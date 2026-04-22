import { useEffect, useState, type ReactElement } from 'react';
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { MerchantLoginPage } from './features/auth/merchant-login-page';
import { MerchantRegisterPage } from './features/auth/merchant-register-page';
import { MarketingHome } from './features/marketing/marketing-home';
import { MerchantDashboard } from './features/merchant/merchant-dashboard';
import { MerchantOnboarding } from './features/merchant/merchant-onboarding';
import { PlatformApp } from './features/platform/platform-app';
import { useMerchantSession } from './features/merchant/use-merchant-session';
import type { MerchantSession } from './features/merchant/types';

type AppRoute = 'marketing' | 'register' | 'login' | 'merchant' | 'platform';
type ThemeMode = 'light' | 'dark';

interface AppProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

function resolveRoute(pathname: string): AppRoute {
  if (pathname === '/platform') {
    return 'platform';
  }

  if (pathname === '/merchant') {
    return 'merchant';
  }

  if (pathname === '/register') {
    return 'register';
  }

  if (pathname === '/login') {
    return 'login';
  }

  return 'marketing';
}

function resolvePath(route: AppRoute): string {
  switch (route) {
    case 'register':
      return '/register';
    case 'login':
      return '/login';
    case 'merchant':
      return '/merchant';
    case 'platform':
      return '/platform';
    case 'marketing':
    default:
      return '/';
  }
}

