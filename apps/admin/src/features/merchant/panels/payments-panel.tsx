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

import type { MerchantRequester } from '../merchant-dashboard.types';
import type { PaymentWithOrder, PaymentStatus } from '../types';

interface PaymentsPanelProps {
  request: MerchantRequester;
}

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±',
  under_review: 'ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©',
  approved: 'ظ…ظ‚ط¨ظˆظ„',
  rejected: 'ظ…ط±ظپظˆط¶',
  refunded: 'ظ…ط³طھط±ط¬ط¹',
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
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ط¯ظپظˆط¹ط§طھ', type: 'error' });
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
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ط¯ظپظˆط¹ط§طھ', type: 'error' });
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
      setMessage({ text: 'طھظ… ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¯ظپط¹ط© ط¨ظ†ط¬ط§ط­', type: 'success' });
      setViewMode('list');
      await (activeTab === 'pending' ? loadPendingPayments() : loadAllPayments());
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¯ظپط¹ط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectPayment(): Promise<void> {
    if (!selectedPayment) return;
    
    if (!reviewNote.trim()) {
      setMessage({ text: 'ط³ط¨ط¨ ط§ظ„ط±ظپط¶ ظ…ط·ظ„ظˆط¨ ظ„ط¥ط¹ظ„ط§ظ… ط§ظ„ط¹ظ…ظٹظ„.', type: 'error' });
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
      setMessage({ text: 'طھظ… ط±ظپط¶ ط§ظ„ط¯ظپط¹ط© ط¨ظ†ط¬ط§ط­', type: 'success' });
      setViewMode('list');
      await (activeTab === 'pending' ? loadPendingPayments() : loadAllPayments());
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± ط±ظپط¶ ط§ظ„ط¯ظپط¹ط©', type: 'error' });
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
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…ط¯ظپظˆط¹ط§طھ
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
              <Typography variant="h6" fontWeight={800}>ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¯ظپط¹ط©</Typography>
            </Box>
            <Divider sx={{ mb: 4 }} />
            
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨ ط§ظ„ظ…ط±طھط¨ط·</Typography>
                <Typography fontWeight={700} fontFamily="monospace">{selectedPayment.orderCode}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">ط§ظ„ظ…ط¨ظ„ط؛</Typography>
                <Typography fontWeight={800} color="primary.main">{selectedPayment.amount} ط±.ط³</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹</Typography>
                <Typography fontWeight={600}>{selectedPayment.method === 'transfer' ? 'ط­ظˆط§ظ„ط© ط¨ظ†ظƒظٹط©' : 'ط¯ظپط¹ ط¹ظ†ط¯ ط§ظ„ط§ط³طھظ„ط§ظ…'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary">ط­ط§ظ„ط© ط§ظ„ط¯ظپط¹ط©</Typography>
                <Chip size="small" label={statusLabels[selectedPayment.status]} color={statusColors[selectedPayment.status]} sx={{ fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">طھط§ط±ظٹط® ط±ظپط¹ ط§ظ„ط¥ظٹطµط§ظ„</Typography>
                <Typography variant="body2" dir="ltr">
                  {selectedPayment.customerUploadedAt ? new Date(selectedPayment.customerUploadedAt).toLocaleString('ar-EG') : 'ط؛ظٹط± ظ…طھظˆظپط±'}
                </Typography>
              </Box>

              {selectedPayment.receiptUrl && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'primary.main', textAlign: 'center' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>ط¥ظٹطµط§ظ„ ط§ظ„طھط­ظˆظٹظ„ ط§ظ„ظ…ط±ظپظ‚</Typography>
                  <Button component="a" href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" variant="contained" disableElevation>
                    ط¹ط±ط¶ ط§ظ„ط¥ظٹطµط§ظ„
                  </Button>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Action / Review */}
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.50', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <FactCheckIcon color="primary" />
              <Typography variant="h6" fontWeight={800} color="primary.dark">ظ‚ط±ط§ط± ط§ظ„ظ…ط±ط§ط¬ط¹ط©</Typography>
            </Box>
            <Divider sx={{ mb: 4, borderColor: 'primary.100' }} />
            
            <Typography variant="body2" color="text.secondary" mb={3}>
              ط±ط§ط¬ط¹ ط§ظ„ط¥ظٹطµط§ظ„ ط§ظ„ظ…ط±ظپظ‚ ظˆط§ظ„ظ…ط¨ظ„ط؛ ط«ظ… ط§طھط®ط° ظ‚ط±ط§ط±ظƒ ط¨ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¯ظپط¹ط© ط£ظˆ ط±ظپط¶ظ‡ط§.
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="ظ…ظ„ط§ط­ط¸ط© ط§ظ„ظ…ط±ط§ط¬ط¹ط©"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="ط£ط¶ظپ ظ…ظ„ط§ط­ط¸ط© (ظ…ط·ظ„ظˆط¨ط© ط¹ظ†ط¯ ط§ظ„ط±ظپط¶)"
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
                  ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¯ظپط¹ط©
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={() => rejectPayment().catch(() => undefined)} 
                  disabled={actionLoading || selectedPayment.status === 'rejected'}
                  disableElevation
                  fullWidth
                >
                  ط±ظپط¶ ط§ظ„ط¯ظپط¹ط©
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
            ط§ظ„ظ…ط¯ظپظˆط¹ط§طھ ظˆط§ظ„ط­ظˆط§ظ„ط§طھ
          </Typography>
          <Typography color="text.secondary">
            ط±ط§ط¬ط¹ ط¥ظٹطµط§ظ„ط§طھ ط§ظ„طھط­ظˆظٹظ„ ط§ظ„ط¨ظ†ظƒظٹ ط§ظ„ظˆط§ط±ط¯ط© ظ…ظ† ط§ظ„ط¹ظ…ظ„ط§ط، ظˆط§ط¹طھظ…ط¯ظ‡ط§ ظ„طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨ط§طھ.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => (activeTab === 'pending' ? loadPendingPayments() : loadAllPayments()).catch(() => undefined)}
          disabled={loading}
        >
          طھط­ط¯ظٹط« ط§ظ„ظ‚ط§ط¦ظ…ط©
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
          ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©
        </Button>
        <Button 
          variant={activeTab === 'all' ? 'contained' : 'text'} 
          color={activeTab === 'all' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('all')}
          startIcon={<PaymentsIcon />}
          sx={{ borderRadius: 999, px: 3 }}
          disableElevation
        >
          ظƒظ„ ط§ظ„ظ…ط¯ظپظˆط¹ط§طھ
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>طھط§ط±ظٹط® ط§ظ„ط±ظپط¹</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ظ…ط¨ظ„ط؛ ظˆط§ظ„ط·ط±ظٹظ‚ط©</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط­ط§ظ„ط© ط§ظ„ط¯ظپط¹</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      {activeTab === 'pending' ? 'ظ„ط§ طھظˆط¬ط¯ ظ…ط¯ظپظˆط¹ط§طھ ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط­ط§ظ„ظٹط§ظ‹.' : 'ظ„ط§ طھظˆط¬ط¯ ظ…ط¯ظپظˆط¹ط§طھ ظ…ط³ط¬ظ„ط©.'}
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
                        ط§ظ„ط·ظ„ط¨: {payment.orderStatus}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" dir="ltr" align="right">
                        {payment.customerUploadedAt ? new Date(payment.customerUploadedAt).toLocaleDateString('ar-EG') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{payment.amount} ط±.ط³</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.method === 'transfer' ? 'ط­ظˆط§ظ„ط© ط¨ظ†ظƒظٹط©' : 'ط£ط®ط±ظ‰'}
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
                        {payment.status === 'under_review' || payment.status === 'pending' ? 'ظ…ط±ط§ط¬ط¹ط©' : 'طھظپط§طµظٹظ„'}
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