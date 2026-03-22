import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import type { MerchantRequester } from '../merchant-dashboard';
import type { PaymentWithOrder, PaymentStatus } from '../types';

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
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [payments, setPayments] = useState<PaymentWithOrder[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithOrder | null>(null);
  
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingPayments().catch(() => undefined);
    } else {
      loadAllPayments().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadPendingPayments(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<PaymentWithOrder[]>('/payments/pending-review', { method: 'GET' });
      setPayments(data ?? []);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر تحميل المدفوعات', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function loadAllPayments(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<PaymentWithOrder[]>('/payments', { method: 'GET' });
      setPayments(data ?? []);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر تحميل المدفوعات', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function approvePayment(): Promise<void> {
    if (!selectedPayment) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      await request(`/payments/${selectedPayment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'approved',
          reviewNote: reviewNote.trim() || undefined,
        }),
      });
      setMessage({ text: 'تم اعتماد الدفعة بنجاح', type: 'success' });
      setViewMode('list');
      await (activeTab === 'pending' ? loadPendingPayments() : loadAllPayments());
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر اعتماد الدفعة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectPayment(): Promise<void> {
    if (!selectedPayment) return;
    
    if (!reviewNote.trim()) {
      setMessage({ text: 'سبب الرفض مطلوب لإعلام العميل.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      await request(`/payments/${selectedPayment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          reviewNote: reviewNote.trim(),
        }),
      });
      setMessage({ text: 'تم رفض الدفعة بنجاح', type: 'success' });
      setViewMode('list');
      await (activeTab === 'pending' ? loadPendingPayments() : loadAllPayments());
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر رفض الدفعة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function selectPayment(payment: PaymentWithOrder): void {
    setSelectedPayment(payment);
    setReviewNote(payment.reviewNote ?? '');
    setMessage({ text: '', type: 'info' });
    setViewMode('detail');
  }

  function handleBackToList() {
    setViewMode('list');
    setMessage({ text: '', type: 'info' });
  }

  if (viewMode === 'detail' && selectedPayment) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 900, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Button 
            startIcon={<ArrowForwardIcon />} 
            onClick={handleBackToList}
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            العودة للمدفوعات
          </Button>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, gap: 3 }}>
          {/* Payment Info */}
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <ReceiptIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>معلومات الدفعة</Typography>
            </Box>
            <Divider sx={{ mb: 4 }} />
            
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">رقم الطلب المرتبط</Typography>
                <Typography fontWeight={700} fontFamily="monospace">{selectedPayment.orderCode}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">المبلغ</Typography>
                <Typography fontWeight={800} color="primary.main">{selectedPayment.amount} ر.س</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">طريقة الدفع</Typography>
                <Typography fontWeight={600}>{selectedPayment.method === 'transfer' ? 'حوالة بنكية' : 'دفع عند الاستلام'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary">حالة الدفعة</Typography>
                <Chip size="small" label={statusLabels[selectedPayment.status]} color={statusColors[selectedPayment.status]} sx={{ fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">تاريخ رفع الإيصال</Typography>
                <Typography variant="body2" dir="ltr">
                  {selectedPayment.customerUploadedAt ? new Date(selectedPayment.customerUploadedAt).toLocaleString('ar-EG') : 'غير متوفر'}
                </Typography>
              </Box>

              {selectedPayment.receiptUrl && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'primary.main', textAlign: 'center' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>إيصال التحويل المرفق</Typography>
                  <Button component="a" href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" variant="contained" disableElevation>
                    عرض الإيصال
                  </Button>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Action / Review */}
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.50', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <FactCheckIcon color="primary" />
              <Typography variant="h6" fontWeight={800} color="primary.dark">قرار المراجعة</Typography>
            </Box>
            <Divider sx={{ mb: 4, borderColor: 'primary.100' }} />
            
            <Typography variant="body2" color="text.secondary" mb={3}>
              راجع الإيصال المرفق والمبلغ ثم اتخذ قرارك باعتماد الدفعة أو رفضها.
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="ملاحظة المراجعة"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="أضف ملاحظة (مطلوبة عند الرفض)"
                multiline
                rows={4}
                fullWidth
                sx={{ bgcolor: 'background.paper' }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={() => approvePayment().catch(() => undefined)} 
                  disabled={actionLoading || selectedPayment.status === 'approved'}
                  disableElevation
                  fullWidth
                >
                  اعتماد الدفعة
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={() => rejectPayment().catch(() => undefined)} 
                  disabled={actionLoading || selectedPayment.status === 'rejected'}
                  disableElevation
                  fullWidth
                >
                  رفض الدفعة
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            المدفوعات والحوالات
          </Typography>
          <Typography color="text.secondary">
            راجع إيصالات التحويل البنكي الواردة من العملاء واعتمدها لتأكيد الطلبات.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => (activeTab === 'pending' ? loadPendingPayments() : loadAllPayments()).catch(() => undefined)}
          disabled={loading}
        >
          تحديث القائمة
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {/* Tabs */}
      <Stack direction="row" spacing={1} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Button 
          variant={activeTab === 'pending' ? 'contained' : 'text'} 
          color={activeTab === 'pending' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('pending')}
          startIcon={<VerifiedUserIcon />}
          sx={{ borderRadius: 999, px: 3 }}
          disableElevation
        >
          قيد المراجعة
        </Button>
        <Button 
          variant={activeTab === 'all' ? 'contained' : 'text'} 
          color={activeTab === 'all' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('all')}
          startIcon={<PaymentsIcon />}
          sx={{ borderRadius: 999, px: 3 }}
          disableElevation
        >
          كل المدفوعات
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>رقم الطلب</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>تاريخ الرفع</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>المبلغ والطريقة</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>حالة الدفع</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      {activeTab === 'pending' ? 'لا توجد مدفوعات بانتظار المراجعة حالياً.' : 'لا توجد مدفوعات مسجلة.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography fontWeight={700} fontFamily="monospace">
                        {payment.orderCode}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        الطلب: {payment.orderStatus}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" dir="ltr" align="right">
                        {payment.customerUploadedAt ? new Date(payment.customerUploadedAt).toLocaleDateString('ar-EG') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{payment.amount} ر.س</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.method === 'transfer' ? 'حوالة بنكية' : 'أخرى'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={statusLabels[payment.status]} 
                        color={statusColors[payment.status]} 
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => selectPayment(payment)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        {payment.status === 'under_review' || payment.status === 'pending' ? 'مراجعة' : 'تفاصيل'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}