export function App({ themeMode, onThemeModeChange }: AppProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [session, setSession] = useMerchantSession();
  const [route, setRoute] = useState<AppRoute>(() => resolveRoute(window.location.pathname));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  function toggleThemeMode(): void {
    onThemeModeChange(themeMode === 'dark' ? 'light' : 'dark');
  }

  useEffect(() => {
    setShowOnboarding(Boolean(session && !session.user.onboardingCompleted));
  }, [session]);

  useEffect(() => {
    const nextRoute = resolveRoute(window.location.pathname);
    const expectedPath = resolvePath(nextRoute);
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }

    setRoute(nextRoute);

    const handlePopState = () => {
      setRoute(resolveRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (route === 'merchant' && !session) {
      navigate('login', true);
      return;
    }

    if ((route === 'login' || route === 'register') && session) {
      navigate('merchant', true);
    }
  }, [route, session]);

  function navigate(nextRoute: AppRoute, replace = false): void {
    const nextPath = resolvePath(nextRoute);
    if (window.location.pathname !== nextPath) {
      if (replace) {
        window.history.replaceState({}, '', nextPath);
      } else {
        window.history.pushState({}, '', nextPath);
      }
    }
    setRoute(nextRoute);
    setMobileDrawerOpen(false);
  }

  const navigationItems: Array<{ route: AppRoute; label: string; icon: ReactElement }> = [
    { route: 'marketing', label: 'الرئيسية', icon: <HomeRoundedIcon fontSize="small" /> },
    { route: 'register', label: 'إنشاء حساب', icon: <PersonAddAlt1RoundedIcon fontSize="small" /> },
    { route: 'login', label: 'دخول التاجر', icon: <LoginRoundedIcon fontSize="small" /> },
    { route: 'merchant', label: 'لوحة التاجر', icon: <StorefrontRoundedIcon fontSize="small" /> },
    { route: 'platform', label: 'إدارة المنصة', icon: <AdminPanelSettingsRoundedIcon fontSize="small" /> },
  ];

  const shellItems =
    route === 'merchant' || route === 'platform'
      ? navigationItems.filter((item) => item.route === 'merchant' || item.route === 'platform')
      : navigationItems;

  function renderRouteContent(currentRoute: AppRoute, currentSession: MerchantSession | null) {
    if (currentRoute === 'marketing') {
      return <MarketingHome onCreateAccount={() => navigate('register')} onSignIn={() => navigate('login')} />;
    }

    if (currentRoute === 'register') {
      return (
        <MerchantRegisterPage
          onBackHome={() => navigate('marketing')}
          onSignIn={() => navigate('login')}
          onRegistered={(nextSession) => {
            setSession(nextSession);
            navigate('merchant', true);
          }}
        />
      );
    }

    if (currentRoute === 'login') {
      return (
        <MerchantLoginPage
          onLoggedIn={(nextSession) => {
            setSession(nextSession);
            navigate('merchant', true);
          }}
          onBackHome={() => navigate('marketing')}
          onCreateAccount={() => navigate('register')}
        />
      );
    }

    if (currentRoute === 'merchant' && currentSession) {
      if (showOnboarding) {
        return (
          <MerchantOnboarding
            session={currentSession}
            onCompleted={(nextSession) => {
              setSession(nextSession);
              setShowOnboarding(false);
            }}
            onSignedOut={() => {
              setSession(null);
              navigate('login', true);
            }}
          />
        );
      }

      return (
          <MerchantDashboard
          session={currentSession}
          onSessionUpdate={setSession}
          themeMode={themeMode}
          onToggleThemeMode={toggleThemeMode}
          onSignedOut={() => {
            setSession(null);
            navigate('login', true);
          }}
        />
      );
    }

    if (currentRoute === 'platform') {
      return (
        <PlatformApp
          onBackHome={() => navigate('marketing')}
          onMerchantLogin={() => navigate('login')}
        />
      );
    }

    return null;
  }

  const activeShellIndex = shellItems.findIndex((item) => item.route === route);
  const isStandalonePage =
    route === 'marketing' || route === 'register' || route === 'login';

  if (route === 'merchant') {
    if (showOnboarding) {
      return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: { xs: 4, md: 8 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Container maxWidth="md">{renderRouteContent(route, session)}</Container>
        </Box>
      );
    }
    return renderRouteContent(route, session);
  }

  if (route === 'platform') {
    return renderRouteContent(route, session);
  }

  if (isStandalonePage) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: { xs: 1, md: 2 } }}>
        <Container maxWidth="xl">{renderRouteContent(route, session)}</Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="fixed" color="inherit" elevation={0}>
        <Toolbar sx={{ gap: 1.5, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {isMobile ? (
              <IconButton onClick={() => setMobileDrawerOpen(true)} aria-label="فتح القائمة">
                <MenuRoundedIcon />
              </IconButton>
            ) : null}
            <Stack spacing={0}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                بوابة إدارة كليم
              </Typography>
              <Typography variant="caption" color="text.secondary">
                المسار الحالي: {resolvePath(route)}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {session ? (
              <Chip
                variant="outlined"
                label={`مرحباً ${session.user.fullName}`}
                icon={<StorefrontRoundedIcon fontSize="small" />}
              />
            ) : (
              <Button size="small" onClick={() => navigate('login')}>
                تسجيل الدخول
              </Button>
            )}
            <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>ك</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Drawer
        anchor="right"
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileDrawerOpen : true}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            borderLeft: '1px solid',
            borderColor: 'divider',
            pt: 1,
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 800 }}>
          التنقل
        </Typography>
        <Divider />
        <List sx={{ py: 1 }}>
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.route}
              selected={route === item.route}
              onClick={() => navigate(item.route)}
              sx={{ mx: 1, borderRadius: 2, direction: 'rtl' }}
            >
              {item.icon}
              <ListItemText sx={{ ml: 1, textAlign: 'right' }} primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          mr: { xs: 0, md: '280px' },
          pb: isMobile ? 10 : 3,
        }}
      >
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Paper variant="outlined" sx={{ p: { xs: 1.25, md: 2 }, borderRadius: 3 }}>
            {renderRouteContent(route, session)}
          </Paper>
        </Container>
      </Box>

      {isMobile ? (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <BottomNavigation
            value={activeShellIndex >= 0 ? activeShellIndex : 0}
            onChange={(_, nextIndex) => {
              const nextItem = shellItems[nextIndex];
              if (nextItem) {
                navigate(nextItem.route);
              }
            }}
            showLabels
          >
            {shellItems.map((item) => (
              <BottomNavigationAction key={item.route} label={item.label} icon={item.icon} />
            ))}
          </BottomNavigation>
        </Paper>
      ) : null}
    </Box>
  );
}
