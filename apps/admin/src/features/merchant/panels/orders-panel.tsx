import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
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
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditNoteIcon from '@mui/icons-material/EditNote';
import type { MerchantRequester } from '../merchant-dashboard.types';
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

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  new: 'info',
  confirmed: 'primary',
  preparing: 'warning',
  out_for_delivery: 'secondary',
  completed: 'success',
  cancelled: 'error',
  returned: 'error',
};

const statusLabels: Record<string, string> = {
  new: 'ط¬ط¯ظٹط¯',
  confirmed: 'ظ…ط¤ظƒط¯',
  preparing: 'ظ‚ظٹط¯ ط§ظ„طھط¬ظ‡ظٹط²',
  out_for_delivery: 'ظپظٹ ط§ظ„ط·ط±ظٹظ‚',
  completed: 'ظ…ظƒطھظ…ظ„',
  cancelled: 'ظ…ظ„ط؛ظ‰',
  returned: 'ظ…ط³طھط±ط¬ط¹',
};

export function OrdersPanel({ request }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [nextStatus, setNextStatus] = useState<OrderStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  // Load initial data
  useEffect(() => {
    loadOrders().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrders(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const query = buildOrdersQuery(statusFilter, searchQuery);
      const data = await request<{ items: Order[] }>(`/orders${query}`, { method: 'GET' });
      setOrders(data?.items ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط·ظ„ط¨ط§طھ', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function loadOrderDetail(orderId: string): Promise<void> {
    setDetailLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<OrderDetail>(`/orders/${orderId}`, { method: 'GET' });
      setOrderDetail(data ?? null);
      if (data) {
        setNextStatus(resolveDefaultNextStatus(data.status));
        setStatusNote('');
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ طھظپط§طµظٹظ„ ط§ظ„ط·ظ„ط¨', type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateOrderStatus(): Promise<void> {
    if (!orderDetail) return;

    setMessage({ text: '', type: 'info' });
    try {
      const payload = buildStatusPayload(nextStatus, statusNote);
      const data = await request<OrderDetail>(`/orders/${orderDetail.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (data) {
        setOrderDetail(data);
      }
      await loadOrders(); // Refresh background list
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨ ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨', type: 'error' });
    }
  }

  function handleBackToList() {
    setOrderDetail(null);
    setMessage({ text: '', type: 'info' });
  }

  // --- DETAIL VIEW ---
  if (orderDetail || detailLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 1000, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Button 
            startIcon={<ArrowForwardIcon />} 
            onClick={handleBackToList}
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط·ظ„ط¨ط§طھ
          </Button>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
        )}

        {detailLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress />
          </Box>
        ) : orderDetail ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
            
            {/* Left Column: Order Items & Timeline */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Order Header */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h5" fontWeight={800} gutterBottom>
                      ط·ظ„ط¨ {orderDetail.orderCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،: {new Date(orderDetail.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Chip 
                    label={statusLabels[orderDetail.status] || orderDetail.status} 
                    color={statusColors[orderDetail.status] || 'default'} 
                    sx={{ fontWeight: 700, px: 1, borderRadius: 2 }} 
                  />
                </Stack>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ShoppingBagIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©</Typography>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ظ…ظ†طھط¬</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>ط§ظ„ظƒظ…ظٹط©</TableCell>
                        <TableCell align="left" sx={{ fontWeight: 700 }}>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderDetail.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>{item.title}</Typography>
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="left" sx={{ fontWeight: 700 }}>
                            {item.lineTotal} {orderDetail.currencyCode}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Timeline */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <LocalShippingIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>ط³ط¬ظ„ ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
                  {orderDetail.timeline.map((entry, index) => (
                    <Box key={`${entry.to}-${entry.createdAt}-${index}`} sx={{ display: 'flex', gap: 2, position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', border: '2px solid white', boxShadow: '0 0 0 2px var(--mui-palette-primary-light)' }} />
                        {index < orderDetail.timeline.length - 1 && (
                          <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 1, mb: 1 }} />
                        )}
                      </Box>
                      <Box sx={{ pb: index < orderDetail.timeline.length - 1 ? 2 : 0 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {entry.from ? `${statusLabels[entry.from] || entry.from} â†گ ` : ''} 
                          {statusLabels[entry.to] || entry.to}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          {new Date(entry.createdAt).toLocaleString('ar-EG')}
                        </Typography>
                        {entry.note && (
                          <Typography variant="body2" sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1, mt: 0.5, border: '1px solid', borderColor: 'divider' }}>
                            {entry.note}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* Right Column: Actions & Payment */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Status Update Action */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'primary.main', bgcolor: 'primary.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EditNoteIcon color="primary" />
                  <Typography variant="h6" fontWeight={700} color="primary.dark">طھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط©</Typography>
                </Box>
                
                <Stack spacing={2}>
                  <TextField
                    select
                    label="ط§ظ„ط­ط§ظ„ط© ط§ظ„ط¬ط¯ظٹط¯ط©"
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
                    fullWidth
                    size="small"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {statusLabels[status] || status}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField 
                    label="ظ…ظ„ط§ط­ط¸ط© (ط§ط®طھظٹط§ط±ظٹ)" 
                    value={statusNote} 
                    onChange={(event) => setStatusNote(event.target.value)} 
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => updateOrderStatus().catch(() => undefined)}
                    disableElevation
                  >
                    طھط£ظƒظٹط¯ ط§ظ„طھط­ط¯ظٹط«
                  </Button>
                </Stack>
              </Paper>

              {/* Summary / Payment */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ReceiptLongIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>ظ…ظ„ط®طµ ط§ظ„ط¯ظپط¹</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography color="text.secondary">ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</Typography>
                  <Typography fontWeight={800} variant="h6" color="primary.main">
                    {orderDetail.total} {orderDetail.currencyCode}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {orderDetail.payment ? (
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹:</Typography>
                      <Typography variant="body2" fontWeight={600}>{orderDetail.payment.method}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">ط­ط§ظ„ط© ط§ظ„ط¯ظپط¹:</Typography>
                      <Chip size="small" label={orderDetail.payment.status} color={orderDetail.payment.status === 'paid' ? 'success' : 'warning'} />
                    </Box>
                    {orderDetail.payment.receiptUrl && (
                      <Button 
                        variant="outlined" 
                        size="small"
                        href={orderDetail.payment.receiptUrl} 
                        target="_blank" 
                        sx={{ mt: 1 }}
                      >
                        ط¹ط±ط¶ ط¥ظٹطµط§ظ„ ط§ظ„ط¯ظپط¹
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ط¯ظپط¹ ظ…ط³ط¬ظ„ط©.
                  </Typography>
                )}
              </Paper>

            </Box>
          </Box>
        ) : null}
      </Box>
    );
  }

  // --- LIST VIEW ---
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            ط§ظ„ط·ظ„ط¨ط§طھ
          </Typography>
          <Typography color="text.secondary">
            ط¥ط¯ط§ط±ط© ط¬ظ…ظٹط¹ ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ظˆط§ط±ط¯ط© ظˆطھط­ط¯ظٹط« ط­ط§ظ„ط§طھ ط§ظ„ط´ط­ظ† ظˆط§ظ„طھظˆطµظٹظ„.
          </Typography>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField 
          placeholder="ط§ط¨ط­ط« ط¨ط±ظ…ط² ط§ظ„ط·ظ„ط¨..." 
          value={searchQuery} 
          onChange={(event) => setSearchQuery(event.target.value)} 
          size="small"
          sx={{ minWidth: 240, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField 
          select 
          label="ظپظ„طھط±ط© ط¨ط§ظ„ط­ط§ظ„ط©" 
          value={statusFilter} 
          onChange={(event) => setStatusFilter(event.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FilterListIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="">ط§ظ„ظƒظ„</MenuItem>
          {statusOptions.map((status) => (
            <MenuItem key={status} value={status}>
              {statusLabels[status] || status}
            </MenuItem>
          ))}
        </TextField>
        <Button 
          variant="contained" 
          onClick={() => loadOrders().catch(() => undefined)}
          disableElevation
          sx={{ height: 40 }}
        >
          ط¨ط­ط« ظˆطھط­ط¯ظٹط«
        </Button>
      </Paper>

      {/* Orders Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„طھط§ط±ظٹط®</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط­ط§ظ„ط©</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ظ…ط·ط§ط¨ظ‚ط© ظ„ظ„ط¨ط­ط«.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{order.orderCode}</TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusLabels[order.status] || order.status} 
                        color={statusColors[order.status] || 'default'} 
                        size="small" 
                        sx={{ fontWeight: 700, borderRadius: 1.5 }} 
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {order.total} {order.currencyCode}
                    </TableCell>
                    <TableCell align="left">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => loadOrderDetail(order.id).catch(() => undefined)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        ط¥ط¯ط§ط±ط©
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
  if (current === 'new') return 'confirmed';
  if (current === 'confirmed') return 'preparing';
  if (current === 'preparing') return 'out_for_delivery';
  if (current === 'out_for_delivery') return 'completed';
  return current;
}