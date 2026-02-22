import { useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { PaymentWithOrder, PaymentStatus, PresignedMediaUpload, MediaAsset } from '../types';

interface PaymentsPanelProps {
  request: MerchantRequester;
}

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  refunded: 'Refunded',
};

const statusColors: Record<PaymentStatus, string> = {
  pending: 'badge-pending',
  under_review: 'badge-review',
  approved: 'badge-success',
  rejected: 'badge-error',
  refunded: 'badge-info',
};

export function PaymentsPanel({ request }: PaymentsPanelProps) {
  const [payments, setPayments] = useState<PaymentWithOrder[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithOrder | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPendingPayments(): Promise<void> {
    setError('');
    try {
      const data = await request<PaymentWithOrder[]>('/payments/pending-review', { method: 'GET' });
      setPayments(data ?? []);
      setMessage(`Loaded ${data?.length ?? 0} payments pending review`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    }
  }

  async function loadAllPayments(): Promise<void> {
    setError('');
    try {
      const data = await request<PaymentWithOrder[]>('/payments', { method: 'GET' });
      setPayments(data ?? []);
      setMessage(`Loaded ${data?.length ?? 0} payments`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    }
  }

  async function approvePayment(): Promise<void> {
    if (!selectedPayment) return;
    setError('');
    setMessage('');

    try {
      await request(`/payments/${selectedPayment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'approved',
          reviewNote: reviewNote.trim() || undefined,
        }),
      });
      setMessage('Payment approved successfully');
      setSelectedPayment(null);
      setReviewNote('');
      await loadPendingPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve payment');
    }
  }

  async function rejectPayment(): Promise<void> {
    if (!selectedPayment) return;
    setError('');
    setMessage('');

    if (!reviewNote.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      await request(`/payments/${selectedPayment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          reviewNote: reviewNote.trim(),
        }),
      });
      setMessage('Payment rejected');
      setSelectedPayment(null);
      setReviewNote('');
      await loadPendingPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject payment');
    }
  }

  function selectPayment(payment: PaymentWithOrder): void {
    setSelectedPayment(payment);
    setReviewNote(payment.reviewNote ?? '');
    setError('');
    setMessage('');
  }

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Transfer Payments</h3>
        <div className="actions">
          <button onClick={() => loadPendingPayments().catch(() => undefined)}>
            Pending Review
          </button>
          <button onClick={() => loadAllPayments().catch(() => undefined)}>All Payments</button>
        </div>

        <div className="list">
          {payments.map((payment) => (
            <article key={payment.id} className="list-item">
              <div className="list-item-header">
                <h4>Order {payment.orderCode}</h4>
                <span className={`badge ${statusColors[payment.status]}`}>
                  {statusLabels[payment.status]}
                </span>
              </div>
              <p>
                Amount: {payment.amount} | Method: {payment.method}
              </p>
              <p>Order Status: {payment.orderStatus}</p>
              {payment.receiptUrl && (
                <p>
                  <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                    View Receipt
                  </a>
                </p>
              )}
              <div className="list-item-actions">
                <button onClick={() => selectPayment(payment)}>Review</button>
              </div>
            </article>
          ))}
          {payments.length === 0 ? (
            <p className="hint">No payments found. Click a button above to load payments.</p>
          ) : null}
        </div>
      </article>

      <article className="card">
        <h3>Review Payment</h3>
        {selectedPayment ? (
          <>
            <div className="payment-summary">
              <p>
                <strong>Order:</strong> {selectedPayment.orderCode}
              </p>
              <p>
                <strong>Amount:</strong> {selectedPayment.amount}
              </p>
              <p>
                <strong>Method:</strong> {selectedPayment.method}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`badge ${statusColors[selectedPayment.status]}`}>
                  {statusLabels[selectedPayment.status]}
                </span>
              </p>
              {selectedPayment.customerUploadedAt && (
                <p>
                  <strong>Receipt uploaded:</strong>{' '}
                  {new Date(selectedPayment.customerUploadedAt).toLocaleString()}
                </p>
              )}
            </div>

            {selectedPayment.receiptUrl && (
              <div className="receipt-preview">
                <h4>Receipt</h4>
                <a
                  href={selectedPayment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                >
                  Open Receipt
                </a>
              </div>
            )}

            <label>
              Review Note
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note (required for rejection)"
                rows={3}
              />
            </label>

            <div className="actions">
              <button className="primary" onClick={() => approvePayment().catch(() => undefined)}>
                Approve
              </button>
              <button className="danger" onClick={() => rejectPayment().catch(() => undefined)}>
                Reject
              </button>
              <button onClick={() => setSelectedPayment(null)}>Cancel</button>
            </div>

            {error && <p className="status-message error">{error}</p>}
            {message && <p className="status-message success">{message}</p>}
          </>
        ) : (
          <p className="hint">Select a payment from the list to review.</p>
        )}
      </article>
    </section>
  );
}
