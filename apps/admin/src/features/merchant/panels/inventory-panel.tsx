import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import type { MerchantRequester } from '../merchant-dashboard';
import type {
  InventoryVariantSnapshot,
  PaginatedInventoryMovements,
  PaginatedInventoryReservations,
} from '../types';

interface InventoryPanelProps {
  request: MerchantRequester;
}

export function InventoryPanel({ request }: InventoryPanelProps) {
  const [movements, setMovements] = useState<PaginatedInventoryMovements['items']>([]);
  const [reservations, setReservations] = useState<PaginatedInventoryReservations['items']>([]);
  const [alerts, setAlerts] = useState<InventoryVariantSnapshot[]>([]);
  
  const [adjustVariantId, setAdjustVariantId] = useState('');
  const [adjustDelta, setAdjustDelta] = useState('0');
  const [adjustNote, setAdjustNote] = useState('');
  
  const [thresholdVariantId, setThresholdVariantId] = useState('');
  const [thresholdValue, setThresholdValue] = useState('0');
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadInventoryData().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInventoryData(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const [alertsData, movementsData, reservationsData] = await Promise.all([
        request<InventoryVariantSnapshot[]>('/inventory/alerts/low-stock', { method: 'GET' }),
        request<PaginatedInventoryMovements>('/inventory/movements?page=1&limit=20', {
          method: 'GET',
        }),
        request<PaginatedInventoryReservations>('/inventory/reservations?page=1&limit=20', {
          method: 'GET',
        }),
      ]);

      setAlerts(alertsData ?? []);
      setMovements(movementsData?.items ?? []);
      setReservations(reservationsData?.items ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل بيانات المخزون', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function adjustInventory(): Promise<void> {
    const variantId = adjustVariantId.trim();
    const quantityDelta = Number(adjustDelta);

    if (!variantId) {
      setMessage({ text: 'معرّف المتغير مطلوب لتعديل المخزون', type: 'error' });
      return;
    }
    if (!Number.isInteger(quantityDelta) || quantityDelta === 0) {
      setMessage({ text: 'يجب أن تكون قيمة التعديل رقماً صحيحاً وغير صفري', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/inventory/variants/${variantId}/adjustments`, {
        method: 'POST',
        body: JSON.stringify({
          quantityDelta,
          note: adjustNote.trim() || undefined,
        }),
      });
      await loadInventoryData();
      setAdjustDelta('0');
      setAdjustNote('');
      setMessage({ text: 'تم تعديل المخزون بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تعديل المخزون', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateThreshold(): Promise<void> {
    const variantId = thresholdVariantId.trim();
    const lowStockThreshold = Number(thresholdValue);

    if (!variantId) {
      setMessage({ text: 'معرّف المتغير مطلوب لتحديث حد التنبيه', type: 'error' });
      return;
    }
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setMessage({ text: 'حد انخفاض المخزون يجب أن يكون رقماً صحيحاً أكبر أو يساوي 0', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/inventory/variants/${variantId}/threshold`, {
        method: 'PUT',
        body: JSON.stringify({ lowStockThreshold }),
      });
      await loadInventoryData();
      setMessage({ text: 'تم تحديث حد انخفاض المخزون بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث حد التنبيه', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            إدارة المخزون
          </Typography>
          <Typography color="text.secondary">
            راقب الحركات والتنبيهات، وقم بتعديل الكميات يدوياً.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => loadInventoryData().catch(() => undefined)}
          disabled={loading}
        >
          تحديث البيانات
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Quick Actions / Adjustments */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <AddShoppingCartIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>تعديل مخزون يدوي</Typography>
                </Box>
                <Stack spacing={2}>
                  <TextField size="small" label="معرّف المتغير (Variant ID)" fullWidth value={adjustVariantId} onChange={(event) => setAdjustVariantId(event.target.value)} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField size="small" label="فرق الكمية (مثل: 5 أو -2)" type="number" inputProps={{ step: 1 }} fullWidth value={adjustDelta} onChange={(event) => setAdjustDelta(event.target.value)} />
                  </Box>
                  <TextField size="small" label="ملاحظة أو سبب التعديل" fullWidth value={adjustNote} onChange={(event) => setAdjustNote(event.target.value)} />
                  <Button variant="contained" onClick={() => adjustInventory().catch(() => undefined)} disabled={actionLoading} disableElevation>
                    تطبيق التعديل
                  </Button>
                </Stack>
              </Paper>
            </Box>

            <Box>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <WarningAmberIcon color="warning" />
                  <Typography variant="h6" fontWeight={800}>حد تنبيه انخفاض المخزون</Typography>
                </Box>
                <Stack spacing={2}>
                  <TextField size="small" label="معرّف المتغير (Variant ID)" fullWidth value={thresholdVariantId} onChange={(event) => setThresholdVariantId(event.target.value)} />
                  <TextField size="small" label="الحد الأدنى للتنبيه" type="number" inputProps={{ min: 0, step: 1 }} fullWidth value={thresholdValue} onChange={(event) => setThresholdValue(event.target.value)} />
                  <Button variant="outlined" color="warning" onClick={() => updateThreshold().catch(() => undefined)} disabled={actionLoading}>
                    تحديث الحد
                  </Button>
                </Stack>
              </Paper>
            </Box>
          </Box>

          {/* Alerts Table */}
          <Paper elevation={0} sx={{ p: 0, borderRadius: 3, border: '1px solid', borderColor: 'error.light', overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'error.50', borderBottom: '1px solid', borderColor: 'error.light', display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon color="error" />
              <Typography variant="h6" fontWeight={800} color="error.dark">تنبيهات انخفاض المخزون ({alerts.length})</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.paper' }}>
                    <TableCell sx={{ fontWeight: 700 }}>المنتج / المتغير</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>المتوفر / المحجوز</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>المخزون الفعلي</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>حد التنبيه</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">المخزون بوضع جيد. لا توجد تنبيهات.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.map((alert) => (
                      <TableRow key={alert.variantId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{alert.productTitle}</Typography>
                          <Typography variant="caption" color="text.secondary">{alert.variantTitle}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2" fontFamily="monospace">{alert.sku}</Typography></TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="success.main" display="inline" fontWeight={700}>{alert.availableQuantity}</Typography>
                          {' / '}
                          <Typography variant="body2" color="warning.main" display="inline" fontWeight={700}>{alert.reservedQuantity}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" label={alert.stockQuantity} color="error" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="center">{alert.lowStockThreshold}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Movements and Reservations */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentReturnIcon color="action" />
                  <Typography variant="subtitle1" fontWeight={800}>آخر الحركات</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>النوع</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>الكمية</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>ملاحظة</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary" variant="body2">لا توجد حركات.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.map((movement) => (
                          <TableRow key={movement.id} hover>
                            <TableCell>
                              <Chip size="small" label={movement.movementType} variant="outlined" />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{movement.sku}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color={movement.qtyDelta > 0 ? 'success.main' : 'error.main'} dir="ltr">
                                {movement.qtyDelta > 0 ? `+${movement.qtyDelta}` : movement.qtyDelta}
                              </Typography>
                            </TableCell>
                            <TableCell><Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>{movement.note ?? '-'}</Typography></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>

            <Box>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalOfferIcon color="action" />
                  <Typography variant="subtitle1" fontWeight={800}>الحجوزات النشطة (للطلبات غير المكتملة)</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>الكمية المحجوزة</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>حالة الحجز</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>رقم الطلب</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reservations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary" variant="body2">لا توجد حجوزات نشطة.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        reservations.map((reservation) => (
                          <TableRow key={reservation.id} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{reservation.sku}</TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={700} color="warning.main">
                                {reservation.quantity}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={reservation.status} color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">{reservation.orderId.slice(0,8)}...</Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}