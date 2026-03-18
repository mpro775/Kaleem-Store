import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
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
  const [message, setMessage] = useState('');

  async function loadInventoryData(): Promise<void> {
    setMessage('');
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
      setMessage('تم تحميل بيانات المخزون');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل بيانات المخزون');
    }
  }

  async function adjustInventory(): Promise<void> {
    const variantId = adjustVariantId.trim();
    const quantityDelta = Number(adjustDelta);

    if (!variantId) {
      setMessage('معرّف المتغير مطلوب لتعديل المخزون');
      return;
    }
    if (!Number.isInteger(quantityDelta) || quantityDelta === 0) {
      setMessage('يجب أن تكون قيمة التعديل رقماً صحيحاً وغير صفري');
      return;
    }

    setMessage('');
    try {
      await request(`/inventory/variants/${variantId}/adjustments`, {
        method: 'POST',
        body: JSON.stringify({
          quantityDelta,
          note: adjustNote.trim() || undefined,
        }),
      });
      await loadInventoryData();
      setMessage('تم تعديل المخزون');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تعديل المخزون');
    }
  }

  async function updateThreshold(): Promise<void> {
    const variantId = thresholdVariantId.trim();
    const lowStockThreshold = Number(thresholdValue);

    if (!variantId) {
      setMessage('معرّف المتغير مطلوب لتحديث حد التنبيه');
      return;
    }
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setMessage('حد انخفاض المخزون يجب أن يكون رقماً صحيحاً أكبر أو يساوي 0');
      return;
    }

    setMessage('');
    try {
      await request(`/inventory/variants/${variantId}/threshold`, {
        method: 'PUT',
        body: JSON.stringify({ lowStockThreshold }),
      });
      await loadInventoryData();
      setMessage('تم تحديث حد انخفاض المخزون');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث حد التنبيه');
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">التحكم بالمخزون</Typography>
        <Button variant="outlined" onClick={() => loadInventoryData().catch(() => undefined)}>تحميل</Button>

        <Typography variant="subtitle1">تعديل مخزون يدوي</Typography>
        <TextField label="معرّف المتغير" value={adjustVariantId} onChange={(event) => setAdjustVariantId(event.target.value)} />
        <TextField label="فرق الكمية" type="number" inputProps={{ step: 1 }} value={adjustDelta} onChange={(event) => setAdjustDelta(event.target.value)} />
        <TextField label="ملاحظة" value={adjustNote} onChange={(event) => setAdjustNote(event.target.value)} />
        <Button variant="contained" onClick={() => adjustInventory().catch(() => undefined)}>
          تطبيق التعديل
        </Button>

        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>حد انخفاض المخزون</Typography>
        <TextField label="معرّف المتغير" value={thresholdVariantId} onChange={(event) => setThresholdVariantId(event.target.value)} />
        <TextField label="الحد" type="number" inputProps={{ min: 0, step: 1 }} value={thresholdValue} onChange={(event) => setThresholdValue(event.target.value)} />
        <Button variant="outlined" onClick={() => updateThreshold().catch(() => undefined)}>تحديث الحد</Button>

        {message ? <Alert severity="info">{message}</Alert> : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
        <Typography variant="h6">تنبيهات انخفاض المخزون</Typography>
        <Box sx={{ mt: 1, display: 'grid', gap: 0.8 }}>
          {alerts.map((alert) => (
            <Paper key={alert.variantId} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2">
                {alert.productTitle} / {alert.variantTitle}
              </Typography>
              <Typography variant="body2">
                SKU {alert.sku} - المخزون {alert.stockQuantity} - الحد {alert.lowStockThreshold}
              </Typography>
              <Typography variant="body2">
                المحجوز {alert.reservedQuantity} - المتاح {alert.availableQuantity}
              </Typography>
            </Paper>
          ))}
          {alerts.length === 0 ? <Typography color="text.secondary">لا توجد تنبيهات انخفاض مخزون.</Typography> : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
        <Typography variant="h6">آخر الحركات</Typography>
        <Box sx={{ mt: 1, display: 'grid', gap: 0.8 }}>
          {movements.map((movement) => (
            <Paper key={movement.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2">
                {movement.movementType} ({movement.qtyDelta}) - {movement.sku}
              </Typography>
              <Typography variant="body2">{movement.note ?? 'بدون ملاحظة'}</Typography>
            </Paper>
          ))}
          {movements.length === 0 ? <Typography color="text.secondary">لا توجد حركات حتى الآن.</Typography> : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
        <Typography variant="h6">الحجوزات النشطة</Typography>
        <Box sx={{ mt: 1, display: 'grid', gap: 0.8 }}>
          {reservations.map((reservation) => (
            <Paper key={reservation.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2">
                {reservation.sku} - الكمية {reservation.quantity}
              </Typography>
              <Typography variant="body2">
                {reservation.status} - الطلب {reservation.orderId}
              </Typography>
            </Paper>
          ))}
          {reservations.length === 0 ? <Typography color="text.secondary">لا توجد حجوزات.</Typography> : null}
        </Box>
      </Paper>
    </Box>
  );
}
