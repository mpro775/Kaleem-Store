require('reflect-metadata');

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { after, before, beforeEach, describe, it } = require('node:test');
const { ValidationPipe } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { Test } = require('@nestjs/testing');

const { AccessTokenGuard } = require('../dist/auth/guards/access-token.guard');
const { AuditService } = require('../dist/audit/audit.service');
const { DnsResolverService } = require('../dist/domains/dns-resolver.service');
const { DomainsController } = require('../dist/domains/domains.controller');
const { DomainsRepository } = require('../dist/domains/domains.repository');
const { DomainsService } = require('../dist/domains/domains.service');
const { CloudflareDomainsService } = require('../dist/domains/cloudflare-domains.service');
const { OutboxService } = require('../dist/messaging/outbox.service');
const { PermissionsGuard } = require('../dist/rbac/guards/permissions.guard');
const { SaasService } = require('../dist/saas/saas.service');
const { TenantGuard } = require('../dist/tenancy/guards/tenant.guard');
const { ThemesController } = require('../dist/themes/themes.controller');
const { ThemesRepository } = require('../dist/themes/themes.repository');
const { ThemesService } = require('../dist/themes/themes.service');

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
  themesByStore: new Map(),
  previewTokens: new Map(),
  domainsById: new Map(),
  outboxEvents: [],
  dnsPairs: new Set(),
};

const themesRepositoryMock = {
  async findByStoreId(storeId) {
    return state.themesByStore.get(storeId) ?? null;
  },
  async createDefaultTheme(storeId, config) {
    if (state.themesByStore.has(storeId)) {
      return null;
    }

    const row = {
      id: randomUUID(),
      store_id: storeId,
      draft_config: config,
      published_config: config,
      version: 1,
    };
    state.themesByStore.set(storeId, row);
    return row;
  },
  async updateDraft(storeId, config) {
    const current = state.themesByStore.get(storeId);
    const updated = {
      ...current,
      draft_config: config,
    };
    state.themesByStore.set(storeId, updated);
    return updated;
  },
  async publishDraft(storeId) {
    const current = state.themesByStore.get(storeId);
    const updated = {
      ...current,
      published_config: current.draft_config,
      version: current.version + 1,
    };
    state.themesByStore.set(storeId, updated);
    return updated;
  },
  async createPreviewToken(storeId, token, expiresAt) {
    const row = { id: randomUUID(), store_id: storeId, token, expires_at: expiresAt };
    state.previewTokens.set(token, row);
    return row;
  },
  async findValidPreviewToken(token) {
    const row = state.previewTokens.get(token);
    if (!row || row.expires_at.getTime() <= Date.now()) {
      return null;
    }
    return row;
  },
  async deleteExpiredPreviewTokens() {
    for (const [token, row] of state.previewTokens.entries()) {
      if (row.expires_at.getTime() <= Date.now()) {
        state.previewTokens.delete(token);
      }
    }
  },
};

const domainsRepositoryMock = {
  async create(input) {
    const duplicate = [...state.domainsById.values()].find(
      (row) => row.hostname.toLowerCase() === input.hostname.toLowerCase(),
    );
    if (duplicate) {
      const error = new Error('duplicate');
      error.code = '23505';
      throw error;
    }

    const row = {
      id: randomUUID(),
      store_id: input.storeId,
      hostname: input.hostname,
      verification_token: input.verificationToken,
      status: 'pending',
      ssl_status: 'pending',
      ssl_provider: input.sslProvider ?? 'manual',
      ssl_mode: input.sslMode ?? 'full_strict',
      cloudflare_zone_id: input.cloudflareZoneId ?? null,
      cloudflare_hostname_id: null,
      ssl_last_checked_at: null,
      ssl_error: null,
      verified_at: null,
      activated_at: null,
    };
    state.domainsById.set(row.id, row);
    return row;
  },
  async list(storeId) {
    return [...state.domainsById.values()].filter((row) => row.store_id === storeId);
  },
  async findById(storeId, domainId) {
    const row = state.domainsById.get(domainId);
    return row && row.store_id === storeId ? row : null;
  },
  async markVerified(storeId, domainId) {
    const row = state.domainsById.get(domainId);
    if (!row || row.store_id !== storeId) {
      return null;
    }

    row.status = 'verified';
    row.verified_at = row.verified_at ?? new Date();
    state.domainsById.set(row.id, row);
    return row;
  },
  async markActive(input) {
    const row = state.domainsById.get(input.domainId);
    if (!row || row.store_id !== input.storeId) {
      return null;
    }

    row.status = 'active';
    row.ssl_status = input.sslStatus;
    row.cloudflare_hostname_id = input.cloudflareHostnameId ?? row.cloudflare_hostname_id;
    row.ssl_last_checked_at = new Date();
    row.ssl_error = input.sslError;
    row.activated_at = row.activated_at ?? new Date();
    state.domainsById.set(row.id, row);
    return row;
  },
  async updateSslState(input) {
    const row = state.domainsById.get(input.domainId);
    if (!row || row.store_id !== input.storeId) {
      return null;
    }

    row.ssl_status = input.sslStatus;
    row.cloudflare_hostname_id = input.cloudflareHostnameId ?? row.cloudflare_hostname_id;
    row.ssl_last_checked_at = new Date();
    row.ssl_error = input.sslError;
    state.domainsById.set(row.id, row);
    return row;
  },
  async delete(storeId, domainId) {
    const row = state.domainsById.get(domainId);
    if (!row || row.store_id !== storeId) {
      return false;
    }
    state.domainsById.delete(domainId);
    return true;
  },
};

