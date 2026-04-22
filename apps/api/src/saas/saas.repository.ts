import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import type { LimitResetPeriod, SaasFeatureKey } from './constants/saas-metrics.constants';

interface Queryable {
  query: <T = unknown>(
    queryText: string,
    values?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
}

export interface PlanRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  monthly_price: string | null;
  annual_price: string | null;
  currency_code: string;
  billing_cycle_options: string[];
  trial_days_default: number;
  metadata: Record<string, unknown>;
}

export interface PlanLimitRecord {
  id: string;
  plan_id: string;
  metric_key: string;
  metric_limit: number | null;
  reset_period: LimitResetPeriod;
}

export interface PlanEntitlementRecord {
  id: string;
  plan_id: string;
  feature_key: SaasFeatureKey;
  is_enabled: boolean;
}

export interface CurrentSubscriptionRecord {
  id: string;
  store_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended';
  starts_at: Date;
  current_period_end: Date | null;
  trial_ends_at: Date | null;
  billing_cycle: 'monthly' | 'annual' | 'manual';
  cancel_at_period_end: boolean;
  canceled_at: Date | null;
  next_billing_at: Date | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan_code: string;
  plan_name: string;
  plan_description: string | null;
  plan_is_active: boolean;
  plan_monthly_price: string | null;
  plan_annual_price: string | null;
  plan_currency_code: string;
}

export interface PlatformStoreRecord {
  id: string;
  name: string;
  slug: string;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: Date;
  plan_code: string | null;
  subscription_status: string | null;
  total_domains: number;
  active_domains: number;
}

export interface PlatformSubscriptionRecord {
  id: string;
  store_id: string;
  store_name: string;
  store_slug: string;
  plan_code: string;
  plan_name: string;
  status: string;
  starts_at: Date;
  current_period_end: Date | null;
  trial_ends_at: Date | null;
  billing_cycle: 'monthly' | 'annual' | 'manual';
  next_billing_at: Date | null;
  cancel_at_period_end: boolean;
}

export interface PlatformDomainRecord {
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
}

export interface PlatformDashboardSummaryRecord {
  total_stores: string;
  active_stores: string;
  suspended_stores: string;
  total_subscriptions: string;
  active_subscriptions: string;
  trialing_subscriptions: string;
  past_due_subscriptions: string;
  canceled_subscriptions: string;
  total_domains: string;
  domain_issues: string;
}

export interface PlatformAuditActivityRecord {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  store_id: string | null;
}

