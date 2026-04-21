import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { ManagedAbandonedCartListResponse, ManagedAbandonedCartStatus } from '../types';
import { AppPage, DataTableWrapper, FilterBar, PageHeader, StatCard } from '../components/ui';

interface AbandonedCartsPanelProps {
  request: MerchantRequester;
}

const STATUS_OPTIONS: Array<{ value: ManagedAbandonedCartStatus | 'all'; label: string }> = [
  { value: 'all', label: 'ط§ظ„ظƒظ„' },
  { value: 'ready', label: 'ط¬ط§ظ‡ط²ط© ظ„ظ„ط¥ط±ط³ط§ظ„' },
  { value: 'sent', label: 'طھظ… ط§ظ„ط¥ط±ط³ط§ظ„' },
  { value: 'recovered', label: 'طھظ… ط§ظ„ط§ط³طھط±ط¬ط§ط¹' },
  { value: 'expired', label: 'ظ…ظ†طھظ‡ظٹط©' },
];

export function AbandonedCartsPanel({ request }: AbandonedCartsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ManagedAbandonedCartStatus | 'all'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [list, setList] = useState<ManagedAbandonedCartListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 30,
  });

  useEffect(() => {
    loadData().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData(): Promise<void> {
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({ page: '1', limit: '30' });
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await request<ManagedAbandonedCartListResponse>(
        `/customers/manage/abandoned-carts?${params.toString()}`,
        { method: 'GET' },
      );

      setList(
        response ?? {
          items: [],
          total: 0,
          page: 1,
          limit: 30,
        },
      );
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط³ظ„ط§طھ ط§ظ„ظ…طھط±ظˆظƒط©.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function sendRecoveryEmail(abandonedCartId: string): Promise<void> {
    setSendingId(abandonedCartId);
    setMessage(null);
    try {
      await request(`/customers/manage/abandoned-carts/${abandonedCartId}/send-recovery`, {
        method: 'POST',
      });
      setMessage({ type: 'success', text: 'طھظ… ط¥ط±ط³ط§ظ„ ط±ط³ط§ظ„ط© ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ط³ظ„ط© ط¨ظ†ط¬ط§ط­.' });
      await loadData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'ظپط´ظ„ ط¥ط±ط³ط§ظ„ ط±ط³ط§ظ„ط© ط§ظ„ط§ط³طھط±ط¬ط§ط¹.',
      });
    } finally {
      setSendingId(null);
    }
  }

  const readyCount = list.items.filter((item) => item.status === 'ready').length;
  const sentCount = list.items.filter((item) => item.status === 'sent').length;
  const recoveredCount = list.items.filter((item) => item.status === 'recovered').length;

  return (
    <AppPage>
      <PageHeader
        title="ط§ظ„ط³ظ„ط§طھ ط§ظ„ظ…طھط±ظˆظƒط©"
        description="ظ…طھط§ط¨ط¹ط© ط§ظ„ط³ظ„ط§طھ ط§ظ„ظ…ظ‡ط¬ظˆط±ط© ظˆط¥ط±ط³ط§ظ„ طھط°ظƒظٹط±ط§طھ ط§ظ„ط§ط³طھط±ط¬ط§ط¹ ظˆطھطھط¨ط¹ ط§ظ„طھط­ظˆظٹظ„ط§طھ ط¨ط´ظƒظ„ ظ…ط¨ط§ط´ط±."
        actions={
          <Button variant="outlined" onClick={() => loadData().catch(() => undefined)} disabled={loading}>
            طھط­ط¯ظٹط«
          </Button>
        }
      />

      {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard
          title="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ظ„ط§طھ"
          value={list.total.toLocaleString('ar-EG')}
          icon={<ShoppingCartCheckoutOutlinedIcon fontSize="small" />}
        />
        <StatCard
          title="ط¬ط§ظ‡ط²ط© ظ„ظ„ط¥ط±ط³ط§ظ„"
          value={readyCount.toLocaleString('ar-EG')}
          icon={<ReplayOutlinedIcon fontSize="small" />}
        />
        <StatCard
          title="ظ…ط±ط³ظ„ط©"
          value={sentCount.toLocaleString('ar-EG')}
          icon={<MarkEmailReadOutlinedIcon fontSize="small" />}
        />
        <StatCard
          title="ظ…ط³طھط±ط¬ط¹ط©"
          value={recoveredCount.toLocaleString('ar-EG')}
          icon={<ShoppingCartCheckoutOutlinedIcon fontSize="small" />}
        />
      </div>

      <FilterBar>
        <TextField
          placeholder="ط¨ط­ط« ط¨ط§ظ„ط¹ظ…ظٹظ„ ط£ظˆ ط§ظ„ط¨ط±ظٹط¯ ط£ظˆ ط§ظ„ظ‡ط§طھظپ"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          sx={{ minWidth: 260, flex: 1 }}
        />
        <TextField
          select
          label="ط§ظ„ط­ط§ظ„ط©"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ManagedAbandonedCartStatus | 'all')}
          sx={{ minWidth: 190 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={() => loadData().catch(() => undefined)}>
          ط¨ط­ط«
        </Button>
      </FilterBar>

      <DataTableWrapper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ط§ظ„ط¹ظ…ظٹظ„</TableCell>
                <TableCell>ط§ظ„طھظˆط§طµظ„</TableCell>
                <TableCell>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ظ„ط©</TableCell>
                <TableCell>ط§ظ„ط¹ظ†ط§طµط±</TableCell>
                <TableCell>ط§ظ„ط­ط§ظ„ط©</TableCell>
                <TableCell>وقت الهجر</TableCell>
                <TableCell>وقت الإرسال</TableCell>
                <TableCell>وقت الاسترجاع</TableCell>
                <TableCell>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ط³ظ„ط§طھ ظ…طھط±ظˆظƒط© ظ…ط·ط§ط¨ظ‚ط© ظ„ظ„ط¨ط­ط«.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.customerName || 'ط²ط§ط¦ط±'}</TableCell>
                    <TableCell>
                      {item.customerEmail || '-'}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {item.customerPhone || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.cartTotal.toLocaleString('ar-EG', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{item.itemsCount}</TableCell>
                    <TableCell>{statusLabel(item.status)}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleString('ar-EG')}</TableCell>
                    <TableCell>{item.recoverySentAt ? new Date(item.recoverySentAt).toLocaleString('ar-EG') : '-'}</TableCell>
                    <TableCell>{item.recoveredAt ? new Date(item.recoveredAt).toLocaleString('ar-EG') : '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={sendingId === item.id || item.status === 'expired' || item.status === 'recovered'}
                        onClick={() => sendRecoveryEmail(item.id).catch(() => undefined)}
                      >
                        ط¥ط±ط³ط§ظ„ طھط°ظƒظٹط±
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableWrapper>
    </AppPage>
  );
}

function statusLabel(status: ManagedAbandonedCartStatus): string {
  if (status === 'ready') {
    return 'ط¬ط§ظ‡ط²ط© ظ„ظ„ط¥ط±ط³ط§ظ„';
  }
  if (status === 'sent') {
    return 'ظ…ط±ط³ظ„ط©';
  }
  if (status === 'recovered') {
    return 'ظ…ط³طھط±ط¬ط¹ط©';
  }
  return 'ظ…ظ†طھظ‡ظٹط©';
}
