import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { RequestContextData } from '../common/utils/request-context.util';
import {
  FEATURE_DISPLAY_NAMES,
  LIMIT_RESET_PERIODS,
  SAAS_FEATURES,
  SAAS_METRICS,
  type LimitResetPeriod,
  type SaasFeatureKey,
  type SaasMetricKey,
} from './constants/saas-metrics.constants';
import type { AssignStorePlanDto } from './dto/assign-store-plan.dto';
import type { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import type { ChangeSubscriptionPlanDto } from './dto/change-subscription-plan.dto';
import type { CreatePlanDto } from './dto/create-plan.dto';
import type { ListPlatformStoresQueryDto } from './dto/list-platform-stores-query.dto';
import type { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import type { ListSubscriptionInvoicesQueryDto } from './dto/list-subscription-invoices-query.dto';
import type { ProviderWebhookDto } from './dto/provider-webhook.dto';
import type { SettleInvoiceDto } from './dto/settle-invoice.dto';
import type { UpdatePlanDto } from './dto/update-plan.dto';
import type { UpdateStoreSuspensionDto } from './dto/update-store-suspension.dto';
import {
  SaasRepository,
  type BillingEventRecord,
  type CurrentSubscriptionRecord,
  type PlanEntitlementRecord,
  type PlanLimitRecord,
  type PlanRecord,
  type SubscriptionInvoiceRecord,
} from './saas.repository';

interface LimitResponse {
  metricKey: string;
  metricLimit: number | null;
  resetPeriod: LimitResetPeriod;
}

interface EntitlementResponse {
  featureKey: SaasFeatureKey;
  isEnabled: boolean;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  billingCycle: 'monthly' | 'annual' | 'proration' | 'manual';
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyCode: string;
  status: 'draft' | 'open' | 'paid' | 'failed' | 'void';
  dueAt: Date | null;
  paidAt: Date | null;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

export interface PlanResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  monthlyPrice: number | null;
  annualPrice: number | null;
  currencyCode: string;
  billingCycleOptions: string[];
  trialDaysDefault: number;
  limits: LimitResponse[];
  entitlements: EntitlementResponse[];
}

export interface StoreSubscriptionResponse {
  id: string;
  storeId: string;
  status: string;
  startsAt: Date;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  billingCycle: 'monthly' | 'annual' | 'manual';
  nextBillingAt: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  plan: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
    monthlyPrice: number | null;
    annualPrice: number | null;
    currencyCode: string;
  };
  limits: LimitResponse[];
  entitlements: EntitlementResponse[];
  usage: Array<{
    metricKey: string;
    used: number;
    limit: number | null;
    resetPeriod: LimitResetPeriod;
  }>;
}

@Injectable()
export class SaasService {
  constructor(
    private readonly saasRepository: SaasRepository,
    private readonly auditService: AuditService,
  ) {}

  async ensureDefaultSubscription(storeId: string): Promise<void> {
    const current = await this.saasRepository.getCurrentSubscription(storeId);
    if (current) {
      return;
    }

    const freePlan = await this.saasRepository.findPlanByCode('free');
    if (!freePlan) {
      throw new NotFoundException('Default free plan is not configured');
    }

    const now = new Date();
    await this.saasRepository.replaceCurrentSubscription({
      storeId,
      planId: freePlan.id,
      status: 'active',
      startsAt: now,
      currentPeriodEnd: null,
      trialEndsAt: null,
      billingCycle: 'monthly',
      nextBillingAt: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
  }

  async getCurrentStoreSubscription(currentUser: AuthUser): Promise<StoreSubscriptionResponse> {
    await this.ensureDefaultSubscription(currentUser.storeId);
    const subscription = await this.requireCurrentSubscription(currentUser.storeId);
    const limits = await this.saasRepository.listPlanLimits(subscription.plan_id);
    const entitlements = await this.saasRepository.listPlanEntitlements(subscription.plan_id);
    const usage = await this.resolveUsageSnapshot(currentUser.storeId, limits, new Date());
    return this.toSubscriptionResponse(subscription, limits, entitlements, usage);
  }

  async listStoreAvailablePlans(): Promise<PlanResponse[]> {
    const plans = await this.saasRepository.listPlans({ onlyActive: true });
    return Promise.all(plans.map((plan) => this.toPlanResponse(plan)));
  }

  async assertFeatureEnabled(storeId: string, featureKey: SaasFeatureKey): Promise<void> {
    const subscription = await this.requireCurrentSubscriptionWithDefaults(storeId);
    const entitlements = await this.saasRepository.listPlanEntitlements(subscription.plan_id);
    const entitlement = entitlements.find((entry) => entry.feature_key === featureKey);
    if (!entitlement) {
      throw new UnprocessableEntityException(
        `Feature entitlement is not configured for ${featureKey}.`,
      );
    }

    if (!entitlement.is_enabled) {
      const displayName = FEATURE_DISPLAY_NAMES[featureKey] ?? featureKey;
      throw new UnprocessableEntityException(
        `Your current plan does not include ${displayName}. Please upgrade your plan.`,
      );
    }
  }

  async assertMetricCanGrow(
    storeId: string,
    metricKey: SaasMetricKey,
    increment = 1,
  ): Promise<void> {
    const now = new Date();
    const subscription = await this.requireCurrentSubscriptionWithDefaults(storeId);
    await this.assertSubscriptionStatusAllowsUsage(storeId, subscription.status, subscription.trial_ends_at, now);

    const limits = await this.saasRepository.listPlanLimits(subscription.plan_id);
    const limit = limits.find((entry) => entry.metric_key === metricKey);
    if (!limit) {
      throw new UnprocessableEntityException(
        `Plan limit is not configured for ${metricKey}. Contact support.`,
      );
    }

    if (limit.metric_limit === null) {
      return;
    }

    const used = await this.resolveMetricUsage(storeId, metricKey, limit.reset_period, now);
    if (used + increment > limit.metric_limit) {
      throw new UnprocessableEntityException(
        `Plan limit reached for ${metricKey}. Used ${used}/${limit.metric_limit}`,
      );
    }
  }

  async recordUsageEvent(
    storeId: string,
    metricKey: SaasMetricKey,
    quantity: number,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.saasRepository.recordUsageEvent({
      storeId,
      metricKey,
      quantity,
      metadata,
    });
  }

  async listPlans(): Promise<PlanResponse[]> {
    const plans = await this.saasRepository.listPlans();
    return Promise.all(plans.map((plan) => this.toPlanResponse(plan)));
  }

  async createPlan(input: CreatePlanDto): Promise<PlanResponse> {
    const existing = await this.saasRepository.findPlanByCode(input.code.trim().toLowerCase());
    if (existing) {
      throw new ConflictException('Plan code already exists');
    }

    this.validateLimits(input.limits);
    this.validateEntitlements(input.entitlements);

    const created = await this.saasRepository.withTransaction(async (db) => {
      const plan = await this.saasRepository.createPlan(
        {
          code: input.code.trim().toLowerCase(),
          name: input.name.trim(),
          description: input.description?.trim() ?? null,
          isActive: input.isActive ?? true,
          monthlyPrice: input.monthlyPrice ?? null,
          annualPrice: input.annualPrice ?? null,
          currencyCode: input.currencyCode ?? 'USD',
          billingCycleOptions: input.billingCycleOptions ?? ['monthly'],
          trialDaysDefault: input.trialDaysDefault ?? 0,
          metadata: {},
        },
        db,
      );

      await this.saasRepository.replacePlanLimits(
        db,
        plan.id,
        input.limits.map((limit) => ({
          metricKey: limit.metricKey,
          metricLimit: limit.metricLimit ?? null,
          resetPeriod: limit.resetPeriod,
        })),
      );

      await this.saasRepository.replacePlanEntitlements(
        db,
        plan.id,
        input.entitlements.map((entitlement) => ({
          featureKey: entitlement.featureKey,
          isEnabled: entitlement.isEnabled,
        })),
      );

      return plan;
    });

    return this.toPlanResponse(created);
  }

  async updatePlan(planId: string, input: UpdatePlanDto): Promise<PlanResponse> {
    const existing = await this.saasRepository.findPlanById(planId);
    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    if (input.limits) {
      this.validateLimits(input.limits);
    }

    if (input.entitlements) {
      this.validateEntitlements(input.entitlements);
    }

    await this.saasRepository.withTransaction(async (db) => {
      await this.saasRepository.updatePlan(
        {
          planId,
          name: input.name?.trim() ?? existing.name,
          description: input.description?.trim() ?? existing.description,
          isActive: input.isActive ?? existing.is_active,
          monthlyPrice: input.monthlyPrice ?? this.parseAmount(existing.monthly_price),
          annualPrice: input.annualPrice ?? this.parseAmount(existing.annual_price),
          currencyCode: input.currencyCode ?? existing.currency_code,
          billingCycleOptions: input.billingCycleOptions ?? existing.billing_cycle_options,
          trialDaysDefault: input.trialDaysDefault ?? existing.trial_days_default,
          metadata: existing.metadata ?? {},
        },
        db,
      );

      if (input.limits) {
        await this.saasRepository.replacePlanLimits(
          db,
          planId,
          input.limits.map((limit) => ({
            metricKey: limit.metricKey,
            metricLimit: limit.metricLimit ?? null,
            resetPeriod: limit.resetPeriod,
          })),
        );
      }

      if (input.entitlements) {
        await this.saasRepository.replacePlanEntitlements(
          db,
          planId,
          input.entitlements.map((entitlement) => ({
            featureKey: entitlement.featureKey,
            isEnabled: entitlement.isEnabled,
          })),
        );
      }
    });

    const fresh = await this.saasRepository.findPlanById(planId);
    if (!fresh) {
      throw new NotFoundException('Plan not found');
    }

    return this.toPlanResponse(fresh);
  }

  async archivePlan(planId: string, context: RequestContextData): Promise<PlanResponse> {
    const existing = await this.saasRepository.findPlanById(planId);
    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    const archived = await this.saasRepository.setPlanActive(planId, false);
    if (!archived) {
      throw new NotFoundException('Plan not found');
    }

    await this.auditService.log({
      action: 'platform.plan_archived',
      storeId: null,
      storeUserId: null,
      targetType: 'plan',
      targetId: archived.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        code: archived.code,
      },
    });

    return this.toPlanResponse(archived);
  }

  async duplicatePlan(planId: string, context: RequestContextData): Promise<PlanResponse> {
    const existing = await this.saasRepository.findPlanById(planId);
    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    const limits = await this.saasRepository.listPlanLimits(planId);
    const entitlements = await this.saasRepository.listPlanEntitlements(planId);
    const baseCode = `${existing.code}-copy`;
    let nextCode = baseCode;
    let suffix = 1;
    while (await this.saasRepository.findPlanByCode(nextCode)) {
      suffix += 1;
      nextCode = `${baseCode}-${suffix}`;
    }

    const duplicateInput: CreatePlanDto = {
      code: nextCode,
      name: `${existing.name} Copy`,
      isActive: false,
      monthlyPrice: this.parseAmount(existing.monthly_price),
      annualPrice: this.parseAmount(existing.annual_price),
      currencyCode: existing.currency_code,
      billingCycleOptions:
        existing.billing_cycle_options.filter(
          (cycle): cycle is 'monthly' | 'annual' =>
            cycle === 'monthly' || cycle === 'annual',
        ).length > 0
          ? existing.billing_cycle_options.filter(
              (cycle): cycle is 'monthly' | 'annual' =>
                cycle === 'monthly' || cycle === 'annual',
            )
          : ['monthly'],
      trialDaysDefault: existing.trial_days_default,
      limits: limits.map((limit) => ({
        metricKey: limit.metric_key as SaasMetricKey,
        metricLimit: limit.metric_limit,
        resetPeriod: limit.reset_period,
      })),
      entitlements: entitlements.map((entry) => ({
        featureKey: entry.feature_key,
        isEnabled: entry.is_enabled,
      })),
    };

    if (existing.description !== null) {
      duplicateInput.description = existing.description;
    }

    const created = await this.createPlan(duplicateInput);

    await this.auditService.log({
      action: 'platform.plan_duplicated',
      storeId: null,
      storeUserId: null,
      targetType: 'plan',
      targetId: created.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        sourcePlanId: planId,
        sourcePlanCode: existing.code,
        duplicatedPlanCode: created.code,
      },
    });

    return created;
  }

  async assignStorePlan(
    storeId: string,
    input: AssignStorePlanDto,
    context: RequestContextData,
  ): Promise<StoreSubscriptionResponse> {
    const plan = await this.saasRepository.findPlanByCode(input.planCode.trim().toLowerCase());
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const status = input.status ?? (input.trialDays ? 'trialing' : 'active');
    const startsAt = new Date();
    const trialEndsAt = input.trialDays
      ? new Date(startsAt.getTime() + input.trialDays * 86_400_000)
      : null;
    const billingCycle = input.billingCycle ?? 'monthly';
    const nextBillingAt = this.computeNextBillingAt(startsAt, billingCycle);

    await this.saasRepository.replaceCurrentSubscription({
      storeId,
      planId: plan.id,
      status,
      startsAt,
      currentPeriodEnd: nextBillingAt,
      trialEndsAt,
      billingCycle,
      nextBillingAt,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });

    await this.auditService.log({
      action: 'platform.subscription_assigned',
      storeId,
      storeUserId: null,
      targetType: 'store_subscription',
      targetId: storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        planCode: plan.code,
        status,
        billingCycle,
      },
    });

    const subscription = await this.requireCurrentSubscription(storeId);
    const limits = await this.saasRepository.listPlanLimits(subscription.plan_id);
    const entitlements = await this.saasRepository.listPlanEntitlements(subscription.plan_id);
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(subscription, limits, entitlements, usage);
  }

  async changeCurrentStorePlan(
    currentUser: AuthUser,
    input: ChangeSubscriptionPlanDto,
    context: RequestContextData,
    mode: 'upgrade' | 'downgrade',
  ): Promise<{ subscription: StoreSubscriptionResponse; invoice: InvoiceResponse | null }> {
    const subscription = await this.requireCurrentSubscriptionWithDefaults(currentUser.storeId);
    const currentPlan = await this.requirePlanById(subscription.plan_id);
    const targetPlan = await this.requirePlanByCode(input.targetPlanCode);
    if (targetPlan.id === currentPlan.id) {
      throw new BadRequestException('Target plan is already active');
    }

    if (mode === 'downgrade') {
      const downgradeCheck = await this.canDowngradePlan(currentUser.storeId, targetPlan.code);
      if (!downgradeCheck.canDowngrade) {
        throw new UnprocessableEntityException({
          message: 'Cannot downgrade due to current usage conflicts',
          conflicts: downgradeCheck.conflicts,
        });
      }
    }

    const startsAt = new Date();
    const billingCycle = input.billingCycle ?? subscription.billing_cycle;
    const nextBillingAt = this.computeNextBillingAt(startsAt, billingCycle);

    await this.saasRepository.replaceCurrentSubscription({
      storeId: currentUser.storeId,
      planId: targetPlan.id,
      status: 'active',
      startsAt,
      currentPeriodEnd: nextBillingAt,
      trialEndsAt: null,
      billingCycle,
      nextBillingAt,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });

    let invoice: SubscriptionInvoiceRecord | null = null;
    const prorationMode = input.prorationMode ?? 'immediate_invoice';
    if (prorationMode !== 'none') {
      const amount = this.computePlanAmount(targetPlan, billingCycle);
      const credit = this.computeProrationCredit(subscription, currentPlan, startsAt);
      const subtotalAmount = Math.max(0, amount - credit);
      const invoiceStatus = subtotalAmount === 0 ? 'paid' : 'open';

      invoice = await this.saasRepository.createInvoice({
        storeId: currentUser.storeId,
        subscriptionId: (await this.requireCurrentSubscription(currentUser.storeId)).id,
        planId: targetPlan.id,
        invoiceNumber: this.generateInvoiceNumber(),
        billingCycle: mode === 'upgrade' ? 'proration' : billingCycle,
        periodStart: startsAt,
        periodEnd: nextBillingAt ?? startsAt,
        subtotalAmount,
        taxAmount: 0,
        totalAmount: subtotalAmount,
        currencyCode: targetPlan.currency_code,
        status: invoiceStatus,
        dueAt: subtotalAmount === 0 ? null : new Date(startsAt.getTime() + 3 * 86_400_000),
        paidAt: subtotalAmount === 0 ? startsAt : null,
        metadata: {
          mode,
          prorationMode,
          targetPlanCode: targetPlan.code,
          previousPlanCode: currentPlan.code,
          creditApplied: Number(credit.toFixed(2)),
        },
      });

      if (subtotalAmount === 0) {
        await this.saasRepository.createPayment({
          invoiceId: invoice.id,
          storeId: currentUser.storeId,
          provider: 'internal',
          paymentMethod: 'credit_balance',
          status: 'succeeded',
          amount: 0,
          currencyCode: targetPlan.currency_code,
          processedAt: startsAt,
          metadata: {
            autoSettled: true,
          },
        });
      }
    }

    await this.saasRepository.createBillingEvent({
      storeId: currentUser.storeId,
      source: 'merchant_action',
      eventType: mode === 'upgrade' ? 'subscription.upgraded' : 'subscription.downgraded',
      idempotencyKey: null,
      payload: {
        previousPlan: currentPlan.code,
        targetPlan: targetPlan.code,
        billingCycle,
        invoiceId: invoice?.id ?? null,
      },
      status: 'processed',
      processedAt: startsAt,
    });

    await this.auditService.log({
      action: mode === 'upgrade' ? 'billing.subscription_upgrade_requested' : 'billing.subscription_downgrade_requested',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_subscription',
      targetId: currentUser.storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        previousPlanCode: currentPlan.code,
        targetPlanCode: targetPlan.code,
        invoiceId: invoice?.id ?? null,
      },
    });

    const freshSubscription = await this.getCurrentStoreSubscription(currentUser);
    return {
      subscription: freshSubscription,
      invoice: invoice ? this.toInvoiceResponse(invoice) : null,
    };
  }

  async listStoreInvoices(currentUser: AuthUser, query: ListSubscriptionInvoicesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.saasRepository.listInvoicesByStore({
      storeId: currentUser.storeId,
      status: query.status ?? null,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: result.rows.map((row) => this.toInvoiceResponse(row)),
      total: result.total,
      page,
      limit,
    };
  }

  async settleInvoice(
    invoiceId: string,
    input: SettleInvoiceDto,
    context: RequestContextData,
  ): Promise<InvoiceResponse> {
    const invoice = await this.saasRepository.findInvoiceById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const paid = input.paymentStatus === 'succeeded';
    await this.saasRepository.updateInvoiceStatus({
      invoiceId,
      status: paid ? 'paid' : 'failed',
      paidAt: paid ? new Date() : null,
      metadata: {
        settledBy: 'platform_admin',
      },
    });

    await this.saasRepository.createPayment({
      invoiceId: invoice.id,
      storeId: invoice.store_id,
      provider: input.provider ?? 'manual',
      paymentMethod: input.paymentMethod ?? null,
      status: paid ? 'succeeded' : 'failed',
      amount: input.amount ? Number(input.amount) : Number(invoice.total_amount),
      currencyCode: input.currencyCode ?? invoice.currency_code,
      externalTransactionId: input.externalTransactionId ?? null,
      failureReason: input.failureReason ?? null,
      processedAt: new Date(),
      metadata: {},
    });

    if (paid) {
      await this.saasRepository.updateSubscriptionStatus(invoice.store_id, 'active');
      await this.saasRepository.setStoreSuspension({
        storeId: invoice.store_id,
        isSuspended: false,
        reason: null,
      });
    } else {
      await this.saasRepository.updateSubscriptionStatus(invoice.store_id, 'past_due');
      await this.saasRepository.setStoreSuspension({
        storeId: invoice.store_id,
        isSuspended: true,
        reason: input.failureReason ?? 'Invoice payment failed',
      });
    }

    await this.auditService.log({
      action: 'platform.invoice_settled',
      storeId: invoice.store_id,
      storeUserId: null,
      targetType: 'subscription_invoice',
      targetId: invoiceId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        paymentStatus: input.paymentStatus,
      },
    });

    const refreshed = await this.saasRepository.findInvoiceById(invoiceId);
    if (!refreshed) {
      throw new NotFoundException('Invoice not found');
    }
    return this.toInvoiceResponse(refreshed);
  }

  async handleProviderWebhook(input: ProviderWebhookDto): Promise<{ processed: boolean; reason?: string }> {
    const existing = await this.saasRepository.findBillingEventBySourceAndIdempotency(
      'provider_webhook',
      input.idempotencyKey,
    );
    if (existing) {
      return { processed: false, reason: 'duplicate' };
    }

    const event = await this.saasRepository.createBillingEvent({
      storeId: input.storeId ?? null,
      source: 'provider_webhook',
      eventType: input.eventType,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload ?? {},
      status: 'received',
    });

    try {
      await this.processProviderWebhookEvent(input);
      await this.saasRepository.updateBillingEventStatus({
        billingEventId: event.id,
        status: 'processed',
        processedAt: new Date(),
      });
      return { processed: true };
    } catch (error) {
      await this.saasRepository.updateBillingEventStatus({
        billingEventId: event.id,
        status: 'failed',
        processingError: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async processProviderWebhookEvent(input: ProviderWebhookDto): Promise<void> {
    if (input.eventType === 'invoice.paid') {
      if (!input.externalInvoiceId) {
        throw new BadRequestException('externalInvoiceId is required for invoice.paid');
      }
      const invoice = await this.saasRepository.findInvoiceByExternalInvoiceId(input.externalInvoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found for externalInvoiceId');
      }

      await this.saasRepository.updateInvoiceStatus({
        invoiceId: invoice.id,
        status: 'paid',
        paidAt: new Date(),
      });
      await this.saasRepository.updateSubscriptionStatus(invoice.store_id, 'active');
      await this.saasRepository.setStoreSuspension({
        storeId: invoice.store_id,
        isSuspended: false,
        reason: null,
      });
      return;
    }

    if (input.eventType === 'invoice.failed') {
      if (!input.externalInvoiceId) {
        throw new BadRequestException('externalInvoiceId is required for invoice.failed');
      }
      const invoice = await this.saasRepository.findInvoiceByExternalInvoiceId(input.externalInvoiceId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found for externalInvoiceId');
      }

      await this.saasRepository.updateInvoiceStatus({
        invoiceId: invoice.id,
        status: 'failed',
      });
      await this.saasRepository.updateSubscriptionStatus(invoice.store_id, 'past_due');
      await this.saasRepository.setStoreSuspension({
        storeId: invoice.store_id,
        isSuspended: true,
        reason: 'Subscription invoice failed',
      });
      return;
    }

    if (input.eventType === 'subscription.canceled') {
      if (!input.externalSubscriptionId) {
        throw new BadRequestException('externalSubscriptionId is required for subscription.canceled');
      }
      const subscription = await this.saasRepository.findCurrentSubscriptionByProviderSubscriptionId(
        input.externalSubscriptionId,
      );
      if (!subscription) {
        return;
      }
      await this.saasRepository.updateSubscriptionStatus(subscription.store_id, 'canceled');
      await this.saasRepository.setStoreSuspension({
        storeId: subscription.store_id,
        isSuspended: true,
        reason: 'Subscription canceled by provider',
      });
      return;
    }
  }

  async getPlatformDashboardSummary() {
    const summary = await this.saasRepository.getPlatformDashboardSummary();
    return {
      totalStores: Number(summary.total_stores),
      activeStores: Number(summary.active_stores),
      suspendedStores: Number(summary.suspended_stores),
      totalSubscriptions: Number(summary.total_subscriptions),
      activeSubscriptions: Number(summary.active_subscriptions),
      trialingSubscriptions: Number(summary.trialing_subscriptions),
      pastDueSubscriptions: Number(summary.past_due_subscriptions),
      canceledSubscriptions: Number(summary.canceled_subscriptions),
      totalDomains: Number(summary.total_domains),
      domainIssues: Number(summary.domain_issues),
    };
  }

  async getPlatformDashboardAlerts() {
    const rows = await this.saasRepository.listPlatformDashboardAlerts(30);
    return rows.map((row) => ({
      type: row.type,
      severity: row.severity,
      referenceId: row.reference_id,
      title: row.title,
      createdAt: row.created_at,
    }));
  }

  async getPlatformDashboardActivity() {
    const rows = await this.saasRepository.listRecentPlatformAuditActivity(40);
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      storeId: row.store_id,
    }));
  }

  async getPlatformDashboardGrowth() {
    return this.saasRepository.getPlatformGrowthSummary();
  }

  async listPlatformStores(query: ListPlatformStoresQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.saasRepository.listPlatformStores({
      q: query.q?.trim() ?? null,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.created_at,
        isSuspended: row.is_suspended,
        suspensionReason: row.suspension_reason,
        planCode: row.plan_code,
        subscriptionStatus: row.subscription_status,
        totalDomains: row.total_domains,
        activeDomains: row.active_domains,
      })),
      total: result.total,
      page,
      limit,
    };
  }

  async getPlatformStoreById(storeId: string) {
    const row = await this.saasRepository.findPlatformStoreById(storeId);
    if (!row) {
      throw new NotFoundException('Store not found');
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      isSuspended: row.is_suspended,
      suspensionReason: row.suspension_reason,
      planCode: row.plan_code,
      subscriptionStatus: row.subscription_status,
      totalDomains: row.total_domains,
      activeDomains: row.active_domains,
    };
  }

  async getPlatformStoreUsage(storeId: string) {
    const subscription = await this.requireCurrentSubscriptionWithDefaults(storeId);
    const limits = await this.saasRepository.listPlanLimits(subscription.plan_id);
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return {
      storeId,
      subscriptionStatus: subscription.status,
      usage,
    };
  }

  async getPlatformStoreActivity(storeId: string) {
    const rows = await this.saasRepository.listStoreAuditActivity(storeId, 50);
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      storeId: row.store_id,
    }));
  }

  async getPlatformStoreDomains(storeId: string) {
    const rows = await this.saasRepository.listPlatformDomainsByStore(storeId);
    return rows.map((row) => this.toPlatformDomainResponse(row));
  }

  async getPlatformStoreSubscription(storeId: string) {
    const subscription = await this.requireCurrentSubscriptionWithDefaults(storeId);
    const limits = await this.saasRepository.listPlanLimits(subscription.plan_id);
    const entitlements = await this.saasRepository.listPlanEntitlements(subscription.plan_id);
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(subscription, limits, entitlements, usage);
  }

  async updateStoreSuspension(
    storeId: string,
    input: UpdateStoreSuspensionDto,
    context: RequestContextData,
  ): Promise<void> {
    const success = await this.saasRepository.setStoreSuspension({
      storeId,
      isSuspended: input.isSuspended,
      reason: input.reason?.trim() ?? null,
    });
    if (!success) {
      throw new NotFoundException('Store not found');
    }

    await this.auditService.log({
      action: 'platform.store_suspension_updated',
      storeId,
      storeUserId: null,
      targetType: 'store',
      targetId: storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        isSuspended: input.isSuspended,
        reason: input.reason ?? null,
      },
    });
  }

  async listPlatformSubscriptions(query: ListPlatformSubscriptionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.saasRepository.listPlatformSubscriptions({
      status: query.status ?? null,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        storeId: row.store_id,
        storeName: row.store_name,
        storeSlug: row.store_slug,
        planCode: row.plan_code,
        planName: row.plan_name,
        status: row.status,
        startsAt: row.starts_at,
        currentPeriodEnd: row.current_period_end,
        trialEndsAt: row.trial_ends_at,
        billingCycle: row.billing_cycle,
        nextBillingAt: row.next_billing_at,
        cancelAtPeriodEnd: row.cancel_at_period_end,
      })),
      total: result.total,
      page,
      limit,
    };
  }

  async listPlatformDomains() {
    const rows = await this.saasRepository.listPlatformDomains();
    return rows.map((row) => this.toPlatformDomainResponse(row));
  }

  async listPlatformDomainIssues() {
    const rows = await this.saasRepository.listPlatformDomainIssues(100);
    return rows.map((row) => this.toPlatformDomainResponse(row));
  }

  async getPlatformDomainById(domainId: string) {
    const domain = await this.saasRepository.findPlatformDomainById(domainId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    return this.toPlatformDomainResponse(domain);
  }

  async recheckPlatformDomain(domainId: string, context: RequestContextData) {
    const domain = await this.saasRepository.findPlatformDomainById(domainId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    const touched = await this.saasRepository.touchPlatformDomainCheck(domainId);
    if (!touched) {
      throw new NotFoundException('Domain not found');
    }

    await this.auditService.log({
      action: 'platform.domain_rechecked',
      storeId: touched.store_id,
      storeUserId: null,
      targetType: 'store_domain',
      targetId: touched.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        hostname: touched.hostname,
      },
    });

    const refreshed = await this.saasRepository.findPlatformDomainById(domainId);
    if (!refreshed) {
      throw new NotFoundException('Domain not found');
    }

    return this.toPlatformDomainResponse(refreshed);
  }

  async forceSyncPlatformDomain(domainId: string, context: RequestContextData) {
    const domain = await this.saasRepository.findPlatformDomainById(domainId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    const touched = await this.saasRepository.touchPlatformDomainCheck(domainId);
    if (!touched) {
      throw new NotFoundException('Domain not found');
    }

    await this.auditService.log({
      action: 'platform.domain_force_synced',
      storeId: domain.store_id,
      storeUserId: null,
      targetType: 'store_domain',
      targetId: domain.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        hostname: domain.hostname,
      },
    });

    const refreshed = await this.saasRepository.findPlatformDomainById(domainId);
    if (!refreshed) {
      throw new NotFoundException('Domain not found');
    }

    return this.toPlatformDomainResponse(refreshed);
  }

  async listPlatformBillingEvents(limit = 50) {
    const rows = await this.saasRepository.listRecentBillingEvents(limit);
    return rows.map((row) => ({
      id: row.id,
      storeId: row.store_id,
      source: row.source,
      eventType: row.event_type,
      idempotencyKey: row.idempotency_key,
      status: row.status,
      processingError: row.processing_error,
      processedAt: row.processed_at,
      createdAt: row.created_at,
    }));
  }

  async assertStoreIsActive(storeId: string): Promise<void> {
    const suspended = await this.saasRepository.isStoreSuspended(storeId);
    if (suspended) {
      throw new BadRequestException('Store is suspended');
    }
  }

  async cancelSubscription(
    storeId: string,
    context: RequestContextData,
  ): Promise<StoreSubscriptionResponse> {
    await this.ensureDefaultSubscription(storeId);
    const subscription = await this.requireCurrentSubscription(storeId);

    if (subscription.status === 'canceled') {
      throw new BadRequestException('Subscription is already canceled');
    }

    await this.saasRepository.updateSubscriptionStatus(storeId, 'canceled');
    await this.saasRepository.updateCurrentSubscriptionBilling({
      storeId,
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
      nextBillingAt: null,
    });

    await this.auditService.log({
      action: 'platform.subscription_canceled',
      storeId,
      storeUserId: null,
      targetType: 'store_subscription',
      targetId: storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        previousStatus: subscription.status,
      },
    });

    const fresh = await this.requireCurrentSubscription(storeId);
    const limits = await this.saasRepository.listPlanLimits(fresh.plan_id);
    const entitlements = await this.saasRepository.listPlanEntitlements(fresh.plan_id);
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(fresh, limits, entitlements, usage);
  }

  async requestMerchantCancellation(
    currentUser: AuthUser,
    input: CancelSubscriptionDto,
    context: RequestContextData,
  ): Promise<StoreSubscriptionResponse> {
    await this.ensureDefaultSubscription(currentUser.storeId);
    const subscription = await this.requireCurrentSubscription(currentUser.storeId);
    if (subscription.status === 'canceled') {
      throw new BadRequestException('Subscription is already canceled');
    }

    const cancelAtPeriodEnd = input.cancelAtPeriodEnd ?? true;
    if (cancelAtPeriodEnd) {
      await this.saasRepository.updateCurrentSubscriptionBilling({
        storeId: currentUser.storeId,
        cancelAtPeriodEnd: true,
      });
    } else {
      await this.saasRepository.updateSubscriptionStatus(currentUser.storeId, 'canceled');
      await this.saasRepository.updateCurrentSubscriptionBilling({
        storeId: currentUser.storeId,
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
        nextBillingAt: null,
      });
    }

    await this.auditService.log({
      action: 'billing.subscription_cancel_requested',
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_subscription',
      targetId: subscription.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        cancelAtPeriodEnd,
      },
    });

    const fresh = await this.requireCurrentSubscription(currentUser.storeId);
    const limits = await this.saasRepository.listPlanLimits(fresh.plan_id);
    const entitlements = await this.saasRepository.listPlanEntitlements(fresh.plan_id);
    const usage = await this.resolveUsageSnapshot(currentUser.storeId, limits, new Date());
    return this.toSubscriptionResponse(fresh, limits, entitlements, usage);
  }

  async suspendSubscription(
    storeId: string,
    reason: string | null,
    context: RequestContextData,
  ): Promise<StoreSubscriptionResponse> {
    await this.ensureDefaultSubscription(storeId);
    const subscription = await this.requireCurrentSubscription(storeId);

    if (subscription.status === 'suspended') {
      throw new BadRequestException('Subscription is already suspended');
    }

    await this.saasRepository.updateSubscriptionStatus(storeId, 'suspended');
    await this.saasRepository.setStoreSuspension({
      storeId,
      isSuspended: true,
      reason: reason ?? 'Subscription suspended',
    });

    await this.auditService.log({
      action: 'platform.subscription_suspended',
      storeId,
      storeUserId: null,
      targetType: 'store_subscription',
      targetId: storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        previousStatus: subscription.status,
        reason,
      },
    });

    const fresh = await this.requireCurrentSubscription(storeId);
    const limits = await this.saasRepository.listPlanLimits(fresh.plan_id);
    const entitlements = await this.saasRepository.listPlanEntitlements(fresh.plan_id);
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(fresh, limits, entitlements, usage);
  }

  async resumeSubscription(
    storeId: string,
    context: RequestContextData,
  ): Promise<StoreSubscriptionResponse> {
    await this.ensureDefaultSubscription(storeId);
    const subscription = await this.requireCurrentSubscription(storeId);

    if (subscription.status !== 'suspended' && subscription.status !== 'canceled' && subscription.status !== 'past_due') {
      throw new BadRequestException('Subscription is not suspended, canceled, or past_due');
    }

    await this.saasRepository.updateSubscriptionStatus(storeId, 'active');
    await this.saasRepository.setStoreSuspension({
      storeId,
      isSuspended: false,
      reason: null,
    });

    await this.auditService.log({
      action: 'platform.subscription_resumed',
      storeId,
      storeUserId: null,
      targetType: 'store_subscription',
      targetId: storeId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        requestId: context.requestId,
        previousStatus: subscription.status,
      },
    });

    const fresh = await this.requireCurrentSubscription(storeId);
    const limits = await this.saasRepository.listPlanLimits(fresh.plan_id);
    const entitlements = await this.saasRepository.listPlanEntitlements(fresh.plan_id);
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(fresh, limits, entitlements, usage);
  }

  async canDowngradePlan(
    storeId: string,
    targetPlanCode: string,
  ): Promise<{
    canDowngrade: boolean;
    conflicts: Array<{ metricKey: string; used: number; limit: number }>;
  }> {
    const subscription = await this.requireCurrentSubscription(storeId);
    await this.requirePlanById(subscription.plan_id);
    const targetPlan = await this.requirePlanByCode(targetPlanCode);
    const targetLimits = await this.saasRepository.listPlanLimits(targetPlan.id);

    const conflicts: Array<{ metricKey: string; used: number; limit: number }> = [];
    const now = new Date();

    for (const targetLimit of targetLimits) {
      if (targetLimit.metric_limit === null) continue;
      const used = await this.resolveMetricUsage(
        storeId,
        targetLimit.metric_key,
        targetLimit.reset_period,
        now,
      );

      if (used > targetLimit.metric_limit) {
        conflicts.push({
          metricKey: targetLimit.metric_key,
          used,
          limit: targetLimit.metric_limit,
        });
      }
    }

    return {
      canDowngrade: conflicts.length === 0,
      conflicts,
    };
  }

  private async resolveUsageSnapshot(
    storeId: string,
    limits: PlanLimitRecord[],
    at: Date,
  ): Promise<
    Array<{ metricKey: string; used: number; limit: number | null; resetPeriod: LimitResetPeriod }>
  > {
    const usage = [] as Array<{
      metricKey: string;
      used: number;
      limit: number | null;
      resetPeriod: LimitResetPeriod;
    }>;

    for (const limit of limits) {
      const used = await this.resolveMetricUsage(storeId, limit.metric_key, limit.reset_period, at);
      usage.push({
        metricKey: limit.metric_key,
        used,
        limit: limit.metric_limit,
        resetPeriod: limit.reset_period,
      });
    }

    return usage;
  }

  private async resolveMetricUsage(
    storeId: string,
    metricKey: string,
    _resetPeriod: LimitResetPeriod,
    at: Date,
  ): Promise<number> {
    if (metricKey === 'products.total') {
      return this.saasRepository.countProducts(storeId);
    }

    if (metricKey === 'orders.monthly') {
      return this.saasRepository.countOrdersForMonth(storeId, at);
    }

    if (metricKey === 'staff.total') {
      return this.saasRepository.countStaff(storeId);
    }

    if (metricKey === 'domains.total') {
      return this.saasRepository.countDomains(storeId);
    }

    if (metricKey === 'storage.used') {
      const bytes = await this.saasRepository.getStorageUsedBytes(storeId);
      return Math.ceil(bytes / (1024 * 1024));
    }

    if (metricKey === 'api_calls.monthly') {
      return this.saasRepository.countApiCallsForMonth(storeId, at);
    }

    if (metricKey === 'webhooks.monthly') {
      return this.saasRepository.countWebhooksForMonth(storeId, at);
    }

    return 0;
  }

  private async assertSubscriptionStatusAllowsUsage(
    storeId: string,
    status: string,
    trialEndsAt: Date | null,
    now: Date,
  ): Promise<void> {
    if (status === 'trialing' && trialEndsAt && trialEndsAt.getTime() < now.getTime()) {
      await this.saasRepository.updateSubscriptionStatus(storeId, 'past_due');
      await this.saasRepository.setStoreSuspension({
        storeId,
        isSuspended: true,
        reason: 'Trial expired',
      });
      throw new UnprocessableEntityException('Trial period has expired. Upgrade plan to continue.');
    }

    if (status === 'canceled' || status === 'suspended' || status === 'past_due') {
      throw new UnprocessableEntityException(
        `Subscription status ${status} does not allow this operation`,
      );
    }
  }

  private validateLimits(
    limits: Array<{
      metricKey: string;
      metricLimit?: number | null;
      resetPeriod: LimitResetPeriod;
    }>,
  ): void {
    const seen = new Set<string>();

    for (const limit of limits) {
      if (!SAAS_METRICS.includes(limit.metricKey as (typeof SAAS_METRICS)[number])) {
        throw new BadRequestException(`Unsupported metric key ${limit.metricKey}`);
      }

      if (!LIMIT_RESET_PERIODS.includes(limit.resetPeriod)) {
        throw new BadRequestException(`Unsupported reset period ${limit.resetPeriod}`);
      }

      if (seen.has(limit.metricKey)) {
        throw new BadRequestException(`Duplicate limit definition for ${limit.metricKey}`);
      }
      seen.add(limit.metricKey);
    }

    if (seen.size !== SAAS_METRICS.length) {
      throw new BadRequestException(
        'Plan limits must define all SaaS metrics. Missing values are not allowed.',
      );
    }
  }

  private validateEntitlements(
    entitlements: Array<{
      featureKey: SaasFeatureKey;
      isEnabled: boolean;
    }>,
  ): void {
    const seen = new Set<string>();
    for (const entitlement of entitlements) {
      if (!SAAS_FEATURES.includes(entitlement.featureKey)) {
        throw new BadRequestException(`Unsupported feature key ${entitlement.featureKey}`);
      }
      if (seen.has(entitlement.featureKey)) {
        throw new BadRequestException(`Duplicate entitlement definition for ${entitlement.featureKey}`);
      }
      seen.add(entitlement.featureKey);
    }

    if (seen.size !== SAAS_FEATURES.length) {
      throw new BadRequestException(
        'Plan entitlements must define all SaaS features. Missing values are not allowed.',
      );
    }
  }

  private async requireCurrentSubscriptionWithDefaults(
    storeId: string,
  ): Promise<CurrentSubscriptionRecord> {
    await this.ensureDefaultSubscription(storeId);
    return this.requireCurrentSubscription(storeId);
  }

  private async requireCurrentSubscription(storeId: string): Promise<CurrentSubscriptionRecord> {
    const subscription = await this.saasRepository.getCurrentSubscription(storeId);
    if (!subscription) {
      throw new NotFoundException('Store subscription not found');
    }

    if (!subscription.plan_is_active) {
      throw new UnprocessableEntityException('Current plan is inactive');
    }

    return subscription;
  }

  private async requirePlanByCode(planCode: string): Promise<PlanRecord> {
    const plan = await this.saasRepository.findPlanByCode(planCode.trim().toLowerCase());
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    if (!plan.is_active) {
      throw new UnprocessableEntityException('Target plan is inactive');
    }
    return plan;
  }

  private async requirePlanById(planId: string): Promise<PlanRecord> {
    const plan = await this.saasRepository.findPlanById(planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  private parseAmount(value: string | null): number | null {
    if (value === null) {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private computePlanAmount(plan: PlanRecord, billingCycle: 'monthly' | 'annual' | 'manual'): number {
    if (billingCycle === 'annual') {
      return this.parseAmount(plan.annual_price) ?? 0;
    }

    if (billingCycle === 'monthly') {
      return this.parseAmount(plan.monthly_price) ?? 0;
    }

    return 0;
  }

  private computeProrationCredit(
    currentSubscription: CurrentSubscriptionRecord,
    currentPlan: PlanRecord,
    at: Date,
  ): number {
    if (!currentSubscription.current_period_end) {
      return 0;
    }

    const end = currentSubscription.current_period_end.getTime();
    const now = at.getTime();
    if (end <= now) {
      return 0;
    }

    const start = currentSubscription.starts_at.getTime();
    const total = Math.max(1, end - start);
    const remaining = end - now;
    const ratio = Math.max(0, Math.min(1, remaining / total));
    const fullAmount = this.computePlanAmount(currentPlan, currentSubscription.billing_cycle);
    return Number((fullAmount * ratio).toFixed(2));
  }

  private computeNextBillingAt(startsAt: Date, billingCycle: 'monthly' | 'annual' | 'manual'): Date | null {
    if (billingCycle === 'manual') {
      return null;
    }
    const next = new Date(startsAt.getTime());
    if (billingCycle === 'annual') {
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      return next;
    }
    next.setUTCMonth(next.getUTCMonth() + 1);
    return next;
  }

  private generateInvoiceNumber(): string {
    const part = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return `INV-${new Date().getUTCFullYear()}-${part}`;
  }

  private async toPlanResponse(plan: PlanRecord): Promise<PlanResponse> {
    const limits = await this.saasRepository.listPlanLimits(plan.id);
    const entitlements = await this.saasRepository.listPlanEntitlements(plan.id);
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      isActive: plan.is_active,
      monthlyPrice: this.parseAmount(plan.monthly_price),
      annualPrice: this.parseAmount(plan.annual_price),
      currencyCode: plan.currency_code,
      billingCycleOptions: plan.billing_cycle_options,
      trialDaysDefault: plan.trial_days_default,
      limits: limits.map((limit) => ({
        metricKey: limit.metric_key,
        metricLimit: limit.metric_limit,
        resetPeriod: limit.reset_period,
      })),
      entitlements: entitlements.map((entitlement) => ({
        featureKey: entitlement.feature_key,
        isEnabled: entitlement.is_enabled,
      })),
    };
  }

  private toSubscriptionResponse(
    subscription: CurrentSubscriptionRecord,
    limits: PlanLimitRecord[],
    entitlements: PlanEntitlementRecord[],
    usage: Array<{
      metricKey: string;
      used: number;
      limit: number | null;
      resetPeriod: LimitResetPeriod;
    }>,
  ): StoreSubscriptionResponse {
    return {
      id: subscription.id,
      storeId: subscription.store_id,
      status: subscription.status,
      startsAt: subscription.starts_at,
      currentPeriodEnd: subscription.current_period_end,
      trialEndsAt: subscription.trial_ends_at,
      billingCycle: subscription.billing_cycle,
      nextBillingAt: subscription.next_billing_at,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at,
      plan: {
        id: subscription.plan_id,
        code: subscription.plan_code,
        name: subscription.plan_name,
        description: subscription.plan_description,
        isActive: subscription.plan_is_active,
        monthlyPrice: this.parseAmount(subscription.plan_monthly_price),
        annualPrice: this.parseAmount(subscription.plan_annual_price),
        currencyCode: subscription.plan_currency_code,
      },
      limits: limits.map((limit) => ({
        metricKey: limit.metric_key,
        metricLimit: limit.metric_limit,
        resetPeriod: limit.reset_period,
      })),
      entitlements: entitlements.map((entitlement) => ({
        featureKey: entitlement.feature_key,
        isEnabled: entitlement.is_enabled,
      })),
      usage,
    };
  }

  private toPlatformDomainResponse(domain: {
    id: string;
    store_id: string;
    store_name: string;
    hostname: string;
    status: string;
    ssl_status: string;
    ssl_provider?: string;
    ssl_mode?: string;
    ssl_last_checked_at?: Date | null;
    ssl_error?: string | null;
    cloudflare_zone_id?: string | null;
    cloudflare_hostname_id?: string | null;
    verification_token?: string;
    verified_at?: Date | null;
    activated_at?: Date | null;
    updated_at: Date;
  }) {
    return {
      id: domain.id,
      storeId: domain.store_id,
      storeName: domain.store_name,
      hostname: domain.hostname,
      status: domain.status,
      sslStatus: domain.ssl_status,
      sslProvider: domain.ssl_provider ?? null,
      sslMode: domain.ssl_mode ?? null,
      sslLastCheckedAt: domain.ssl_last_checked_at ?? null,
      sslError: domain.ssl_error ?? null,
      cloudflareZoneId: domain.cloudflare_zone_id ?? null,
      cloudflareHostnameId: domain.cloudflare_hostname_id ?? null,
      verificationToken: domain.verification_token ?? null,
      verifiedAt: domain.verified_at ?? null,
      activatedAt: domain.activated_at ?? null,
      updatedAt: domain.updated_at,
    };
  }

  private toInvoiceResponse(invoice: SubscriptionInvoiceRecord): InvoiceResponse {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      billingCycle: invoice.billing_cycle,
      subtotalAmount: Number(invoice.subtotal_amount),
      taxAmount: Number(invoice.tax_amount),
      totalAmount: Number(invoice.total_amount),
      currencyCode: invoice.currency_code,
      status: invoice.status,
      dueAt: invoice.due_at,
      paidAt: invoice.paid_at,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      createdAt: invoice.created_at,
    };
  }
}
