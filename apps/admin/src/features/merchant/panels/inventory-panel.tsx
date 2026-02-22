import { useState } from 'react';
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
      setMessage('Inventory data loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load inventory data');
    }
  }

  async function adjustInventory(): Promise<void> {
    const variantId = adjustVariantId.trim();
    const quantityDelta = Number(adjustDelta);

    if (!variantId) {
      setMessage('Variant ID is required for stock adjustment');
      return;
    }
    if (!Number.isInteger(quantityDelta) || quantityDelta === 0) {
      setMessage('quantityDelta must be a non-zero integer');
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
      setMessage('Inventory adjusted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to adjust inventory');
    }
  }

  async function updateThreshold(): Promise<void> {
    const variantId = thresholdVariantId.trim();
    const lowStockThreshold = Number(thresholdValue);

    if (!variantId) {
      setMessage('Variant ID is required to update threshold');
      return;
    }
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setMessage('lowStockThreshold must be an integer >= 0');
      return;
    }

    setMessage('');
    try {
      await request(`/inventory/variants/${variantId}/threshold`, {
        method: 'PUT',
        body: JSON.stringify({ lowStockThreshold }),
      });
      await loadInventoryData();
      setMessage('Low stock threshold updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update threshold');
    }
  }

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Inventory Controls</h3>
        <div className="actions">
          <button onClick={() => loadInventoryData().catch(() => undefined)}>Load</button>
        </div>

        <h4>Manual Stock Adjustment</h4>
        <label>
          Variant ID
          <input
            value={adjustVariantId}
            onChange={(event) => setAdjustVariantId(event.target.value)}
          />
        </label>
        <label>
          Quantity Delta
          <input
            type="number"
            step={1}
            value={adjustDelta}
            onChange={(event) => setAdjustDelta(event.target.value)}
          />
        </label>
        <label>
          Note
          <input value={adjustNote} onChange={(event) => setAdjustNote(event.target.value)} />
        </label>
        <button className="primary" onClick={() => adjustInventory().catch(() => undefined)}>
          Apply Adjustment
        </button>

        <h4>Low-Stock Threshold</h4>
        <label>
          Variant ID
          <input
            value={thresholdVariantId}
            onChange={(event) => setThresholdVariantId(event.target.value)}
          />
        </label>
        <label>
          Threshold
          <input
            type="number"
            min={0}
            step={1}
            value={thresholdValue}
            onChange={(event) => setThresholdValue(event.target.value)}
          />
        </label>
        <button onClick={() => updateThreshold().catch(() => undefined)}>Update Threshold</button>

        {message ? <p className="status-message">{message}</p> : null}
      </article>

      <article className="card">
        <h3>Low Stock Alerts</h3>
        <div className="list compact-list">
          {alerts.map((alert) => (
            <article key={alert.variantId} className="list-item">
              <p>
                {alert.productTitle} / {alert.variantTitle}
              </p>
              <p>
                SKU {alert.sku} - stock {alert.stockQuantity} - threshold {alert.lowStockThreshold}
              </p>
              <p>
                Reserved {alert.reservedQuantity} - available {alert.availableQuantity}
              </p>
            </article>
          ))}
          {alerts.length === 0 ? <p className="hint">No low-stock alerts.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>Recent Movements</h3>
        <div className="list compact-list">
          {movements.map((movement) => (
            <article key={movement.id} className="list-item">
              <p>
                {movement.movementType} ({movement.qtyDelta}) - {movement.sku}
              </p>
              <p>{movement.note ?? 'No note'}</p>
            </article>
          ))}
          {movements.length === 0 ? <p className="hint">No movements yet.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>Active Reservations</h3>
        <div className="list compact-list">
          {reservations.map((reservation) => (
            <article key={reservation.id} className="list-item">
              <p>
                {reservation.sku} - qty {reservation.quantity}
              </p>
              <p>
                {reservation.status} - order {reservation.orderId}
              </p>
            </article>
          ))}
          {reservations.length === 0 ? <p className="hint">No reservations found.</p> : null}
        </div>
      </article>
    </section>
  );
}
