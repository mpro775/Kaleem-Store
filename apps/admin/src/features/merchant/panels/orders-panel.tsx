import { useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { Order, OrderDetail, OrderStatus } from '../types';

interface OrdersPanelProps {
  request: MerchantRequester;
}

const statusOptions: OrderStatus[] = [
  'new',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'completed',
  'cancelled',
  'returned',
];

export function OrdersPanel({ request }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [nextStatus, setNextStatus] = useState<OrderStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [message, setMessage] = useState('');

  async function loadOrders(): Promise<void> {
    setMessage('');
    try {
      const query = buildOrdersQuery(statusFilter, searchQuery);
      const data = await request<{ items: Order[] }>(`/orders${query}`, { method: 'GET' });
      setOrders(data?.items ?? []);
      setMessage('Orders loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load orders');
    }
  }

  async function loadOrderDetail(orderId: string): Promise<void> {
    setMessage('');
    try {
      const data = await request<OrderDetail>(`/orders/${orderId}`, { method: 'GET' });
      setOrderDetail(data ?? null);
      if (data) {
        setNextStatus(resolveDefaultNextStatus(data.status));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load order details');
    }
  }

  async function updateOrderStatus(): Promise<void> {
    if (!orderDetail) {
      setMessage('Select an order first');
      return;
    }

    setMessage('');
    try {
      const payload = buildStatusPayload(nextStatus, statusNote);
      const data = await request<OrderDetail>(`/orders/${orderDetail.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (data) {
        setOrderDetail(data);
      }
      await loadOrders();
      setMessage('Order status updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Orders</h3>
        <div className="actions">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search order code"
          />
          <button onClick={() => loadOrders().catch(() => undefined)}>Load</button>
        </div>

        <div className="list">
          {orders.map((order) => (
            <article key={order.id} className="list-item">
              <h4>{order.orderCode}</h4>
              <p>
                {order.status} - {order.total} {order.currencyCode}
              </p>
              <button onClick={() => loadOrderDetail(order.id).catch(() => undefined)}>
                Details
              </button>
            </article>
          ))}
          {orders.length === 0 ? <p className="hint">No orders loaded.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>Order Details</h3>
        {orderDetail ? (
          <>
            <p>
              <strong>{orderDetail.orderCode}</strong> - {orderDetail.status}
            </p>
            <p>
              Total: {orderDetail.total} {orderDetail.currencyCode}
            </p>

            <label>
              Next Status
              <select
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Note
              <input value={statusNote} onChange={(event) => setStatusNote(event.target.value)} />
            </label>
            <button className="primary" onClick={() => updateOrderStatus().catch(() => undefined)}>
              Update Status
            </button>

            {orderDetail.payment && (
              <>
                <h4>Payment</h4>
                <div className="payment-info">
                  <p>
                    <strong>Method:</strong> {orderDetail.payment.method}
                  </p>
                  <p>
                    <strong>Status:</strong> {orderDetail.payment.status}
                  </p>
                  <p>
                    <strong>Amount:</strong> {orderDetail.payment.amount}
                  </p>
                  {orderDetail.payment.receiptUrl && (
                    <p>
                      <a
                        href={orderDetail.payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Receipt
                      </a>
                    </p>
                  )}
                </div>
              </>
            )}

            <h4>Items</h4>
            <div className="list compact-list">
              {orderDetail.items.map((item) => (
                <article key={item.id} className="list-item">
                  <p>
                    {item.title} x {item.quantity}
                  </p>
                  <p>{item.lineTotal}</p>
                </article>
              ))}
            </div>

            <h4>Timeline</h4>
            <div className="list compact-list">
              {orderDetail.timeline.map((entry, index) => (
                <article key={`${entry.to}-${entry.createdAt}-${index}`} className="list-item">
                  <p>
                    {entry.from ?? 'none'} {'->'} {entry.to}
                  </p>
                  <p>{entry.note ?? 'No note'}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="hint">Select an order to view details.</p>
        )}
      </article>

      {message ? <p className="status-message">{message}</p> : null}
    </section>
  );
}

function buildOrdersQuery(status: string, q: string): string {
  const params = new URLSearchParams();
  params.set('page', '1');
  params.set('limit', '30');
  if (status) {
    params.set('status', status);
  }
  if (q.trim()) {
    params.set('q', q.trim());
  }

  return `?${params.toString()}`;
}

function buildStatusPayload(
  status: OrderStatus,
  note: string,
): { status: OrderStatus; note?: string } {
  const payload: { status: OrderStatus; note?: string } = { status };
  const normalizedNote = note.trim();
  if (normalizedNote) {
    payload.note = normalizedNote;
  }
  return payload;
}

function resolveDefaultNextStatus(current: OrderStatus): OrderStatus {
  if (current === 'new') {
    return 'confirmed';
  }
  if (current === 'confirmed') {
    return 'preparing';
  }
  if (current === 'preparing') {
    return 'out_for_delivery';
  }
  if (current === 'out_for_delivery') {
    return 'completed';
  }
  return current;
}
