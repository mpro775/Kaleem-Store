import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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

const statusColors: Record<PaymentStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'error',
  refunded: 'default',
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
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">مدفوعات التحويل</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadPendingPayments().catch(() => undefined)}>
            قيد المراجعة
          </Button>
          <Button variant="outlined" onClick={() => loadAllPayments().catch(() => undefined)}>كل المدفوعات</Button>
        </Stack>

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {payments.map((payment) => (
            <Paper key={payment.id} variant="outlined" sx={{ p: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">طلب {payment.orderCode}</Typography>
                <Chip label={statusLabels[payment.status]} color={statusColors[payment.status]} size="small" />
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.4 }}>
                المبلغ: {payment.amount} | الطريقة: {payment.method}
              </Typography>
              <Typography variant="body2">حالة الطلب: {payment.orderStatus}</Typography>
              {payment.receiptUrl && (
                <Typography variant="body2" sx={{ mt: 0.4 }}>
                  <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                    عرض الإيصال
                  </a>
                </Typography>
              )}
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectPayment(payment)}>مراجعة</Button>
            </Paper>
          ))}
          {payments.length === 0 ? (
            <Typography color="text.secondary">لا توجد مدفوعات. اضغط أحد الأزرار بالأعلى للتحميل.</Typography>
          ) : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">مراجعة الدفعة</Typography>
        {selectedPayment ? (
          <>
            <Box>
              <Typography variant="body2">
                <strong>الطلب:</strong> {selectedPayment.orderCode}
              </Typography>
              <Typography variant="body2">
                <strong>المبلغ:</strong> {selectedPayment.amount}
              </Typography>
              <Typography variant="body2">
                <strong>الطريقة:</strong> {selectedPayment.method}
              </Typography>
              <Typography variant="body2">
                <strong>الحالة:</strong>{' '}
                <Chip
                  sx={{ ml: 0.6 }}
                  label={statusLabels[selectedPayment.status]}
                  color={statusColors[selectedPayment.status]}
                  size="small"
                />
              </Typography>
              {selectedPayment.customerUploadedAt && (
                <Typography variant="body2">
                  <strong>تاريخ رفع الإيصال:</strong>{' '}
                  {new Date(selectedPayment.customerUploadedAt).toLocaleString()}
                </Typography>
              )}
            </Box>

            {selectedPayment.receiptUrl && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">الإيصال</Typography>
                <Button component="a" href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" variant="outlined">
                  فتح الإيصال
                </Button>
              </Stack>
            )}

            <TextField
              label="ملاحظة المراجعة"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="أضف ملاحظة (مطلوبة عند الرفض)"
              multiline
              minRows={3}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" onClick={() => approvePayment().catch(() => undefined)}>
                اعتماد
              </Button>
              <Button color="error" variant="outlined" onClick={() => rejectPayment().catch(() => undefined)}>
                رفض
              </Button>
              <Button variant="outlined" onClick={() => setSelectedPayment(null)}>إلغاء</Button>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}
          </>
        ) : (
          <Typography color="text.secondary">اختر دفعة من القائمة للمراجعة.</Typography>
        )}
      </Paper>
    </Box>
  );
}
