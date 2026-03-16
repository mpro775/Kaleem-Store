import { useEffect, useState } from 'react';
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
    <article className="card">
      <h3>الويب هوكس</h3>
      <label>
        اسم نقطة النهاية
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </label>
      <label>
        رابط نقطة النهاية
        <input
          value={form.url}
          onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
          placeholder="https://example.com/webhooks"
        />
      </label>
      <label>
        الأحداث
        <select
          multiple
          value={form.events}
          onChange={(event) => {
            const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
            setForm((prev) => ({ ...prev, events: selected }));
          }}
        >
          {EVENT_OPTIONS.map((eventType) => (
            <option key={eventType} value={eventType}>
              {eventType}
            </option>
          ))}
        </select>
      </label>

      <div className="actions">
        <button onClick={() => loadAll().catch(() => undefined)} disabled={loading}>
          إعادة تحميل
        </button>
        <button className="primary" onClick={() => createEndpoint().catch(() => undefined)} disabled={loading}>
          إضافة نقطة نهاية
        </button>
        <button onClick={() => triggerTestEvent().catch(() => undefined)} disabled={loading}>
          تشغيل حدث اختباري
        </button>
        <button onClick={() => retryPending().catch(() => undefined)} disabled={loading}>
          إعادة محاولة المعلق
        </button>
      </div>

      <h4>نقاط النهاية</h4>
      <ul>
        {endpoints.map((endpoint) => (
          <li key={endpoint.id}>
            <strong>{endpoint.name}</strong> - {endpoint.url} - الأحداث: {endpoint.events.join(', ')}
          </li>
        ))}
      </ul>

      <h4>آخر عمليات الإرسال</h4>
      <ul>
        {deliveries.map((delivery) => (
          <li key={delivery.id}>
            {delivery.eventType} - الحالة {delivery.responseStatus ?? 'قيد الانتظار'} - المحاولات{' '}
            {delivery.attemptNumber}
          </li>
        ))}
      </ul>

      {message ? <p className="status-message">{message}</p> : null}
    </article>
  );
}
