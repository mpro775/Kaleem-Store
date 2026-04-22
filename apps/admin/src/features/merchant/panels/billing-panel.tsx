import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  type ChipProps,
} from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard.types';
import { AppPage, DataTableWrapper, PageHeader, SectionCard } from '../components/ui';
import type {
  BillingInvoicesPage,
  BillingPlanView,
  StoreSubscriptionView,
  SubscriptionBillingCycle,
  SubscriptionInvoiceView,
} from '../types';

interface BillingPanelProps {
  request: MerchantRequester;
}

const invoiceStatusColors: Record<SubscriptionInvoiceView['status'], ChipProps['color']> = {
  draft: 'default',
  open: 'info',
  paid: 'success',
  failed: 'error',
  void: 'default',
};

const invoiceStatusLabels: Record<SubscriptionInvoiceView['status'], string> = {
  draft: 'مسودة',
  open: 'مفتوحة',
  paid: 'مدفوعة',
  failed: 'فشلت',
  void: 'ملغاة',
};

function formatAmount(amount: number, currencyCode: string): string {
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

function resolvePlanPrice(plan: BillingPlanView, cycle: SubscriptionBillingCycle): number | null {
  if (cycle === 'annual') {
    return plan.annualPrice;
  }
  if (cycle === 'monthly') {
    return plan.monthlyPrice;
  }
  return null;
}

export function BillingPanel({ request }: BillingPanelProps) {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subscription, setSubscription] = useState<StoreSubscriptionView | null>(null);
  const [plans, setPlans] = useState<BillingPlanView[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoicesPage | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<SubscriptionBillingCycle>('monthly');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [subscriptionRes, plansRes, invoicesRes] = await Promise.all([
        request<StoreSubscriptionView>('/billing/subscription', { method: 'GET' }),
        request<BillingPlanView[]>('/billing/plans', { method: 'GET' }),
        request<BillingInvoicesPage>('/billing/invoices?page=1&limit=20', { method: 'GET' }),
      ]);
      setSubscription(subscriptionRes ?? null);
      setPlans(plansRes ?? []);
      setInvoices(invoicesRes ?? { items: [], total: 0, page: 1, limit: 20 });
      if (subscriptionRes?.billingCycle) {
        setSelectedCycle(subscriptionRes.billingCycle);
      }
      setCancelAtPeriodEnd(subscriptionRes?.cancelAtPeriodEnd ?? true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData().catch(() => undefined);
  }, [loadData]);

  const currentPlanId = subscription?.plan.id ?? null;
  const currentPlanPrice = useMemo(() => {
    if (!subscription) {
      return null;
    }
    const cycle = selectedCycle;
    return resolvePlanPrice(
      {
        id: subscription.plan.id,
        code: subscription.plan.code,
        name: subscription.plan.name,
        description: subscription.plan.description,
        isActive: subscription.plan.isActive,
        monthlyPrice: subscription.plan.monthlyPrice,
        annualPrice: subscription.plan.annualPrice,
        currencyCode: subscription.plan.currencyCode,
        billingCycleOptions: ['monthly', 'annual'],
        trialDaysDefault: 0,
        limits: [],
        entitlements: [],
      },
      cycle,
    );
  }, [selectedCycle, subscription]);

  async function handleChangePlan(targetPlan: BillingPlanView): Promise<void> {
    if (!subscription) {
      return;
    }

    const targetPrice = resolvePlanPrice(targetPlan, selectedCycle);
    const mode = targetPrice !== null && currentPlanPrice !== null && targetPrice < currentPlanPrice
      ? 'downgrade'
      : 'upgrade';

    setWorking(true);
    setError('');
    setSuccess('');
    try {
      await request(`/billing/subscription/${mode}`, {
        method: 'POST',
        body: JSON.stringify({
          targetPlanCode: targetPlan.code,
          billingCycle: selectedCycle === 'manual' ? 'monthly' : selectedCycle,
          prorationMode: 'immediate_invoice',
        }),
      });
      setSuccess(`Plan changed successfully to ${targetPlan.name}.`);
      await loadData();
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Failed to change plan.');
    } finally {
      setWorking(false);
    }
  }

  async function handleCancelSubscription(): Promise<void> {
    setWorking(true);
    setError('');
    setSuccess('');
    try {
      await request('/billing/subscription/cancel', {
        method: 'POST',
        body: JSON.stringify({
          cancelAtPeriodEnd,
        }),
      });
      setSuccess(
        cancelAtPeriodEnd
          ? 'Cancellation is scheduled at period end.'
          : 'Subscription was canceled immediately.',
      );
      await loadData();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel subscription.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppPage>
      <PageHeader
        title="الفوترة والاشتراكات"
        description="إدارة الخطة الحالية، تغيير الباقة، ومراجعة الفواتير."
        actions={
          <Button variant="outlined" onClick={() => loadData().catch(() => undefined)} disabled={loading || working}>
            تحديث
          </Button>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {loading ? (
        <SectionCard>
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </SectionCard>
      ) : null}

      {!loading && subscription ? (
        <>
          <SectionCard>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Current Plan: {subscription.plan.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Status: {subscription.status} | Billing Cycle: {subscription.billingCycle}
                </Typography>
                <Typography color="text.secondary">
                  Next Billing: {formatDate(subscription.nextBillingAt)}
                </Typography>
                <Typography color="text.secondary">
                  Current Period End: {formatDate(subscription.currentPeriodEnd)}
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="billing-cycle-label">Billing Cycle</InputLabel>
                  <Select
                    labelId="billing-cycle-label"
                    label="Billing Cycle"
                    value={selectedCycle}
                    onChange={(event) => setSelectedCycle(event.target.value as SubscriptionBillingCycle)}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="annual">Annual</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="cancel-mode-label">Cancel Mode</InputLabel>
                  <Select
                    labelId="cancel-mode-label"
                    label="Cancel Mode"
                    value={cancelAtPeriodEnd ? 'period_end' : 'immediate'}
                    onChange={(event) => setCancelAtPeriodEnd(event.target.value === 'period_end')}
                  >
                    <MenuItem value="period_end">At period end</MenuItem>
                    <MenuItem value="immediate">Immediate</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" color="error" onClick={() => handleCancelSubscription().catch(() => undefined)} disabled={working}>
                  Cancel Subscription
                </Button>
              </Stack>
            </Stack>
          </SectionCard>

          <SectionCard>
            <Typography variant="h6" fontWeight={800}>
              Available Plans
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' } }}>
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const price = resolvePlanPrice(plan, selectedCycle);
                const enabledEntitlements = plan.entitlements.filter((item) => item.isEnabled).length;
                return (
                  <SectionCard key={plan.id} sx={{ borderColor: isCurrent ? 'primary.main' : 'divider' }}>
                    <Stack spacing={1.1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={800}>
                          {plan.name}
                        </Typography>
                        {isCurrent ? <Chip size="small" color="primary" label="Current" /> : null}
                      </Stack>
                      <Typography color="text.secondary">{plan.description ?? 'No description.'}</Typography>
                      <Typography variant="h5" color="primary.main" fontWeight={900}>
                        {price === null ? 'N/A' : formatAmount(price, plan.currencyCode)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {enabledEntitlements} enabled features | {plan.limits.length} limits
                      </Typography>
                      <Button
                        variant={isCurrent ? 'outlined' : 'contained'}
                        disabled={isCurrent || working}
                        onClick={() => handleChangePlan(plan).catch(() => undefined)}
                      >
                        {isCurrent ? 'Current Plan' : 'Choose Plan'}
                      </Button>
                    </Stack>
                  </SectionCard>
                );
              })}
            </Box>
          </SectionCard>

          <SectionCard>
            <Typography variant="h6" fontWeight={800}>
              Invoices
            </Typography>
            <Divider sx={{ my: 2 }} />
            <DataTableWrapper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Cycle</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Issued</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell>Paid</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(invoices?.items ?? []).map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.billingCycle}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={invoiceStatusLabels[invoice.status]}
                          color={invoiceStatusColors[invoice.status]}
                        />
                      </TableCell>
                      <TableCell>{formatAmount(invoice.totalAmount, invoice.currencyCode)}</TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                      <TableCell>{formatDate(invoice.dueAt)}</TableCell>
                      <TableCell>{formatDate(invoice.paidAt)}</TableCell>
                    </TableRow>
                  ))}
                  {(invoices?.items.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>
                          No invoices found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </DataTableWrapper>
          </SectionCard>
        </>
      ) : null}
    </AppPage>
  );
}
