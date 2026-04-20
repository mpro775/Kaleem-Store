import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StyleIcon from '@mui/icons-material/Style';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentsIcon from '@mui/icons-material/Payments';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import WebhookIcon from '@mui/icons-material/Webhook';
import PeopleIcon from '@mui/icons-material/People';
import type { MerchantNavItem, MerchantTabKey } from '../merchant-dashboard.types';
import { ADMIN_TOKENS } from '../../../theme/tokens';

export const MERCHANT_DRAWER_WIDTH = ADMIN_TOKENS.layout.sidebarWidth;

export const MERCHANT_NAV_ITEMS: MerchantNavItem[] = [
  { key: 'overview', label: 'الرئيسية', icon: <DashboardIcon /> },
  { key: 'orders', label: 'الطلبات', icon: <ShoppingCartIcon /> },
  { key: 'products', label: 'المنتجات', icon: <InventoryIcon /> },
  { key: 'inventory', label: 'المخزون', icon: <InventoryIcon /> },
  { key: 'warehouses', label: 'المستودعات', icon: <WarehouseIcon /> },
  { key: 'categories', label: 'التصنيفات', icon: <AccountTreeIcon /> },
  { key: 'attributes', label: 'الخصائص', icon: <StyleIcon /> },
  { key: 'payments', label: 'المدفوعات', icon: <PaymentsIcon /> },
  { key: 'shipping', label: 'الشحن', icon: <LocalShippingIcon /> },
  { key: 'promotions', label: 'العروض التسويقية', icon: <LocalOfferIcon /> },
  { key: 'themes', label: 'واجهة المتجر', icon: <PaletteIcon /> },
  { key: 'domains', label: 'النطاقات (الدومين)', icon: <LanguageIcon /> },
  { key: 'staff', label: 'فريق العمل', icon: <PeopleIcon /> },
  { key: 'webhooks', label: 'الربط المتقدم (API)', icon: <WebhookIcon /> },
  { key: 'store', label: 'إعدادات المتجر', icon: <StorefrontIcon /> },
];

export const MERCHANT_PRIMARY_MOBILE_TABS: MerchantTabKey[] = [
  'overview',
  'orders',
  'products',
  'store',
];

const MERCHANT_TAB_KEYS = new Set<MerchantTabKey>(MERCHANT_NAV_ITEMS.map((item) => item.key));

export function isMerchantTabKey(value: string): value is MerchantTabKey {
  return MERCHANT_TAB_KEYS.has(value as MerchantTabKey);
}