export interface PlatformStoreNoteRecord {
  id: string;
  store_id: string;
  author_admin_id: string | null;
  author_name: string | null;
  type: string;
  body: string;
  pinned: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformIncidentRecord {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  title: string;
  summary: string;
  status: 'open' | 'investigating' | 'mitigated' | 'resolved';
  related_store_id: string | null;
  created_by_admin_id: string | null;
  created_by_name: string | null;
  created_at: Date;
  resolved_at: Date | null;
  updated_at: Date;
}

export interface PlatformAdminUserRecord {
  id: string;
  full_name: string;
  email: string;
  status: 'active' | 'disabled';
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformRoleRecord {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformSettingRecord {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: Date;
}

export interface PlatformAutomationRuleRecord {
  id: string;
  name: string;
  description: string | null;
  trigger_type: 'manual' | 'schedule' | 'event';
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  last_run_at: Date | null;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformAutomationRunRecord {
  id: string;
  rule_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  triggered_by_admin_id: string | null;
  store_id: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  logs: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface PlatformSupportCaseRecord {
  id: string;
  store_id: string | null;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  queue: string;
  assignee_admin_id: string | null;
  assignee_name: string | null;
  sla_due_at: Date | null;
  impact_score: number;
  created_by_admin_id: string | null;
  created_by_name: string | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformRiskViolationRecord {
  id: string;
  store_id: string | null;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  status: 'open' | 'investigating' | 'mitigated' | 'accepted' | 'resolved';
  summary: string;
  details: Record<string, unknown>;
  detected_at: Date;
  resolved_at: Date | null;
  owner_admin_id: string | null;
  owner_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformComplianceTaskRecord {
  id: string;
  violation_id: string | null;
  policy_key: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  due_at: Date | null;
  assignee_admin_id: string | null;
  assignee_name: string | null;
  checklist: Record<string, unknown>[];
  evidence: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionInvoiceRecord {
  id: string;
  store_id: string;
  subscription_id: string;
  plan_id: string;
  invoice_number: string;
  billing_cycle: 'monthly' | 'annual' | 'proration' | 'manual';
  period_start: Date;
  period_end: Date;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  currency_code: string;
  status: 'draft' | 'open' | 'paid' | 'failed' | 'void';
  due_at: Date | null;
  paid_at: Date | null;
  external_invoice_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionPaymentRecord {
  id: string;
  invoice_id: string;
  store_id: string;
  provider: string;
  payment_method: string | null;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  amount: string;
  currency_code: string;
  external_transaction_id: string | null;
  failure_reason: string | null;
  processed_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface BillingEventRecord {
  id: string;
  store_id: string | null;
  source: 'provider_webhook' | 'internal_admin' | 'merchant_action' | 'system_scheduler';
  event_type: string;
  idempotency_key: string | null;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  processing_error: string | null;
  processed_at: Date | null;
  created_at: Date;
}

@Injectable()
export class SaasRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listPlans(options?: { onlyActive?: boolean }): Promise<PlanRecord[]> {
    const result = await this.databaseService.db.query<PlanRecord>(
      `
        SELECT
          id,
          code,
          name,
          description,
          is_active,
          monthly_price,
          annual_price,
          currency_code,
          billing_cycle_options,
          trial_days_default,
          metadata
        FROM plans
        WHERE ($1::boolean = FALSE OR is_active = TRUE)
        ORDER BY created_at ASC
      `,
      [Boolean(options?.onlyActive)],
    );
    return result.rows;
  }

  async findPlanByCode(code: string): Promise<PlanRecord | null> {
    const result = await this.databaseService.db.query<PlanRecord>(
      `
        SELECT
          id,
          code,
          name,
          description,
          is_active,
          monthly_price,
          annual_price,
          currency_code,
          billing_cycle_options,
          trial_days_default,
          metadata
        FROM plans
        WHERE LOWER(code) = LOWER($1)
        LIMIT 1
      `,
      [code],
    );
    return result.rows[0] ?? null;
  }

  async findPlanById(planId: string): Promise<PlanRecord | null> {
    const result = await this.databaseService.db.query<PlanRecord>(
      `
        SELECT
          id,
          code,
          name,
          description,
          is_active,
          monthly_price,
          annual_price,
          currency_code,
          billing_cycle_options,
          trial_days_default,
          metadata
        FROM plans
        WHERE id = $1
        LIMIT 1
      `,
      [planId],
    );
    return result.rows[0] ?? null;
  }

  async createPlan(
    input: {
      code: string;
      name: string;
      description: string | null;
      isActive: boolean;
      monthlyPrice: number | null;
      annualPrice: number | null;
      currencyCode: string;
      billingCycleOptions: string[];
      trialDaysDefault: number;
      metadata: Record<string, unknown>;
    },
    db?: Queryable,
  ): Promise<PlanRecord> {
    const queryable = db ?? this.databaseService.db;
    const result = await queryable.query<PlanRecord>(
      `
        INSERT INTO plans (
          id,
          code,
          name,
          description,
          is_active,
          monthly_price,
          annual_price,
          currency_code,
          billing_cycle_options,
          trial_days_default,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10, $11::jsonb)
        RETURNING
          id,
          code,
          name,
          description,
          is_active,
          monthly_price,
          annual_price,
          currency_code,
          billing_cycle_options,
          trial_days_default,
          metadata
      `,
      [
        uuidv4(),
        input.code,
        input.name,
        input.description,
        input.isActive,
        input.monthlyPrice,
        input.annualPrice,
        input.currencyCode,
        input.billingCycleOptions,
        input.trialDaysDefault,
        JSON.stringify(input.metadata),
      ],
    );
    return result.rows[0] as PlanRecord;
  }

  async updatePlan(
    input: {
      planId: string;
      name: string;
      description: string | null;
      isActive: boolean;
      monthlyPrice: number | null;
      annualPrice: number | null;
      currencyCode: string;
      billingCycleOptions: string[];
      trialDaysDefault: number;
      metadata: Record<string, unknown>;
    },
    db?: Queryable,
  ): Promise<PlanRecord | null> {
    const queryable = db ?? this.databaseService.db;
    const result = await queryable.query<PlanRecord>(
      `
        UPDATE plans
        SET name = $2,
            description = $3,
            is_active = $4,
            monthly_price = $5,
            annual_price = $6,
            currency_code = $7,
            billing_cycle_options = $8::text[],
            trial_days_default = $9,
            metadata = $10::jsonb,
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          code,
          name,
          description,
          is_active,
          monthly_price,
          annual_price,
          currency_code,
          billing_cycle_options,
          trial_days_default,
          metadata
      `,
      [
        input.planId,
        input.name,
        input.description,
        input.isActive,
        input.monthlyPrice,
        input.annualPrice,
        input.currencyCode,
        input.billingCycleOptions,
        input.trialDaysDefault,
        JSON.stringify(input.metadata),
      ],
    );
    return result.rows[0] ?? null;
  }

  async listPlanLimits(planId: string): Promise<PlanLimitRecord[]> {
    const result = await this.databaseService.db.query<PlanLimitRecord>(
      `
        SELECT id, plan_id, metric_key, metric_limit, reset_period
        FROM plan_limits
        WHERE plan_id = $1
        ORDER BY metric_key ASC
      `,
      [planId],
    );
    return result.rows;
  }

  async replacePlanLimits(
    db: Queryable,
    planId: string,
    limits: Array<{ metricKey: string; metricLimit: number | null; resetPeriod: LimitResetPeriod }>,
  ): Promise<void> {
    await db.query(
      `
        DELETE FROM plan_limits
        WHERE plan_id = $1
      `,
      [planId],
    );

    for (const limit of limits) {
      await db.query(
        `
          INSERT INTO plan_limits (id, plan_id, metric_key, metric_limit, reset_period)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [uuidv4(), planId, limit.metricKey, limit.metricLimit, limit.resetPeriod],
      );
    }
  }

  async listPlanEntitlements(planId: string): Promise<PlanEntitlementRecord[]> {
    const result = await this.databaseService.db.query<PlanEntitlementRecord>(
      `
        SELECT id, plan_id, feature_key, is_enabled
        FROM plan_entitlements
        WHERE plan_id = $1
        ORDER BY feature_key ASC
      `,
      [planId],
    );
    return result.rows;
  }

  async replacePlanEntitlements(
    db: Queryable,
    planId: string,
    entitlements: Array<{ featureKey: SaasFeatureKey; isEnabled: boolean }>,
  ): Promise<void> {
    await db.query(
      `
        DELETE FROM plan_entitlements
        WHERE plan_id = $1
      `,
      [planId],
    );

    for (const entitlement of entitlements) {
      await db.query(
        `
          INSERT INTO plan_entitlements (id, plan_id, feature_key, is_enabled)
          VALUES ($1, $2, $3, $4)
        `,
        [uuidv4(), planId, entitlement.featureKey, entitlement.isEnabled],
      );
    }
  }

  async withTransaction<T>(callback: (db: Queryable) => Promise<T>): Promise<T> {
    const client = await this.databaseService.db.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCurrentSubscription(storeId: string): Promise<CurrentSubscriptionRecord | null> {
    const result = await this.databaseService.db.query<CurrentSubscriptionRecord>(
      `
        SELECT
          ss.id,
          ss.store_id,
          ss.plan_id,
          ss.status,
          ss.starts_at,
          ss.current_period_end,
          ss.trial_ends_at,
          ss.billing_cycle,
          ss.cancel_at_period_end,
          ss.canceled_at,
          ss.next_billing_at,
          ss.provider_customer_id,
          ss.provider_subscription_id,
          p.code AS plan_code,
          p.name AS plan_name,
          p.description AS plan_description,
          p.is_active AS plan_is_active,
          p.monthly_price AS plan_monthly_price,
          p.annual_price AS plan_annual_price,
          p.currency_code AS plan_currency_code
        FROM store_subscriptions ss
        INNER JOIN plans p
          ON p.id = ss.plan_id
        WHERE ss.store_id = $1
          AND ss.is_current = TRUE
        LIMIT 1
      `,
      [storeId],
    );
    return result.rows[0] ?? null;
  }

  async replaceCurrentSubscription(input: {
    storeId: string;
    planId: string;
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended';
    startsAt: Date;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    billingCycle: 'monthly' | 'annual' | 'manual';
    nextBillingAt: Date | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
  }): Promise<void> {
    await this.withTransaction(async (db) => {
      await db.query(
        `
          UPDATE store_subscriptions
          SET is_current = FALSE,
              updated_at = NOW()
          WHERE store_id = $1
            AND is_current = TRUE
        `,
        [input.storeId],
      );

      await db.query(
        `
          INSERT INTO store_subscriptions (
            id,
            store_id,
            plan_id,
            status,
            starts_at,
            current_period_end,
            trial_ends_at,
            billing_cycle,
            cancel_at_period_end,
            canceled_at,
            next_billing_at,
            provider_customer_id,
            provider_subscription_id,
            is_current
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
        `,
        [
          uuidv4(),
          input.storeId,
          input.planId,
          input.status,
          input.startsAt,
          input.currentPeriodEnd,
          input.trialEndsAt,
          input.billingCycle,
          input.cancelAtPeriodEnd ?? false,
          input.canceledAt ?? null,
          input.nextBillingAt,
          input.providerCustomerId ?? null,
          input.providerSubscriptionId ?? null,
        ],
      );
    });
  }

  async updateCurrentSubscriptionBilling(input: {
    storeId: string;
    billingCycle?: 'monthly' | 'annual' | 'manual';
    currentPeriodEnd?: Date | null;
    nextBillingAt?: Date | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
  }): Promise<boolean> {
    const assignments: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [input.storeId];

    const append = (column: string, value: unknown) => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    if (input.billingCycle !== undefined) {
      append('billing_cycle', input.billingCycle);
    }
    if (input.currentPeriodEnd !== undefined) {
      append('current_period_end', input.currentPeriodEnd);
    }
    if (input.nextBillingAt !== undefined) {
      append('next_billing_at', input.nextBillingAt);
    }
    if (input.cancelAtPeriodEnd !== undefined) {
      append('cancel_at_period_end', input.cancelAtPeriodEnd);
    }
    if (input.canceledAt !== undefined) {
      append('canceled_at', input.canceledAt);
    }
    if (input.providerCustomerId !== undefined) {
      append('provider_customer_id', input.providerCustomerId);
    }
    if (input.providerSubscriptionId !== undefined) {
      append('provider_subscription_id', input.providerSubscriptionId);
    }

    const result = await this.databaseService.db.query(
      `
        UPDATE store_subscriptions
        SET ${assignments.join(', ')}
        WHERE store_id = $1
          AND is_current = TRUE
      `,
      values,
    );

    return (result.rowCount ?? 0) > 0;
  }

  async findSubscriptionById(subscriptionId: string): Promise<CurrentSubscriptionRecord | null> {
    const result = await this.databaseService.db.query<CurrentSubscriptionRecord>(
      `
        SELECT
          ss.id,
          ss.store_id,
          ss.plan_id,
          ss.status,
          ss.starts_at,
          ss.current_period_end,
          ss.trial_ends_at,
          ss.billing_cycle,
          ss.cancel_at_period_end,
          ss.canceled_at,
          ss.next_billing_at,
          ss.provider_customer_id,
          ss.provider_subscription_id,
          p.code AS plan_code,
          p.name AS plan_name,
          p.description AS plan_description,
          p.is_active AS plan_is_active,
          p.monthly_price AS plan_monthly_price,
          p.annual_price AS plan_annual_price,
          p.currency_code AS plan_currency_code
        FROM store_subscriptions ss
        INNER JOIN plans p ON p.id = ss.plan_id
        WHERE ss.id = $1
        LIMIT 1
      `,
      [subscriptionId],
    );
    return result.rows[0] ?? null;
  }

  async findCurrentSubscriptionByProviderSubscriptionId(
    providerSubscriptionId: string,
  ): Promise<CurrentSubscriptionRecord | null> {
    const result = await this.databaseService.db.query<CurrentSubscriptionRecord>(
      `
        SELECT
          ss.id,
          ss.store_id,
          ss.plan_id,
          ss.status,
          ss.starts_at,
          ss.current_period_end,
          ss.trial_ends_at,
          ss.billing_cycle,
          ss.cancel_at_period_end,
          ss.canceled_at,
          ss.next_billing_at,
          ss.provider_customer_id,
          ss.provider_subscription_id,
          p.code AS plan_code,
          p.name AS plan_name,
          p.description AS plan_description,
          p.is_active AS plan_is_active,
          p.monthly_price AS plan_monthly_price,
          p.annual_price AS plan_annual_price,
          p.currency_code AS plan_currency_code
        FROM store_subscriptions ss
        INNER JOIN plans p ON p.id = ss.plan_id
        WHERE ss.provider_subscription_id = $1
          AND ss.is_current = TRUE
        LIMIT 1
      `,
      [providerSubscriptionId],
    );
    return result.rows[0] ?? null;
  }

  async recordUsageEvent(input: {
    storeId: string;
    metricKey: string;
    quantity: number;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.databaseService.db.query(
      `
        INSERT INTO usage_events (id, store_id, metric_key, quantity, happened_at, metadata)
        VALUES ($1, $2, $3, $4, NOW(), $5::jsonb)
      `,
      [uuidv4(), input.storeId, input.metricKey, input.quantity, JSON.stringify(input.metadata)],
    );
  }

  async createInvoice(input: {
    storeId: string;
    subscriptionId: string;
    planId: string;
    invoiceNumber: string;
    billingCycle: 'monthly' | 'annual' | 'proration' | 'manual';
    periodStart: Date;
    periodEnd: Date;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    currencyCode: string;
    status: 'draft' | 'open' | 'paid' | 'failed' | 'void';
    dueAt: Date | null;
    paidAt?: Date | null;
    externalInvoiceId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<SubscriptionInvoiceRecord> {
    const result = await this.databaseService.db.query<SubscriptionInvoiceRecord>(
      `
        INSERT INTO subscription_invoices (
          id,
          store_id,
          subscription_id,
          plan_id,
          invoice_number,
          billing_cycle,
          period_start,
          period_end,
          subtotal_amount,
          tax_amount,
          total_amount,
          currency_code,
          status,
          due_at,
          paid_at,
          external_invoice_id,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb
        )
        RETURNING
          id,
          store_id,
          subscription_id,
          plan_id,
          invoice_number,
          billing_cycle,
          period_start,
          period_end,
          subtotal_amount,
          tax_amount,
          total_amount,
          currency_code,
          status,
          due_at,
          paid_at,
          external_invoice_id,
          metadata,
          created_at,
          updated_at
      `,
      [
        uuidv4(),
        input.storeId,
        input.subscriptionId,
        input.planId,
        input.invoiceNumber,
        input.billingCycle,
        input.periodStart,
        input.periodEnd,
        input.subtotalAmount,
        input.taxAmount,
        input.totalAmount,
        input.currencyCode,
        input.status,
        input.dueAt,
        input.paidAt ?? null,
        input.externalInvoiceId ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return result.rows[0] as SubscriptionInvoiceRecord;
  }

  async findInvoiceById(invoiceId: string): Promise<SubscriptionInvoiceRecord | null> {
    const result = await this.databaseService.db.query<SubscriptionInvoiceRecord>(
      `
        SELECT
          id,
          store_id,
          subscription_id,
          plan_id,
          invoice_number,
          billing_cycle,
          period_start,
          period_end,
          subtotal_amount,
          tax_amount,
          total_amount,
          currency_code,
          status,
          due_at,
          paid_at,
          external_invoice_id,
          metadata,
          created_at,
          updated_at
        FROM subscription_invoices
        WHERE id = $1
        LIMIT 1
      `,
      [invoiceId],
    );
    return result.rows[0] ?? null;
  }

  async findInvoiceByExternalInvoiceId(externalInvoiceId: string): Promise<SubscriptionInvoiceRecord | null> {
    const result = await this.databaseService.db.query<SubscriptionInvoiceRecord>(
      `
        SELECT
          id,
          store_id,
          subscription_id,
          plan_id,
          invoice_number,
          billing_cycle,
          period_start,
          period_end,
          subtotal_amount,
          tax_amount,
          total_amount,
          currency_code,
          status,
          due_at,
          paid_at,
          external_invoice_id,
          metadata,
          created_at,
          updated_at
        FROM subscription_invoices
        WHERE external_invoice_id = $1
        LIMIT 1
      `,
      [externalInvoiceId],
    );
    return result.rows[0] ?? null;
  }

  async updateInvoiceStatus(input: {
    invoiceId: string;
    status: 'draft' | 'open' | 'paid' | 'failed' | 'void';
    paidAt?: Date | null;
    externalInvoiceId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        UPDATE subscription_invoices
        SET status = $2,
            paid_at = $3,
            external_invoice_id = COALESCE($4, external_invoice_id),
            metadata = CASE WHEN $5::jsonb = '{}'::jsonb THEN metadata ELSE $5::jsonb END,
            updated_at = NOW()
        WHERE id = $1
      `,
      [input.invoiceId, input.status, input.paidAt ?? null, input.externalInvoiceId ?? null, JSON.stringify(input.metadata ?? {})],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async listInvoicesByStore(input: {
    storeId: string;
    status: string | null;
    limit: number;
    offset: number;
  }): Promise<{ rows: SubscriptionInvoiceRecord[]; total: number }> {
    const rowsResult = await this.databaseService.db.query<SubscriptionInvoiceRecord>(
      `
        SELECT
          id,
          store_id,
          subscription_id,
          plan_id,
          invoice_number,
          billing_cycle,
          period_start,
          period_end,
          subtotal_amount,
          tax_amount,
          total_amount,
          currency_code,
          status,
          due_at,
          paid_at,
          external_invoice_id,
          metadata,
          created_at,
          updated_at
        FROM subscription_invoices
        WHERE store_id = $1
          AND ($2::text IS NULL OR status = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
      `,
      [input.storeId, input.status, input.limit, input.offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM subscription_invoices
        WHERE store_id = $1
          AND ($2::text IS NULL OR status = $2)
      `,
      [input.storeId, input.status],
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async createPayment(input: {
    invoiceId: string;
    storeId: string;
    provider: string;
    paymentMethod: string | null;
    status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    amount: number;
    currencyCode: string;
    externalTransactionId?: string | null;
    failureReason?: string | null;
    processedAt?: Date | null;
    metadata?: Record<string, unknown>;
  }): Promise<SubscriptionPaymentRecord> {
    const result = await this.databaseService.db.query<SubscriptionPaymentRecord>(
      `
        INSERT INTO subscription_payments (
          id,
          invoice_id,
          store_id,
          provider,
          payment_method,
          status,
          amount,
          currency_code,
          external_transaction_id,
          failure_reason,
          processed_at,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        RETURNING
          id,
          invoice_id,
          store_id,
          provider,
          payment_method,
          status,
          amount,
          currency_code,
          external_transaction_id,
          failure_reason,
          processed_at,
          metadata,
          created_at
      `,
      [
        uuidv4(),
        input.invoiceId,
        input.storeId,
        input.provider,
        input.paymentMethod,
        input.status,
        input.amount,
        input.currencyCode,
        input.externalTransactionId ?? null,
        input.failureReason ?? null,
        input.processedAt ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return result.rows[0] as SubscriptionPaymentRecord;
  }

  async findBillingEventBySourceAndIdempotency(
    source: BillingEventRecord['source'],
    idempotencyKey: string,
  ): Promise<BillingEventRecord | null> {
    const result = await this.databaseService.db.query<BillingEventRecord>(
      `
        SELECT
          id,
          store_id,
          source,
          event_type,
          idempotency_key,
          payload,
          status,
          processing_error,
          processed_at,
          created_at
        FROM billing_events
        WHERE source = $1
          AND idempotency_key = $2
        LIMIT 1
      `,
      [source, idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  async createBillingEvent(input: {
    storeId: string | null;
    source: BillingEventRecord['source'];
    eventType: string;
    idempotencyKey: string | null;
    payload: Record<string, unknown>;
    status: BillingEventRecord['status'];
    processingError?: string | null;
    processedAt?: Date | null;
  }): Promise<BillingEventRecord> {
    const result = await this.databaseService.db.query<BillingEventRecord>(
      `
        INSERT INTO billing_events (
          id,
          store_id,
          source,
          event_type,
          idempotency_key,
          payload,
          status,
          processing_error,
          processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
        RETURNING
          id,
          store_id,
          source,
          event_type,
          idempotency_key,
          payload,
          status,
          processing_error,
          processed_at,
          created_at
      `,
      [
        uuidv4(),
        input.storeId,
        input.source,
        input.eventType,
        input.idempotencyKey,
        JSON.stringify(input.payload),
        input.status,
        input.processingError ?? null,
        input.processedAt ?? null,
      ],
    );
    return result.rows[0] as BillingEventRecord;
  }

  async updateBillingEventStatus(input: {
    billingEventId: string;
    status: BillingEventRecord['status'];
    processingError?: string | null;
    processedAt?: Date | null;
  }): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        UPDATE billing_events
        SET status = $2,
            processing_error = $3,
            processed_at = $4,
            updated_at = NOW()
        WHERE id = $1
      `,
      [input.billingEventId, input.status, input.processingError ?? null, input.processedAt ?? null],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async listRecentBillingEvents(limit: number): Promise<BillingEventRecord[]> {
    const result = await this.databaseService.db.query<BillingEventRecord>(
      `
        SELECT
          id,
          store_id,
          source,
          event_type,
          idempotency_key,
          payload,
          status,
          processing_error,
          processed_at,
          created_at
        FROM billing_events
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async countProducts(storeId: string): Promise<number> {
    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM products
        WHERE store_id = $1
      `,
      [storeId],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async countStaff(storeId: string): Promise<number> {
    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM store_users
        WHERE store_id = $1
          AND is_active = TRUE
      `,
      [storeId],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async countOrdersForMonth(storeId: string, at: Date): Promise<number> {
    const periodStart = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));

    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM orders
        WHERE store_id = $1
          AND created_at >= $2
          AND created_at < $3
      `,
      [storeId, periodStart, periodEnd],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async getPlatformDashboardSummary(): Promise<PlatformDashboardSummaryRecord> {
    const result = await this.databaseService.db.query<PlatformDashboardSummaryRecord>(
      `
        SELECT
          (SELECT COUNT(*)::text FROM stores) AS total_stores,
          (SELECT COUNT(*)::text FROM stores WHERE is_suspended = FALSE) AS active_stores,
          (SELECT COUNT(*)::text FROM stores WHERE is_suspended = TRUE) AS suspended_stores,
          (SELECT COUNT(*)::text FROM store_subscriptions WHERE is_current = TRUE) AS total_subscriptions,
          (SELECT COUNT(*)::text FROM store_subscriptions WHERE is_current = TRUE AND status = 'active') AS active_subscriptions,
          (SELECT COUNT(*)::text FROM store_subscriptions WHERE is_current = TRUE AND status = 'trialing') AS trialing_subscriptions,
          (SELECT COUNT(*)::text FROM store_subscriptions WHERE is_current = TRUE AND status = 'past_due') AS past_due_subscriptions,
          (SELECT COUNT(*)::text FROM store_subscriptions WHERE is_current = TRUE AND status = 'canceled') AS canceled_subscriptions,
          (SELECT COUNT(*)::text FROM store_domains) AS total_domains,
          (
            SELECT COUNT(*)::text
            FROM store_domains
            WHERE ssl_status = 'error'
               OR status = 'pending'
          ) AS domain_issues
      `,
    );

    return result.rows[0] as PlatformDashboardSummaryRecord;
  }

  async getPlatformGrowthSummary(): Promise<{
    newStores7d: number;
    newStores30d: number;
    trialingSubscriptions: number;
    paidSubscriptions: number;
  }> {
    const result = await this.databaseService.db.query<{
      new_stores_7d: string;
      new_stores_30d: string;
      trialing_subscriptions: string;
      paid_subscriptions: string;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)::text
            FROM stores
            WHERE created_at >= NOW() - INTERVAL '7 days'
          ) AS new_stores_7d,
          (
            SELECT COUNT(*)::text
            FROM stores
            WHERE created_at >= NOW() - INTERVAL '30 days'
          ) AS new_stores_30d,
          (
            SELECT COUNT(*)::text
            FROM store_subscriptions
            WHERE is_current = TRUE
              AND status = 'trialing'
          ) AS trialing_subscriptions,
          (
            SELECT COUNT(*)::text
            FROM store_subscriptions
            WHERE is_current = TRUE
              AND status = 'active'
          ) AS paid_subscriptions
      `,
    );

    const row = result.rows[0];
    return {
      newStores7d: Number(row?.new_stores_7d ?? '0'),
      newStores30d: Number(row?.new_stores_30d ?? '0'),
      trialingSubscriptions: Number(row?.trialing_subscriptions ?? '0'),
      paidSubscriptions: Number(row?.paid_subscriptions ?? '0'),
    };
  }

  async getPlatformMrrChurnSummary(): Promise<{
    mrr: number;
    arr: number;
    activePaidSubscriptions: number;
    canceledIn30d: number;
    churnRate30d: number;
  }> {
    const result = await this.databaseService.db.query<{
      mrr: string;
      arr: string;
      active_paid_subscriptions: string;
      canceled_in_30d: string;
      churn_rate_30d: string;
    }>(
      `
        WITH current_paid AS (
          SELECT ss.id, ss.status, ss.updated_at, ss.starts_at, p.monthly_price
          FROM store_subscriptions ss
          INNER JOIN plans p ON p.id = ss.plan_id
          WHERE ss.is_current = TRUE
            AND ss.status = 'active'
            AND COALESCE(p.monthly_price, 0) > 0
        )
        SELECT
          COALESCE(SUM(monthly_price), 0)::text AS mrr,
          (COALESCE(SUM(monthly_price), 0) * 12)::text AS arr,
          COUNT(*)::text AS active_paid_subscriptions,
          (
            SELECT COUNT(*)::text
            FROM store_subscriptions ss2
            INNER JOIN plans p2 ON p2.id = ss2.plan_id
            WHERE ss2.status = 'canceled'
              AND ss2.updated_at >= NOW() - INTERVAL '30 days'
              AND COALESCE(p2.monthly_price, 0) > 0
          ) AS canceled_in_30d,
          CASE
            WHEN COUNT(*) = 0 THEN '0'
            ELSE (
              (
                SELECT COUNT(*)::numeric
                FROM store_subscriptions ss3
                INNER JOIN plans p3 ON p3.id = ss3.plan_id
                WHERE ss3.status = 'canceled'
                  AND ss3.updated_at >= NOW() - INTERVAL '30 days'
                  AND COALESCE(p3.monthly_price, 0) > 0
              ) / COUNT(*)::numeric
            )::text
          END AS churn_rate_30d
        FROM current_paid
      `,
    );

    const row = result.rows[0];
    return {
      mrr: Number(row?.mrr ?? '0'),
      arr: Number(row?.arr ?? '0'),
      activePaidSubscriptions: Number(row?.active_paid_subscriptions ?? '0'),
      canceledIn30d: Number(row?.canceled_in_30d ?? '0'),
      churnRate30d: Number(row?.churn_rate_30d ?? '0'),
    };
  }

  async getPlatformCohorts(): Promise<
    Array<{
      cohort_month: string;
      signups: number;
      paid_within_30d: number;
      conversion_rate_30d: number;
    }>
  > {
    const result = await this.databaseService.db.query<{
      cohort_month: string;
      signups: number;
      paid_within_30d: number;
      conversion_rate_30d: string;
    }>(
      `
        WITH cohorts AS (
          SELECT
            s.id AS store_id,
            DATE_TRUNC('month', s.created_at) AS cohort_month,
            s.created_at
          FROM stores s
          WHERE s.created_at >= NOW() - INTERVAL '12 months'
        ),
        paid_in_30d AS (
          SELECT DISTINCT c.store_id
          FROM cohorts c
          INNER JOIN store_subscriptions ss
            ON ss.store_id = c.store_id
           AND ss.status = 'active'
          INNER JOIN plans p ON p.id = ss.plan_id
          WHERE COALESCE(p.monthly_price, 0) > 0
            AND ss.starts_at <= c.created_at + INTERVAL '30 days'
        )
        SELECT
          TO_CHAR(c.cohort_month, 'YYYY-MM') AS cohort_month,
          COUNT(*)::int AS signups,
          COUNT(*) FILTER (WHERE c.store_id IN (SELECT store_id FROM paid_in_30d))::int AS paid_within_30d,
          CASE
            WHEN COUNT(*) = 0 THEN '0'
            ELSE (
              COUNT(*) FILTER (WHERE c.store_id IN (SELECT store_id FROM paid_in_30d))::numeric / COUNT(*)::numeric
            )::text
          END AS conversion_rate_30d
        FROM cohorts c
        GROUP BY c.cohort_month
        ORDER BY c.cohort_month DESC
      `,
    );

    return result.rows.map((row) => ({
      cohort_month: row.cohort_month,
      signups: Number(row.signups ?? 0),
      paid_within_30d: Number(row.paid_within_30d ?? 0),
      conversion_rate_30d: Number(row.conversion_rate_30d ?? '0'),
    }));
  }

  async getPlatformFunnelSummary(): Promise<{
    signups30d: number;
    activated30d: number;
    paid30d: number;
    activationRate: number;
    paidRate: number;
  }> {
    const result = await this.databaseService.db.query<{
      signups_30d: string;
      activated_30d: string;
      paid_30d: string;
      activation_rate: string;
      paid_rate: string;
    }>(
      `
        WITH base AS (
          SELECT id, created_at
          FROM stores
          WHERE created_at >= NOW() - INTERVAL '30 days'
        ),
        activated AS (
          SELECT DISTINCT b.id
          FROM base b
          WHERE EXISTS (SELECT 1 FROM products p WHERE p.store_id = b.id)
            AND EXISTS (SELECT 1 FROM store_domains d WHERE d.store_id = b.id AND d.status = 'active')
        ),
        paid AS (
          SELECT DISTINCT b.id
          FROM base b
          INNER JOIN store_subscriptions ss ON ss.store_id = b.id
          INNER JOIN plans p ON p.id = ss.plan_id
          WHERE ss.status = 'active'
            AND COALESCE(p.monthly_price, 0) > 0
        )
        SELECT
          (SELECT COUNT(*)::text FROM base) AS signups_30d,
          (SELECT COUNT(*)::text FROM activated) AS activated_30d,
          (SELECT COUNT(*)::text FROM paid) AS paid_30d,
          CASE
            WHEN (SELECT COUNT(*) FROM base) = 0 THEN '0'
            ELSE ((SELECT COUNT(*)::numeric FROM activated) / (SELECT COUNT(*)::numeric FROM base))::text
          END AS activation_rate,
          CASE
            WHEN (SELECT COUNT(*) FROM base) = 0 THEN '0'
            ELSE ((SELECT COUNT(*)::numeric FROM paid) / (SELECT COUNT(*)::numeric FROM base))::text
          END AS paid_rate
      `,
    );

    const row = result.rows[0];
    return {
      signups30d: Number(row?.signups_30d ?? '0'),
      activated30d: Number(row?.activated_30d ?? '0'),
      paid30d: Number(row?.paid_30d ?? '0'),
      activationRate: Number(row?.activation_rate ?? '0'),
      paidRate: Number(row?.paid_rate ?? '0'),
    };
  }

  async listPlatformDashboardAlerts(limit: number): Promise<
    Array<{
      type: string;
      severity: string;
      reference_id: string;
      title: string;
      created_at: Date;
    }>
  > {
    const result = await this.databaseService.db.query<{
      type: string;
      severity: string;
      reference_id: string;
      title: string;
      created_at: Date;
    }>(
      `
        SELECT *
        FROM (
          SELECT
            'subscription'::text AS type,
            CASE WHEN ss.status = 'past_due' THEN 'critical' ELSE 'warning' END AS severity,
            ss.store_id::text AS reference_id,
            ('Subscription ' || ss.status || ' for store ' || s.name) AS title,
            ss.updated_at AS created_at
          FROM store_subscriptions ss
          INNER JOIN stores s ON s.id = ss.store_id
          WHERE ss.is_current = TRUE
            AND ss.status IN ('past_due', 'suspended')
          UNION ALL
          SELECT
            'domain'::text AS type,
            CASE WHEN d.ssl_status = 'error' THEN 'critical' ELSE 'warning' END AS severity,
            d.id::text AS reference_id,
            ('Domain issue: ' || d.hostname) AS title,
            d.updated_at AS created_at
          FROM store_domains d
          WHERE d.ssl_status = 'error'
             OR d.status = 'pending'
        ) alerts
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows;
  }

  async listRecentPlatformAuditActivity(limit: number): Promise<PlatformAuditActivityRecord[]> {
    const result = await this.databaseService.db.query<PlatformAuditActivityRecord>(
      `
        SELECT
          id,
          action,
          target_type,
          target_id,
          metadata,
          created_at,
          store_id
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async listPlatformAuditLogs(input: {
    q: string | null;
    action: string | null;
    storeId: string | null;
    limit: number;
    offset: number;
  }): Promise<{ rows: PlatformAuditActivityRecord[]; total: number }> {
    const rowsResult = await this.databaseService.db.query<PlatformAuditActivityRecord>(
      `
        SELECT
          id,
          action,
          target_type,
          target_id,
          metadata,
          created_at,
          store_id
        FROM audit_logs
        WHERE ($1::text IS NULL OR action = $1)
          AND ($2::uuid IS NULL OR store_id = $2)
          AND (
            $3::text IS NULL
            OR action ILIKE '%' || $3 || '%'
            OR COALESCE(target_type, '') ILIKE '%' || $3 || '%'
            OR COALESCE(target_id, '') ILIKE '%' || $3 || '%'
          )
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5
      `,
      [input.action, input.storeId, input.q, input.limit, input.offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM audit_logs
        WHERE ($1::text IS NULL OR action = $1)
          AND ($2::uuid IS NULL OR store_id = $2)
          AND (
            $3::text IS NULL
            OR action ILIKE '%' || $3 || '%'
            OR COALESCE(target_type, '') ILIKE '%' || $3 || '%'
            OR COALESCE(target_id, '') ILIKE '%' || $3 || '%'
          )
      `,
      [input.action, input.storeId, input.q],
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async listOnboardingPipeline(limit: number): Promise<
    Array<{
      store_id: string;
      store_name: string;
      store_slug: string;
      created_at: Date;
      onboarding_status: string;
      has_products: boolean;
      has_domain: boolean;
      first_order_at: Date | null;
      trial_ends_at: Date | null;
      subscription_status: string | null;
    }>
  > {
    const result = await this.databaseService.db.query<{
      store_id: string;
      store_name: string;
      store_slug: string;
      created_at: Date;
      onboarding_status: string;
      has_products: boolean;
      has_domain: boolean;
      first_order_at: Date | null;
      trial_ends_at: Date | null;
      subscription_status: string | null;
    }>(
      `
        SELECT
          s.id AS store_id,
          s.name AS store_name,
          s.slug AS store_slug,
          s.created_at,
          CASE
            WHEN s.onboarding_completed_at IS NOT NULL THEN 'completed'
            ELSE 'in_progress'
          END AS onboarding_status,
          EXISTS (
            SELECT 1
            FROM products p
            WHERE p.store_id = s.id
          ) AS has_products,
          EXISTS (
            SELECT 1
            FROM store_domains d
            WHERE d.store_id = s.id
              AND d.status = 'active'
          ) AS has_domain,
          (
            SELECT MIN(o.created_at)
            FROM orders o
            WHERE o.store_id = s.id
          ) AS first_order_at,
          ss.trial_ends_at,
          ss.status AS subscription_status
        FROM stores s
        LEFT JOIN store_subscriptions ss
          ON ss.store_id = s.id
         AND ss.is_current = TRUE
        ORDER BY s.created_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async listOnboardingStuckStores(limit: number): Promise<
    Array<{
      store_id: string;
      store_name: string;
      store_slug: string;
      created_at: Date;
      onboarding_status: string | null;
      has_products: boolean;
      has_domain: boolean;
      first_order_at: Date | null;
      trial_ends_at: Date | null;
      subscription_status: string | null;
      days_since_signup: number;
    }>
  > {
    const result = await this.databaseService.db.query<{
      store_id: string;
      store_name: string;
      store_slug: string;
      created_at: Date;
      onboarding_status: string | null;
      has_products: boolean;
      has_domain: boolean;
      first_order_at: Date | null;
      trial_ends_at: Date | null;
      subscription_status: string | null;
      days_since_signup: number;
    }>(
      `
        SELECT
          s.id AS store_id,
          s.name AS store_name,
          s.slug AS store_slug,
          s.created_at,
          CASE
            WHEN s.onboarding_completed_at IS NOT NULL THEN 'completed'
            ELSE 'in_progress'
          END AS onboarding_status,
          EXISTS (
            SELECT 1
            FROM products p
            WHERE p.store_id = s.id
          ) AS has_products,
          EXISTS (
            SELECT 1
            FROM store_domains d
            WHERE d.store_id = s.id
              AND d.status = 'active'
          ) AS has_domain,
          (
            SELECT MIN(o.created_at)
            FROM orders o
            WHERE o.store_id = s.id
          ) AS first_order_at,
          ss.trial_ends_at,
          ss.status AS subscription_status,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400)::int AS days_since_signup
        FROM stores s
        LEFT JOIN store_subscriptions ss
          ON ss.store_id = s.id
         AND ss.is_current = TRUE
        WHERE (
          s.onboarding_completed_at IS NULL
          OR NOT EXISTS (SELECT 1 FROM products p WHERE p.store_id = s.id)
          OR NOT EXISTS (SELECT 1 FROM store_domains d WHERE d.store_id = s.id AND d.status = 'active')
          OR NOT EXISTS (SELECT 1 FROM orders o WHERE o.store_id = s.id)
        )
          AND s.created_at <= NOW() - INTERVAL '3 days'
        ORDER BY s.created_at ASC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async listStoreNotes(storeId: string, limit: number): Promise<PlatformStoreNoteRecord[]> {
    const result = await this.databaseService.db.query<PlatformStoreNoteRecord>(
      `
        SELECT
          n.id,
          n.store_id,
          n.author_admin_id,
          u.full_name AS author_name,
          n.type,
          n.body,
          n.pinned,
          n.created_at,
          n.updated_at
        FROM platform_store_notes n
        LEFT JOIN platform_admin_users u
          ON u.id = n.author_admin_id
        WHERE n.store_id = $1
        ORDER BY n.pinned DESC, n.created_at DESC
        LIMIT $2
      `,
      [storeId, limit],
    );
    return result.rows;
  }

  async createStoreNote(input: {
    storeId: string;
    authorAdminId: string;
    type: string;
    body: string;
    pinned: boolean;
  }): Promise<PlatformStoreNoteRecord> {
    const result = await this.databaseService.db.query<PlatformStoreNoteRecord>(
      `
        INSERT INTO platform_store_notes (
          id,
          store_id,
          author_admin_id,
          type,
          body,
          pinned,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING
          id,
          store_id,
          author_admin_id,
          NULL::text AS author_name,
          type,
          body,
          pinned,
          created_at,
          updated_at
      `,
      [uuidv4(), input.storeId, input.authorAdminId, input.type, input.body, input.pinned],
    );

    return result.rows[0] as PlatformStoreNoteRecord;
  }

  async findPlatformStoreById(storeId: string): Promise<PlatformStoreRecord | null> {
    const result = await this.databaseService.db.query<PlatformStoreRecord>(
      `
        SELECT
          s.id,
          s.name,
          s.slug,
          s.is_suspended,
          s.suspension_reason,
          s.created_at,
          p.code AS plan_code,
          ss.status AS subscription_status,
          COALESCE(dom.total_domains, 0)::int AS total_domains,
          COALESCE(dom.active_domains, 0)::int AS active_domains
        FROM stores s
        LEFT JOIN store_subscriptions ss
          ON ss.store_id = s.id
         AND ss.is_current = TRUE
        LEFT JOIN plans p
          ON p.id = ss.plan_id
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS total_domains,
            COUNT(*) FILTER (WHERE status = 'active')::int AS active_domains
          FROM store_domains d
          WHERE d.store_id = s.id
        ) dom ON TRUE
        WHERE s.id = $1
        LIMIT 1
      `,
      [storeId],
    );

    return result.rows[0] ?? null;
  }

  async listStoreAuditActivity(storeId: string, limit: number): Promise<PlatformAuditActivityRecord[]> {
    const result = await this.databaseService.db.query<PlatformAuditActivityRecord>(
      `
        SELECT
          id,
          action,
          target_type,
          target_id,
          metadata,
          created_at,
          store_id
        FROM audit_logs
        WHERE store_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [storeId, limit],
    );

    return result.rows;
  }

  async listPlatformStores(input: {
    q: string | null;
    limit: number;
    offset: number;
  }): Promise<{ rows: PlatformStoreRecord[]; total: number }> {
    const rowsResult = await this.databaseService.db.query<PlatformStoreRecord>(
      `
        SELECT
          s.id,
          s.name,
          s.slug,
          s.is_suspended,
          s.suspension_reason,
          s.created_at,
          p.code AS plan_code,
          ss.status AS subscription_status,
          COALESCE(dom.total_domains, 0)::int AS total_domains,
          COALESCE(dom.active_domains, 0)::int AS active_domains
        FROM stores s
        LEFT JOIN store_subscriptions ss
          ON ss.store_id = s.id
         AND ss.is_current = TRUE
        LEFT JOIN plans p
          ON p.id = ss.plan_id
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS total_domains,
            COUNT(*) FILTER (WHERE status = 'active')::int AS active_domains
          FROM store_domains d
          WHERE d.store_id = s.id
        ) dom ON TRUE
        WHERE ($1::text IS NULL OR s.name ILIKE '%' || $1 || '%' OR s.slug ILIKE '%' || $1 || '%')
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [input.q, input.limit, input.offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM stores s
        WHERE ($1::text IS NULL OR s.name ILIKE '%' || $1 || '%' OR s.slug ILIKE '%' || $1 || '%')
      `,
      [input.q],
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async setStoreSuspension(input: {
    storeId: string;
    isSuspended: boolean;
    reason: string | null;
  }): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        UPDATE stores
        SET is_suspended = $2,
            suspension_reason = $3,
            suspended_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
            updated_at = NOW()
        WHERE id = $1
      `,
      [input.storeId, input.isSuspended, input.reason],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async isStoreSuspended(storeId: string): Promise<boolean> {
    const result = await this.databaseService.db.query<{ is_suspended: boolean }>(
      `
        SELECT is_suspended
        FROM stores
        WHERE id = $1
        LIMIT 1
      `,
      [storeId],
    );
    return Boolean(result.rows[0]?.is_suspended);
  }

  async listPlatformSubscriptions(input: {
    status: string | null;
    limit: number;
    offset: number;
  }): Promise<{ rows: PlatformSubscriptionRecord[]; total: number }> {
    const rowsResult = await this.databaseService.db.query<PlatformSubscriptionRecord>(
      `
        SELECT
          ss.id,
          ss.store_id,
          s.name AS store_name,
          s.slug AS store_slug,
          p.code AS plan_code,
          p.name AS plan_name,
          ss.status,
          ss.starts_at,
          ss.current_period_end,
          ss.trial_ends_at,
          ss.billing_cycle,
          ss.next_billing_at,
          ss.cancel_at_period_end
        FROM store_subscriptions ss
        INNER JOIN stores s ON s.id = ss.store_id
        INNER JOIN plans p ON p.id = ss.plan_id
        WHERE ss.is_current = TRUE
          AND ($1::text IS NULL OR ss.status = $1)
        ORDER BY ss.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [input.status, input.limit, input.offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM store_subscriptions ss
        WHERE ss.is_current = TRUE
          AND ($1::text IS NULL OR ss.status = $1)
      `,
      [input.status],
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async listPlatformDomains(): Promise<PlatformDomainRecord[]> {
    const result = await this.databaseService.db.query<PlatformDomainRecord>(
      `
        SELECT
          d.id,
          d.store_id,
          s.name AS store_name,
          d.hostname,
          d.status,
          d.ssl_status,
          d.updated_at
        FROM store_domains d
        INNER JOIN stores s ON s.id = d.store_id
        ORDER BY d.updated_at DESC
      `,
    );
    return result.rows;
  }

  async listPlatformDomainIssues(limit: number): Promise<PlatformDomainRecord[]> {
    const result = await this.databaseService.db.query<PlatformDomainRecord>(
      `
        SELECT
          d.id,
          d.store_id,
          s.name AS store_name,
          d.hostname,
          d.status,
          d.ssl_status,
          d.ssl_provider,
          d.ssl_mode,
          d.ssl_last_checked_at,
          d.ssl_error,
          d.cloudflare_zone_id,
          d.cloudflare_hostname_id,
          d.verification_token,
          d.verified_at,
          d.activated_at,
          d.updated_at
        FROM store_domains d
        INNER JOIN stores s ON s.id = d.store_id
        WHERE d.ssl_status = 'error'
           OR d.status = 'pending'
        ORDER BY d.updated_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async findPlatformDomainById(domainId: string): Promise<PlatformDomainRecord | null> {
    const result = await this.databaseService.db.query<PlatformDomainRecord>(
      `
        SELECT
          d.id,
          d.store_id,
          s.name AS store_name,
          d.hostname,
          d.status,
          d.ssl_status,
          d.ssl_provider,
          d.ssl_mode,
          d.ssl_last_checked_at,
          d.ssl_error,
          d.cloudflare_zone_id,
          d.cloudflare_hostname_id,
          d.verification_token,
          d.verified_at,
          d.activated_at,
          d.updated_at
        FROM store_domains d
        INNER JOIN stores s ON s.id = d.store_id
        WHERE d.id = $1
        LIMIT 1
      `,
      [domainId],
    );
    return result.rows[0] ?? null;
  }

  async listPlatformDomainsByStore(storeId: string): Promise<PlatformDomainRecord[]> {
    const result = await this.databaseService.db.query<PlatformDomainRecord>(
      `
        SELECT
          d.id,
          d.store_id,
          s.name AS store_name,
          d.hostname,
          d.status,
          d.ssl_status,
          d.ssl_provider,
          d.ssl_mode,
          d.ssl_last_checked_at,
          d.ssl_error,
          d.cloudflare_zone_id,
          d.cloudflare_hostname_id,
          d.verification_token,
          d.verified_at,
          d.activated_at,
          d.updated_at
        FROM store_domains d
        INNER JOIN stores s ON s.id = d.store_id
        WHERE d.store_id = $1
        ORDER BY d.updated_at DESC
      `,
      [storeId],
    );
    return result.rows;
  }

  async touchPlatformDomainCheck(domainId: string): Promise<PlatformDomainRecord | null> {
    const result = await this.databaseService.db.query<PlatformDomainRecord>(
      `
        UPDATE store_domains
        SET ssl_last_checked_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          store_id,
          ''::text AS store_name,
          hostname,
          status,
          ssl_status,
          ssl_provider,
          ssl_mode,
          ssl_last_checked_at,
          ssl_error,
          cloudflare_zone_id,
          cloudflare_hostname_id,
          verification_token,
          verified_at,
          activated_at,
          updated_at
      `,
      [domainId],
    );

    return result.rows[0] ?? null;
  }

  async listPlatformAdmins(): Promise<PlatformAdminUserRecord[]> {
    const result = await this.databaseService.db.query<PlatformAdminUserRecord>(
      `
        SELECT
          id,
          full_name,
          email,
          status,
          last_login_at,
          created_at,
          updated_at
        FROM platform_admin_users
        ORDER BY created_at DESC
      `,
    );
    return result.rows;
  }

  async findPlatformAdminByEmail(email: string): Promise<PlatformAdminUserRecord | null> {
    const result = await this.databaseService.db.query<PlatformAdminUserRecord>(
      `
        SELECT
          id,
          full_name,
          email,
          status,
          last_login_at,
          created_at,
          updated_at
        FROM platform_admin_users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async findPlatformAdminById(adminId: string): Promise<PlatformAdminUserRecord | null> {
    const result = await this.databaseService.db.query<PlatformAdminUserRecord>(
      `
        SELECT
          id,
          full_name,
          email,
          status,
          last_login_at,
          created_at,
          updated_at
        FROM platform_admin_users
        WHERE id = $1
        LIMIT 1
      `,
      [adminId],
    );
    return result.rows[0] ?? null;
  }

  async createPlatformAdmin(input: {
    fullName: string;
    email: string;
    passwordHash: string;
    status: 'active' | 'disabled';
  }): Promise<PlatformAdminUserRecord> {
    const result = await this.databaseService.db.query<PlatformAdminUserRecord>(
      `
        INSERT INTO platform_admin_users (
          id,
          full_name,
          email,
          password_hash,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING
          id,
          full_name,
          email,
          status,
          last_login_at,
          created_at,
          updated_at
      `,
      [uuidv4(), input.fullName, input.email, input.passwordHash, input.status],
    );
    return result.rows[0] as PlatformAdminUserRecord;
  }

  async updatePlatformAdmin(input: {
    adminId: string;
    fullName?: string;
    status?: 'active' | 'disabled';
    passwordHash?: string;
  }): Promise<PlatformAdminUserRecord | null> {
    const setParts: string[] = [];
    const values: unknown[] = [input.adminId];
    let idx = 2;

    const append = (field: string, value: unknown) => {
      setParts.push(`${field} = $${idx}`);
      values.push(value);
      idx += 1;
    };

    if (input.fullName !== undefined) {
      append('full_name', input.fullName);
    }
    if (input.status !== undefined) {
      append('status', input.status);
    }
    if (input.passwordHash !== undefined) {
      append('password_hash', input.passwordHash);
    }
    append('updated_at', new Date());

    const result = await this.databaseService.db.query<PlatformAdminUserRecord>(
      `
        UPDATE platform_admin_users
        SET ${setParts.join(', ')}
        WHERE id = $1
        RETURNING
          id,
          full_name,
          email,
          status,
          last_login_at,
          created_at,
          updated_at
      `,
      values,
    );
    return result.rows[0] ?? null;
  }

  async listPlatformRolePermissions(roleId: string): Promise<string[]> {
    const result = await this.databaseService.db.query<{ key: string }>(
      `
        SELECT p.key
        FROM platform_admin_role_permissions rp
        INNER JOIN platform_admin_permissions p
          ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.key ASC
      `,
      [roleId],
    );
    return result.rows.map((row) => row.key);
  }

  async listPlatformRoles(): Promise<PlatformRoleRecord[]> {
    const result = await this.databaseService.db.query<PlatformRoleRecord>(
      `
        SELECT
          id,
          name,
          code,
          description,
          created_at,
          updated_at
        FROM platform_admin_roles
        ORDER BY created_at DESC
      `,
    );
    return result.rows;
  }

  async findPlatformRoleById(roleId: string): Promise<PlatformRoleRecord | null> {
    const result = await this.databaseService.db.query<PlatformRoleRecord>(
      `
        SELECT
          id,
          name,
          code,
          description,
          created_at,
          updated_at
        FROM platform_admin_roles
        WHERE id = $1
        LIMIT 1
      `,
      [roleId],
    );
    return result.rows[0] ?? null;
  }

  async findPlatformRoleByCode(code: string): Promise<PlatformRoleRecord | null> {
    const result = await this.databaseService.db.query<PlatformRoleRecord>(
      `
        SELECT
          id,
          name,
          code,
          description,
          created_at,
          updated_at
        FROM platform_admin_roles
        WHERE LOWER(code) = LOWER($1)
        LIMIT 1
      `,
      [code],
    );
    return result.rows[0] ?? null;
  }

  async createPlatformRole(input: {
    name: string;
    code: string;
    description: string | null;
  }): Promise<PlatformRoleRecord> {
    const result = await this.databaseService.db.query<PlatformRoleRecord>(
      `
        INSERT INTO platform_admin_roles (
          id,
          name,
          code,
          description,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING
          id,
          name,
          code,
          description,
          created_at,
          updated_at
      `,
      [uuidv4(), input.name, input.code, input.description],
    );
    return result.rows[0] as PlatformRoleRecord;
  }

  async updatePlatformRole(input: {
    roleId: string;
    name?: string;
    description?: string | null;
  }): Promise<PlatformRoleRecord | null> {
    const setParts: string[] = [];
    const values: unknown[] = [input.roleId];
    let idx = 2;
    if (input.name !== undefined) {
      setParts.push(`name = $${idx}`);
      values.push(input.name);
      idx += 1;
    }
    if (input.description !== undefined) {
      setParts.push(`description = $${idx}`);
      values.push(input.description);
      idx += 1;
    }
    setParts.push(`updated_at = $${idx}`);
    values.push(new Date());

    const result = await this.databaseService.db.query<PlatformRoleRecord>(
      `
        UPDATE platform_admin_roles
        SET ${setParts.join(', ')}
        WHERE id = $1
        RETURNING
          id,
          name,
          code,
          description,
          created_at,
          updated_at
      `,
      values,
    );
    return result.rows[0] ?? null;
  }

  async replacePlatformRolePermissions(roleId: string, permissionKeys: string[]): Promise<void> {
    await this.withTransaction(async (db) => {
      await db.query(
        `
          DELETE FROM platform_admin_role_permissions
          WHERE role_id = $1
        `,
        [roleId],
      );

      if (permissionKeys.length === 0) {
        return;
      }

      await db.query(
        `
          INSERT INTO platform_admin_role_permissions (role_id, permission_id, created_at)
          SELECT $1, p.id, NOW()
          FROM platform_admin_permissions p
          WHERE p.key = ANY($2::text[])
        `,
        [roleId, permissionKeys],
      );
    });
  }

  async assignPlatformRoleToAdmin(adminId: string, roleId: string): Promise<void> {
    await this.databaseService.db.query(
      `
        INSERT INTO platform_admin_user_roles (user_id, role_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT DO NOTHING
      `,
      [adminId, roleId],
    );
  }

  async replacePlatformAdminRoles(adminId: string, roleIds: string[]): Promise<void> {
    await this.withTransaction(async (db) => {
      await db.query(
        `
          DELETE FROM platform_admin_user_roles
          WHERE user_id = $1
        `,
        [adminId],
      );
      if (roleIds.length === 0) {
        return;
      }

      await db.query(
        `
          INSERT INTO platform_admin_user_roles (user_id, role_id, created_at)
          SELECT $1, x.role_id::uuid, NOW()
          FROM UNNEST($2::text[]) AS x(role_id)
        `,
        [adminId, roleIds],
      );
    });
  }

  async listPlatformAdminRoleIds(adminId: string): Promise<string[]> {
    const result = await this.databaseService.db.query<{ role_id: string }>(
      `
        SELECT role_id::text AS role_id
        FROM platform_admin_user_roles
        WHERE user_id = $1
      `,
      [adminId],
    );
    return result.rows.map((row) => row.role_id);
  }

  async listPlatformAdminRoleCodes(adminId: string): Promise<string[]> {
    const result = await this.databaseService.db.query<{ code: string }>(
      `
        SELECT r.code
        FROM platform_admin_user_roles ur
        INNER JOIN platform_admin_roles r
          ON r.id = ur.role_id
        WHERE ur.user_id = $1
        ORDER BY r.code ASC
      `,
      [adminId],
    );
    return result.rows.map((row) => row.code);
  }

  async listPlatformPermissionKeys(): Promise<string[]> {
    const result = await this.databaseService.db.query<{ key: string }>(
      `
        SELECT key
        FROM platform_admin_permissions
        ORDER BY key ASC
      `,
    );
    return result.rows.map((row) => row.key);
  }

  async listPlatformSettings(): Promise<PlatformSettingRecord[]> {
    const result = await this.databaseService.db.query<PlatformSettingRecord>(
      `
        SELECT
          ps.id,
          ps.key,
          ps.value,
          ps.updated_by,
          u.full_name AS updated_by_name,
          ps.updated_at
        FROM platform_settings ps
        LEFT JOIN platform_admin_users u
          ON u.id = ps.updated_by
        ORDER BY ps.key ASC
      `,
    );
    return result.rows;
  }

  async upsertPlatformSetting(input: {
    key: string;
    value: Record<string, unknown>;
    updatedBy: string;
  }): Promise<PlatformSettingRecord> {
    const result = await this.databaseService.db.query<PlatformSettingRecord>(
      `
        INSERT INTO platform_settings (id, key, value, updated_by, updated_at)
        VALUES ($1, $2, $3::jsonb, $4, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
        RETURNING
          id,
          key,
          value,
          updated_by,
          NULL::text AS updated_by_name,
          updated_at
      `,
      [uuidv4(), input.key, JSON.stringify(input.value), input.updatedBy],
    );
    return result.rows[0] as PlatformSettingRecord;
  }

  async listPlatformQueueOverview(): Promise<
    Array<{ queue_name: string; backlog_count: number; failed_jobs: number; retry_ready: number }>
  > {
    const result = await this.databaseService.db.query<{
      queue_name: string;
      backlog_count: number;
      failed_jobs: number;
      retry_ready: number;
    }>(
      `
        SELECT
          'outbox_events'::text AS queue_name,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS backlog_count,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_jobs,
          COUNT(*) FILTER (
            WHERE status = 'failed'
              AND available_at <= NOW()
          )::int AS retry_ready
        FROM outbox_events
      `,
    );
    return result.rows;
  }

  async listPlatformIncidents(limit: number): Promise<PlatformIncidentRecord[]> {
    const result = await this.databaseService.db.query<PlatformIncidentRecord>(
      `
        SELECT
          i.id,
          i.type,
          i.severity,
          i.service,
          i.title,
          i.summary,
          i.status,
          i.related_store_id,
          i.created_by_admin_id,
          u.full_name AS created_by_name,
          i.created_at,
          i.resolved_at,
          i.updated_at
        FROM platform_incidents i
        LEFT JOIN platform_admin_users u
          ON u.id = i.created_by_admin_id
        ORDER BY i.created_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async createPlatformIncident(input: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    service: string;
    title: string;
    summary: string;
    status: 'open' | 'investigating' | 'mitigated' | 'resolved';
    relatedStoreId: string | null;
    createdByAdminId: string;
  }): Promise<PlatformIncidentRecord> {
    const result = await this.databaseService.db.query<PlatformIncidentRecord>(
      `
        INSERT INTO platform_incidents (
          id,
          type,
          severity,
          service,
          title,
          summary,
          status,
          related_store_id,
          created_by_admin_id,
          created_at,
          resolved_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW())
        RETURNING
          id,
          type,
          severity,
          service,
          title,
          summary,
          status,
          related_store_id,
          created_by_admin_id,
          NULL::text AS created_by_name,
          created_at,
          resolved_at,
          updated_at
      `,
      [
        uuidv4(),
        input.type,
        input.severity,
        input.service,
        input.title,
        input.summary,
        input.status,
        input.relatedStoreId,
        input.createdByAdminId,
        input.status === 'resolved' ? new Date() : null,
      ],
    );
    return result.rows[0] as PlatformIncidentRecord;
  }

  async updateIncidentStatus(input: {
    incidentId: string;
    status: 'open' | 'investigating' | 'mitigated' | 'resolved';
  }): Promise<PlatformIncidentRecord | null> {
    const result = await this.databaseService.db.query<PlatformIncidentRecord>(
      `
        UPDATE platform_incidents
        SET status = $2,
            resolved_at = CASE WHEN $2 = 'resolved' THEN NOW() ELSE NULL END,
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          type,
          severity,
          service,
          title,
          summary,
          status,
          related_store_id,
          created_by_admin_id,
          NULL::text AS created_by_name,
          created_at,
          resolved_at,
          updated_at
      `,
      [input.incidentId, input.status],
    );
    return result.rows[0] ?? null;
  }

  async listPlatformAutomationRules(): Promise<PlatformAutomationRuleRecord[]> {
    const result = await this.databaseService.db.query<PlatformAutomationRuleRecord>(
      `
        SELECT
          id,
          name,
          description,
          trigger_type,
          trigger_config,
          action_type,
          action_config,
          is_active,
          last_run_at,
          created_by_admin_id,
          updated_by_admin_id,
          created_at,
          updated_at
        FROM platform_automation_rules
        ORDER BY updated_at DESC
      `,
    );
    return result.rows;
  }

  async createPlatformAutomationRule(input: {
    name: string;
    description: string | null;
    triggerType: 'manual' | 'schedule' | 'event';
    triggerConfig: Record<string, unknown>;
    actionType: string;
    actionConfig: Record<string, unknown>;
    isActive: boolean;
    createdByAdminId: string;
  }): Promise<PlatformAutomationRuleRecord> {
    const result = await this.databaseService.db.query<PlatformAutomationRuleRecord>(
      `
        INSERT INTO platform_automation_rules (
          id, name, description, trigger_type, trigger_config, action_type, action_config,
          is_active, created_by_admin_id, updated_by_admin_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, NOW(), NOW())
        RETURNING
          id,
          name,
          description,
          trigger_type,
          trigger_config,
          action_type,
          action_config,
          is_active,
          last_run_at,
          created_by_admin_id,
          updated_by_admin_id,
          created_at,
          updated_at
      `,
      [
        uuidv4(),
        input.name,
        input.description,
        input.triggerType,
        JSON.stringify(input.triggerConfig),
        input.actionType,
        JSON.stringify(input.actionConfig),
        input.isActive,
        input.createdByAdminId,
      ],
    );
    return result.rows[0] as PlatformAutomationRuleRecord;
  }

  async setPlatformAutomationRuleStatus(input: {
    ruleId: string;
    isActive: boolean;
    updatedByAdminId: string;
  }): Promise<PlatformAutomationRuleRecord | null> {
    const result = await this.databaseService.db.query<PlatformAutomationRuleRecord>(
      `
        UPDATE platform_automation_rules
        SET is_active = $2,
            updated_by_admin_id = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          name,
          description,
          trigger_type,
          trigger_config,
          action_type,
          action_config,
          is_active,
          last_run_at,
          created_by_admin_id,
          updated_by_admin_id,
          created_at,
          updated_at
      `,
      [input.ruleId, input.isActive, input.updatedByAdminId],
    );
    return result.rows[0] ?? null;
  }

  async createPlatformAutomationRun(input: {
    ruleId: string;
    triggeredByAdminId: string;
    storeId: string | null;
    status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
    logs: string | null;
    metadata: Record<string, unknown>;
  }): Promise<PlatformAutomationRunRecord> {
    const now = new Date();
    const result = await this.databaseService.db.query<PlatformAutomationRunRecord>(
      `
        INSERT INTO platform_automation_runs (
          id, rule_id, status, triggered_by_admin_id, store_id, started_at, finished_at, logs, metadata, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING
          id,
          rule_id,
          status,
          triggered_by_admin_id,
          store_id,
          started_at,
          finished_at,
          logs,
          metadata,
          created_at
      `,
      [
        uuidv4(),
        input.ruleId,
        input.status,
        input.triggeredByAdminId,
        input.storeId,
        now,
        input.status === 'running' || input.status === 'queued' ? null : now,
        input.logs,
        JSON.stringify(input.metadata),
      ],
    );

    await this.databaseService.db.query(
      `
        UPDATE platform_automation_rules
        SET last_run_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `,
      [input.ruleId],
    );

    return result.rows[0] as PlatformAutomationRunRecord;
  }

  async listPlatformAutomationRuns(limit: number): Promise<PlatformAutomationRunRecord[]> {
    const result = await this.databaseService.db.query<PlatformAutomationRunRecord>(
      `
        SELECT
          id,
          rule_id,
          status,
          triggered_by_admin_id,
          store_id,
          started_at,
          finished_at,
          logs,
          metadata,
          created_at
        FROM platform_automation_runs
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async listPlatformSupportCases(limit: number): Promise<PlatformSupportCaseRecord[]> {
    const result = await this.databaseService.db.query<PlatformSupportCaseRecord>(
      `
        SELECT
          c.id,
          c.store_id,
          c.subject,
          c.description,
          c.priority,
          c.status,
          c.queue,
          c.assignee_admin_id,
          assignee.full_name AS assignee_name,
          c.sla_due_at,
          c.impact_score,
          c.created_by_admin_id,
          creator.full_name AS created_by_name,
          c.resolved_at,
          c.created_at,
          c.updated_at
        FROM platform_support_cases c
        LEFT JOIN platform_admin_users assignee
          ON assignee.id = c.assignee_admin_id
        LEFT JOIN platform_admin_users creator
          ON creator.id = c.created_by_admin_id
        ORDER BY c.updated_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async createPlatformSupportCase(input: {
    storeId: string | null;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
    queue: string;
    assigneeAdminId: string | null;
    impactScore: number;
    createdByAdminId: string;
  }): Promise<PlatformSupportCaseRecord> {
    const result = await this.databaseService.db.query<PlatformSupportCaseRecord>(
      `
        INSERT INTO platform_support_cases (
          id, store_id, subject, description, priority, status, queue,
          assignee_admin_id, impact_score, created_by_admin_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING
          id,
          store_id,
          subject,
          description,
          priority,
          status,
          queue,
          assignee_admin_id,
          NULL::text AS assignee_name,
          sla_due_at,
          impact_score,
          created_by_admin_id,
          NULL::text AS created_by_name,
          resolved_at,
          created_at,
          updated_at
      `,
      [
        uuidv4(),
        input.storeId,
        input.subject,
        input.description,
        input.priority,
        input.status,
        input.queue,
        input.assigneeAdminId,
        input.impactScore,
        input.createdByAdminId,
      ],
    );
    return result.rows[0] as PlatformSupportCaseRecord;
  }

  async updatePlatformSupportCase(input: {
    caseId: string;
    status?: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
    assigneeAdminId?: string;
    queue?: string;
  }): Promise<PlatformSupportCaseRecord | null> {
    const updates: string[] = [];
    const values: unknown[] = [input.caseId];
    let i = 2;

    if (input.status !== undefined) {
      updates.push(`status = $${i}`);
      values.push(input.status);
      i += 1;
      updates.push(`resolved_at = CASE WHEN $${i - 1} IN ('resolved', 'closed') THEN NOW() ELSE NULL END`);
    }
    if (input.assigneeAdminId !== undefined) {
      updates.push(`assignee_admin_id = $${i}`);
      values.push(input.assigneeAdminId);
      i += 1;
    }
    if (input.queue !== undefined) {
      updates.push(`queue = $${i}`);
      values.push(input.queue);
      i += 1;
    }
    if (updates.length === 0) {
      return null;
    }

    updates.push('updated_at = NOW()');
    const result = await this.databaseService.db.query<PlatformSupportCaseRecord>(
      `
        UPDATE platform_support_cases
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING
          id,
          store_id,
          subject,
          description,
          priority,
          status,
          queue,
          assignee_admin_id,
          NULL::text AS assignee_name,
          sla_due_at,
          impact_score,
          created_by_admin_id,
          NULL::text AS created_by_name,
          resolved_at,
          created_at,
          updated_at
      `,
      values,
    );
    return result.rows[0] ?? null;
  }

  async createPlatformSupportCaseEvent(input: {
    caseId: string;
    eventType: string;
    actorAdminId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.databaseService.db.query(
      `
        INSERT INTO platform_support_case_events (id, case_id, event_type, actor_admin_id, payload, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `,
      [uuidv4(), input.caseId, input.eventType, input.actorAdminId, JSON.stringify(input.payload)],
    );
  }

  async listPlatformRiskViolations(limit: number): Promise<PlatformRiskViolationRecord[]> {
    const result = await this.databaseService.db.query<PlatformRiskViolationRecord>(
      `
        SELECT
          v.id,
          v.store_id,
          v.category,
          v.severity,
          v.score,
          v.status,
          v.summary,
          v.details,
          v.detected_at,
          v.resolved_at,
          v.owner_admin_id,
          owner.full_name AS owner_name,
          v.created_at,
          v.updated_at
        FROM platform_risk_violations v
        LEFT JOIN platform_admin_users owner
          ON owner.id = v.owner_admin_id
        ORDER BY v.updated_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async createPlatformRiskViolation(input: {
    storeId: string | null;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    status: 'open' | 'investigating' | 'mitigated' | 'accepted' | 'resolved';
    summary: string;
    details: Record<string, unknown>;
    ownerAdminId: string | null;
  }): Promise<PlatformRiskViolationRecord> {
    const result = await this.databaseService.db.query<PlatformRiskViolationRecord>(
      `
        INSERT INTO platform_risk_violations (
          id, store_id, category, severity, score, status, summary, details,
          detected_at, resolved_at, owner_admin_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, NOW(), NOW())
        RETURNING
          id,
          store_id,
          category,
          severity,
          score,
          status,
          summary,
          details,
          detected_at,
          resolved_at,
          owner_admin_id,
          NULL::text AS owner_name,
          created_at,
          updated_at
      `,
      [
        uuidv4(),
        input.storeId,
        input.category,
        input.severity,
        input.score,
        input.status,
        input.summary,
        JSON.stringify(input.details),
        input.status === 'resolved' ? new Date() : null,
        input.ownerAdminId,
      ],
    );
    return result.rows[0] as PlatformRiskViolationRecord;
  }

  async updatePlatformRiskViolationStatus(input: {
    violationId: string;
    status: 'open' | 'investigating' | 'mitigated' | 'accepted' | 'resolved';
  }): Promise<PlatformRiskViolationRecord | null> {
    const result = await this.databaseService.db.query<PlatformRiskViolationRecord>(
      `
        UPDATE platform_risk_violations
        SET status = $2,
            resolved_at = CASE WHEN $2 = 'resolved' THEN NOW() ELSE NULL END,
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          store_id,
          category,
          severity,
          score,
          status,
          summary,
          details,
          detected_at,
          resolved_at,
          owner_admin_id,
          NULL::text AS owner_name,
          created_at,
          updated_at
      `,
      [input.violationId, input.status],
    );
    return result.rows[0] ?? null;
  }

  async listPlatformComplianceTasks(limit: number): Promise<PlatformComplianceTaskRecord[]> {
    const result = await this.databaseService.db.query<PlatformComplianceTaskRecord>(
      `
        SELECT
          t.id,
          t.violation_id,
          t.policy_key,
          t.title,
          t.status,
          t.due_at,
          t.assignee_admin_id,
          assignee.full_name AS assignee_name,
          t.checklist,
          t.evidence,
          t.created_at,
          t.updated_at
        FROM platform_compliance_tasks t
        LEFT JOIN platform_admin_users assignee
          ON assignee.id = t.assignee_admin_id
        ORDER BY t.updated_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async createPlatformComplianceTask(input: {
    violationId: string | null;
    policyKey: string;
    title: string;
    status: 'pending' | 'in_progress' | 'done' | 'skipped';
    assigneeAdminId: string | null;
    checklist: Record<string, unknown>[];
    evidence: Record<string, unknown>;
  }): Promise<PlatformComplianceTaskRecord> {
    const result = await this.databaseService.db.query<PlatformComplianceTaskRecord>(
      `
        INSERT INTO platform_compliance_tasks (
          id, violation_id, policy_key, title, status, assignee_admin_id,
          checklist, evidence, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING
          id,
          violation_id,
          policy_key,
          title,
          status,
          due_at,
          assignee_admin_id,
          NULL::text AS assignee_name,
          checklist,
          evidence,
          created_at,
          updated_at
      `,
      [
        uuidv4(),
        input.violationId,
        input.policyKey,
        input.title,
        input.status,
        input.assigneeAdminId,
        JSON.stringify(input.checklist),
        JSON.stringify(input.evidence),
      ],
    );
    return result.rows[0] as PlatformComplianceTaskRecord;
  }

  async updatePlatformComplianceTaskStatus(input: {
    taskId: string;
    status: 'pending' | 'in_progress' | 'done' | 'skipped';
  }): Promise<PlatformComplianceTaskRecord | null> {
    const result = await this.databaseService.db.query<PlatformComplianceTaskRecord>(
      `
        UPDATE platform_compliance_tasks
        SET status = $2,
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          violation_id,
          policy_key,
          title,
          status,
          due_at,
          assignee_admin_id,
          NULL::text AS assignee_name,
          checklist,
          evidence,
          created_at,
          updated_at
      `,
      [input.taskId, input.status],
    );
    return result.rows[0] ?? null;
  }

  async getPlatformFinanceOverview(): Promise<{
    totalMrr: number;
    openInvoicesAmount: number;
    failedInvoicesAmount: number;
    overdueInvoicesCount: number;
    activePaidSubscriptions: number;
  }> {
    const result = await this.databaseService.db.query<{
      total_mrr: string;
      open_invoices_amount: string;
      failed_invoices_amount: string;
      overdue_invoices_count: string;
      active_paid_subscriptions: string;
    }>(
      `
        SELECT
          COALESCE(SUM(
            CASE
              WHEN ss.is_current = TRUE AND ss.status = 'active'
              THEN COALESCE(p.monthly_price, 0)
              ELSE 0
            END
          ), 0)::text AS total_mrr,
          COALESCE(SUM(
            CASE
              WHEN i.status = 'open' THEN i.total_amount
              ELSE 0
            END
          ), 0)::text AS open_invoices_amount,
          COALESCE(SUM(
            CASE
              WHEN i.status = 'failed' THEN i.total_amount
              ELSE 0
            END
          ), 0)::text AS failed_invoices_amount,
          COUNT(*) FILTER (
            WHERE i.status = 'open'
              AND i.due_at IS NOT NULL
              AND i.due_at < NOW()
          )::text AS overdue_invoices_count,
          COUNT(*) FILTER (
            WHERE ss.is_current = TRUE
              AND ss.status = 'active'
              AND COALESCE(p.monthly_price, 0) > 0
          )::text AS active_paid_subscriptions
        FROM store_subscriptions ss
        LEFT JOIN plans p
          ON p.id = ss.plan_id
        LEFT JOIN subscription_invoices i
          ON i.store_id = ss.store_id
      `,
    );
    const row = result.rows[0];
    return {
      totalMrr: Number(row?.total_mrr ?? '0'),
      openInvoicesAmount: Number(row?.open_invoices_amount ?? '0'),
      failedInvoicesAmount: Number(row?.failed_invoices_amount ?? '0'),
      overdueInvoicesCount: Number(row?.overdue_invoices_count ?? '0'),
      activePaidSubscriptions: Number(row?.active_paid_subscriptions ?? '0'),
    };
  }

  async listPlatformFinanceAging(): Promise<
    Array<{ bucket: 'current' | '1_30' | '31_60' | '61_90' | '90_plus'; invoices: number; amount: number }>
  > {
    const result = await this.databaseService.db.query<{
      bucket: 'current' | '1_30' | '31_60' | '61_90' | '90_plus';
      invoices: string;
      amount: string;
    }>(
      `
        SELECT
          CASE
            WHEN i.due_at IS NULL OR i.due_at >= NOW() THEN 'current'
            WHEN NOW() - i.due_at < INTERVAL '31 days' THEN '1_30'
            WHEN NOW() - i.due_at < INTERVAL '61 days' THEN '31_60'
            WHEN NOW() - i.due_at < INTERVAL '91 days' THEN '61_90'
            ELSE '90_plus'
          END AS bucket,
          COUNT(*)::text AS invoices,
          COALESCE(SUM(i.total_amount), 0)::text AS amount
        FROM subscription_invoices i
        WHERE i.status = 'open'
        GROUP BY 1
        ORDER BY 1
      `,
    );
    return result.rows.map((row) => ({
      bucket: row.bucket,
      invoices: Number(row.invoices),
      amount: Number(row.amount),
    }));
  }

  async listPlatformFinanceCollections(limit: number): Promise<
    Array<{
      invoice_id: string;
      invoice_number: string;
      store_id: string;
      store_name: string;
      status: 'open' | 'failed';
      due_at: Date | null;
      total_amount: string;
      currency_code: string;
      updated_at: Date;
    }>
  > {
    const result = await this.databaseService.db.query<{
      invoice_id: string;
      invoice_number: string;
      store_id: string;
      store_name: string;
      status: 'open' | 'failed';
      due_at: Date | null;
      total_amount: string;
      currency_code: string;
      updated_at: Date;
    }>(
      `
        SELECT
          i.id AS invoice_id,
          i.invoice_number,
          i.store_id,
          s.name AS store_name,
          i.status,
          i.due_at,
          i.total_amount,
          i.currency_code,
          i.updated_at
        FROM subscription_invoices i
        INNER JOIN stores s
          ON s.id = i.store_id
        WHERE i.status IN ('open', 'failed')
        ORDER BY i.updated_at DESC
        LIMIT $1
      `,
      [limit],
    );
    return result.rows;
  }

  async countDomains(storeId: string): Promise<number> {
    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM store_domains
        WHERE store_id = $1
      `,
      [storeId],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async pingPostgres(): Promise<void> {
    await this.databaseService.pingPostgres();
  }

  async pingRedis(): Promise<void> {
    await this.databaseService.pingRedis();
  }

  async getStorageUsedBytes(storeId: string): Promise<number> {
    const result = await this.databaseService.db.query<{ total_bytes: string | null }>(
      `
        SELECT COALESCE(SUM(file_size_bytes), 0)::text AS total_bytes
        FROM media_assets
        WHERE store_id = $1
      `,
      [storeId],
    );
    return Number(result.rows[0]?.total_bytes ?? '0');
  }

  async countApiCallsForMonth(storeId: string, at: Date): Promise<number> {
    const periodStart = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));

    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COALESCE(SUM(quantity), 0)::text AS total
        FROM usage_events
        WHERE store_id = $1
          AND metric_key = 'api_calls.monthly'
          AND happened_at >= $2
          AND happened_at < $3
      `,
      [storeId, periodStart, periodEnd],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async countWebhooksForMonth(storeId: string, at: Date): Promise<number> {
    const periodStart = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));

    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COALESCE(SUM(quantity), 0)::text AS total
        FROM usage_events
        WHERE store_id = $1
          AND metric_key = 'webhooks.monthly'
          AND happened_at >= $2
          AND happened_at < $3
      `,
      [storeId, periodStart, periodEnd],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async updateSubscriptionStatus(
    storeId: string,
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended',
  ): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        UPDATE store_subscriptions
        SET status = $2,
            updated_at = NOW()
        WHERE store_id = $1
          AND is_current = TRUE
      `,
      [storeId, status],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async setPlanActive(planId: string, isActive: boolean): Promise<PlanRecord | null> {
    const result = await this.databaseService.db.query<PlanRecord>(
      `
        UPDATE plans
        SET is_active = $2,
            updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          code,
          name,
          description,
          is_active,
          monthly_price,
          annual_price,
          currency_code,
          billing_cycle_options,
          trial_days_default,
          metadata
      `,
      [planId, isActive],
    );

    return result.rows[0] ?? null;
  }
}
