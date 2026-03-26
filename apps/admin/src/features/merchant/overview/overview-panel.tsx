/* eslint-disable complexity, no-irregular-whitespace */
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { MerchantSession } from '../types';
import type { MerchantRequester } from '../merchant-dashboard.types';
import { useMerchantOverviewData } from './use-merchant-overview-data';
import {
  anomalyKeyLabel,
  formatCurrency,
  formatDurationMinutes,
  funnelEventLabel,
  orderStatusLabel,
  qualityCheckLabel,
  transitionLabel,
} from './overview-formatters';

export function OverviewPanel({ session, request }: { session: MerchantSession; request: MerchantRequester }) {
  const theme = useTheme();
  const { data, loading: loadingState, errors } = useMerchantOverviewData(request);
  const {
    overview,
    fulfillmentSla,
    paymentsPerformance,
    promotionsEfficiency,
    inventoryHealth,
    stockoutRisk,
    customersRetention,
    funnelConversion,
    sourceAttribution,
    dataQuality,
    anomalyReport,
  } = data;
  const coreLoading = loadingState.core;
  const commerceLoading = loadingState.commerce;
  const qualityLoading = loadingState.quality;
  const loadingAny = coreLoading || commerceLoading || qualityLoading;
  const error = errors.core || errors.commerce || errors.quality;
  const loading = loadingAny;

  const currencyCode =
    overview?.currencyCode ?? paymentsPerformance?.currencyCode ?? promotionsEfficiency?.currencyCode ?? 'YER';
  const stats = [
    {
      title: 'إجمالي المبيعات',
      value: formatCurrency(overview?.kpis.grossSales ?? 0, currencyCode),
      subtitle: 'آخر 30 يوم',
      icon: <MonetizationOnIcon />,
      color: '#10b981',
      bg: '#ecfdf5',
    },
    {
      title: 'عدد الطلبات',
      value: String(overview?.kpis.totalOrders ?? 0),
      subtitle: 'آخر 30 يوم',
      icon: <LocalMallIcon />,
      color: '#6366f1',
      bg: '#eef2ff',
    },
    {
      title: 'متوسط قيمة الطلب',
      value: formatCurrency(overview?.kpis.averageOrderValue ?? 0, currencyCode),
      subtitle: 'AOV',
      icon: <InventoryIcon />,
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    {
      title: 'نسبة الإلغاء',
      value: `${(overview?.kpis.cancellationRate ?? 0).toFixed(2)}%`,
      subtitle: 'من إجمالي الطلبات',
      icon: <VisibilityIcon />,
      color: '#ec4899',
      bg: '#fdf2f8',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert> : null}

      {/* Stat Cards Row */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        {stats.map((stat, i) => (
          <Box key={i}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.04)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
                    {loading ? '-' : stat.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </Box>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>أكثر المنتجات مبيعاً</Typography>
            <Typography variant="caption" color="text.secondary">آخر 30 يوم</Typography>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={26} />
            </Box>
          ) : (overview?.topProducts.length ?? 0) === 0 ? (
            <Typography variant="body2" color="text.secondary">لا توجد مبيعات في الفترة المحددة بعد.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>المنتج</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>الوحدات</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>الإيراد</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(overview?.topProducts ?? []).map((item) => (
                    <TableRow key={item.productId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.productTitle}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.shareOfNetSales.toFixed(2)}% من صافي المبيعات</Typography>
                      </TableCell>
                      <TableCell align="center">{item.unitsSold}</TableCell>
                      <TableCell align="right">{formatCurrency(item.revenue, currencyCode)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>توزيع حالات الطلب</Typography>
            <Typography variant="caption" color="text.secondary">آخر 30 يوم</Typography>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={26} />
            </Box>
          ) : (
            <Stack spacing={1}>
              {(overview?.ordersByStatus ?? []).map((item) => (
                <Stack key={item.status} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">{orderStatusLabel(item.status)}</Typography>
                  <Chip size="small" label={item.count} sx={{ fontWeight: 700 }} />
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <LocalShippingIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>أداء التجهيز والشحن</Typography>
          </Stack>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {(fulfillmentSla?.items ?? []).map((item) => (
                <Box key={item.transition} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">{transitionLabel(item.transition)}</Typography>
                  <Stack direction="row" justifyContent="space-between" mt={0.8}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>P50: {formatDurationMinutes(item.p50Minutes)}</Typography>
                    <Typography variant="body2" color="text.secondary">P90: {formatDurationMinutes(item.p90Minutes)}</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">عينات: {item.sampleCount}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <PaymentsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>أداء المدفوعات</Typography>
          </Stack>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">نسبة القبول</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{(paymentsPerformance?.kpis.approvalRate ?? 0).toFixed(2)}%</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">قيمة المدفوعات المقبولة</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(paymentsPerformance?.kpis.approvedAmount ?? 0, currencyCode)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">قيد المراجعة</Typography><Chip size="small" label={paymentsPerformance?.kpis.underReviewPayments ?? 0} /></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">زمن المراجعة P50</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDurationMinutes(paymentsPerformance?.kpis.p50ReviewMinutes ?? 0)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">زمن المراجعة P90</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDurationMinutes(paymentsPerformance?.kpis.p90ReviewMinutes ?? 0)}</Typography></Stack>
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <LocalOfferIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>كفاءة الخصومات</Typography>
          </Stack>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Stack spacing={1.2}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">إجمالي الخصم</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(promotionsEfficiency?.kpis.discountTotal ?? 0, currencyCode)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">معدل الخصم من الصافي</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{(promotionsEfficiency?.kpis.discountRate ?? 0).toFixed(2)}%</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">العائد لكل 1 خصم</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{(promotionsEfficiency?.kpis.revenuePerDiscountUnit ?? 0).toFixed(2)}x</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">طلبات بكوبون</Typography><Chip size="small" label={promotionsEfficiency?.kpis.couponOrders ?? 0} /></Stack>
            </Stack>
          )}
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>أفضل الكوبونات أداءً</Typography>
          <Typography variant="caption" color="text.secondary">آخر 30 يوم</Typography>
        </Stack>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (promotionsEfficiency?.topCoupons.length ?? 0) === 0 ? (
          <Typography variant="body2" color="text.secondary">لا يوجد استخدام للكوبونات في الفترة الحالية.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>الكوبون</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>عدد الطلبات</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>الخصم</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>صافي المبيعات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(promotionsEfficiency?.topCoupons ?? []).map((coupon) => (
                  <TableRow key={coupon.couponCode} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{coupon.couponCode}</TableCell>
                    <TableCell align="center">{coupon.ordersCount}</TableCell>
                    <TableCell align="right">{formatCurrency(coupon.discountTotal, currencyCode)}</TableCell>
                    <TableCell align="right">{formatCurrency(coupon.netSales, currencyCode)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>صحة المخزون</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">إجمالي المتغيرات</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{inventoryHealth?.kpis.totalVariants ?? 0}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">منخفضة المخزون</Typography><Chip size="small" color="warning" label={inventoryHealth?.kpis.lowStockVariants ?? 0} /></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">نفد مخزونها</Typography><Chip size="small" color="error" label={inventoryHealth?.kpis.outOfStockVariants ?? 0} /></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">الوحدات المحجوزة</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{inventoryHealth?.kpis.reservedUnits ?? 0}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">معدل الحركة</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{(inventoryHealth?.kpis.sellThroughRate ?? 0).toFixed(2)}%</Typography></Stack>
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>احتياج إعادة تموين</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (stockoutRisk?.items.length ?? 0) === 0 ? (
            <Typography variant="body2" color="text.secondary">لا توجد مخاطر واضحة حالياً.</Typography>
          ) : (
            <Stack spacing={1.2}>
              {(stockoutRisk?.items ?? []).slice(0, 5).map((item) => (
                <Box key={item.variantId} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.productTitle}</Typography>
                  <Stack direction="row" justifyContent="space-between" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">التغطية</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.daysOfCover.toFixed(1)} يوم</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">المتاح</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.availableQuantity}</Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>ولاء العملاء</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">عملاء نشطون</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{customersRetention?.kpis.activeCustomers ?? 0}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">عملاء جدد</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{customersRetention?.kpis.newCustomers ?? 0}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">عملاء عائدون</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{customersRetention?.kpis.returningCustomers ?? 0}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">معدل إعادة الشراء</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{(customersRetention?.kpis.repeatPurchaseRate ?? 0).toFixed(2)}%</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">متوسط طلبات/عميل</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{(customersRetention?.kpis.averageOrdersPerCustomer ?? 0).toFixed(2)}</Typography></Stack>
            </Stack>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>منتجات بطيئة الحركة</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (inventoryHealth?.slowMovingItems.length ?? 0) === 0 ? (
            <Typography variant="body2" color="text.secondary">لا توجد منتجات راكدة في هذه الفترة.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>المنتج</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>المتاح</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(inventoryHealth?.slowMovingItems ?? []).map((item) => (
                    <TableRow key={item.variantId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{item.productTitle}</TableCell>
                      <TableCell align="center">{item.sku}</TableCell>
                      <TableCell align="right">{item.availableQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>أكثر العملاء تكراراً</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (customersRetention?.topRepeatCustomers.length ?? 0) === 0 ? (
            <Typography variant="body2" color="text.secondary">لا توجد بيانات كافية بعد.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>العميل</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>طلبات الفترة</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>طلبات إجمالية</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>صافي المبيعات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(customersRetention?.topRepeatCustomers ?? []).map((customer) => (
                    <TableRow key={customer.customerId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary" dir="ltr">{customer.phone}</Typography>
                      </TableCell>
                      <TableCell align="center">{customer.ordersInWindow}</TableCell>
                      <TableCell align="center">{customer.lifetimeOrders}</TableCell>
                      <TableCell align="right">{formatCurrency(customer.netSalesInWindow, currencyCode)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>قمع التحويل</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (
            <Stack spacing={1.2}>
              {(funnelConversion?.stages ?? []).map((stage) => (
                <Box key={stage.event} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{funnelEventLabel(stage.event)}</Typography>
                    <Chip size="small" label={stage.sessions} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">تحويل المرحلة</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{stage.stepConversionRate.toFixed(2)}%</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">من الزيارة</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{stage.fromVisitRate.toFixed(2)}%</Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>نسبة التحويل حسب المصدر</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (sourceAttribution?.items.length ?? 0) === 0 ? (
            <Typography variant="body2" color="text.secondary">لا توجد بيانات مصادر كافية بعد.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>المصدر</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>زيارات</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>تحقق الدفع</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>التحويل</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sourceAttribution?.items ?? []).map((item) => (
                    <TableRow key={`${item.source}-${item.medium}-${item.campaign}`} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.source}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.medium} / {item.campaign}</Typography>
                      </TableCell>
                      <TableCell align="center">{item.visits}</TableCell>
                      <TableCell align="center">{item.checkouts}</TableCell>
                      <TableCell align="right">{item.visitToCheckoutRate.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '2fr 3fr' } }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>حوكمة البيانات</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (
            <Stack spacing={1.1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">درجة الجودة</Typography>
                <Chip
                  size="small"
                  color={dataQuality?.status === 'critical' ? 'error' : dataQuality?.status === 'warning' ? 'warning' : 'success'}
                  label={`${dataQuality?.score ?? 0}/100`}
                />
              </Stack>
              {(dataQuality?.checks ?? []).map((check) => (
                <Stack key={check.key} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">{qualityCheckLabel(check.key)}</Typography>
                  <Chip
                    size="small"
                    color={check.severity === 'critical' ? 'error' : check.severity === 'warning' ? 'warning' : 'success'}
                    label={check.value}
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>تنبيهات الانحراف</Typography>
            <Typography variant="caption" color="text.secondary">عتبة {(anomalyReport?.thresholdPercent ?? 25)}%</Typography>
          </Stack>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={22} /></Box>
          ) : (anomalyReport?.alerts.length ?? 0) === 0 ? (
            <Typography variant="body2" color="text.secondary">لا توجد انحرافات تتجاوز العتبة المحددة.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>المؤشر</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>السابق</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>الحالي</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>الانحراف</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(anomalyReport?.alerts ?? []).map((alert) => (
                    <TableRow key={alert.key} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{anomalyKeyLabel(alert.key)}</Typography>
                        <Typography variant="caption" color="text.secondary">{alert.severity === 'critical' ? 'حرج' : 'تحذير'}</Typography>
                      </TableCell>
                      <TableCell align="center">{alert.previousValue.toFixed(2)}</TableCell>
                      <TableCell align="center">{alert.currentValue.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ color: alert.deltaPercent < 0 ? 'error.main' : 'success.main', fontWeight: 700 }}>
                        {alert.deltaPercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Info & Guide Cards Row */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StorefrontIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>معلومات المتجر</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>معرّف المتجر (Store ID)</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'background.default', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                {session.user.storeId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>الصلاحيات المتاحة</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {session.user.permissions.length > 0 ? (
                  session.user.permissions.map((perm) => (
                    <Box key={perm} sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'primary.main', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                      {perm}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">لا توجد صلاحيات مخصصة</Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>عملة التقارير</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{currencyCode}</Typography>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DashboardIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>دليل الاستخدام السريع</Typography>
          </Box>
          <Box component="ul" sx={{ m: 0, pl: 2, display: 'flex', flexDirection: 'column', gap: 1.5, color: 'text.secondary', '& li': { pl: 1 } }}>
            <Box component="li">
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>قم بضبط إعدادات المتجر الأساسية (العملة، سياسات الشحن).</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>أضف تصنيفات المنتجات لتنظيم متجرك.</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>أضف منتجاتك الأولى وحدد أسعارها ومخزونها.</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>تأكد من ضبط طرق الشحن والدفع.</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>اختر واجهة مناسبة (Theme) لمتجرك.</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>اربط نطاقك الخاص (Domain) لانطلاقة احترافية.</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
