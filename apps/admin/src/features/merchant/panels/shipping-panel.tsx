import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
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
  CircularProgress,
  Grid,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import type { MerchantRequester } from '../merchant-dashboard.types';
import type { ShippingZone } from '../types';

interface ShippingPanelProps {
  request: MerchantRequester;
}

const emptyForm = {
  name: '',
  city: '',
  area: '',
  fee: '0',
  isActive: true,
};

export function ShippingPanel({ request }: ShippingPanelProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadZones().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadZones(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<ShippingZone[]>('/shipping-zones', { method: 'GET' });
      setZones(data ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ظ…ظ†ط§ط·ظ‚ ط§ظ„ط´ط­ظ†', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedId('');
    setForm(emptyForm);
    setMessage({ text: '', type: 'info' });
    setViewMode('detail');
  }

  function handleBackToList() {
    setViewMode('list');
    setMessage({ text: '', type: 'info' });
  }

  async function createZone(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request('/shipping-zones', {
        method: 'POST',
        body: JSON.stringify(buildPayload(form)),
      });
      setForm(emptyForm);
      await loadZones();
      setMessage({ text: 'طھظ… ط¥ظ†ط´ط§ط، ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ† ط¨ظ†ط¬ط§ط­', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط¥ظ†ط´ط§ط، ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ†', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateZone(): Promise<void> {
    if (!selectedId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/shipping-zones/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      });
      await loadZones();
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ† ط¨ظ†ط¬ط§ط­', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ†', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteZone(): Promise<void> {
    if (!selectedId || !window.confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ† ظ‡ط°ظ‡طں')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/shipping-zones/${selectedId}`, { method: 'DELETE' });
      setSelectedId('');
      setForm(emptyForm);
      await loadZones();
      setMessage({ text: 'طھظ… ط­ط°ظپ ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ† ط¨ظ†ط¬ط§ط­', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط­ط°ظپ ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ†', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function selectZone(zone: ShippingZone): void {
    setSelectedId(zone.id);
    setForm({
      name: zone.name,
      city: zone.city ?? '',
      area: zone.area ?? '',
      fee: String(zone.fee),
      isActive: zone.isActive,
    });
    setViewMode('detail');
  }

  if (viewMode === 'detail') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Button 
            startIcon={<ArrowForwardIcon />} 
            onClick={handleBackToList}
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…ظ†ط§ط·ظ‚
          </Button>
          {selectedId && (
            <Button 
              color="error" 
              startIcon={<DeleteOutlineIcon />}
              onClick={() => deleteZone().catch(() => undefined)}
              disabled={actionLoading}
            >
              ط­ط°ظپ ط§ظ„ظ…ظ†ط·ظ‚ط©
            </Button>
          )}
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
        )}

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <LocalShippingIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>
              {selectedId ? 'طھط¹ط¯ظٹظ„ ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ†' : 'ط¥ط¶ط§ظپط© ظ…ظ†ط·ظ‚ط© ط´ط­ظ† ط¬ط¯ظٹط¯ط©'}
            </Typography>
          </Box>
          <Divider sx={{ mb: 4 }} />
          
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="ط§ط³ظ… ط§ظ„ظ…ظ†ط·ظ‚ط© ط§ظ„طھط³ظˆظٹظ‚ظٹ" 
                  fullWidth 
                  value={form.name} 
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} 
                  placeholder="ظ…ط«ط§ظ„: طھظˆطµظٹظ„ ط¯ط§ط®ظ„ ط§ظ„ط±ظٹط§ط¶"
                  required
                />
              </Box>
              <Box>
                <TextField 
                  label="ط±ط³ظˆظ… ط§ظ„ط´ط­ظ†" 
                  type="number" 
                  inputProps={{ min: 0, step: 0.01 }} 
                  fullWidth 
                  value={form.fee} 
                  onChange={(event) => setForm((prev) => ({ ...prev, fee: event.target.value }))} 
                  required
                />
              </Box>
            </Box>

            <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط§ط³طھظ‡ط¯ط§ظپ ط§ظ„ط¬ط؛ط±ط§ظپظٹ (ط§ط®طھظٹط§ط±ظٹ)</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="ط§ظ„ظ…ط¯ظٹظ†ط©" 
                  fullWidth 
                  value={form.city} 
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} 
                  placeholder="ظ…ط«ط§ظ„: ط§ظ„ط±ظٹط§ط¶"
                  helperText="ط¥ط°ط§ طھط±ظƒطھ ظپط§ط±ط؛ط§ظ‹ ط³طھط´ظ…ظ„ ظƒط§ظپط© ط§ظ„ظ…ط¯ظ†"
                />
              </Box>
              <Box>
                <TextField 
                  label="ط§ظ„ط­ظٹ / ط§ظ„ظ…ظ†ط·ظ‚ط©" 
                  fullWidth 
                  value={form.area} 
                  onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} 
                  placeholder="ظ…ط«ط§ظ„: ط­ظٹ ط§ظ„ط¹ظ„ظٹط§"
                />
              </Box>
            </Box>

            <FormControlLabel 
              control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} 
              label={<Typography fontWeight={600}>ط§ظ„ظ…ظ†ط·ظ‚ط© ظ…طھط§ط­ط© ظ„ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ط¢ظ†</Typography>} 
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => (selectedId ? updateZone() : createZone()).catch(() => undefined)}
                disabled={actionLoading}
                sx={{ px: 4, borderRadius: 2 }}
              >
                {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸...' : selectedId ? 'ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ' : 'ط¥ط¶ط§ظپط© ط§ظ„ظ…ظ†ط·ظ‚ط©'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            ظ…ظ†ط§ط·ظ‚ ظˆطھظƒط§ظ„ظٹظپ ط§ظ„ط´ط­ظ†
          </Typography>
          <Typography color="text.secondary">
            ط­ط¯ط¯ ط§ظ„ظ…ظ†ط§ط·ظ‚ ط§ظ„طھظٹ طھط´ط­ظ† ط¥ظ„ظٹظ‡ط§ ظˆطھظƒظ„ظپط© ط§ظ„ط´ط­ظ† ظ„ظƒظ„ ظ…ط¯ظٹظ†ط© ط£ظˆ ط­ظٹ.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadZones().catch(() => undefined)}
            disabled={loading}
          >
            طھط­ط¯ظٹط«
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleCreateNew}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            ط¥ط¶ط§ظپط© ظ…ظ†ط·ظ‚ط©
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ط§ط³ظ… ط§ظ„ظ…ظ†ط·ظ‚ط©</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط§ط³طھظ‡ط¯ط§ظپ (ظ…ط¯ظٹظ†ط©/ط­ظٹ)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط±ط³ظˆظ…</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط­ط§ظ„ط©</TableCell>
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
              ) : zones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ظ…ظ†ط§ط·ظ‚ ط´ط­ظ† ظ…ط¶ط§ظپط©.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700 }}>{zone.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {zone.city ?? 'ظƒط§ظپط© ط§ظ„ظ…ط¯ظ†'} {zone.area ? ` / ${zone.area}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color="primary.main">{zone.fee} ط±.ط³</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={zone.isActive ? 'ظ…طھط§ط­' : 'ظ…طھظˆظ‚ظپ'} 
                        color={zone.isActive ? 'success' : 'default'} 
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<EditNoteIcon />}
                        onClick={() => selectZone(zone)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        طھط¹ط¯ظٹظ„
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

function buildPayload(form: {
  name: string;
  city: string;
  area: string;
  fee: string;
  isActive: boolean;
}) {
  const payload: {
    name: string;
    city?: string;
    area?: string;
    fee: number;
    isActive: boolean;
  } = {
    name: form.name.trim(),
    fee: Number(form.fee || '0'),
    isActive: form.isActive,
  };

  const city = form.city.trim();
  const area = form.area.trim();
  if (city) {
    payload.city = city;
  }
  if (area) {
    payload.area = area;
  }

  return payload;
}