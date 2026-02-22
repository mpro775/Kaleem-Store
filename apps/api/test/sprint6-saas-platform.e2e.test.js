require('reflect-metadata');

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { after, before, beforeEach, describe, it } = require('node:test');
const { ValidationPipe } = require('@nestjs/common');
const { Test } = require('@nestjs/testing');

const { AccessTokenGuard } = require('../dist/auth/guards/access-token.guard');
const { AuditService } = require('../dist/audit/audit.service');
const { BillingController } = require('../dist/saas/billing.controller');
const { PermissionsGuard } = require('../dist/rbac/guards/permissions.guard');
const { PlatformAdminController } = require('../dist/saas/platform-admin.controller');
const { PlatformAdminGuard } = require('../dist/saas/platform-admin.guard');
const { SaasRepository } = require('../dist/saas/saas.repository');
const { SaasService } = require('../dist/saas/saas.service');
const { TenantGuard } = require('../dist/tenancy/guards/tenant.guard');

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const ACTIVE_USER = {
  id: '22222222-2222-4222-8222-222222222222',
  storeId: STORE_ID,
  email: 'owner@example.com',
  fullName: 'Store Owner',
  role: 'owner',
  permissions: ['*'],
  sessionId: '33333333-3333-4333-8333-333333333333',
};

const state = {
  plans: new Map(),
  planLimits: new Map(),
  subscriptions: new Map(),
  stores: new Map(),
  domains: [],
};

const saasRepositoryMock = {
  async listPlans() {
    return [...state.plans.values()];
  },
  async findPlanByCode(code) {
    return [...state.plans.values()].find((plan) => plan.code.toLowerCase() === code.toLowerCase()) ?? null;
  },
  async findPlanById(planId) {
    return state.plans.get(planId) ?? null;
  },
  async createPlan(input) {
    const row = {
      id: randomUUID(),
      code: input.code,
      name: input.name,
      description: input.description,
      is_active: input.isActive,
    };
    state.plans.set(row.id, row);
    return row;
  },
  async updatePlan(input) {
    const row = state.plans.get(input.planId);
    if (!row) {
      return null;
    }

    const updated = {
      ...row,
      name: input.name,
      description: input.description,
      is_active: input.isActive,
    };
    state.plans.set(updated.id, updated);
    return updated;
  },
  async listPlanLimits(planId) {
    return state.planLimits.get(planId) ?? [];
  },
  async replacePlanLimits(_db, planId, limits) {
    state.planLimits.set(
      planId,
      limits.map((limit) => ({
        id: randomUUID(),
        plan_id: planId,
        metric_key: limit.metricKey,
        metric_limit: limit.metricLimit,
        reset_period: limit.resetPeriod,
      })),
    );
  },
  async withTransaction(callback) {
    return callback({ query: async () => ({ rows: [], rowCount: 0 }) });
  },
  async getCurrentSubscription(storeId) {
    const record = state.subscriptions.get(storeId);
    if (!record) {
      return null;
    }

    const plan = state.plans.get(record.plan_id);
    return {
      ...record,
      plan_code: plan.code,
      plan_name: plan.name,
      plan_description: plan.description,
      plan_is_active: plan.is_active,
    };
  },
  async replaceCurrentSubscription(input) {
    state.subscriptions.set(input.storeId, {
      id: randomUUID(),
      store_id: input.storeId,
      plan_id: input.planId,
      status: input.status,
      starts_at: input.startsAt,
      current_period_end: input.currentPeriodEnd,
      trial_ends_at: input.trialEndsAt,
    });
  },
  async recordUsageEvent() {
    return;
  },
  async countProducts() {
    return 12;
  },
  async countStaff() {
    return 1;
  },
  async countOrdersForMonth() {
    return 7;
  },
  async listPlatformStores({ q }) {
    const rows = [...state.stores.values()].filter(
      (store) => !q || store.name.toLowerCase().includes(q.toLowerCase()) || store.slug.toLowerCase().includes(q.toLowerCase()),
    );
    return { rows, total: rows.length };
  },
  async setStoreSuspension(input) {
    const row = state.stores.get(input.storeId);
    if (!row) {
      return false;
    }
    row.is_suspended = input.isSuspended;
    row.suspension_reason = input.reason;
    state.stores.set(row.id, row);
    return true;
  },
  async isStoreSuspended(storeId) {
    return Boolean(state.stores.get(storeId)?.is_suspended);
  },
  async listPlatformSubscriptions() {
    const rows = [];
    for (const sub of state.subscriptions.values()) {
      const store = state.stores.get(sub.store_id);
      const plan = state.plans.get(sub.plan_id);
      rows.push({
        id: sub.id,
        store_id: sub.store_id,
        store_name: store?.name ?? 'Unknown',
        store_slug: store?.slug ?? 'unknown',
        plan_code: plan.code,
        plan_name: plan.name,
        status: sub.status,
        starts_at: sub.starts_at,
        current_period_end: sub.current_period_end,
        trial_ends_at: sub.trial_ends_at,
      });
    }
    return { rows, total: rows.length };
  },
  async listPlatformDomains() {
    return state.domains;
  },
};

