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
  LIMIT_RESET_PERIODS,
  SAAS_METRICS,
  type LimitResetPeriod,
  type SaasMetricKey,
} from './constants/saas-metrics.constants';
import type { AssignStorePlanDto } from './dto/assign-store-plan.dto';
import type { CreatePlanDto } from './dto/create-plan.dto';
import type { ListPlatformStoresQueryDto } from './dto/list-platform-stores-query.dto';
import type { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import type { UpdatePlanDto } from './dto/update-plan.dto';
import type { UpdateStoreSuspensionDto } from './dto/update-store-suspension.dto';
import {
  SaasRepository,
  type CurrentSubscriptionRecord,
  type PlanLimitRecord,
  type PlanRecord,
} from './saas.repository';

interface LimitResponse {
  metricKey: string;
  metricLimit: number | null;
  resetPeriod: LimitResetPeriod;
}

export interface PlanResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  limits: LimitResponse[];
}

export interface StoreSubscriptionResponse {
  id: string;
  storeId: string;
  status: string;
  startsAt: Date;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  plan: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
  limits: LimitResponse[];
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

    await this.saasRepository.replaceCurrentSubscription({
      storeId,
      planId: freePlan.id,
      status: 'active',
      startsAt: new Date(),
      currentPeriodEnd: null,
      trialEndsAt: null,
    });
  }

  async getCurrentStoreSubscription(currentUser: AuthUser): Promise<StoreSubscriptionResponse> {
    await this.ensureDefaultSubscription(currentUser.storeId);
    const subscription = await this.requireCurrentSubscription(currentUser.storeId);
    const limits = await this.saasRepository.listPlanLimits(subscription.plan_id);
    const usage = await this.resolveUsageSnapshot(currentUser.storeId, limits, new Date());
    return this.toSubscriptionResponse(subscription, limits, usage);
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
    if (!limit || limit.metric_limit === null) {
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

    const created = await this.saasRepository.withTransaction(async (db) => {
      const plan = await this.saasRepository.createPlan(
        {
          code: input.code.trim().toLowerCase(),
          name: input.name.trim(),
          description: input.description?.trim() ?? null,
          isActive: input.isActive ?? true,
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

    await this.saasRepository.withTransaction(async (db) => {
      await this.saasRepository.updatePlan(
        {
          planId,
          name: input.name?.trim() ?? existing.name,
          description: input.description?.trim() ?? existing.description,
          isActive: input.isActive ?? existing.is_active,
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
    });

    const fresh = await this.saasRepository.findPlanById(planId);
    if (!fresh) {
      throw new NotFoundException('Plan not found');
    }

    return this.toPlanResponse(fresh);
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

    await this.saasRepository.replaceCurrentSubscription({
      storeId,
      planId: plan.id,
      status,
      startsAt,
      currentPeriodEnd: null,
      trialEndsAt,
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
      },
    });

    const subscription = await this.requireCurrentSubscription(storeId);
    const limits = await this.saasRepository.listPlanLimits(subscription.plan_id);
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(subscription, limits, usage);
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
      })),
      total: result.total,
      page,
      limit,
    };
  }

  async listPlatformDomains() {
    const rows = await this.saasRepository.listPlatformDomains();
    return rows.map((row) => ({
      id: row.id,
      storeId: row.store_id,
      storeName: row.store_name,
      hostname: row.hostname,
      status: row.status,
      sslStatus: row.ssl_status,
      updatedAt: row.updated_at,
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
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(fresh, limits, usage);
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
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(fresh, limits, usage);
  }

  async resumeSubscription(
    storeId: string,
    context: RequestContextData,
  ): Promise<StoreSubscriptionResponse> {
    await this.ensureDefaultSubscription(storeId);
    const subscription = await this.requireCurrentSubscription(storeId);

    if (subscription.status !== 'suspended' && subscription.status !== 'canceled') {
      throw new BadRequestException('Subscription is not suspended or canceled');
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
    const usage = await this.resolveUsageSnapshot(storeId, limits, new Date());
    return this.toSubscriptionResponse(fresh, limits, usage);
  }

  async canDowngradePlan(
    storeId: string,
    targetPlanCode: string,
  ): Promise<{
    canDowngrade: boolean;
    conflicts: Array<{ metricKey: string; used: number; limit: number }>;
  }> {
    const subscription = await this.requireCurrentSubscription(storeId);
    const currentPlan = await this.saasRepository.findPlanById(subscription.plan_id);

    if (!currentPlan) {
      throw new NotFoundException('Current plan not found');
    }

    const targetPlan = await this.saasRepository.findPlanByCode(targetPlanCode);
    if (!targetPlan) {
      throw new NotFoundException('Target plan not found');
    }

    const currentLimits = await this.saasRepository.listPlanLimits(subscription.plan_id);
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

  private async toPlanResponse(plan: PlanRecord): Promise<PlanResponse> {
    const limits = await this.saasRepository.listPlanLimits(plan.id);
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      isActive: plan.is_active,
      limits: limits.map((limit) => ({
        metricKey: limit.metric_key,
        metricLimit: limit.metric_limit,
        resetPeriod: limit.reset_period,
      })),
    };
  }

  private toSubscriptionResponse(
    subscription: CurrentSubscriptionRecord,
    limits: PlanLimitRecord[],
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
      plan: {
        id: subscription.plan_id,
        code: subscription.plan_code,
        name: subscription.plan_name,
        description: subscription.plan_description,
        isActive: subscription.plan_is_active,
      },
      limits: limits.map((limit) => ({
        metricKey: limit.metric_key,
        metricLimit: limit.metric_limit,
        resetPeriod: limit.reset_period,
      })),
      usage,
    };
  }
}
