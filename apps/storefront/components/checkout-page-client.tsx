'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { clearCartIdFromStorage, getCartIdFromStorage } from '../lib/cart-storage';
import { checkout, getCart, listShippingZones } from '../lib/storefront-client';
import type { ShippingZone, StorefrontCart } from '../lib/types';

export function CheckoutPageClient() {
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine: '',
    city: '',
    area: '',
    shippingZoneId: '',
    couponCode: '',
    note: '',
    paymentMethod: 'cod' as 'cod' | 'transfer',
  });

  useEffect(() => {
    bootstrap().catch(() => {
      return;
    });
  }, []);

  const shippingFee = useMemo(() => {
    const zone = zones.find((entry) => entry.id === form.shippingZoneId);
    return zone?.fee ?? 0;
  }, [form.shippingZoneId, zones]);

  const estimatedTotal = (cart?.subtotal ?? 0) + shippingFee;

  async function bootstrap() {
    const cartId = getCartIdFromStorage();
    if (!cartId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [cartResponse, zoneResponse] = await Promise.all([
        getCart(cartId),
        listShippingZones(),
      ]);
      setCart(cartResponse);
      setZones(zoneResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Failed to load checkout data',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = buildCheckoutPayload(cart.cartId, form);
      const response = await checkout(payload);
      clearCartIdFromStorage();
      setOrderCode(response.orderCode);
      setCart(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="panel">Loading checkout...</div>
      </main>
    );
  }

  if (orderCode) {
    return (
      <main className="page-shell">
        <div className="panel">
          <h1>Order placed successfully</h1>
          <p>Your order code is {orderCode}.</p>
          <Link
            href={`/track-order?orderCode=${encodeURIComponent(orderCode)}`}
            className="button-primary"
          >
            Track this order
          </Link>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="page-shell">
        <div className="panel">
          <h1>Your cart is empty</h1>
          <Link href="/categories" className="button-primary">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Checkout</h1>
        <p>Complete your order details and confirm.</p>
      </header>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="checkout-grid">
        <form className="panel stack-md" onSubmit={onSubmit}>
          <h2>Customer details</h2>
          <input
            className="input"
            placeholder="Full name"
            value={form.customerName}
            onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Phone"
            value={form.customerPhone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerPhone: event.target.value }))
            }
            required
          />
          <input
            className="input"
            placeholder="Email (optional)"
            value={form.customerEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerEmail: event.target.value }))
            }
          />

          <h2>Shipping</h2>
          <input
            className="input"
            placeholder="Address line"
            value={form.addressLine}
            onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="City"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Area"
            value={form.area}
            onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
          />

          <select
            className="input"
            value={form.shippingZoneId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, shippingZoneId: event.target.value }))
            }
          >
            <option value="">No shipping zone</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} ({zone.fee.toFixed(2)})
              </option>
            ))}
          </select>

          <h2>Payment</h2>
          <select
            className="input"
            value={form.paymentMethod}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                paymentMethod: event.target.value as 'cod' | 'transfer',
              }))
            }
          >
            <option value="cod">Cash on delivery</option>
            <option value="transfer">Bank transfer</option>
          </select>

          <input
            className="input"
            placeholder="Coupon code"
            value={form.couponCode}
            onChange={(event) => setForm((prev) => ({ ...prev, couponCode: event.target.value }))}
          />
          <textarea
            className="input"
            placeholder="Order note"
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />

          <button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="panel stack-md">
          <h2>Order summary</h2>
          {cart.items.map((item) => (
            <div key={item.variantId} className="summary-row">
              <span>
                {item.title} x {item.quantity}
              </span>
              <strong>{item.lineTotal.toFixed(2)}</strong>
            </div>
          ))}
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{cart.subtotal.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <strong>{shippingFee.toFixed(2)}</strong>
          </div>
          <div className="summary-row total-row">
            <span>Estimated total</span>
            <strong>
              {estimatedTotal.toFixed(2)} {cart.currencyCode}
            </strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

function buildCheckoutPayload(
  cartId: string,
  form: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    addressLine: string;
    city: string;
    area: string;
    shippingZoneId: string;
    couponCode: string;
    note: string;
    paymentMethod: 'cod' | 'transfer';
  },
): {
  cartId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressLine: string;
  city?: string;
  area?: string;
  shippingZoneId?: string;
  couponCode?: string;
  note?: string;
  paymentMethod: 'cod' | 'transfer';
} {
  const payload: {
    cartId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    addressLine: string;
    city?: string;
    area?: string;
    shippingZoneId?: string;
    couponCode?: string;
    note?: string;
    paymentMethod: 'cod' | 'transfer';
  } = {
    cartId,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    addressLine: form.addressLine,
    paymentMethod: form.paymentMethod,
  };

  if (form.customerEmail) {
    payload.customerEmail = form.customerEmail;
  }
  if (form.city) {
    payload.city = form.city;
  }
  if (form.area) {
    payload.area = form.area;
  }
  if (form.shippingZoneId) {
    payload.shippingZoneId = form.shippingZoneId;
  }
  if (form.couponCode) {
    payload.couponCode = form.couponCode;
  }
  if (form.note) {
    payload.note = form.note;
  }

  return payload;
}
