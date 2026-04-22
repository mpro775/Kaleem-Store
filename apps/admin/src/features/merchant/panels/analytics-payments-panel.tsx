import { Alert, Box, CircularProgress } from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { AnalyticsPaymentsAdvanced } from '../types';
import { AppPage, PageHeader, StatCard } from '../components/ui';
import { AnalyticsFiltersBar, buildAnalyticsQuery, useAnalyticsData, useAnalyticsFilters } from './analytics-common';

function money(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

export function AnalyticsPaymentsPanel({ request }: { request: MerchantRequester }) {
  const [filters, setFilters] = useAnalyticsFilters();
  const query = buildAnalyticsQuery(filters);
  const { data, loading, error, refresh } = useAnalyticsData<AnalyticsPaymentsAdvanced>(
    request,
    '/analytics/payments/advanced',
    query,
  );

  return (
    <AppPage>
      <PageHeader title="تحليلات المدفوعات" description="أداء المدفوعات ومعدلات النجاح والفشل والاسترداد." />
      <AnalyticsFiltersBar filters={filters} onChange={setFilters} onRefresh={refresh} />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4,1fr)' } }}>
          <StatCard title="العمليات الناجحة" value={String(data.metrics.successfulOperations)} />
          <StatCard title="العمليات الفاشلة" value={String(data.metrics.failedOperations)} />
          <StatCard title="العمليات المستردة" value={String(data.metrics.refundedOperations)} />
          <StatCard title="معدل النجاح" value={`${data.metrics.successRate.toFixed(2)}%`} />
          <StatCard title="معدل الفشل" value={`${data.metrics.failureRate.toFixed(2)}%`} />
          <StatCard title="معدل الاسترداد" value={`${data.metrics.refundRate.toFixed(2)}%`} />
          <StatCard title="إجمالي المبالغ المحصلة" value={money(data.metrics.collectedAmount, data.currencyCode)} />
          <StatCard title="حجم العمليات الناجحة" value={money(data.metrics.successfulSalesVolume, data.currencyCode)} />
        </Box>
      ) : null}
    </AppPage>
  );
}

