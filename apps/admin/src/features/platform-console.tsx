import { useMemo, useState } from 'react';
import { requestJson } from '../lib/http';
import { useLocalStorageState } from '../lib/use-local-storage-state';

type PlanLimit = {
  metricKey:
    | 'products.total'
    | 'orders.monthly'
    | 'staff.total'
    | 'domains.total'
    | 'storage.used'
    | 'api_calls.monthly'
    | 'webhooks.monthly';
  metricLimit: number | null;
  resetPeriod: 'lifetime' | 'monthly';
};

type PlanResponse = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  limits: PlanLimit[];
};

type PlatformStore = {
  id: string;
  name: string;
  slug: string;
  isSuspended: boolean;
  suspensionReason: string | null;
  planCode: string | null;
  subscriptionStatus: string | null;
  totalDomains: number;
  activeDomains: number;
};

type PlatformSubscription = {
  id: string;
  storeId: string;
  storeName: string;
  planCode: string;
  status: string;
};

type PlatformDomain = {
  id: string;
  storeId: string;
  storeName: string;
  hostname: string;
  status: string;
  sslStatus: string;
};

type DowngradeCheck = {
  canDowngrade: boolean;
  conflicts: Array<{ metricKey: string; used: number; limit: number }>;
};

const defaultLimits: PlanLimit[] = [
  { metricKey: 'products.total', metricLimit: 250, resetPeriod: 'lifetime' },
  { metricKey: 'orders.monthly', metricLimit: 400, resetPeriod: 'monthly' },
  { metricKey: 'staff.total', metricLimit: 2, resetPeriod: 'lifetime' },
  { metricKey: 'domains.total', metricLimit: 2, resetPeriod: 'lifetime' },
  { metricKey: 'storage.used', metricLimit: 1000, resetPeriod: 'lifetime' },
  { metricKey: 'api_calls.monthly', metricLimit: 50000, resetPeriod: 'monthly' },
  { metricKey: 'webhooks.monthly', metricLimit: 5000, resetPeriod: 'monthly' },
];

const METRIC_DISPLAY_NAMES: Record<string, string> = {
  'products.total': 'Products',
  'orders.monthly': 'Monthly Orders',
  'staff.total': 'Staff Members',
  'domains.total': 'Custom Domains',
  'storage.used': 'Storage (MB)',
  'api_calls.monthly': 'Monthly API Calls',
  'webhooks.monthly': 'Monthly Webhooks',
};

