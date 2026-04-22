import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { platformRequestJson } from './platform-api-client';
import type { PlatformSession, PlatformStoreSummary, PlatformStoresResponse } from './platform-types';

type PlatformPage = 'dashboard' | 'stores' | 'plans' | 'subscriptions' | 'domains';

interface PlatformShellProps {
  session: PlatformSession;
  onSessionUpdate: (session: PlatformSession) => void;
  onSignedOut: () => void;
}

function hasPermission(session: PlatformSession, permission: string): boolean {
  return session.user.permissions.includes('*') || session.user.permissions.includes(permission);
}

export function PlatformShell({ session, onSessionUpdate, onSignedOut }: PlatformShellProps) {
  const [page, setPage] = useState<PlatformPage>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState<Record<string, unknown> | null>(null);
  const [stores, setStores] = useState<PlatformStoreSummary[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; code: string; name: string; isActive: boolean }>>([]);
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; storeName: string; planCode: string; status: string }>>([]);
  const [domains, setDomains] = useState<Array<{ id: string; storeName: string; hostname: string; status: string; sslStatus: string }>>([]);

  const navItems = useMemo(
    () => [
      { key: 'dashboard' as const, label: 'Dashboard', permission: 'platform.dashboard.read' },
      { key: 'stores' as const, label: 'Stores', permission: 'platform.stores.read' },
      { key: 'plans' as const, label: 'Plans', permission: 'platform.plans.read' },
      { key: 'subscriptions' as const, label: 'Subscriptions', permission: 'platform.subscriptions.read' },
      { key: 'domains' as const, label: 'Domains', permission: 'platform.domains.read' },
    ].filter((item) => hasPermission(session, item.permission)),
    [session],
  );

  async function runPageLoad(nextPage: PlatformPage): Promise<void> {
    setLoading(true);
    setError('');
    setPage(nextPage);

    try {
      if (nextPage === 'dashboard') {
        const data = await platformRequestJson<Record<string, unknown>>({
          session,
          path: '/platform/dashboard/summary',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setDashboardSummary(data ?? null);
      }

      if (nextPage === 'stores') {
        const data = await platformRequestJson<PlatformStoresResponse>({
          session,
          path: '/platform/stores?page=1&limit=30',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setStores(data?.items ?? []);
      }

      if (nextPage === 'plans') {
        const data = await platformRequestJson<Array<{ id: string; code: string; name: string; isActive: boolean }>>({
          session,
          path: '/platform/plans',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setPlans(data ?? []);
      }

      if (nextPage === 'subscriptions') {
        const data = await platformRequestJson<{ items: Array<{ id: string; storeName: string; planCode: string; status: string }> }>({
          session,
          path: '/platform/subscriptions?page=1&limit=30',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setSubscriptions(data?.items ?? []);
      }

      if (nextPage === 'domains') {
        const data = await platformRequestJson<Array<{ id: string; storeName: string; hostname: string; status: string; sslStatus: string }>>({
          session,
          path: '/platform/domains',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setDomains(data ?? []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function logout(): Promise<void> {
    try {
      await platformRequestJson({
        session,
        path: '/platform/auth/logout',
        init: { method: 'POST' },
        onSessionUpdate,
        onSessionExpired: onSignedOut,
      });
    } finally {
      onSignedOut();
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', direction: 'rtl' }}>
      <AppBar position="fixed" color="inherit" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack spacing={0}>
            <Typography variant="h6" fontWeight={800}>Kaleem Platform Admin</Typography>
            <Typography variant="caption" color="text.secondary">{session.user.fullName}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip variant="outlined" label={session.user.roleCodes.join(', ') || 'admin'} />
            <Button variant="outlined" onClick={() => logout().catch(() => undefined)}>تسجيل الخروج</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Drawer
        anchor="right"
        variant="permanent"
        PaperProps={{ sx: { width: 260, borderLeft: '1px solid', borderColor: 'divider' } }}
      >
        <Toolbar />
        <Divider />
        <List sx={{ py: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.key}
              selected={page === item.key}
              onClick={() => runPageLoad(item.key).catch(() => undefined)}
              sx={{ mx: 1, borderRadius: 2 }}
            >
              <ListItemText primary={item.label} sx={{ textAlign: 'right' }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, mr: '260px' }}>
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => runPageLoad(page).catch(() => undefined)}
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : 'تحديث'}
            </Button>
          </Stack>

          {error ? <Typography color="error">{error}</Typography> : null}

          {page === 'dashboard' ? (
            <Box>
              <Typography variant="h6" fontWeight={800}>Dashboard Summary</Typography>
              <pre>{JSON.stringify(dashboardSummary, null, 2)}</pre>
            </Box>
          ) : null}

          {page === 'stores' ? (
            <Box>
              <Typography variant="h6" fontWeight={800}>Stores</Typography>
              <pre>{JSON.stringify(stores, null, 2)}</pre>
            </Box>
          ) : null}

          {page === 'plans' ? (
            <Box>
              <Typography variant="h6" fontWeight={800}>Plans</Typography>
              <pre>{JSON.stringify(plans, null, 2)}</pre>
            </Box>
          ) : null}

          {page === 'subscriptions' ? (
            <Box>
              <Typography variant="h6" fontWeight={800}>Subscriptions</Typography>
              <pre>{JSON.stringify(subscriptions, null, 2)}</pre>
            </Box>
          ) : null}

          {page === 'domains' ? (
            <Box>
              <Typography variant="h6" fontWeight={800}>Domains</Typography>
              <pre>{JSON.stringify(domains, null, 2)}</pre>
            </Box>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
