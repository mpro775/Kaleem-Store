import { useCallback, useMemo, useState } from 'react';
import { merchantRequestJson, type MerchantRequestOptions } from './api-client';
import { AttributesPanel } from './panels/attributes-panel';
import { CategoriesPanel } from './panels/categories-panel';
import { DomainsPanel } from './panels/domains-panel';
import { InventoryPanel } from './panels/inventory-panel';
import { OrdersPanel } from './panels/orders-panel';
import { PaymentsPanel } from './panels/payments-panel';
import { ProductsPanel } from './panels/products-panel';
import { PromotionsPanel } from './panels/promotions-panel';
import { ShippingPanel } from './panels/shipping-panel';
import { StaffPanel } from './panels/staff-panel';
import { StoreSettingsPanel } from './panels/store-settings-panel';
import { ThemesPanel } from './panels/themes-panel';
import type { MerchantSession } from './types';

type MerchantTabKey =
  | 'overview'
  | 'store'
  | 'products'
  | 'inventory'
  | 'attributes'
  | 'categories'
  | 'orders'
  | 'payments'
  | 'shipping'
  | 'promotions'
  | 'themes'
  | 'domains'
  | 'staff';

export type MerchantRequester = <T>(
  path: string,
  init?: RequestInit,
  options?: MerchantRequestOptions,
) => Promise<T | null>;

interface MerchantDashboardProps {
  session: MerchantSession;
  onSessionUpdate: (session: MerchantSession) => void;
  onSignedOut: () => void;
}

interface MerchantPanelProps {
  session: MerchantSession;
  request: MerchantRequester;
}

export function MerchantDashboard({
  session,
  onSessionUpdate,
  onSignedOut,
}: MerchantDashboardProps) {
  const [activeTab, setActiveTab] = useState<MerchantTabKey>('overview');
  const [bannerMessage, setBannerMessage] = useState('');

  const request = useCallback<MerchantRequester>(
    async <T,>(path: string, init?: RequestInit, options?: MerchantRequestOptions) =>
      merchantRequestJson<T>({
        session,
        path,
        init,
        options,
        onSessionUpdate,
        onSessionExpired: onSignedOut,
      }),
    [onSessionUpdate, onSignedOut, session],
  );

  const tabs = useMemo(
    () =>
      [
        { key: 'overview', label: 'Overview' },
        { key: 'store', label: 'Store Settings' },
        { key: 'products', label: 'Products' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'attributes', label: 'Attributes' },
        { key: 'categories', label: 'Categories' },
        { key: 'orders', label: 'Orders' },
        { key: 'payments', label: 'Payments' },
        { key: 'shipping', label: 'Shipping' },
        { key: 'promotions', label: 'Promotions' },
        { key: 'themes', label: 'Themes' },
        { key: 'domains', label: 'Domains' },
        { key: 'staff', label: 'Staff' },
      ] as Array<{ key: MerchantTabKey; label: string }>,
    [],
  );

  async function signOut(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' }, { includeStoreHeader: false });
    } catch {
      // Ignore sign-out network failures and clear session locally.
    }

    onSignedOut();
  }

  return (
    <section className="panel panel-merchant merchant-dashboard">
      <header className="panel-header">
        <h2>Merchant Dashboard</h2>
        <p>
          Signed in as {session.user.fullName} ({session.user.email}) - role: {session.user.role}
        </p>
        <p className="route-hint">Store ID: {session.user.storeId}</p>
      </header>

      <div className="dashboard-actions">
        <button onClick={() => setBannerMessage('Session is active and refresh-enabled.')}>
          Check session
        </button>
        <button className="danger" onClick={() => signOut().catch(() => undefined)}>
          Sign out
        </button>
      </div>

      <nav className="tab-nav" aria-label="Merchant sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={tab.key === activeTab ? 'selected' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-content">{renderPanel(activeTab, { session, request })}</div>

      {bannerMessage ? <p className="status-message">{bannerMessage}</p> : null}
    </section>
  );
}

function renderPanel(activeTab: MerchantTabKey, props: MerchantPanelProps) {
  const renderer = panelRenderers[activeTab];
  return renderer ? renderer(props) : null;
}

const panelRenderers: Record<MerchantTabKey, (props: MerchantPanelProps) => JSX.Element> = {
  overview: (props) => <OverviewPanel session={props.session} />,
  store: (props) => <StoreSettingsPanel request={props.request} />,
  products: (props) => <ProductsPanel request={props.request} />,
  inventory: (props) => <InventoryPanel request={props.request} />,
  attributes: (props) => <AttributesPanel request={props.request} />,
  categories: (props) => <CategoriesPanel request={props.request} />,
  orders: (props) => <OrdersPanel request={props.request} />,
  payments: (props) => <PaymentsPanel request={props.request} />,
  shipping: (props) => <ShippingPanel request={props.request} />,
  promotions: (props) => <PromotionsPanel request={props.request} />,
  themes: (props) => <ThemesPanel request={props.request} apiBaseUrl={props.session.apiBaseUrl} />,
  domains: (props) => <DomainsPanel request={props.request} />,
  staff: (props) => <StaffPanel request={props.request} />,
};

function OverviewPanel({ session }: { session: MerchantSession }) {
  return (
    <section className="card-grid">
      <article className="card">
        <h3>Store Context</h3>
        <p>Store ID: {session.user.storeId}</p>
        <p>Permissions: {session.user.permissions.join(', ') || 'none'}</p>
      </article>

      <article className="card">
        <h3>Execution Checklist</h3>
        <ul>
          <li>Store settings with save flow</li>
          <li>Products, variants, and media attach</li>
          <li>Inventory reservations, movements, and low-stock alerts</li>
          <li>Categories CRUD</li>
          <li>Attributes, values, and category mapping</li>
          <li>Orders management and status updates</li>
          <li>Shipping zones, promotions, themes, domains</li>
          <li>Staff role assignment UX</li>
        </ul>
      </article>
    </section>
  );
}
