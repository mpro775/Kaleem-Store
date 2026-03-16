import { useCallback, useMemo, useState, type ReactElement } from 'react';
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
import { WebhooksPanel } from './panels/webhooks-panel';
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
  | 'staff'
  | 'webhooks';

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
        { key: 'overview', label: 'نظرة عامة' },
        { key: 'store', label: 'إعدادات المتجر' },
        { key: 'products', label: 'المنتجات' },
        { key: 'inventory', label: 'المخزون' },
        { key: 'attributes', label: 'الخصائص' },
        { key: 'categories', label: 'التصنيفات' },
        { key: 'orders', label: 'الطلبات' },
        { key: 'payments', label: 'المدفوعات' },
        { key: 'shipping', label: 'الشحن' },
        { key: 'promotions', label: 'العروض' },
        { key: 'themes', label: 'الثيمات' },
        { key: 'domains', label: 'النطاقات' },
        { key: 'webhooks', label: 'الويب هوكس' },
        { key: 'staff', label: 'الفريق' },
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
        <h2>لوحة التاجر</h2>
        <p>
          تم تسجيل الدخول باسم {session.user.fullName} ({session.user.email}) - الدور: {session.user.role}
        </p>
        <p className="route-hint">معرّف المتجر: {session.user.storeId}</p>
      </header>

      <div className="dashboard-actions">
        <button onClick={() => setBannerMessage('الجلسة فعالة وتدعم التحديث التلقائي.') }>
          فحص الجلسة
        </button>
        <button className="danger" onClick={() => signOut().catch(() => undefined)}>
          تسجيل الخروج
        </button>
      </div>

      <nav className="tab-nav" aria-label="أقسام التاجر">
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

const panelRenderers: Record<MerchantTabKey, (props: MerchantPanelProps) => ReactElement> = {
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
  webhooks: (props) => <WebhooksPanel request={props.request} />,
  staff: (props) => <StaffPanel request={props.request} />,
};

function OverviewPanel({ session }: { session: MerchantSession }) {
  return (
    <section className="card-grid">
      <article className="card">
        <h3>ملخص المتجر</h3>
        <p>معرّف المتجر: {session.user.storeId}</p>
        <p>الصلاحيات: {session.user.permissions.join(', ') || 'لا توجد'}</p>
      </article>

      <article className="card">
        <h3>قائمة التشغيل</h3>
        <ul>
          <li>إعدادات المتجر مع حفظ كامل للبيانات</li>
          <li>إدارة المنتجات والمتغيرات وربط الوسائط</li>
          <li>حركات وحجوزات المخزون وتنبيهات انخفاض الكمية</li>
          <li>إدارة التصنيفات بالكامل</li>
          <li>إدارة الخصائص وقيمها وربطها بالتصنيفات</li>
          <li>إدارة الطلبات وتحديث حالاتها</li>
          <li>مناطق الشحن والعروض والثيمات والنطاقات</li>
          <li>إدارة الفريق وتوزيع الأدوار</li>
        </ul>
      </article>
    </section>
  );
}
