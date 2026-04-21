import type { ReactElement } from 'react';
import { AttributesPanel } from './panels/attributes-panel';
import { FiltersPanel } from './panels/filters-panel';
import { CategoriesPanel } from './panels/categories-panel';
import { BrandsPanel } from './panels/brands-panel';
import { CustomerQuestionsPanel } from './panels/customer-questions-panel';
import { CustomerReviewsPanel } from './panels/customer-reviews-panel';
import { CustomersPanel } from './panels/customers-panel';
import { AbandonedCartsPanel } from './panels/abandoned-carts-panel';
import { DomainsPanel } from './panels/domains-panel';
import { InventoryPanel } from './panels/inventory-panel';
import { OrdersPanel } from './panels/orders-panel';
import { PaymentsPanel } from './panels/payments-panel';
import { ProductsPanel } from './panels/products-panel';
import { PromotionsPanel } from './panels/promotions-panel';
import { RestockAlertsPanel } from './panels/restock-alerts-panel';
import { ShippingPanel } from './panels/shipping-panel';
import { StaffPanel } from './panels/staff-panel';
import { StoreSettingsPanel } from './panels/store-settings-panel';
import { ThemesPanel } from './panels/themes-panel';
import { WebhooksPanel } from './panels/webhooks-panel';
import { WarehousesPanel } from './panels/warehouses-panel';
import { OverviewPanel } from './overview/overview-panel';
import type { MerchantPanelProps, MerchantTabKey } from './merchant-dashboard.types';

const panelRenderers: Record<MerchantTabKey, (props: MerchantPanelProps) => ReactElement> = {
  overview: (props) => <OverviewPanel session={props.session} request={props.request} />,
  store: (props) => <StoreSettingsPanel request={props.request} />,
  products: (props) => <ProductsPanel request={props.request} />,
  inventory: (props) => <InventoryPanel request={props.request} />,
  warehouses: (props) => <WarehousesPanel request={props.request} />,
  attributes: (props) => <AttributesPanel request={props.request} />,
  filters: (props) => <FiltersPanel request={props.request} />,
  categories: (props) => <CategoriesPanel request={props.request} />,
  brands: (props) => <BrandsPanel request={props.request} />,
  customers: (props) => <CustomersPanel request={props.request} />,
  abandonedCarts: (props) => <AbandonedCartsPanel request={props.request} />,
  customerReviews: (props) => <CustomerReviewsPanel request={props.request} />,
  customerQuestions: (props) => <CustomerQuestionsPanel request={props.request} />,
  restockAlerts: (props) => <RestockAlertsPanel request={props.request} />,
  orders: (props) => <OrdersPanel request={props.request} />,
  payments: (props) => <PaymentsPanel request={props.request} />,
  shipping: (props) => <ShippingPanel request={props.request} />,
  promotions: (props) => <PromotionsPanel request={props.request} />,
  themes: (props) => <ThemesPanel request={props.request} apiBaseUrl={props.session.apiBaseUrl} />,
  domains: (props) => <DomainsPanel request={props.request} />,
  webhooks: (props) => <WebhooksPanel request={props.request} />,
  staff: (props) => <StaffPanel request={props.request} />,
};

export function renderMerchantPanel(activeTab: MerchantTabKey, props: MerchantPanelProps): ReactElement | null {
  const renderer = panelRenderers[activeTab];
  return renderer ? renderer(props) : null;
}
