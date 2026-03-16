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
    <section className="card-grid">
      <article className="card">
        <h3>التحكم بالمخزون</h3>
        <div className="actions">
          <button onClick={() => loadInventoryData().catch(() => undefined)}>تحميل</button>
        </div>

        <h4>تعديل مخزون يدوي</h4>
        <label>
          معرّف المتغير
          <input
            value={adjustVariantId}
            onChange={(event) => setAdjustVariantId(event.target.value)}
          />
        </label>
        <label>
          فرق الكمية
          <input
            type="number"
            step={1}
            value={adjustDelta}
            onChange={(event) => setAdjustDelta(event.target.value)}
          />
        </label>
        <label>
          ملاحظة
          <input value={adjustNote} onChange={(event) => setAdjustNote(event.target.value)} />
        </label>
        <button className="primary" onClick={() => adjustInventory().catch(() => undefined)}>
          تطبيق التعديل
        </button>

        <h4>حد انخفاض المخزون</h4>
        <label>
          معرّف المتغير
          <input
            value={thresholdVariantId}
            onChange={(event) => setThresholdVariantId(event.target.value)}
          />
        </label>
        <label>
          الحد
          <input
            type="number"
            min={0}
            step={1}
            value={thresholdValue}
            onChange={(event) => setThresholdValue(event.target.value)}
          />
        </label>
        <button onClick={() => updateThreshold().catch(() => undefined)}>تحديث الحد</button>

        {message ? <p className="status-message">{message}</p> : null}
      </article>

      <article className="card">
        <h3>تنبيهات انخفاض المخزون</h3>
        <div className="list compact-list">
          {alerts.map((alert) => (
            <article key={alert.variantId} className="list-item">
              <p>
                {alert.productTitle} / {alert.variantTitle}
              </p>
              <p>
                SKU {alert.sku} - المخزون {alert.stockQuantity} - الحد {alert.lowStockThreshold}
              </p>
              <p>
                المحجوز {alert.reservedQuantity} - المتاح {alert.availableQuantity}
              </p>
            </article>
          ))}
          {alerts.length === 0 ? <p className="hint">لا توجد تنبيهات انخفاض مخزون.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>آخر الحركات</h3>
        <div className="list compact-list">
          {movements.map((movement) => (
            <article key={movement.id} className="list-item">
              <p>
                {movement.movementType} ({movement.qtyDelta}) - {movement.sku}
              </p>
              <p>{movement.note ?? 'بدون ملاحظة'}</p>
            </article>
          ))}
          {movements.length === 0 ? <p className="hint">لا توجد حركات حتى الآن.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>الحجوزات النشطة</h3>
        <div className="list compact-list">
          {reservations.map((reservation) => (
            <article key={reservation.id} className="list-item">
              <p>
                {reservation.sku} - الكمية {reservation.quantity}
              </p>
              <p>
                {reservation.status} - الطلب {reservation.orderId}
              </p>
            </article>
          ))}
          {reservations.length === 0 ? <p className="hint">لا توجد حجوزات.</p> : null}
        </div>
      </article>
    </section>
  );
}
