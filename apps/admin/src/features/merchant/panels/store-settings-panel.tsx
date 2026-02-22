import { useEffect, useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { StoreSettings } from '../types';

interface StoreSettingsPanelProps {
  request: MerchantRequester;
}

export function StoreSettingsPanel({ request }: StoreSettingsPanelProps) {
  const [form, setForm] = useState({
    name: '',
    currencyCode: 'YER',
    timezone: 'Asia/Aden',
    logoUrl: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings().catch(() => undefined);
  }, []);

  async function loadSettings(): Promise<void> {
    setLoading(true);
    setMessage('');

    try {
      const data = await request<StoreSettings>('/store/settings', { method: 'GET' });
      if (!data) {
        return;
      }

      setForm({
        name: data.name,
        currencyCode: data.currencyCode,
        timezone: data.timezone,
        logoUrl: data.logoUrl ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
      });
      setMessage('Store settings loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load store settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(): Promise<void> {
    setLoading(true);
    setMessage('');

    try {
      await request<StoreSettings>('/store/settings', {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      });
      setMessage('Store settings updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card">
      <h3>Store Settings</h3>
      <label>
        Name
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
      </label>
      <label>
        Currency Code
        <input
          value={form.currencyCode}
          maxLength={3}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))
          }
        />
      </label>
      <label>
        Timezone
        <input
          value={form.timezone}
          onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
        />
      </label>
      <label>
        Logo URL
        <input
          value={form.logoUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
        />
      </label>
      <label>
        Phone
        <input
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
        />
      </label>
      <label>
        Address
        <input
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
        />
      </label>

      <div className="actions">
        <button onClick={() => loadSettings().catch(() => undefined)} disabled={loading}>
          Reload
        </button>
        <button
          className="primary"
          onClick={() => saveSettings().catch(() => undefined)}
          disabled={loading}
        >
          Save
        </button>
      </div>

      {message ? <p className="status-message">{message}</p> : null}
    </article>
  );
}

function buildPayload(form: {
  name: string;
  currencyCode: string;
  timezone: string;
  logoUrl: string;
  phone: string;
  address: string;
}) {
  const payload: {
    name: string;
    currencyCode: string;
    timezone: string;
    logoUrl?: string;
    phone?: string;
    address?: string;
  } = {
    name: form.name.trim(),
    currencyCode: form.currencyCode.trim().toUpperCase(),
    timezone: form.timezone.trim(),
  };

  const logo = form.logoUrl.trim();
  const phone = form.phone.trim();
  const address = form.address.trim();

  if (logo) {
    payload.logoUrl = logo;
  }
  if (phone) {
    payload.phone = phone;
  }
  if (address) {
    payload.address = address;
  }

  return payload;
}
