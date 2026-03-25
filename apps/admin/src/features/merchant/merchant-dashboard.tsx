import { useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider,
  Grid,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Local Imports
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

const DRAWER_WIDTH = 260;

export function MerchantDashboard({
  session,
  onSessionUpdate,
  onSignedOut,
}: MerchantDashboardProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MerchantTabKey>('overview');
  const [bannerMessage, setBannerMessage] = useState('');
  
  // User Menu State
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

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

  const navItems = useMemo(
    () => [
      { key: 'overview', label: 'الرئيسية', icon: <DashboardIcon /> },
      { key: 'orders', label: 'الطلبات', icon: <ShoppingCartIcon /> },
      { key: 'products', label: 'المنتجات', icon: <InventoryIcon /> },
      { key: 'inventory', label: 'المخزون', icon: <WarehouseIcon /> },
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
    ] as Array<{ key: MerchantTabKey; label: string; icon: ReactElement }>,
    [],
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  async function signOut(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' }, { includeStoreHeader: false });
    } catch {
      // Ignore sign-out network failures and clear session locally.
    }
    onSignedOut();
  }

  const handleSignOutClick = () => {
    handleCloseUserMenu();
    signOut().catch(() => undefined);
  };

  const activeLabel = navItems.find((n) => n.key === activeTab)?.label || 'لوحة التحكم';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer Header (Logo) */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.2rem',
          }}
        >
          K
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
          كليم ستور
        </Typography>
      </Box>

      {/* Navigation Links */}
      <List sx={{ flex: 1, px: 1.5, py: 2, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  setActiveTab(item.key);
                  if (!isDesktop) setMobileOpen(false);
                  setBannerMessage('');
                }}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.04),
                    color: isActive ? 'primary.dark' : 'text.primary',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.95rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Drawer Footer (Store Info) */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
            حالة متجرك الآن
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              متصل ونشط
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { lg: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 64, md: 72 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { lg: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
              {activeLabel}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="large" aria-label="show new notifications" color="inherit">
              <NotificationsIcon />
            </IconButton>
            
            <Box 
              onClick={handleOpenUserMenu}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                ml: 1, 
                p: 0.5, 
                pr: 1.5,
                borderRadius: 999,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.02) }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'primary.light', 
                  color: 'primary.dark',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                {session.user.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {session.user.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {session.user.role === 'owner' ? 'المالك' : 'عضو فريق'}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon fontSize="small" color="action" />
            </Box>

            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{session.user.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">{session.user.email}</Typography>
                <Typography variant="caption" sx={{ mt: 0.5, display: 'inline-block', bgcolor: 'primary.main', color: 'white', px: 1, py: 0.2, borderRadius: 1 }}>
                  Store ID: {session.user.storeId}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); setActiveTab('store'); }}>
                <ListItemIcon><StorefrontIcon fontSize="small" /></ListItemIcon>
                إعدادات المتجر
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); setActiveTab('staff'); }}>
                <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                إدارة الفريق
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOutClick} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                تسجيل الخروج
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile.
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3, lg: 4 },
          width: { xs: '100%', lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: '64px', md: '72px' }, // Account for TopBar height
        }}
      >
        {bannerMessage ? <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{bannerMessage}</Alert> : null}
        
        {/* Panel Content Box */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderPanel(activeTab, { session, request })}
        </Box>
      </Box>
    </Box>
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
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            الرئيسية
          </Typography>
          <Typography color="text.secondary">
            نظرة عامة على أداء متجرك وإحصائيات سريعة.
          </Typography>
        </Box>
      </Box>

      {/* Stat Cards Row */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        {[
          { title: 'إجمالي المبيعات', value: '0 ر.س', subtitle: 'اليوم', icon: <MonetizationOnIcon />, color: '#10b981' },
          { title: 'الطلبات الجديدة', value: '0', subtitle: 'قيد الانتظار', icon: <LocalMallIcon />, color: '#6366f1' },
          { title: 'المنتجات النشطة', value: '0', subtitle: 'من إجمالي المنتجات', icon: <InventoryIcon />, color: '#f59e0b' },
          { title: 'زيارات المتجر', value: '0', subtitle: 'آخر 24 ساعة', icon: <VisibilityIcon />, color: '#ec4899' },
        ].map((stat, i) => (
          <Box key={i}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={700} gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5, color: 'text.primary' }}>
                    {stat.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(stat.color, 0.1), color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </Box>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Info & Guide Cards Row */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <StorefrontIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>معلومات المتجر</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>معرّف المتجر (Store ID)</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'background.default', p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                {session.user.storeId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>الصلاحيات المتاحة</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {session.user.permissions.length > 0 ? (
                  session.user.permissions.map((perm) => (
                    <Box key={perm} sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.dark', fontSize: '0.75rem', fontWeight: 700, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                      {perm}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">لا توجد صلاحيات مخصصة</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <DashboardIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>دليل البدء السريع</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Box component="ul" sx={{ m: 0, pl: 2, display: 'flex', flexDirection: 'column', gap: 2, color: 'text.secondary', '& li': { pl: 1 } }}>
            <Box component="li">
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>إعدادات المتجر الأساسية</Typography>
              <Typography variant="caption" display="block">قم بضبط العملة، سياسات الشحن، ومعلومات التواصل.</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>إدارة المنتجات</Typography>
              <Typography variant="caption" display="block">أضف تصنيفات المنتجات لتنظيم متجرك ثم أضف منتجاتك الأولى.</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>طرق الدفع والشحن</Typography>
              <Typography variant="caption" display="block">تأكد من تفعيل البوابات المطلوبة وتحديد مناطق التوصيل.</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>المظهر والنطاق</Typography>
              <Typography variant="caption" display="block">اختر واجهة (Theme) واربط نطاقك الخاص (Domain) لانطلاقة احترافية.</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}