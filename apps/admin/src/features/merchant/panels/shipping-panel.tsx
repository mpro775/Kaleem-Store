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
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل مناطق الشحن', type: 'error' });
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
      setMessage({ text: 'تم إنشاء منطقة الشحن بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إنشاء منطقة الشحن', type: 'error' });
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
      setMessage({ text: 'تم تحديث منطقة الشحن بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث منطقة الشحن', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteZone(): Promise<void> {
    if (!selectedId || !window.confirm('هل أنت متأكد من حذف منطقة الشحن هذه؟')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/shipping-zones/${selectedId}`, { method: 'DELETE' });
      setSelectedId('');
      setForm(emptyForm);
      await loadZones();
      setMessage({ text: 'تم حذف منطقة الشحن بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حذف منطقة الشحن', type: 'error' });
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
            العودة للمناطق
          </Button>
          {selectedId && (
            <Button 
              color="error" 
              startIcon={<DeleteOutlineIcon />}
              onClick={() => deleteZone().catch(() => undefined)}
              disabled={actionLoading}
            >
              حذف المنطقة
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
              {selectedId ? 'تعديل منطقة الشحن' : 'إضافة منطقة شحن جديدة'}
            </Typography>
          </Box>
          <Divider sx={{ mb: 4 }} />
          
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="اسم المنطقة التسويقي" 
                  fullWidth 
                  value={form.name} 
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} 
                  placeholder="مثال: توصيل داخل الرياض"
                  required
                />
              </Box>
              <Box>
                <TextField 
                  label="رسوم الشحن" 
                  type="number" 
                  inputProps={{ min: 0, step: 0.01 }} 
                  fullWidth 
                  value={form.fee} 
                  onChange={(event) => setForm((prev) => ({ ...prev, fee: event.target.value }))} 
                  required
                />
              </Box>
            </Box>

            <Typography variant="subtitle2" fontWeight={700}>الاستهداف الجغرافي (اختياري)</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="المدينة" 
                  fullWidth 
                  value={form.city} 
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} 
                  placeholder="مثال: الرياض"
                  helperText="إذا تركت فارغاً ستشمل كافة المدن"
                />
              </Box>
              <Box>
                <TextField 
                  label="الحي / المنطقة" 
                  fullWidth 
                  value={form.area} 
                  onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} 
                  placeholder="مثال: حي العليا"
                />
              </Box>
            </Box>

            <FormControlLabel 
              control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} 
              label={<Typography fontWeight={600}>المنطقة متاحة للعملاء الآن</Typography>} 
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => (selectedId ? updateZone() : createZone()).catch(() => undefined)}
                disabled={actionLoading}
                sx={{ px: 4, borderRadius: 2 }}
              >
                {actionLoading ? 'جارِ الحفظ...' : selectedId ? 'حفظ التعديلات' : 'إضافة المنطقة'}
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
            مناطق وتكاليف الشحن
          </Typography>
          <Typography color="text.secondary">
            حدد المناطق التي تشحن إليها وتكلفة الشحن لكل مدينة أو حي.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadZones().catch(() => undefined)}
            disabled={loading}
          >
            تحديث
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleCreateNew}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            إضافة منطقة
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
                <TableCell sx={{ fontWeight: 700 }}>اسم المنطقة</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>الاستهداف (مدينة/حي)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>الرسوم</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>الإجراءات</TableCell>
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
                    <Typography color="text.secondary">لا توجد مناطق شحن مضافة.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700 }}>{zone.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {zone.city ?? 'كافة المدن'} {zone.area ? ` / ${zone.area}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color="primary.main">{zone.fee} ر.س</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={zone.isActive ? 'متاح' : 'متوقف'} 
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
                        تعديل
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