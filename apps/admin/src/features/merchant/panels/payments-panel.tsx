import { useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { PaymentWithOrder, PaymentStatus, PresignedMediaUpload, MediaAsset } from '../types';

interface PaymentsPanelProps {
  request: MerchantRequester;
}

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'قيد الانتظار',
  under_review: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
  refunded: 'مسترجع',
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
      setMessage(`تم تحميل ${data?.length ?? 0} مدفوعات قيد المراجعة`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل المدفوعات');
    }
  }

  async function loadAllPayments(): Promise<void> {
    setError('');
    try {
      const data = await request<PaymentWithOrder[]>('/payments', { method: 'GET' });
      setPayments(data ?? []);
      setMessage(`تم تحميل ${data?.length ?? 0} مدفوعات`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل المدفوعات');
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
      setMessage('تم اعتماد الدفعة بنجاح');
      setSelectedPayment(null);
      setReviewNote('');
      await loadPendingPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر اعتماد الدفعة');
    }
  }

  async function rejectPayment(): Promise<void> {
    if (!selectedPayment) return;
    setError('');
    setMessage('');

    if (!reviewNote.trim()) {
      setError('سبب الرفض مطلوب');
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
      setMessage('تم رفض الدفعة');
      setSelectedPayment(null);
      setReviewNote('');
      await loadPendingPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر رفض الدفعة');
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
        <h3>مدفوعات التحويل</h3>
        <div className="actions">
          <button onClick={() => loadPendingPayments().catch(() => undefined)}>
            قيد المراجعة
          </button>
          <button onClick={() => loadAllPayments().catch(() => undefined)}>كل المدفوعات</button>
        </div>

        <div className="list">
          {payments.map((payment) => (
            <article key={payment.id} className="list-item">
              <div className="list-item-header">
                <h4>طلب {payment.orderCode}</h4>
                <span className={`badge ${statusColors[payment.status]}`}>
                  {statusLabels[payment.status]}
                </span>
              </div>
              <p>
                المبلغ: {payment.amount} | الطريقة: {payment.method}
              </p>
              <p>حالة الطلب: {payment.orderStatus}</p>
              {payment.receiptUrl && (
                <p>
                  <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                    عرض الإيصال
                  </a>
                </p>
              )}
              <div className="list-item-actions">
                <button onClick={() => selectPayment(payment)}>مراجعة</button>
              </div>
            </article>
          ))}
          {payments.length === 0 ? (
            <p className="hint">لا توجد مدفوعات. اضغط أحد الأزرار بالأعلى للتحميل.</p>
          ) : null}
        </div>
      </article>

      <article className="card">
        <h3>مراجعة الدفعة</h3>
        {selectedPayment ? (
          <>
            <div className="payment-summary">
              <p>
                <strong>الطلب:</strong> {selectedPayment.orderCode}
              </p>
              <p>
                <strong>المبلغ:</strong> {selectedPayment.amount}
              </p>
              <p>
                <strong>الطريقة:</strong> {selectedPayment.method}
              </p>
              <p>
                <strong>الحالة:</strong>{' '}
                <span className={`badge ${statusColors[selectedPayment.status]}`}>
                  {statusLabels[selectedPayment.status]}
                </span>
              </p>
              {selectedPayment.customerUploadedAt && (
                <p>
                  <strong>تاريخ رفع الإيصال:</strong>{' '}
                  {new Date(selectedPayment.customerUploadedAt).toLocaleString()}
                </p>
              )}
            </div>

            {selectedPayment.receiptUrl && (
              <div className="receipt-preview">
                <h4>الإيصال</h4>
                <a
                  href={selectedPayment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                >
                  فتح الإيصال
                </a>
              </div>
            )}

            <label>
              ملاحظة المراجعة
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="أضف ملاحظة (مطلوبة عند الرفض)"
                rows={3}
              />
            </label>

            <div className="actions">
              <button className="primary" onClick={() => approvePayment().catch(() => undefined)}>
                اعتماد
              </button>
              <button className="danger" onClick={() => rejectPayment().catch(() => undefined)}>
                رفض
              </button>
              <button onClick={() => setSelectedPayment(null)}>إلغاء</button>
            </div>

            {error && <p className="status-message error">{error}</p>}
            {message && <p className="status-message success">{message}</p>}
          </>
        ) : (
          <p className="hint">اختر دفعة من القائمة للمراجعة.</p>
        )}
      </article>
    </section>
  );
}
