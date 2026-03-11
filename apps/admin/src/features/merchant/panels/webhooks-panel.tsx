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
      setMessage('Webhook data loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }

  async function createEndpoint(): Promise<void> {
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) {
      setMessage('Name, URL, and at least one event are required');
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
      setMessage('Webhook endpoint created');
      setForm((prev) => ({ ...prev, name: '', url: '' }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create endpoint');
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
      setMessage('Test event dispatched');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to trigger test event');
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
      setMessage('Pending retries processed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to process pending retries');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card">
      <h3>Webhooks</h3>
      <label>
        Endpoint name
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </label>
      <label>
        Endpoint URL
        <input
          value={form.url}
          onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
          placeholder="https://example.com/webhooks"
        />
      </label>
      <label>
        Events
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
          Reload
        </button>
        <button className="primary" onClick={() => createEndpoint().catch(() => undefined)} disabled={loading}>
          Add endpoint
        </button>
        <button onClick={() => triggerTestEvent().catch(() => undefined)} disabled={loading}>
          Trigger test event
        </button>
        <button onClick={() => retryPending().catch(() => undefined)} disabled={loading}>
          Retry pending
        </button>
      </div>

      <h4>Endpoints</h4>
      <ul>
        {endpoints.map((endpoint) => (
          <li key={endpoint.id}>
            <strong>{endpoint.name}</strong> - {endpoint.url} - events: {endpoint.events.join(', ')}
          </li>
        ))}
      </ul>

      <h4>Recent deliveries</h4>
      <ul>
        {deliveries.map((delivery) => (
          <li key={delivery.id}>
            {delivery.eventType} - status {delivery.responseStatus ?? 'pending'} - attempts{' '}
            {delivery.attemptNumber}
          </li>
        ))}
      </ul>

      {message ? <p className="status-message">{message}</p> : null}
    </article>
  );
}
