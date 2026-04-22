import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { requestJson } from '../lib/http';
import { readStoredApiBaseUrl } from './merchant/session-storage';

interface PlatformConsoleProps {
  onBackHome: () => void;
  onMerchantLogin: () => void;
}

interface PlatformPlan {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  monthlyPrice: number | null;
  annualPrice: number | null;
  currencyCode: string;
}

interface PlatformSubscription {
  id: string;
  storeId: string;
  storeName: string;
  planCode: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string | null;
}

interface BillingEvent {
  id: string;
  storeId: string | null;
  source: string;
  eventType: string;
  status: string;
  createdAt: string;
}

interface PaginatedSubscriptions {
  items: PlatformSubscription[];
  total: number;
  page: number;
  limit: number;
}

function formatAmount(amount: number | null, currencyCode: string): string {
  if (amount === null) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('en-GB');
}

export function PlatformConsole({ onBackHome, onMerchantLogin }: PlatformConsoleProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => readStoredApiBaseUrl());
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>([]);
  const [events, setEvents] = useState<BillingEvent[]>([]);

  const hasCredentials = useMemo(
    () => apiBaseUrl.trim().length > 0 && adminSecret.trim().length > 0,
    [adminSecret, apiBaseUrl],
  );

  async function platformRequest<T>(path: string): Promise<T | null> {
    return requestJson<T>(`${apiBaseUrl.trim()}${path}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-platform-admin-secret': adminSecret.trim(),
      },
    });
  }

  async function loadPlatformData(): Promise<void> {
    if (!hasCredentials) {
      setError('API Base URL and platform admin secret are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [plansRes, subsRes, eventsRes] = await Promise.all([
        platformRequest<PlatformPlan[]>('/platform/plans'),
        platformRequest<PaginatedSubscriptions>('/platform/subscriptions?page=1&limit=30'),
        platformRequest<BillingEvent[]>('/platform/billing/events?limit=30'),
      ]);
      setPlans(plansRes ?? []);
      setSubscriptions(subsRes?.items ?? []);
      setEvents(eventsRes ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load platform data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="section" dir="rtl" sx={{ display: 'grid', gap: 1.25 }}>
      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              منصة الاشتراكات والفوترة
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              تشغيل مباشر لخطط SaaS والاشتراكات وأحداث الفوترة.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="outlined" onClick={onBackHome}>
              الرئيسية
            </Button>
            <Button variant="outlined" onClick={onMerchantLogin}>
              دخول التاجر
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.2}>
          <TextField
            label="API Base URL"
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            fullWidth
            placeholder="http://localhost:3000"
          />
          <TextField
            label="Platform Admin Secret"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
            fullWidth
            type="password"
          />
          <Button
            variant="contained"
            onClick={() => loadPlatformData().catch(() => undefined)}
            disabled={!hasCredentials || loading}
          >
            {loading ? 'جاري التحميل...' : 'تحميل البيانات'}
          </Button>
        </Stack>
        {error ? <Alert severity="error" sx={{ mt: 1.2 }}>{error}</Alert> : null}
      </Paper>

      {loading ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
          <CircularProgress />
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          الخطط
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Monthly</TableCell>
              <TableCell>Annual</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id} hover>
                <TableCell>{plan.code}</TableCell>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{formatAmount(plan.monthlyPrice, plan.currencyCode)}</TableCell>
                <TableCell>{formatAmount(plan.annualPrice, plan.currencyCode)}</TableCell>
                <TableCell>{plan.isActive ? 'Active' : 'Inactive'}</TableCell>
              </TableRow>
            ))}
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No plans loaded.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          الاشتراكات الحالية
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Store</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Cycle</TableCell>
              <TableCell>Period End</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.storeName}</TableCell>
                <TableCell>{item.planCode}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.billingCycle}</TableCell>
                <TableCell>{formatDate(item.currentPeriodEnd)}</TableCell>
              </TableRow>
            ))}
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No subscriptions loaded.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
          أحداث الفوترة
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Store ID</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} hover>
                <TableCell>{event.eventType}</TableCell>
                <TableCell>{event.source}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>{event.storeId ?? '-'}</TableCell>
                <TableCell>{formatDate(event.createdAt)}</TableCell>
              </TableRow>
            ))}
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No events loaded.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
