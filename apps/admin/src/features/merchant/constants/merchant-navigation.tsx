import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StyleIcon from '@mui/icons-material/Style';
import TuneIcon from '@mui/icons-material/Tune';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentsIcon from '@mui/icons-material/Payments';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import WebhookIcon from '@mui/icons-material/Webhook';
import PeopleIcon from '@mui/icons-material/People';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import StarsIcon from '@mui/icons-material/Stars';
import type { MerchantNavItem, MerchantTabKey } from '../merchant-dashboard.types';
import { ADMIN_TOKENS } from '../../../theme/tokens';

import SettingsIcon from '@mui/icons-material/Settings';

export const MERCHANT_DRAWER_WIDTH = ADMIN_TOKENS.layout.sidebarWidth;

export const MERCHANT_NAV_ITEMS: MerchantNavItem[] = [
  {
    key: 'group_dashboard',
    label: 'الرئيسية',
    icon: <DashboardIcon />,
    children: [
      { key: 'overview', label: 'الرئيسية', icon: <DashboardIcon /> },
    ],
  },
  {
    key: 'group_products_inventory',
    label: 'إدارة المنتجات والمخزون',
    icon: <InventoryIcon />,
    children: [
      { key: 'products', label: 'المنتجات', icon: <InventoryIcon /> },
      { key: 'categories', label: 'التصنيفات' },
      { key: 'brands', label: 'العلامات التجارية' },
      { key: 'attributes', label: 'الخصائص' },
      { key: 'filters', label: 'إدارة الفلاتر' },
      { key: 'inventory', label: 'المخزون' },
      { key: 'warehouses', label: 'المستودعات' },
      { key: 'restockAlerts', label: 'تنبيهات التوفر' },
    ],
  },
  {
    key: 'group_sales_orders',
    label: 'المبيعات والطلبات',
    icon: <ShoppingCartIcon />,
    children: [
      { key: 'orders', label: 'الطلبات', icon: <ShoppingCartIcon /> },
      { key: 'abandonedCarts', label: 'السلات المتروكة' },
    ],
  },
  {
    key: 'group_customers_engagement',
    label: 'العملاء والتفاعل',
    icon: <PeopleIcon />,
    children: [
      { key: 'customers', label: 'العملاء' },
      { key: 'customerReviews', label: 'تقييمات العملاء' },
      { key: 'customerQuestions', label: 'أسئلة المنتجات' },
    ],
  },
  {
    key: 'group_marketing',
    label: 'التسويق',
    icon: <CampaignIcon />,
    children: [
      { key: 'promotions', label: 'العروض التسويقية' },
      { key: 'advancedPromotions', label: 'العروض المتقدمة' },
      { key: 'coupons', label: 'الكوبونات' },
      { key: 'affiliates', label: 'التسويق بالعمولة' },
      { key: 'loyalty', label: 'برنامج الولاء' },
    ],
  },
  {
    key: 'group_storefront',
    label: 'واجهة المتجر',
    icon: <StorefrontIcon />,
    children: [
      { key: 'themes', label: 'واجهة المتجر والتصميم' },
      { key: 'domains', label: 'النطاقات (الدومين)' },
    ],
  },
  {
    key: 'group_settings',
    label: 'الإعدادات',
    icon: <SettingsIcon />,
    children: [
      { key: 'store', label: 'إعدادات المتجر', icon: <SettingsIcon /> },
      { key: 'payments', label: 'المدفوعات' },
      { key: 'shipping', label: 'الشحن' },
      { key: 'staff', label: 'فريق العمل' },
      { key: 'webhooks', label: 'الربط المتقدم (API)' },
    ],
  },
];

export const MERCHANT_PRIMARY_MOBILE_TABS: MerchantTabKey[] = [
  'overview',
  'orders',
  'products',
  'store',
];

const MERCHANT_TAB_KEYS = new Set<MerchantTabKey>(
  MERCHANT_NAV_ITEMS.flatMap((group) => group.children?.map((child) => child.key as MerchantTabKey) || [])
);

export function isMerchantTabKey(value: string): value is MerchantTabKey {
  return MERCHANT_TAB_KEYS.has(value as MerchantTabKey);
}
