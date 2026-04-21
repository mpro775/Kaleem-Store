import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TuneIcon from '@mui/icons-material/Tune';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { Filter, FilterType, FilterValue } from '../types';

interface FiltersPanelProps {
  request: MerchantRequester;
}

const filterFormDefault = {
  nameAr: '',
  nameEn: '',
  slug: '',
  type: 'checkbox' as FilterType,
  sortOrder: '0',
  isActive: true,
};

const valueFormDefault = {
  valueAr: '',
  valueEn: '',
  slug: '',
  colorHex: '',
  sortOrder: '0',
  isActive: true,
};

export function FiltersPanel({ request }: FiltersPanelProps) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState('');
  const [selectedValueId, setSelectedValueId] = useState('');
  const [filterForm, setFilterForm] = useState(filterFormDefault);
  const [valueForm, setValueForm] = useState(valueFormDefault);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  const selectedFilter = useMemo(
    () => filters.find((item) => item.id === selectedFilterId) ?? null,
    [filters, selectedFilterId],
  );

  useEffect(() => {
    void loadFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFilters(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<Filter[]>('/filters?includeValues=true', { method: 'GET' });
      setFilters(data ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل الفلاتر', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function prepareNewFilter(): void {
    setSelectedFilterId('');
    setSelectedValueId('');
    setFilterForm(filterFormDefault);
    setValueForm(valueFormDefault);
    setMessage({ text: '', type: 'info' });
  }

  function selectFilter(filter: Filter): void {
    setSelectedFilterId(filter.id);
    setSelectedValueId('');
    setFilterForm({
      nameAr: filter.nameAr,
      nameEn: filter.nameEn,
      slug: filter.slug,
      type: filter.type,
      sortOrder: String(filter.sortOrder),
      isActive: filter.isActive,
    });
    setValueForm(valueFormDefault);
  }

  function selectValue(value: FilterValue): void {
    setSelectedValueId(value.id);
    setValueForm({
      valueAr: value.valueAr,
      valueEn: value.valueEn,
      slug: value.slug,
      colorHex: value.colorHex ?? '',
      sortOrder: String(value.sortOrder),
      isActive: value.isActive,
    });
  }

  async function saveFilter(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const payload = {
        nameAr: filterForm.nameAr.trim(),
        nameEn: filterForm.nameEn.trim(),
        type: filterForm.type,
        sortOrder: Number(filterForm.sortOrder || '0'),
        isActive: filterForm.isActive,
        ...(filterForm.slug.trim() ? { slug: filterForm.slug.trim() } : {}),
      };

      if (selectedFilterId) {
        await request(`/filters/${selectedFilterId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await request<Filter>('/filters', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (created) {
          setSelectedFilterId(created.id);
        }
      }

      await loadFilters();
      setMessage({ text: 'تم حفظ الفلتر بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حفظ الفلتر', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteFilter(): Promise<void> {
    if (!selectedFilterId || !window.confirm('تأكيد حذف الفلتر؟')) {
      return;
    }
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/filters/${selectedFilterId}`, { method: 'DELETE' });
      prepareNewFilter();
      await loadFilters();
      setMessage({ text: 'تم حذف الفلتر', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حذف الفلتر', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveValue(): Promise<void> {
    if (!selectedFilterId) {
      setMessage({ text: 'احفظ الفلتر أولاً', type: 'error' });
      return;
    }
    if (selectedFilter?.type === 'range') {
      setMessage({ text: 'فلتر النطاق لا يدعم قيماً ثابتة', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const payload = {
        valueAr: valueForm.valueAr.trim(),
        valueEn: valueForm.valueEn.trim(),
        sortOrder: Number(valueForm.sortOrder || '0'),
        isActive: valueForm.isActive,
        ...(valueForm.slug.trim() ? { slug: valueForm.slug.trim() } : {}),
        ...(selectedFilter?.type === 'color' && valueForm.colorHex.trim()
          ? { colorHex: valueForm.colorHex.trim() }
          : {}),
      };

      if (selectedValueId) {
        await request(`/filters/${selectedFilterId}/values/${selectedValueId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await request(`/filters/${selectedFilterId}/values`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setSelectedValueId('');
      setValueForm(valueFormDefault);
      await loadFilters();
      setMessage({ text: 'تم حفظ قيمة الفلتر', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حفظ القيمة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteValue(valueId: string): Promise<void> {
    if (!selectedFilterId || !window.confirm('تأكيد حذف القيمة؟')) {
      return;
    }
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/filters/${selectedFilterId}/values/${valueId}`, { method: 'DELETE' });
      setSelectedValueId('');
      setValueForm(valueFormDefault);
      await loadFilters();
      setMessage({ text: 'تم حذف القيمة', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حذف القيمة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>إدارة فلاتر المنتجات</Typography>
          <Typography color="text.secondary">إضافة وإدارة الفلاتر وقيمها حسب النوع.</Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={prepareNewFilter}>
          فلتر جديد
        </Button>
      </Box>

      {message.text ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            select
            label="فلتر موجود"
            value={selectedFilterId}
            onChange={(event) => {
              const target = filters.find((item) => item.id === event.target.value);
              if (target) {
                selectFilter(target);
              } else {
                prepareNewFilter();
              }
            }}
          >
            <MenuItem value="">فلتر جديد</MenuItem>
            {filters.map((filter) => (
              <MenuItem key={filter.id} value={filter.id}>
                {filter.nameAr} ({filter.type})
              </MenuItem>
            ))}
          </TextField>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="الاسم عربي"
              value={filterForm.nameAr}
              onChange={(event) => setFilterForm((prev) => ({ ...prev, nameAr: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Name (English)"
              value={filterForm.nameEn}
              onChange={(event) => setFilterForm((prev) => ({ ...prev, nameEn: event.target.value }))}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Slug"
              value={filterForm.slug}
              onChange={(event) => setFilterForm((prev) => ({ ...prev, slug: event.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="النوع"
              value={filterForm.type}
              onChange={(event) =>
                setFilterForm((prev) => ({ ...prev, type: event.target.value as FilterType }))
              }
              fullWidth
            >
              <MenuItem value="checkbox">Checkbox</MenuItem>
              <MenuItem value="radio">Radio</MenuItem>
              <MenuItem value="color">Color</MenuItem>
              <MenuItem value="range">Range</MenuItem>
            </TextField>
            <TextField
              label="Sort Order"
              type="number"
              value={filterForm.sortOrder}
              onChange={(event) => setFilterForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
              fullWidth
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={filterForm.isActive}
                onChange={(event) =>
                  setFilterForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
            }
            label="نشط"
          />

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => saveFilter().catch(() => undefined)} disabled={actionLoading}>
              حفظ الفلتر
            </Button>
            {selectedFilterId ? (
              <Button
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => deleteFilter().catch(() => undefined)}
                disabled={actionLoading}
              >
                حذف الفلتر
              </Button>
            ) : null}
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TuneIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>قيم الفلتر</Typography>
        </Box>
        {selectedFilter?.type === 'range' ? (
          <Alert severity="info">فلتر النطاق رقمي ولا يحتوي قيماً ثابتة.</Alert>
        ) : (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="القيمة عربي"
                value={valueForm.valueAr}
                onChange={(event) => setValueForm((prev) => ({ ...prev, valueAr: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Value (English)"
                value={valueForm.valueEn}
                onChange={(event) => setValueForm((prev) => ({ ...prev, valueEn: event.target.value }))}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Slug"
                value={valueForm.slug}
                onChange={(event) => setValueForm((prev) => ({ ...prev, slug: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Sort Order"
                type="number"
                value={valueForm.sortOrder}
                onChange={(event) => setValueForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                fullWidth
              />
              {selectedFilter?.type === 'color' ? (
                <TextField
                  label="HEX Color"
                  placeholder="#FF0000"
                  value={valueForm.colorHex}
                  onChange={(event) => setValueForm((prev) => ({ ...prev, colorHex: event.target.value }))}
                  fullWidth
                />
              ) : null}
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={valueForm.isActive}
                  onChange={(event) =>
                    setValueForm((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                />
              }
              label="القيمة نشطة"
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="contained" onClick={() => saveValue().catch(() => undefined)} disabled={actionLoading || !selectedFilterId}>
                {selectedValueId ? 'تحديث القيمة' : 'إضافة قيمة'}
              </Button>
              {selectedValueId ? (
                <Button onClick={() => { setSelectedValueId(''); setValueForm(valueFormDefault); }}>
                  إلغاء
                </Button>
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(selectedFilter?.values ?? []).map((value) => (
                <Chip
                  key={value.id}
                  label={value.valueAr}
                  onClick={() => selectValue(value)}
                  onDelete={() => deleteValue(value.id).catch(() => undefined)}
                  sx={{
                    ...(value.colorHex
                      ? {
                          backgroundColor: value.colorHex,
                          color: '#111',
                        }
                      : {}),
                  }}
                />
              ))}
            </Box>
          </Stack>
        )}
      </Paper>

      {loading ? <Typography color="text.secondary">جاري تحميل الفلاتر...</Typography> : null}
    </Box>
  );
}
