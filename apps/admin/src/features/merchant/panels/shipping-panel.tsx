import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard';
import type { ShippingZone } from '../types';

interface ShippingPanelProps {
  request: MerchantRequester;
}

const emptyForm = {
  name: '',
  city: '',
  area: '',
  fee: '0',
  isActive: true,
};

export function ShippingPanel({ request }: ShippingPanelProps) {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  async function loadZones(): Promise<void> {
    setMessage('');
    try {
      const data = await request<ShippingZone[]>('/shipping-zones', { method: 'GET' });
      setZones(data ?? []);
      setMessage('تم تحميل مناطق الشحن');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل مناطق الشحن');
    }
  }

  async function createZone(): Promise<void> {
    setMessage('');
    try {
      await request('/shipping-zones', {
        method: 'POST',
        body: JSON.stringify(buildPayload(form)),
      });
      setForm(emptyForm);
      await loadZones();
      setMessage('تم إنشاء منطقة شحن');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء منطقة الشحن');
    }
  }

  async function updateZone(): Promise<void> {
    if (!selectedId) {
      setMessage('اختر منطقة قبل التحديث');
      return;
    }

    setMessage('');
    try {
      await request(`/shipping-zones/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      });
      await loadZones();
      setMessage('تم تحديث منطقة الشحن');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث منطقة الشحن');
    }
  }

  async function deleteZone(): Promise<void> {
    if (!selectedId) {
      setMessage('اختر منطقة قبل الحذف');
      return;
    }

    setMessage('');
    try {
      await request(`/shipping-zones/${selectedId}`, { method: 'DELETE' });
      setSelectedId('');
      setForm(emptyForm);
      await loadZones();
      setMessage('تم حذف منطقة الشحن');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف منطقة الشحن');
    }
  }

  function selectZone(zone: ShippingZone): void {
    setSelectedId(zone.id);
    setForm({
      name: zone.name,
      city: zone.city ?? '',
      area: zone.area ?? '',
      fee: String(zone.fee),
      isActive: zone.isActive,
    });
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">مناطق الشحن</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadZones().catch(() => undefined)}>تحميل</Button>
          <Button variant="contained" onClick={() => createZone().catch(() => undefined)}>
            إنشاء
          </Button>
          <Button variant="outlined" onClick={() => updateZone().catch(() => undefined)}>تحديث</Button>
          <Button color="error" variant="outlined" onClick={() => deleteZone().catch(() => undefined)}>
            حذف
          </Button>
        </Stack>

        <TextField label="الاسم" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <TextField label="المدينة" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
        <TextField label="المنطقة" value={form.area} onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} />
        <TextField label="الرسوم" type="number" inputProps={{ min: 0, step: 0.01 }} value={form.fee} onChange={(event) => setForm((prev) => ({ ...prev, fee: event.target.value }))} />
        <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="نشط" />

        {message ? <Alert severity="info">{message}</Alert> : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">قائمة المناطق</Typography>
        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {zones.map((zone) => (
            <Paper key={zone.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle1">{zone.name}</Typography>
              <Typography variant="body2" sx={{ mt: 0.4 }}>
                {zone.city ?? 'أي مدينة'} / {zone.area ?? 'أي منطقة'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.4 }}>
                الرسوم: {zone.fee} - {zone.isActive ? 'نشط' : 'غير نشط'}
              </Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectZone(zone)}>تعديل</Button>
            </Paper>
          ))}
          {zones.length === 0 ? <Typography color="text.secondary">لا توجد مناطق محملة.</Typography> : null}
        </Box>
      </Paper>
    </Box>
  );
}

function buildPayload(form: {
  name: string;
  city: string;
  area: string;
  fee: string;
  isActive: boolean;
}) {
  const payload: {
    name: string;
    city?: string;
    area?: string;
    fee: number;
    isActive: boolean;
  } = {
    name: form.name.trim(),
    fee: Number(form.fee || '0'),
    isActive: form.isActive,
  };

  const city = form.city.trim();
  const area = form.area.trim();
  if (city) {
    payload.city = city;
  }
  if (area) {
    payload.area = area;
  }

  return payload;
}
