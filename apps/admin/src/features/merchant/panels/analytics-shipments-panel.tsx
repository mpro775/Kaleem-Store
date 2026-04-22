import { Alert, Box, CircularProgress } from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { AnalyticsShipments } from '../types';
import { AppPage, PageHeader, StatCard } from '../components/ui';
import { AnalyticsFiltersBar, buildAnalyticsQuery, useAnalyticsData, useAnalyticsFilters } from './analytics-common';

export function AnalyticsShipmentsPanel({ request }: { request: MerchantRequester }) {
  const [filters, setFilters] = useAnalyticsFilters();
  const query = buildAnalyticsQuery(filters);
  const { data, loading, error, refresh } = useAnalyticsData<AnalyticsShipments>(request, '/analytics/shipments', query);

  return (
    <AppPage>
      <PageHeader title="تحليلات الشحنات" description="تتبع حالات الشحنات ومعدلات الأداء." />
      <AnalyticsFiltersBar filters={filters} onChange={setFilters} onRefresh={refresh} />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4,1fr)' } }}>
          <StatCard title="إجمالي الشحنات" value={String(data.counts.totalShipments)} />
          <StatCard title="تم التسليم" value={String(data.counts.delivered)} />
          <StatCard title="قيد التنفيذ" value={String(data.counts.inTransit)} />
          <StatCard title="ملغية" value={String(data.counts.cancelled)} />
          <StatCard title="فشل التوصيل" value={String(data.counts.failedDelivery)} />
          <StatCard title="ضائعة" value={String(data.counts.lost)} />
          <StatCard title="تالفة" value={String(data.counts.damaged)} />
          <StatCard title="متأخرة" value={String(data.counts.delayed)} />
          <StatCard title="تأخر استلامها" value={String(data.counts.lateReceived)} />
          <StatCard title="معدل التسليم" value={`${data.rates.deliveredRate.toFixed(2)}%`} />
          <StatCard title="معدل الفشل" value={`${data.rates.failedRate.toFixed(2)}%`} />
          <StatCard title="معدل التأخير" value={`${data.rates.delayedRate.toFixed(2)}%`} />
        </Box>
      ) : null}
    </AppPage>
  );
}

