import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard';
import type { WebhookDelivery, WebhookEndpoint } from '../types';

interface WebhooksPanelProps {
  request: MerchantRequester;
}

const EVENT_OPTIONS = [
  'product.created',
  'product.updated',
  'order.created',
  'order.updated',
  'inventory.updated',
  'coupon.updated',
];

export function WebhooksPanel({ request }: WebhooksPanelProps) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    url: '',
    events: ['order.created', 'order.updated'],
  });

  useEffect(() => {
    loadAll().catch(() => undefined);
  }, []);

  async function loadAll(): Promise<void> {
    setLoading(true);
    setMessage('');

    try {
      const [endpointRows, deliveryRows] = await Promise.all([
        request<WebhookEndpoint[]>('/webhooks', { method: 'GET' }),
        request<{ items: WebhookDelivery[] }>('/webhooks/deliveries?page=1&limit=10', {
          method: 'GET',
        }),
      ]);

      setEndpoints(endpointRows ?? []);
      setDeliveries(deliveryRows?.items ?? []);
      setMessage('تم تحميل بيانات الويب هوكس');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الويب هوكس');
    } finally {
      setLoading(false);
    }
  }

  async function createEndpoint(): Promise<void> {
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) {
      setMessage('الاسم والرابط وحدث واحد على الأقل مطلوبة');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await request('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          url: form.url.trim(),
          events: form.events,
          isActive: true,
        }),
      });
      await loadAll();
      setMessage('تم إنشاء نقطة نهاية ويب هوك');
      setForm((prev) => ({ ...prev, name: '', url: '' }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء نقطة النهاية');
    } finally {
      setLoading(false);
    }
  }

  async function triggerTestEvent(): Promise<void> {
    setLoading(true);
    setMessage('');
    try {
      await request('/webhooks/test-event', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'order.updated',
          data: {
            source: 'admin-panel',
            triggeredAt: new Date().toISOString(),
          },
        }),
      });
      await loadAll();
      setMessage('تم إرسال حدث اختباري');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تشغيل الحدث الاختباري');
    } finally {
      setLoading(false);
    }
  }

  async function retryPending(): Promise<void> {
    setLoading(true);
    setMessage('');
    try {
      await request('/webhooks/deliveries/retry-pending', { method: 'POST' });
      await loadAll();
      setMessage('تمت معالجة الإعادات المعلقة');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر معالجة الإعادات المعلقة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
      <Typography variant="h6">الويب هوكس</Typography>
      <TextField label="اسم نقطة النهاية" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
      <TextField
        label="رابط نقطة النهاية"
        value={form.url}
        onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
        placeholder="https://example.com/webhooks"
      />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.6 }}>الأحداث</Typography>
        <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))' } }}>
          {EVENT_OPTIONS.map((eventType) => (
            <FormControlLabel
              key={eventType}
              control={
                <Checkbox
                  checked={form.events.includes(eventType)}
                  onChange={(event) => {
                    setForm((prev) => ({
                      ...prev,
                      events: event.target.checked
                        ? [...prev.events, eventType]
                        : prev.events.filter((row) => row !== eventType),
                    }));
                  }}
                />
              }
              label={eventType}
            />
          ))}
        </FormGroup>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" onClick={() => loadAll().catch(() => undefined)} disabled={loading}>
          إعادة تحميل
        </Button>
        <Button variant="contained" onClick={() => createEndpoint().catch(() => undefined)} disabled={loading}>
          إضافة نقطة نهاية
        </Button>
        <Button variant="outlined" onClick={() => triggerTestEvent().catch(() => undefined)} disabled={loading}>
          تشغيل حدث اختباري
        </Button>
        <Button variant="outlined" onClick={() => retryPending().catch(() => undefined)} disabled={loading}>
          إعادة محاولة المعلق
        </Button>
      </Stack>

      <Typography variant="subtitle1">نقاط النهاية</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, display: 'grid', gap: 0.5 }}>
        {endpoints.map((endpoint) => (
          <Box component="li" key={endpoint.id}>
            <strong>{endpoint.name}</strong> - {endpoint.url} - الأحداث: {endpoint.events.join(', ')}
          </Box>
        ))}
      </Box>

      <Typography variant="subtitle1">آخر عمليات الإرسال</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, display: 'grid', gap: 0.5 }}>
        {deliveries.map((delivery) => (
          <Box component="li" key={delivery.id}>
            {delivery.eventType} - الحالة {delivery.responseStatus ?? 'قيد الانتظار'} - المحاولات{' '}
            {delivery.attemptNumber}
          </Box>
        ))}
      </Box>

      {message ? <Alert severity="info">{message}</Alert> : null}
    </Paper>
  );
}
