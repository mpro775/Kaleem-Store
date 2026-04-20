import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  clearMerchantSessionCache,
  merchantRequestJson,
  type MerchantRequestOptions,
} from './api-client';
import { MERCHANT_DRAWER_WIDTH, MERCHANT_NAV_ITEMS, MERCHANT_PRIMARY_MOBILE_TABS } from './constants/merchant-navigation';
import { MerchantDashboardLayout } from './components/layout/merchant-dashboard-layout';
import { MerchantMobileNav } from './components/navigation/merchant-mobile-nav';
import { MerchantSidebar } from './components/navigation/merchant-sidebar';
import { MerchantTopBar } from './components/navigation/merchant-top-bar';
import { useMerchantTabState } from './hooks/use-merchant-tab-state';
import { renderMerchantPanel } from './panel-registry';
import type { MerchantRequester, MerchantTabKey } from './merchant-dashboard.types';
import type { MerchantSession } from './types';

export type {
  MerchantNavItem,
  MerchantPanelProps,
  MerchantRequester,
  MerchantTabKey,
} from './merchant-dashboard.types';

interface MerchantDashboardProps {
  session: MerchantSession;
  onSessionUpdate: (session: MerchantSession) => void;
  themeMode: 'light' | 'dark';
  onToggleThemeMode: () => void;
  onSignedOut: () => void;
}

export function MerchantDashboard({
  session,
  onSessionUpdate,
  themeMode,
  onToggleThemeMode,
  onSignedOut,
}: MerchantDashboardProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useMerchantTabState('overview');

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

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const activeLabel = useMemo(
    () => MERCHANT_NAV_ITEMS.find((item) => item.key === activeTab)?.label ?? 'لوحة التحكم',
    [activeTab],
  );

  const primaryMobileItems = useMemo(
    () => MERCHANT_NAV_ITEMS.filter((item) => MERCHANT_PRIMARY_MOBILE_TABS.includes(item.key)),
    [],
  );

  const handleOpenNavigation = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const handleCloseNavigation = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const handleSelectTab = useCallback(
    (nextTab: MerchantTabKey) => {
      setActiveTab(nextTab);
      setBannerMessage('');
      if (!isDesktop) {
        setMobileSidebarOpen(false);
      }
    },
    [isDesktop, setActiveTab],
  );

  const handleOpenUserMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  }, []);

  const handleCloseUserMenu = useCallback(() => {
    setUserMenuAnchorEl(null);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await request('/auth/logout', { method: 'POST' }, { includeStoreHeader: false });
    } catch {
      // Ignore sign-out network failures and clear session locally.
    }
    clearMerchantSessionCache();
    onSignedOut();
  }, [onSignedOut, request]);

  const handleSignOut = useCallback(() => {
    handleCloseUserMenu();
    signOut().catch(() => undefined);
  }, [handleCloseUserMenu, signOut]);

  return (
    <MerchantDashboardLayout
      bannerMessage={bannerMessage}
      sidebar={
        <MerchantSidebar
          drawerWidth={MERCHANT_DRAWER_WIDTH}
          navItems={MERCHANT_NAV_ITEMS}
          activeTab={activeTab}
          isDesktop={isDesktop}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={handleCloseNavigation}
          onSelectTab={handleSelectTab}
        />
      }
      topBar={
        <MerchantTopBar
          activeLabel={activeLabel}
          session={session}
          themeMode={themeMode}
          showNavigationToggle={!isDesktop}
          userMenuAnchorEl={userMenuAnchorEl}
          onToggleThemeMode={onToggleThemeMode}
          onOpenNavigation={handleOpenNavigation}
          onOpenUserMenu={handleOpenUserMenu}
          onCloseUserMenu={handleCloseUserMenu}
          onGoToStoreSettings={() => {
            handleCloseUserMenu();
            handleSelectTab('store');
          }}
          onGoToStaff={() => {
            handleCloseUserMenu();
            handleSelectTab('staff');
          }}
          onSignOut={handleSignOut}
        />
      }
      mobileNavigation={
        <MerchantMobileNav
          primaryItems={primaryMobileItems}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenMore={handleOpenNavigation}
        />
      }
    >
      {renderMerchantPanel(activeTab, { session, request })}
    </MerchantDashboardLayout>
  );
}
