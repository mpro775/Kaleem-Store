import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
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
  CircularProgress,
  Grid,
} from '@mui/material';
import StyleIcon from '@mui/icons-material/Style';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';

import type { MerchantRequester } from '../merchant-dashboard.types';
import type { Attribute, AttributeValue, Category, CategoryAttributes } from '../types';

interface AttributesPanelProps {
  request: MerchantRequester;
}

const attributeFormDefault = {
  name: '',
  slug: '',
  nameAr: '',
  nameEn: '',
};

const valueFormDefault = {
  value: '',
  slug: '',
  valueAr: '',
  valueEn: '',
};

export function AttributesPanel({ request }: AttributesPanelProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [selectedValueId, setSelectedValueId] = useState('');
  
  const [attributeForm, setAttributeForm] = useState(attributeFormDefault);
  const [valueForm, setValueForm] = useState(valueFormDefault);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryAttributeIds, setSelectedCategoryAttributeIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadBaseData().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBaseData(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const [attributesData, categoriesData] = await Promise.all([
        request<Attribute[]>('/attributes?includeValues=true', { method: 'GET' }),
        request<Category[]>('/categories', { method: 'GET' }),
      ]);

      setAttributes(attributesData ?? []);
      setCategories(categoriesData ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط®طµط§ط¦طµ', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedAttributeId('');
    setSelectedValueId('');
    setAttributeForm(attributeFormDefault);
    setValueForm(valueFormDefault);
    setMessage({ text: '', type: 'info' });
    setViewMode('detail');
  }

  function handleBackToList() {
    setViewMode('list');
    setMessage({ text: '', type: 'info' });
  }

  async function createAttribute(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const created = await request<Attribute>('/attributes', {
        method: 'POST',
        body: JSON.stringify(buildAttributePayload(attributeForm)),
      });
      if (created) {
        setSelectedAttributeId(created.id);
        setMessage({ text: 'طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ط®ط§طµظٹط© ط¨ظ†ط¬ط§ط­. ظٹظ…ظƒظ†ظƒ ط§ظ„ط¢ظ† ط¥ط¶ط§ظپط© ظ‚ظٹظ… ظ„ظ‡ط§.', type: 'success' });
        await loadBaseData();
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ط®ط§طµظٹط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateAttribute(): Promise<void> {
    if (!selectedAttributeId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/attributes/${selectedAttributeId}`, {
        method: 'PUT',
        body: JSON.stringify(buildAttributePayload(attributeForm)),
      });
      await loadBaseData();
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ط§ظ„ط®ط§طµظٹط© ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ط®ط§طµظٹط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteAttribute(): Promise<void> {
    if (!selectedAttributeId || !window.confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ظ‡ ط§ظ„ط®ط§طµظٹط© ظˆط¬ظ…ظٹط¹ ظ‚ظٹظ…ظ‡ط§طں')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/attributes/${selectedAttributeId}`, {
        method: 'DELETE',
      });
      setSelectedAttributeId('');
      setSelectedValueId('');
      setAttributeForm(attributeFormDefault);
      setValueForm(valueFormDefault);
      await loadBaseData();
      setMessage({ text: 'طھظ… ط­ط°ظپ ط§ظ„ط®ط§طµظٹط© ط¨ظ†ط¬ط§ط­', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط­ط°ظپ ط§ظ„ط®ط§طµظٹط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function createValue(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage({ text: 'ظٹط¬ط¨ ط­ظپط¸ ط§ظ„ط®ط§طµظٹط© ط§ظ„ط£ط³ط§ط³ظٹط© ط£ظˆظ„ط§ظ‹', type: 'error' });
      return;
    }
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/attributes/${selectedAttributeId}/values`, {
        method: 'POST',
        body: JSON.stringify(buildValuePayload(valueForm)),
      });
      setValueForm(valueFormDefault);
      setSelectedValueId('');
      await loadBaseData();
      setMessage({ text: 'طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظ‚ظٹظ…ط© ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ظ‚ظٹظ…ط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateValue(): Promise<void> {
    if (!selectedAttributeId || !selectedValueId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/attributes/${selectedAttributeId}/values/${selectedValueId}`, {
        method: 'PUT',
        body: JSON.stringify(buildValuePayload(valueForm)),
      });
      setValueForm(valueFormDefault);
      setSelectedValueId('');
      await loadBaseData();
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ط§ظ„ظ‚ظٹظ…ط© ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ظ‚ظٹظ…ط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteValue(valueId: string): Promise<void> {
    if (!selectedAttributeId || !window.confirm('ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ط­ط°ظپطں')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/attributes/${selectedAttributeId}/values/${valueId}`, {
        method: 'DELETE',
      });
      setValueForm(valueFormDefault);
      setSelectedValueId('');
      await loadBaseData();
      setMessage({ text: 'طھظ… ط­ط°ظپ ط§ظ„ظ‚ظٹظ…ط©', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط­ط°ظپ ط§ظ„ظ‚ظٹظ…ط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function loadCategoryAttributes(categoryId: string): Promise<void> {
    setMessage({ text: '', type: 'info' });
    setSelectedCategoryId(categoryId);

    if (!categoryId) {
      setSelectedCategoryAttributeIds([]);
      return;
    }
    setActionLoading(true);
    try {
      const data = await request<CategoryAttributes>(
        `/attributes/categories/${categoryId}/attributes`,
        { method: 'GET' },
      );
      setSelectedCategoryAttributeIds(data?.attributeIds ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط®طµط§ط¦طµ ط§ظ„طھطµظ†ظٹظپ', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveCategoryAttributes(): Promise<void> {
    if (!selectedCategoryId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/attributes/categories/${selectedCategoryId}/attributes`, {
        method: 'PUT',
        body: JSON.stringify({ attributeIds: selectedCategoryAttributeIds }),
      });
      setMessage({ text: 'طھظ… ط­ظپط¸ ط±ط¨ط· ط§ظ„ط®طµط§ط¦طµ ط¨ط§ظ„طھطµظ†ظٹظپ ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط®طµط§ط¦طµ ط§ظ„طھطµظ†ظٹظپ', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function selectAttribute(attribute: Attribute): void {
    setSelectedAttributeId(attribute.id);
    setSelectedValueId('');
    setValueForm(valueFormDefault);
    setAttributeForm({
      name: attribute.name,
      slug: attribute.slug,
      nameAr: (attribute as any).nameAr ?? '',
      nameEn: (attribute as any).nameEn ?? '',
    });
    setViewMode('detail');
  }

  function selectValueForEdit(value: AttributeValue): void {
    setSelectedValueId(value.id);
    setValueForm({
      value: value.value,
      slug: value.slug,
      valueAr: (value as any).valueAr ?? '',
      valueEn: (value as any).valueEn ?? '',
    });
  }

  function toggleCategoryAttribute(attributeId: string, enabled: boolean): void {
    setSelectedCategoryAttributeIds((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(attributeId);
      } else {
        next.delete(attributeId);
      }
      return [...next];
    });
  }

  const selectedAttribute = attributes.find((attribute) => attribute.id === selectedAttributeId) ?? null;

  if (viewMode === 'detail') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 900, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Button 
            startIcon={<ArrowForwardIcon />} 
            onClick={handleBackToList}
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ‚ط§ط¦ظ…ط©
          </Button>
          {selectedAttributeId && (
            <Button 
              color="error" 
              startIcon={<DeleteOutlineIcon />}
              onClick={() => deleteAttribute().catch(() => undefined)}
              disabled={actionLoading}
            >
              ط­ط°ظپ ط§ظ„ط®ط§طµظٹط©
            </Button>
          )}
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 3 }}>
          <Box>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <StyleIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>
                  {selectedAttributeId ? 'طھط¹ط¯ظٹظ„ ط§ظ„ط®ط§طµظٹط©' : 'ط®ط§طµظٹط© ط¬ط¯ظٹط¯ط©'}
                </Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Stack spacing={3}>
                <TextField 
                  label="ط§ط³ظ… ط§ظ„ط®ط§طµظٹط©" 
                  fullWidth 
                  value={attributeForm.name} 
                  onChange={(event) => setAttributeForm((prev) => ({ ...prev, name: event.target.value }))} 
                  placeholder="ظ…ط«ط§ظ„: ط§ظ„ظ„ظˆظ†طŒ ط§ظ„ظ…ظ‚ط§ط³"
                  required
                />
                <TextField 
                  label="ط§ظ„ط§ط³ظ… (ط¹ط±ط¨ظٹ)" 
                  fullWidth 
                  value={attributeForm.nameAr} 
                  onChange={(event) => setAttributeForm((prev) => ({ ...prev, nameAr: event.target.value }))} 
                  dir="rtl"
                />
                <TextField 
                  label="Name (English)" 
                  fullWidth 
                  value={attributeForm.nameEn} 
                  onChange={(event) => setAttributeForm((prev) => ({ ...prev, nameEn: event.target.value }))} 
                  dir="ltr"
                />
                <TextField 
                  label="ط§ظ„ظ…ط³ط§ط± ط§ظ„ظ…ط®طھطµط± (Slug)" 
                  fullWidth 
                  value={attributeForm.slug} 
                  onChange={(event) => setAttributeForm((prev) => ({ ...prev, slug: event.target.value }))} 
                  dir="ltr"
                  helperText="ظ…ط«ط§ظ„: color, size"
                />
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => (selectedAttributeId ? updateAttribute() : createAttribute()).catch(() => undefined)}
                  disabled={actionLoading}
                  disableElevation
                >
                  {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸...' : selectedAttributeId ? 'ط­ظپط¸ ط§ظ„ط®ط§طµظٹط©' : 'ط¥ظ†ط´ط§ط، ط§ظ„ط®ط§طµظٹط©'}
                </Button>
              </Stack>
            </Paper>
          </Box>

          <Box>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%', opacity: selectedAttributeId ? 1 : 0.5, pointerEvents: selectedAttributeId ? 'auto' : 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Typography variant="h6" fontWeight={800}>ط§ظ„ظ‚ظٹظ… (Options)</Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>
                  {selectedValueId ? 'طھط¹ط¯ظٹظ„ ط§ظ„ظ‚ظٹظ…ط©' : 'ط¥ط¶ط§ظپط© ظ‚ظٹظ…ط© ط¬ط¯ظٹط¯ط©'}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <TextField size="small" label="ط§ظ„ظ‚ظٹظ…ط© (ظ…ط«ط§ظ„: ط£ط­ظ…ط±)" fullWidth value={valueForm.value} onChange={(event) => setValueForm((prev) => ({ ...prev, value: event.target.value }))} />
                  <TextField size="small" label="ط§ظ„ظ‚ظٹظ…ط© (ط¹ط±ط¨ظٹ)" fullWidth value={valueForm.valueAr} onChange={(event) => setValueForm((prev) => ({ ...prev, valueAr: event.target.value }))} dir="rtl" />
                  <TextField size="small" label="Value (English)" fullWidth value={valueForm.valueEn} onChange={(event) => setValueForm((prev) => ({ ...prev, valueEn: event.target.value }))} dir="ltr" />
                  <TextField size="small" label="Slug (ظ…ط«ط§ظ„: red)" fullWidth value={valueForm.slug} onChange={(event) => setValueForm((prev) => ({ ...prev, slug: event.target.value }))} dir="ltr" />
                  <Button 
                    variant={selectedValueId ? "contained" : "outlined"} 
                    color={selectedValueId ? "primary" : "inherit"}
                    onClick={() => (selectedValueId ? updateValue() : createValue()).catch(() => undefined)} 
                    disabled={actionLoading || !valueForm.value}
                    sx={{ minWidth: 100 }}
                  >
                    {selectedValueId ? 'طھط­ط¯ظٹط«' : 'ط¥ط¶ط§ظپط©'}
                  </Button>
                  {selectedValueId && (
                     <Button variant="text" color="inherit" onClick={() => { setSelectedValueId(''); setValueForm(valueFormDefault); }}>ط¥ظ„ط؛ط§ط،</Button>
                  )}
                </Stack>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} mb={1}>ط§ظ„ظ‚ظٹظ… ط§ظ„ظ…ط¶ط§ظپط©:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(selectedAttribute?.values ?? []).map((value) => (
                  <Chip 
                    key={value.id}
                    label={`${value.value} (${value.slug})`}
                    onClick={() => selectValueForEdit(value)}
                    onDelete={() => deleteValue(value.id).catch(() => undefined)}
                    color={selectedValueId === value.id ? 'primary' : 'default'}
                    variant={selectedValueId === value.id ? 'filled' : 'outlined'}
                  />
                ))}
                {(selectedAttribute?.values ?? []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ظ‚ظٹظ…طŒ ظ‚ظ… ط¨ط¥ط¶ط§ظپط© ظˆط§ط­ط¯ط© ط£ط¹ظ„ط§ظ‡.</Typography>
                )}
              </Box>
            </Paper>
        </Box>
      </Box>
    </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            ط§ظ„ط®طµط§ط¦طµ ظˆط§ظ„ظ…ظˆط§طµظپط§طھ
          </Typography>
          <Typography color="text.secondary">
            ظ‚ظ… ط¨ط¥ظ†ط´ط§ط، ط§ظ„ط®طµط§ط¦طµ (ظƒط§ظ„ط£ظ„ظˆط§ظ† ظˆط§ظ„ظ…ظ‚ط§ط³ط§طھ) ظˆط§ط±ط¨ط·ظ‡ط§ ط¨ط§ظ„طھطµظ†ظٹظپط§طھ ظ„ط§ط³طھط®ط¯ط§ظ…ظ‡ط§ ظپظٹ ط§ظ„ظ…طھط؛ظٹط±ط§طھ.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadBaseData().catch(() => undefined)}
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
            ط®ط§طµظٹط© ط¬ط¯ظٹط¯ط©
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
        {/* Attributes List */}
        <Box>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <StyleIcon color="action" />
              <Typography variant="subtitle1" fontWeight={800}>ط§ظ„ط®طµط§ط¦طµ ط§ظ„ط£ط³ط§ط³ظٹط©</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ط§ط³ظ… ط§ظ„ط®ط§طµظٹط©</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ظ…ط³ط§ط± ط§ظ„ظ…ط®طھطµط±</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ظ‚ظٹظ…</TableCell>
                    <TableCell align="left" sx={{ fontWeight: 700 }}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : attributes.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><Typography color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ط®طµط§ط¦طµ.</Typography></TableCell></TableRow>
                  ) : (
                    attributes.map((attribute) => (
                      <TableRow key={attribute.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{attribute.name}</TableCell>
                        <TableCell dir="ltr" align="right">
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">/{attribute.slug}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={`${attribute.values?.length ?? 0} ظ‚ظٹظ…`} variant="outlined" />
                        </TableCell>
                        <TableCell align="left">
                          <Button size="small" variant="outlined" startIcon={<EditNoteIcon />} onClick={() => selectAttribute(attribute)} sx={{ borderRadius: 1.5 }}>
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

        {/* Category Mapping */}
        <Box>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SettingsEthernetIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>ط±ط¨ط· ط§ظ„ط®طµط§ط¦طµ ط¨ط§ظ„طھطµظ†ظٹظپط§طھ</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={3}>
              ط§ط®طھط± طھطµظ†ظٹظپط§ظ‹ ظˆط­ط¯ط¯ ط§ظ„ط®طµط§ط¦طµ ط§ظ„ظ…طھط§ط­ط© ظ„ظ„ظ…ظ†طھط¬ط§طھ ط¯ط§ط®ظ„ ظ‡ط°ط§ ط§ظ„طھطµظ†ظٹظپ.
            </Typography>

            <TextField
              select
              label="ط§ط®طھط± ط§ظ„طھطµظ†ظٹظپ"
              value={selectedCategoryId}
              onChange={(event) => loadCategoryAttributes(event.target.value).catch(() => undefined)}
              fullWidth
              sx={{ mb: 3 }}
            >
              <MenuItem value="">ط§ط®طھط± طھطµظ†ظٹظپط§ظ‹</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.default', mb: 3 }}>
              {selectedCategoryId ? (
                attributes.length > 0 ? (
                  <Stack spacing={1}>
                    {attributes.map((attribute) => (
                      <FormControlLabel
                        key={attribute.id}
                        control={
                          <Checkbox
                            checked={selectedCategoryAttributeIds.includes(attribute.id)}
                            onChange={(event) => toggleCategoryAttribute(attribute.id, event.target.checked)}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2" fontWeight={600}>{attribute.name}</Typography>}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ط®طµط§ط¦طµ ظ„ط±ط¨ط·ظ‡ط§.</Typography>
                )
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>ظٹط±ط¬ظ‰ طھط­ط¯ظٹط¯ طھطµظ†ظٹظپ ط£ظˆظ„ط§ظ‹ ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط© ط£ط¹ظ„ط§ظ‡.</Typography>
              )}
            </Box>

            <Button 
              variant="contained" 
              onClick={() => saveCategoryAttributes().catch(() => undefined)}
              disabled={actionLoading || !selectedCategoryId}
              fullWidth
              size="large"
            >
              {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸ ط§ظ„ط±ط¨ط·'}
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

function buildAttributePayload(form: typeof attributeFormDefault) {
  const payload: { name: string; slug?: string; nameAr?: string; nameEn?: string } = {
    name: form.name.trim(),
  };

  const slug = form.slug.trim();
  if (slug) {
    payload.slug = slug;
  }

  const nameAr = form.nameAr.trim();
  if (nameAr) {
    payload.nameAr = nameAr;
  }

  const nameEn = form.nameEn.trim();
  if (nameEn) {
    payload.nameEn = nameEn;
  }

  return payload;
}

function buildValuePayload(form: typeof valueFormDefault) {
  const payload: { value: string; slug?: string; valueAr?: string; valueEn?: string } = {
    value: form.value.trim(),
  };

  const slug = form.slug.trim();
  if (slug) {
    payload.slug = slug;
  }

  const valueAr = form.valueAr.trim();
  if (valueAr) {
    payload.valueAr = valueAr;
  }

  const valueEn = form.valueEn.trim();
  if (valueEn) {
    payload.valueEn = valueEn;
  }

  return payload;
}