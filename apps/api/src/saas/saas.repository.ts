import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import type { LimitResetPeriod } from './constants/saas-metrics.constants';

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
}

export interface PlanLimitRecord {
  id: string;
  plan_id: string;
  metric_key: string;
  metric_limit: number | null;
  reset_period: LimitResetPeriod;
}

export interface CurrentSubscriptionRecord {
  id: string;
  store_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended';
  starts_at: Date;
  current_period_end: Date | null;
  trial_ends_at: Date | null;
  plan_code: string;
  plan_name: string;
  plan_description: string | null;
  plan_is_active: boolean;
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
}

export interface PlatformDomainRecord {
  id: string;
  store_id: string;
  store_name: string;
  hostname: string;
  status: string;
  ssl_status: string;
  updated_at: Date;
}

@Injectable()
export class SaasRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listPlans(): Promise<PlanRecord[]> {
    const result = await this.databaseService.db.query<PlanRecord>(
      `
        SELECT id, code, name, description, is_active
        FROM plans
        ORDER BY created_at ASC
      `,
    );
    return result.rows;
  }

  async findPlanByCode(code: string): Promise<PlanRecord | null> {
    const result = await this.databaseService.db.query<PlanRecord>(
      `
        SELECT id, code, name, description, is_active
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
        SELECT id, code, name, description, is_active
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
    },
    db?: Queryable,
  ): Promise<PlanRecord> {
    const queryable = db ?? this.databaseService.db;
    const result = await queryable.query<PlanRecord>(
      `
        INSERT INTO plans (id, code, name, description, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, code, name, description, is_active
      `,
      [uuidv4(), input.code, input.name, input.description, input.isActive],
    );
    return result.rows[0] as PlanRecord;
  }

  async updatePlan(
    input: {
      planId: string;
      name: string;
      description: string | null;
      isActive: boolean;
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
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, code, name, description, is_active
      `,
      [input.planId, input.name, input.description, input.isActive],
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
          p.code AS plan_code,
          p.name AS plan_name,
          p.description AS plan_description,
          p.is_active AS plan_is_active
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
            is_current
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        `,
        [
          uuidv4(),
          input.storeId,
          input.planId,
          input.status,
          input.startsAt,
          input.currentPeriodEnd,
          input.trialEndsAt,
        ],
      );
    });
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
          ss.trial_ends_at
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
}
