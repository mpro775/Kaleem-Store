import { useState } from 'react';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
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
      setMessage('تم تحميل الطلبات');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الطلبات');
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
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل تفاصيل الطلب');
    }
  }

  async function updateOrderStatus(): Promise<void> {
    if (!orderDetail) {
      setMessage('اختر طلباً أولاً');
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
      setMessage('تم تحديث حالة الطلب');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث حالة الطلب');
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">الطلبات</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField select label="الحالة" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <MenuItem value="">كل الحالات</MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="ابحث برمز الطلب" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          <Button variant="outlined" onClick={() => loadOrders().catch(() => undefined)}>تحميل</Button>
        </Stack>

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {orders.map((order) => (
            <Paper key={order.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle1">{order.orderCode}</Typography>
              <Typography variant="body2" sx={{ mt: 0.4 }}>
                {order.status} - {order.total} {order.currencyCode}
              </Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => loadOrderDetail(order.id).catch(() => undefined)}>
                التفاصيل
              </Button>
            </Paper>
          ))}
          {orders.length === 0 ? <Typography color="text.secondary">لا توجد طلبات محملة.</Typography> : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">تفاصيل الطلب</Typography>
        {orderDetail ? (
          <>
            <Typography>
              <strong>{orderDetail.orderCode}</strong> - {orderDetail.status}
            </Typography>
            <Typography>
              الإجمالي: {orderDetail.total} {orderDetail.currencyCode}
            </Typography>

            <TextField
              select
              label="الحالة التالية"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="ملاحظة" value={statusNote} onChange={(event) => setStatusNote(event.target.value)} />
            <Button variant="contained" onClick={() => updateOrderStatus().catch(() => undefined)}>
              تحديث الحالة
            </Button>

            {orderDetail.payment && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 0.6 }}>
                  الدفع
                </Typography>
                <Box>
                  <Typography variant="body2">
                    <strong>الطريقة:</strong> {orderDetail.payment.method}
                  </Typography>
                  <Typography variant="body2">
                    <strong>الحالة:</strong> {orderDetail.payment.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>المبلغ:</strong> {orderDetail.payment.amount}
                  </Typography>
                  {orderDetail.payment.receiptUrl && (
                    <Typography variant="body2">
                      <a
                        href={orderDetail.payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        عرض الإيصال
                      </a>
                    </Typography>
                  )}
                </Box>
              </>
            )}

            <Typography variant="subtitle1" sx={{ mt: 0.6 }}>
              العناصر
            </Typography>
            <Box sx={{ display: 'grid', gap: 0.8 }}>
              {orderDetail.items.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1 }}>
                  <Typography variant="body2">
                    {item.title} x {item.quantity}
                  </Typography>
                  <Typography variant="body2">{item.lineTotal}</Typography>
                </Paper>
              ))}
            </Box>

            <Typography variant="subtitle1" sx={{ mt: 0.6 }}>
              سجل الحالة
            </Typography>
            <Box sx={{ display: 'grid', gap: 0.8 }}>
              {orderDetail.timeline.map((entry, index) => (
                <Paper key={`${entry.to}-${entry.createdAt}-${index}`} variant="outlined" sx={{ p: 1 }}>
                  <Typography variant="body2">
                    {entry.from ?? 'لا يوجد'} {'->'} {entry.to}
                  </Typography>
                  <Typography variant="body2">{entry.note ?? 'بدون ملاحظة'}</Typography>
                </Paper>
              ))}
            </Box>
          </>
        ) : (
          <Typography color="text.secondary">اختر طلباً لعرض التفاصيل.</Typography>
        )}
      </Paper>

      {message ? <Alert severity="info">{message}</Alert> : null}
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
