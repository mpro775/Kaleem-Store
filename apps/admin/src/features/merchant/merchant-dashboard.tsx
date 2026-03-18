import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Alert, Box, Button, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
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
    <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, display: 'grid', gap: 1.1 }}>
      <Box>
        <Typography variant="h5">لوحة التاجر</Typography>
        <Typography sx={{ mt: 0.4 }}>
          تم تسجيل الدخول باسم {session.user.fullName} ({session.user.email}) - الدور: {session.user.role}
        </Typography>
        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>
          معرّف المتجر: {session.user.storeId}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" onClick={() => setBannerMessage('الجلسة فعالة وتدعم التحديث التلقائي.')}>
          فحص الجلسة
        </Button>
        <Button color="error" variant="outlined" onClick={() => signOut().catch(() => undefined)}>
          تسجيل الخروج
        </Button>
      </Stack>

      <Tabs
        value={tabs.findIndex((tab) => tab.key === activeTab)}
        onChange={(_, index: number) => {
          const tab = tabs[index];
          if (tab) {
            setActiveTab(tab.key);
          }
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="أقسام التاجر"
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} label={tab.label} />
        ))}
      </Tabs>

      <Box>{renderPanel(activeTab, { session, request })}</Box>

      {bannerMessage ? <Alert severity="success">{bannerMessage}</Alert> : null}
    </Paper>
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
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
        <Typography variant="h6">ملخص المتجر</Typography>
        <Typography sx={{ mt: 0.5 }}>معرّف المتجر: {session.user.storeId}</Typography>
        <Typography sx={{ mt: 0.3 }}>الصلاحيات: {session.user.permissions.join(', ') || 'لا توجد'}</Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
        <Typography variant="h6">قائمة التشغيل</Typography>
        <Box component="ul" sx={{ m: 0, mt: 0.7, pl: 2, display: 'grid', gap: 0.5 }}>
          <Box component="li">إعدادات المتجر مع حفظ كامل للبيانات</Box>
          <Box component="li">إدارة المنتجات والمتغيرات وربط الوسائط</Box>
          <Box component="li">حركات وحجوزات المخزون وتنبيهات انخفاض الكمية</Box>
          <Box component="li">إدارة التصنيفات بالكامل</Box>
          <Box component="li">إدارة الخصائص وقيمها وربطها بالتصنيفات</Box>
          <Box component="li">إدارة الطلبات وتحديث حالاتها</Box>
          <Box component="li">مناطق الشحن والعروض والثيمات والنطاقات</Box>
          <Box component="li">إدارة الفريق وتوزيع الأدوار</Box>
        </Box>
      </Paper>
    </Box>
  );
}