const dnsResolverServiceMock = {
  async hasVerificationRecord(hostname, token, prefix) {
    return state.dnsPairs.has(`${prefix}.${hostname}:${token}`);
  },
  async hasRoutingCname() {
    return true;
  },
};

const cloudflareDomainsServiceMock = {
  isEnabled() {
    return false;
  },
  async createCustomHostname() {
    return { cloudflareHostnameId: 'cf-hostname-id', sslStatus: 'requested' };
  },
  async getCustomHostname() {
    return { sslStatus: 'issued' };
  },
  async deleteCustomHostname() {
    return;
  },
};

const outboxServiceMock = {
  async enqueue(event) {
    state.outboxEvents.push(event);
  },
};

const auditServiceMock = {
  async log() {
    return;
  },
};

const saasServiceMock = {
  async assertMetricCanGrow() {
    return;
  },
  async recordUsageEvent() {
    return;
  },
};

describe('Sprint 5 themes/domains e2e', () => {
  let app;
  let baseUrl = '';

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThemesController, DomainsController],
      providers: [
        ThemesService,
        DomainsService,
        { provide: ThemesRepository, useValue: themesRepositoryMock },
        { provide: DomainsRepository, useValue: domainsRepositoryMock },
        { provide: DnsResolverService, useValue: dnsResolverServiceMock },
        { provide: OutboxService, useValue: outboxServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: SaasService, useValue: saasServiceMock },
        { provide: CloudflareDomainsService, useValue: cloudflareDomainsServiceMock },
        {
          provide: ConfigService,
          useValue: {
            get(key, fallback) {
              if (key === 'DOMAIN_VERIFY_TXT_PREFIX') {
                return '_kaleem-verify';
              }
              if (key === 'THEME_PREVIEW_TOKEN_TTL_MINUTES') {
                return 30;
              }
              if (key === 'DOMAIN_SSL_PROVIDER') {
                return 'manual';
              }
              return fallback;
            },
          },
        },
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
    state.themesByStore.clear();
    state.previewTokens.clear();
    state.domainsById.clear();
    state.outboxEvents.length = 0;
    state.dnsPairs.clear();
  });

  after(async () => {
    await app.close();
  });

  it('updates and publishes theme config', async () => {
    const initial = await requestJson(
      '/themes/draft',
      { method: 'GET', headers: adminHeaders(false) },
      200,
      baseUrl,
    );
    assert.equal(initial.version, 1);

    const updated = await requestJson(
      '/themes/draft',
      {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({
          config: {
            globals: { primaryColor: '#123456' },
            sections: [{ id: 'header-main', type: 'header', enabled: true, settings: {} }],
          },
        }),
      },
      200,
      baseUrl,
    );

    assert.equal(updated.draftConfig.globals.primaryColor, '#123456');

    const token = await requestJson(
      '/themes/preview-token',
      { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ expiresInMinutes: 5 }) },
      200,
      baseUrl,
    );
    assert.equal(typeof token.previewToken, 'string');

    const published = await requestJson(
      '/themes/publish',
      { method: 'POST', headers: adminHeaders(false) },
      200,
      baseUrl,
    );
    assert.equal(published.version, 2);
    assert.equal(published.publishedConfig.globals.primaryColor, '#123456');

    const event = state.outboxEvents.find((entry) => entry.eventType === 'theme.published');
    assert.equal(Boolean(event), true);
    assert.equal(event.payload.storeId, STORE_ID);
  });

  it('verifies and activates a custom domain with ssl issued status', async () => {
    const created = await requestJson(
      '/domains',
      {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ hostname: 'shop.example.com' }),
      },
      201,
      baseUrl,
    );

    await requestError(
      `/domains/${created.id}/verify`,
      { method: 'POST', headers: adminHeaders(false) },
      400,
      'Domain verification token not found in DNS TXT records',
      baseUrl,
    );

    state.dnsPairs.add(`${created.verificationDnsHost}:${created.verificationToken}`);

    const verified = await requestJson(
      `/domains/${created.id}/verify`,
      { method: 'POST', headers: adminHeaders(false) },
      200,
      baseUrl,
    );
    assert.equal(verified.status, 'verified');

    const activated = await requestJson(
      `/domains/${created.id}/activate`,
      { method: 'POST', headers: adminHeaders(false) },
      200,
      baseUrl,
    );
    assert.equal(activated.status, 'active');
    assert.equal(activated.sslStatus, 'issued');
    assert.equal(activated.routingType, 'cname');
    assert.equal(activated.routingHost, 'shop.example.com');
    assert.equal(activated.sslProvider, 'manual');
    assert.equal(typeof activated.routingTarget, 'string');
    assert.equal(activated.routingTarget.length > 0, true);

    const listed = await requestJson(
      '/domains',
      { method: 'GET', headers: adminHeaders(false) },
      200,
      baseUrl,
    );
    assert.equal(listed.length, 1);
    assert.equal(listed[0].hostname, 'shop.example.com');

    const verifiedEvent = state.outboxEvents.find((entry) => entry.eventType === 'domain.verified');
    const activatedEvent = state.outboxEvents.find(
      (entry) => entry.eventType === 'domain.activated',
    );
    assert.equal(Boolean(verifiedEvent), true);
    assert.equal(Boolean(activatedEvent), true);
  });
});

function adminHeaders(withBody = true) {
  const headers = {
    authorization: 'Bearer smoke-test-token',
    'x-store-id': STORE_ID,
  };

  if (withBody) {
    headers['content-type'] = 'application/json';
  }

  return headers;
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

async function requestError(path, init, expectedStatus, expectedMessage, baseUrl) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();

  assert.equal(response.status, expectedStatus, `Unexpected status for ${path}`);
  assert.equal(body.message, expectedMessage);
}