export function PlatformConsole() {
  const [apiBaseUrl, setApiBaseUrl] = useLocalStorageState(
    'platform.apiBaseUrl',
    'http://localhost:3000',
  );
  const [platformSecret, setPlatformSecret] = useLocalStorageState('platform.secret', '');
  const [message, setMessage] = useState('');

  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [stores, setStores] = useState<PlatformStore[]>([]);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>([]);
  const [domains, setDomains] = useState<PlatformDomain[]>([]);

  const [planCode, setPlanCode] = useState('starter-plus');
  const [planName, setPlanName] = useState('Starter Plus');
  const [planDescription, setPlanDescription] = useState('Starter plan for fast-growing stores');
  const [planLimitsText, setPlanLimitsText] = useState(JSON.stringify(defaultLimits, null, 2));

  const [assignStoreId, setAssignStoreId] = useState('');
  const [assignPlanCode, setAssignPlanCode] = useState('starter-plus');
  const [assignStatus, setAssignStatus] = useState('active');

  const [suspendStoreId, setSuspendStoreId] = useState('');
  const [suspendReason, setSuspendReason] = useState('Policy review');
  const [suspendEnabled, setSuspendEnabled] = useState(true);

  const [subscriptionActionStoreId, setSubscriptionActionStoreId] = useState('');
  const [downgradePlanCode, setDowngradePlanCode] = useState('free');
  const [downgradeResult, setDowngradeResult] = useState<DowngradeCheck | null>(null);

  const canCallApi = useMemo(
    () => apiBaseUrl.trim().length > 0 && platformSecret.trim().length > 0,
    [apiBaseUrl, platformSecret],
  );

  async function callPlatformApi<T>(path: string, init: RequestInit = {}): Promise<T | null> {
    if (!canCallApi) {
      throw new Error('API base URL and platform secret are required');
    }

    const hasBody = init.body !== undefined;
    return requestJson<T>(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'x-platform-admin-secret': platformSecret.trim(),
        ...(hasBody ? { 'content-type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
    });
  }

  async function refreshOverview(): Promise<void> {
    try {
      const [plansData, storesData, subscriptionsData, domainsData] = await Promise.all([
        callPlatformApi<PlanResponse[]>('/platform/plans', { method: 'GET' }),
        callPlatformApi<{ items: PlatformStore[] }>('/platform/stores?page=1&limit=20', {
          method: 'GET',
        }),
        callPlatformApi<{ items: PlatformSubscription[] }>(
          '/platform/subscriptions?page=1&limit=20',
          {
            method: 'GET',
          },
        ),
        callPlatformApi<PlatformDomain[]>('/platform/domains', { method: 'GET' }),
      ]);

      setPlans(plansData ?? []);
      setStores(storesData?.items ?? []);
      setSubscriptions(subscriptionsData?.items ?? []);
      setDomains(domainsData ?? []);
      setMessage('Platform overview loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to refresh overview');
    }
  }

  async function createPlan(): Promise<void> {
    try {
      const parsedLimits = JSON.parse(planLimitsText) as PlanLimit[];
      await callPlatformApi('/platform/plans', {
        method: 'POST',
        body: JSON.stringify({
          code: planCode.trim().toLowerCase(),
          name: planName.trim(),
          description: planDescription.trim(),
          isActive: true,
          limits: parsedLimits,
        }),
      });

      await refreshOverview();
      setMessage('Plan created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create plan');
    }
  }

  async function assignPlanToStore(): Promise<void> {
    try {
      if (!assignStoreId.trim()) {
        throw new Error('Store ID is required for assignment');
      }

      await callPlatformApi(`/platform/stores/${assignStoreId.trim()}/subscription`, {
        method: 'POST',
        body: JSON.stringify({
          planCode: assignPlanCode.trim().toLowerCase(),
          status: assignStatus,
        }),
      });

      await refreshOverview();
      setMessage('Plan assigned to store');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to assign plan');
    }
  }

  async function updateSuspension(): Promise<void> {
    try {
      if (!suspendStoreId.trim()) {
        throw new Error('Store ID is required for suspension update');
      }

      await callPlatformApi(`/platform/stores/${suspendStoreId.trim()}/suspension`, {
        method: 'PATCH',
        body: JSON.stringify({
          isSuspended: suspendEnabled,
          reason: suspendReason.trim(),
        }),
      });

      await refreshOverview();
      setMessage(suspendEnabled ? 'Store suspended' : 'Store unsuspended');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update suspension');
    }
  }

  async function cancelStoreSubscription(): Promise<void> {
    try {
      if (!subscriptionActionStoreId.trim()) {
        throw new Error('Store ID is required');
      }

      await callPlatformApi(
        `/platform/stores/${subscriptionActionStoreId.trim()}/subscription/cancel`,
        {
          method: 'POST',
        },
      );

      await refreshOverview();
      setMessage('Subscription canceled');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to cancel subscription');
    }
  }

  async function suspendStoreSubscription(): Promise<void> {
    try {
      if (!subscriptionActionStoreId.trim()) {
        throw new Error('Store ID is required');
      }

      await callPlatformApi(
        `/platform/stores/${subscriptionActionStoreId.trim()}/subscription/suspend`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: suspendReason.trim() }),
        },
      );

      await refreshOverview();
      setMessage('Subscription suspended');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to suspend subscription');
    }
  }

  async function resumeStoreSubscription(): Promise<void> {
    try {
      if (!subscriptionActionStoreId.trim()) {
        throw new Error('Store ID is required');
      }

      await callPlatformApi(
        `/platform/stores/${subscriptionActionStoreId.trim()}/subscription/resume`,
        {
          method: 'POST',
        },
      );

      await refreshOverview();
      setMessage('Subscription resumed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to resume subscription');
    }
  }

  async function checkDowngrade(): Promise<void> {
    try {
      if (!subscriptionActionStoreId.trim()) {
        throw new Error('Store ID is required');
      }

      const result = await callPlatformApi<DowngradeCheck>(
        `/platform/stores/${subscriptionActionStoreId.trim()}/subscription/can-downgrade/${downgradePlanCode.trim()}`,
      );

      setDowngradeResult(result);
      if (result?.canDowngrade) {
        setMessage('Downgrade is possible');
      } else {
        setMessage('Downgrade blocked - usage exceeds target plan limits');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to check downgrade');
    }
  }

  function clearPlatformSession(): void {
    setPlatformSecret('');
    setMessage('Platform secret cleared from local storage');
  }

  return (
    <section className="panel panel-platform">
      <header className="panel-header">
        <h2>Platform Admin</h2>
        <p>Plans, subscriptions, tenant suspension, and global status views.</p>
      </header>

      <div className="card-grid">
        <article className="card">
          <h3>Connection</h3>
          <label>
            API Base URL
            <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
          </label>
          <label>
            Platform Secret
            <input
              type="password"
              value={platformSecret}
              onChange={(event) => setPlatformSecret(event.target.value)}
            />
          </label>
          <button onClick={clearPlatformSession}>Clear Secret</button>
          <button className="primary" onClick={refreshOverview}>
            Refresh Overview
          </button>
        </article>

        <article className="card">
          <h3>Create Plan</h3>
          <label>
            Plan Code
            <input value={planCode} onChange={(event) => setPlanCode(event.target.value)} />
          </label>
          <label>
            Plan Name
            <input value={planName} onChange={(event) => setPlanName(event.target.value)} />
          </label>
          <label>
            Description
            <input
              value={planDescription}
              onChange={(event) => setPlanDescription(event.target.value)}
            />
          </label>
          <label>
            Limits JSON
            <textarea
              value={planLimitsText}
              onChange={(event) => setPlanLimitsText(event.target.value)}
            />
          </label>
          <button className="primary" onClick={createPlan}>
            Create Plan
          </button>
        </article>

        <article className="card">
          <h3>Assign Plan</h3>
          <label>
            Store ID
            <input
              value={assignStoreId}
              onChange={(event) => setAssignStoreId(event.target.value)}
            />
          </label>
          <label>
            Plan Code
            <input
              value={assignPlanCode}
              onChange={(event) => setAssignPlanCode(event.target.value)}
            />
          </label>
          <label>
            Subscription Status
            <input value={assignStatus} onChange={(event) => setAssignStatus(event.target.value)} />
          </label>
          <button className="primary" onClick={assignPlanToStore}>
            Assign
          </button>
        </article>

        <article className="card">
          <h3>Suspend / Unsuspend Store</h3>
          <label>
            Store ID
            <input
              value={suspendStoreId}
              onChange={(event) => setSuspendStoreId(event.target.value)}
            />
          </label>
          <label>
            Reason
            <input
              value={suspendReason}
              onChange={(event) => setSuspendReason(event.target.value)}
            />
          </label>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={suspendEnabled}
              onChange={(event) => setSuspendEnabled(event.target.checked)}
            />
            isSuspended
          </label>
          <button className="danger" onClick={updateSuspension}>
            Apply Suspension State
          </button>
        </article>

        <article className="card">
          <h3>Subscription Management</h3>
          <label>
            Store ID
            <input
              value={subscriptionActionStoreId}
              onChange={(event) => setSubscriptionActionStoreId(event.target.value)}
            />
          </label>
          <div className="button-group">
            <button className="warning" onClick={cancelStoreSubscription}>
              Cancel
            </button>
            <button className="danger" onClick={suspendStoreSubscription}>
              Suspend
            </button>
            <button onClick={resumeStoreSubscription}>Resume</button>
          </div>
          <label>
            Target Plan (for downgrade check)
            <input
              value={downgradePlanCode}
              onChange={(event) => setDowngradePlanCode(event.target.value)}
            />
          </label>
          <button onClick={checkDowngrade}>Check Downgrade</button>
          {downgradeResult && (
            <div className="downgrade-result">
              {downgradeResult.canDowngrade ? (
                <p className="success">✓ Can downgrade safely</p>
              ) : (
                <div className="conflicts">
                  <p className="error">✗ Cannot downgrade - conflicts:</p>
                  <ul>
                    {downgradeResult.conflicts.map((c, i) => (
                      <li key={i}>
                        {METRIC_DISPLAY_NAMES[c.metricKey] ?? c.metricKey}: {c.used} / {c.limit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </article>
      </div>

      <section className="tables">
        <article className="table-card">
          <h3>Plans</h3>
          <ul>
            {plans.map((plan) => (
              <li key={plan.id}>
                <strong>{plan.code}</strong> - {plan.name} ({plan.isActive ? 'active' : 'inactive'})
                <ul className="plan-limits">
                  {plan.limits.map((limit, i) => (
                    <li key={i}>
                      {METRIC_DISPLAY_NAMES[limit.metricKey] ?? limit.metricKey}:{' '}
                      {limit.metricLimit === null ? '∞' : limit.metricLimit} ({limit.resetPeriod})
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </article>

        <article className="table-card">
          <h3>Stores</h3>
          <ul>
            {stores.map((store) => (
              <li key={store.id}>
                <strong>{store.slug}</strong> - {store.planCode ?? 'no-plan'} /{' '}
                {store.subscriptionStatus ?? 'no-subscription'} / suspended:{' '}
                {String(store.isSuspended)}
              </li>
            ))}
          </ul>
        </article>

        <article className="table-card">
          <h3>Subscriptions</h3>
          <ul>
            {subscriptions.map((subscription) => (
              <li key={subscription.id}>
                <strong>{subscription.storeName}</strong> - {subscription.planCode} /{' '}
                {subscription.status}
              </li>
            ))}
          </ul>
        </article>

        <article className="table-card">
          <h3>Domains</h3>
          <ul>
            {domains.map((domain) => (
              <li key={domain.id}>
                <strong>{domain.hostname}</strong> - {domain.status} / SSL: {domain.sslStatus}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <p className="status-message">{message}</p>
    </section>
  );
}
