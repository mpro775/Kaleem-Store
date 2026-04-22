import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type {
  NotificationPreference,
  NotificationsInboxResponse,
} from '../types';
import { AppPage, DataTableWrapper, FilterBar, PageHeader } from '../components/ui';

interface NotificationsCenterPanelProps {
  request: MerchantRequester;
}

const FREQUENCY_OPTIONS: Array<'instant' | 'daily_digest' | 'mute'> = [
  'instant',
  'daily_digest',
  'mute',
];

export function NotificationsCenterPanel({ request }: NotificationsCenterPanelProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inbox, setInbox] = useState<NotificationsInboxResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadData().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData(): Promise<void> {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        unreadOnly: unreadOnly ? 'true' : 'false',
      });
      if (typeFilter.trim()) params.set('type', typeFilter.trim());

      const [inboxResponse, prefsResponse] = await Promise.all([
        request<NotificationsInboxResponse>(`/notifications/inbox?${params.toString()}`, { method: 'GET' }),
        request<NotificationPreference[]>('/notifications/preferences', { method: 'GET' }),
      ]);

      setInbox(inboxResponse ?? { items: [], total: 0, page: 1, limit: 20 });
      setPreferences(prefsResponse ?? []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load notifications center',
      });
    } finally {
      setLoading(false);
    }
  }

  async function markRead(notificationId: string): Promise<void> {
    setSaving(true);
    setMessage(null);
    try {
      await request(`/notifications/${notificationId}/read`, { method: 'PATCH' });
      await loadData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to mark notification as read',
      });
    } finally {
      setSaving(false);
    }
  }

  async function markAllRead(): Promise<void> {
    setSaving(true);
    setMessage(null);
    try {
      await request('/notifications/read-all', { method: 'PATCH' });
      await loadData();
      setMessage({ type: 'success', text: 'All notifications marked as read.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      });
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences(): Promise<void> {
    setSaving(true);
    setMessage(null);
    try {
      await request('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          preferences: preferences.map((item) => ({
            eventType: item.eventType,
            channel: item.channel,
            isEnabled: item.isEnabled,
            frequency: item.frequency,
            target: item.recipientType === 'store_user' ? 'store_user' : 'store',
          })),
        }),
      });
      setMessage({ type: 'success', text: 'Preferences saved.' });
      await loadData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save preferences',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppPage maxWidth={1300}>
      <PageHeader
        title="مركز الإشعارات"
        description="إدارة صندوق الإشعارات وتفضيلات القنوات والتكرار."
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => loadData().catch(() => undefined)} disabled={loading || saving}>
              Refresh
            </Button>
            <Button variant="outlined" onClick={() => markAllRead().catch(() => undefined)} disabled={saving}>
              Mark All Read
            </Button>
          </Stack>
        }
      />

      {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <FilterBar>
        <TextField
          label="Type filter"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          sx={{ minWidth: 240 }}
        />
        <FormControlLabel
          control={<Switch checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />}
          label="Unread only"
        />
        <Button variant="contained" onClick={() => loadData().catch(() => undefined)} disabled={loading}>
          Apply
        </Button>
      </FilterBar>

      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2}>
        <Box sx={{ flex: 1.2 }}>
          <DataTableWrapper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="left">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center"><CircularProgress size={22} /></TableCell>
                    </TableRow>
                  ) : inbox.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No notifications found.</TableCell>
                    </TableRow>
                  ) : (
                    inbox.items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography fontWeight={700}>{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.body}</Typography>
                        </TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={item.status}
                            color={item.status === 'unread' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                        <TableCell align="left">
                          {item.status === 'unread' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => markRead(item.id).catch(() => undefined)}
                              disabled={saving}
                            >
                              Mark Read
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Read</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DataTableWrapper>
        </Box>

        <Box sx={{ flex: 1 }}>
          <DataTableWrapper>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Notification Preferences
              </Typography>
              {preferences.length === 0 ? (
                <Typography color="text.secondary">No preferences configured yet.</Typography>
              ) : (
                <Stack spacing={1.2}>
                  {preferences.map((item, index) => (
                    <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.2 }}>
                      <Typography fontWeight={700}>{item.eventType}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.channel} • {item.recipientType}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={item.isEnabled}
                              onChange={(event) =>
                                setPreferences((prev) =>
                                  prev.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, isEnabled: event.target.checked }
                                      : entry,
                                  ),
                                )
                              }
                            />
                          }
                          label="Enabled"
                        />
                        <TextField
                          select
                          size="small"
                          value={item.frequency}
                          onChange={(event) =>
                            setPreferences((prev) =>
                              prev.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? {
                                      ...entry,
                                      frequency: event.target.value as 'instant' | 'daily_digest' | 'mute',
                                    }
                                  : entry,
                              ),
                            )
                          }
                          sx={{ minWidth: 160 }}
                        >
                          {FREQUENCY_OPTIONS.map((frequency) => (
                            <MenuItem key={frequency} value={frequency}>{frequency}</MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
              <Button
                variant="contained"
                sx={{ mt: 1.5 }}
                onClick={() => savePreferences().catch(() => undefined)}
                disabled={saving}
              >
                Save Preferences
              </Button>
            </Box>
          </DataTableWrapper>
        </Box>
      </Stack>
    </AppPage>
  );
}
