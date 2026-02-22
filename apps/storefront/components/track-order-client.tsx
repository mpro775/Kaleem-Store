'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackOrder } from '../lib/storefront-client';
import type { TrackOrderResponse } from '../lib/types';

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const initialOrderCode = searchParams.get('orderCode') ?? '';

  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackOrderResponse | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !orderCode.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await trackOrder(orderCode.trim(), phone.trim() || undefined);
      setResult(response);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : 'Unable to track this order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Track your order</h1>
        <p>Enter your order code and optional phone number.</p>
      </header>

      <form className="panel stack-md" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Order code (e.g. KS-ABC123)"
          value={orderCode}
          onChange={(event) => setOrderCode(event.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Track order'}
        </button>
      </form>

      {error ? <p className="error-message">{error}</p> : null}

      {result ? (
        <section className="panel stack-md">
          <h2>Order {result.orderCode}</h2>
          <p>Status: {result.status}</p>
          <p>
            Total: {result.total.toFixed(2)} {result.currencyCode}
          </p>

          <div className="timeline">
            {result.timeline.map((item, index) => (
              <article key={`${item.to}-${item.createdAt}-${index}`} className="timeline-item">
                <strong>{item.to}</strong>
                <span>{item.note ?? 'Status updated'}</span>
                <time>{new Date(item.createdAt).toLocaleString()}</time>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
