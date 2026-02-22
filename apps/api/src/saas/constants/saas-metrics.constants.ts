export const SAAS_METRICS = [
  'products.total',
  'orders.monthly',
  'staff.total',
  'domains.total',
  'storage.used',
  'api_calls.monthly',
  'webhooks.monthly',
] as const;

export const LIMIT_RESET_PERIODS = ['lifetime', 'monthly'] as const;

export type SaasMetricKey = (typeof SAAS_METRICS)[number];
export type LimitResetPeriod = (typeof LIMIT_RESET_PERIODS)[number];

export const METRIC_DISPLAY_NAMES: Record<SaasMetricKey, string> = {
  'products.total': 'Products',
  'orders.monthly': 'Monthly Orders',
  'staff.total': 'Staff Members',
  'domains.total': 'Custom Domains',
  'storage.used': 'Storage (MB)',
  'api_calls.monthly': 'Monthly API Calls',
  'webhooks.monthly': 'Monthly Webhooks',
};

export const DEFAULT_PLAN_LIMITS: Record<
  string,
  Record<SaasMetricKey, { limit: number | null; resetPeriod: LimitResetPeriod }>
> = {
  free: {
    'products.total': { limit: 100, resetPeriod: 'lifetime' },
    'orders.monthly': { limit: 100, resetPeriod: 'monthly' },
    'staff.total': { limit: 1, resetPeriod: 'lifetime' },
    'domains.total': { limit: 1, resetPeriod: 'lifetime' },
    'storage.used': { limit: 500, resetPeriod: 'lifetime' },
    'api_calls.monthly': { limit: 10000, resetPeriod: 'monthly' },
    'webhooks.monthly': { limit: 1000, resetPeriod: 'monthly' },
  },
  pro: {
    'products.total': { limit: 1000, resetPeriod: 'lifetime' },
    'orders.monthly': { limit: 2000, resetPeriod: 'monthly' },
    'staff.total': { limit: 5, resetPeriod: 'lifetime' },
    'domains.total': { limit: 3, resetPeriod: 'lifetime' },
    'storage.used': { limit: 5000, resetPeriod: 'lifetime' },
    'api_calls.monthly': { limit: 100000, resetPeriod: 'monthly' },
    'webhooks.monthly': { limit: 10000, resetPeriod: 'monthly' },
  },
  business: {
    'products.total': { limit: null, resetPeriod: 'lifetime' },
    'orders.monthly': { limit: null, resetPeriod: 'monthly' },
    'staff.total': { limit: 50, resetPeriod: 'lifetime' },
    'domains.total': { limit: 10, resetPeriod: 'lifetime' },
    'storage.used': { limit: 50000, resetPeriod: 'lifetime' },
    'api_calls.monthly': { limit: null, resetPeriod: 'monthly' },
    'webhooks.monthly': { limit: null, resetPeriod: 'monthly' },
  },
};