const auditServiceMock = {
  async log() {
    return;
  },
};

describe('Sprint 6 SaaS platform e2e', () => {
  let app;
  let baseUrl = '';

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BillingController, PlatformAdminController],
      providers: [
        SaasService,
        { provide: SaasRepository, useValue: saasRepositoryMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate(context) {
          const request = context.switchToHttp().getRequest();
          request.user = ACTIVE_USER;
          request.storeId = ACTIVE_USER.storeId;
          return true;
        },
      })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PlatformAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  beforeEach(() => {
    state.plans.clear();
    state.planLimits.clear();
    state.subscriptions.clear();
    state.stores.clear();
    state.domains.length = 0;

    const freePlan = {
      id: randomUUID(),
      code: 'free',
      name: 'Free',
      description: 'Starter',
      is_active: true,
    };
    state.plans.set(freePlan.id, freePlan);
    state.planLimits.set(freePlan.id, [
      {
        id: randomUUID(),
        plan_id: freePlan.id,
        metric_key: 'products.total',
        metric_limit: 100,
        reset_period: 'lifetime',
      },
      {
        id: randomUUID(),
        plan_id: freePlan.id,
        metric_key: 'orders.monthly',
        metric_limit: 100,
        reset_period: 'monthly',
      },
    ]);

    state.stores.set(STORE_ID, {
      id: STORE_ID,
      name: 'Demo Store',
      slug: 'demo-store',
      is_suspended: false,
      suspension_reason: null,
      created_at: new Date(),
      plan_code: 'free',
      subscription_status: 'active',
      total_domains: 1,
      active_domains: 1,
    });

    state.domains.push({
      id: randomUUID(),
      store_id: STORE_ID,
      store_name: 'Demo Store',
      hostname: 'shop.example.com',
      status: 'active',
      ssl_status: 'requested',
      updated_at: new Date(),
    });
  });

  after(async () => {
    await app.close();
  });

  it('creates a plan and assigns it to store', async () => {
    const createdPlan = await requestJson(
      '/platform/plans',
      {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          code: 'starter-plus',
          name: 'Starter Plus',
          description: 'Starter plus limits',
          limits: [
            { metricKey: 'products.total', metricLimit: 250, resetPeriod: 'lifetime' },
            { metricKey: 'orders.monthly', metricLimit: 400, resetPeriod: 'monthly' },
            { metricKey: 'staff.total', metricLimit: 2, resetPeriod: 'lifetime' },
          ],
        }),
      },
      201,
      baseUrl,
    );

    assert.equal(createdPlan.code, 'starter-plus');
    assert.equal(createdPlan.limits.length, 3);

    const assigned = await requestJson(
      `/platform/stores/${STORE_ID}/subscription`,
      {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          planCode: 'starter-plus',
          status: 'active',
        }),
      },
      200,
      baseUrl,
    );

    assert.equal(assigned.storeId, STORE_ID);
    assert.equal(assigned.plan.code, 'starter-plus');
  });

  it('returns current billing subscription and usage snapshot', async () => {
    const freePlan = [...state.plans.values()].find((plan) => plan.code === 'free');
    state.subscriptions.set(STORE_ID, {
      id: randomUUID(),
      store_id: STORE_ID,
      plan_id: freePlan.id,
      status: 'active',
      starts_at: new Date(),
      current_period_end: null,
      trial_ends_at: null,
    });

    const billing = await requestJson(
      '/billing/subscription',
      {
        method: 'GET',
        headers: authHeaders(),
      },
      200,
      baseUrl,
    );

    assert.equal(billing.storeId, STORE_ID);
    assert.equal(billing.plan.code, 'free');
    assert.equal(Array.isArray(billing.usage), true);
    assert.equal(billing.usage.some((entry) => entry.metricKey === 'orders.monthly'), true);
  });

  it('supports basic platform admin listing and suspension', async () => {
    const stores = await requestJson('/platform/stores', { method: 'GET', headers: authHeaders() }, 200, baseUrl);
    assert.equal(stores.items.length, 1);
    assert.equal(stores.items[0].slug, 'demo-store');

    await requestJson(
      `/platform/stores/${STORE_ID}/suspension`,
      {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({
          isSuspended: true,
          reason: 'Policy violation',
        }),
      },
      204,
      baseUrl,
    );

    const domains = await requestJson('/platform/domains', { method: 'GET', headers: authHeaders() }, 200, baseUrl);
    assert.equal(domains.length, 1);
    assert.equal(domains[0].hostname, 'shop.example.com');
  });
});

function authHeaders() {
  return {
    authorization: 'Bearer smoke-test-token',
    'x-store-id': STORE_ID,
  };
}

function jsonHeaders() {
  return {
    ...authHeaders(),
    'content-type': 'application/json',
  };
}

async function requestJson(path, init, expectedStatus, baseUrl) {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (response.status !== expectedStatus) {
    const errorBody = await response.text();
    assert.equal(
      response.status,
      expectedStatus,
      `Expected ${expectedStatus} for ${path} but got ${response.status}. Body: ${errorBody}`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
