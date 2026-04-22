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
