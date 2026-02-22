import { useState } from 'react';
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
      setMessage('Shipping zones loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load shipping zones');
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
      setMessage('Shipping zone created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create shipping zone');
    }
  }

  async function updateZone(): Promise<void> {
    if (!selectedId) {
      setMessage('Select a zone before updating');
      return;
    }

    setMessage('');
    try {
      await request(`/shipping-zones/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      });
      await loadZones();
      setMessage('Shipping zone updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update shipping zone');
    }
  }

  async function deleteZone(): Promise<void> {
    if (!selectedId) {
      setMessage('Select a zone before deleting');
      return;
    }

    setMessage('');
    try {
      await request(`/shipping-zones/${selectedId}`, { method: 'DELETE' });
      setSelectedId('');
      setForm(emptyForm);
      await loadZones();
      setMessage('Shipping zone deleted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete shipping zone');
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
    <section className="card-grid">
      <article className="card">
        <h3>Shipping Zones</h3>
        <div className="actions">
          <button onClick={() => loadZones().catch(() => undefined)}>Load</button>
          <button className="primary" onClick={() => createZone().catch(() => undefined)}>
            Create
          </button>
          <button onClick={() => updateZone().catch(() => undefined)}>Update</button>
          <button className="danger" onClick={() => deleteZone().catch(() => undefined)}>
            Delete
          </button>
        </div>

        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label>
          City
          <input
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          />
        </label>
        <label>
          Area
          <input
            value={form.area}
            onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
          />
        </label>
        <label>
          Fee
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.fee}
            onChange={(event) => setForm((prev) => ({ ...prev, fee: event.target.value }))}
          />
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          Active
        </label>

        {message ? <p className="status-message">{message}</p> : null}
      </article>

      <article className="card">
        <h3>Zone List</h3>
        <div className="list">
          {zones.map((zone) => (
            <article key={zone.id} className="list-item">
              <h4>{zone.name}</h4>
              <p>
                {zone.city ?? 'Any city'} / {zone.area ?? 'Any area'}
              </p>
              <p>
                Fee: {zone.fee} - {zone.isActive ? 'active' : 'inactive'}
              </p>
              <button onClick={() => selectZone(zone)}>Edit</button>
            </article>
          ))}
          {zones.length === 0 ? <p className="hint">No zones loaded.</p> : null}
        </div>
      </article>
    </section>
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
