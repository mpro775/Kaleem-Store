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
} from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard';
import type { Attribute, AttributeValue, Category, CategoryAttributes } from '../types';

interface AttributesPanelProps {
  request: MerchantRequester;
}

const attributeFormDefault = {
  name: '',
  slug: '',
};

const valueFormDefault = {
  value: '',
  slug: '',
};

export function AttributesPanel({ request }: AttributesPanelProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [selectedValueId, setSelectedValueId] = useState('');
  const [attributeForm, setAttributeForm] = useState(attributeFormDefault);
  const [valueForm, setValueForm] = useState(valueFormDefault);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryAttributeIds, setSelectedCategoryAttributeIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBaseData().catch(() => undefined);
  }, []);

  async function loadBaseData(): Promise<void> {
    setMessage('');
    try {
      const [attributesData, categoriesData] = await Promise.all([
        request<Attribute[]>('/attributes?includeValues=true', { method: 'GET' }),
        request<Category[]>('/categories', { method: 'GET' }),
      ]);

      setAttributes(attributesData ?? []);
      setCategories(categoriesData ?? []);
      setMessage('تم تحميل الخصائص والتصنيفات');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الخصائص');
    }
  }

  async function createAttribute(): Promise<void> {
    setMessage('');
    try {
      await request('/attributes', {
        method: 'POST',
        body: JSON.stringify(buildAttributePayload(attributeForm)),
      });
      setAttributeForm(attributeFormDefault);
      await loadBaseData();
      setMessage('تم إنشاء الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء الخاصية');
    }
  }

  async function updateAttribute(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('اختر خاصية أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}`, {
        method: 'PUT',
        body: JSON.stringify(buildAttributePayload(attributeForm)),
      });
      await loadBaseData();
      setMessage('تم تحديث الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث الخاصية');
    }
  }

  async function deleteAttribute(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('اختر خاصية أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}`, {
        method: 'DELETE',
      });
      setSelectedAttributeId('');
      setSelectedValueId('');
      setAttributeForm(attributeFormDefault);
      setValueForm(valueFormDefault);
      await loadBaseData();
      setMessage('تم حذف الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف الخاصية');
    }
  }

  async function createValue(): Promise<void> {
    if (!selectedAttributeId) {
      setMessage('اختر خاصية أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}/values`, {
        method: 'POST',
        body: JSON.stringify(buildValuePayload(valueForm)),
      });
      setValueForm(valueFormDefault);
      setSelectedValueId('');
      await loadBaseData();
      setMessage('تم إنشاء قيمة الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء القيمة');
    }
  }

  async function updateValue(): Promise<void> {
    if (!selectedAttributeId || !selectedValueId) {
      setMessage('اختر قيمة أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}/values/${selectedValueId}`, {
        method: 'PUT',
        body: JSON.stringify(buildValuePayload(valueForm)),
      });
      await loadBaseData();
      setMessage('تم تحديث قيمة الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث القيمة');
    }
  }

  async function deleteValue(): Promise<void> {
    if (!selectedAttributeId || !selectedValueId) {
      setMessage('اختر قيمة أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/${selectedAttributeId}/values/${selectedValueId}`, {
        method: 'DELETE',
      });
      setValueForm(valueFormDefault);
      setSelectedValueId('');
      await loadBaseData();
      setMessage('تم حذف قيمة الخاصية');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف القيمة');
    }
  }

  async function loadCategoryAttributes(categoryId: string): Promise<void> {
    setMessage('');
    setSelectedCategoryId(categoryId);

    if (!categoryId) {
      setSelectedCategoryAttributeIds([]);
      return;
    }

    try {
      const data = await request<CategoryAttributes>(
        `/attributes/categories/${categoryId}/attributes`,
        { method: 'GET' },
      );
      setSelectedCategoryAttributeIds(data?.attributeIds ?? []);
      setMessage('تم تحميل ربط الخصائص بالتصنيف');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل خصائص التصنيف');
    }
  }

  async function saveCategoryAttributes(): Promise<void> {
    if (!selectedCategoryId) {
      setMessage('اختر تصنيفاً أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/attributes/categories/${selectedCategoryId}/attributes`, {
        method: 'PUT',
        body: JSON.stringify({ attributeIds: selectedCategoryAttributeIds }),
      });
      setMessage('تم تحديث خصائص التصنيف');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث خصائص التصنيف');
    }
  }

  function selectAttribute(attribute: Attribute): void {
    setSelectedAttributeId(attribute.id);
    setSelectedValueId('');
    setValueForm(valueFormDefault);
    setAttributeForm({
      name: attribute.name,
      slug: attribute.slug,
    });
  }

  function selectValue(value: AttributeValue): void {
    setSelectedValueId(value.id);
    setValueForm({
      value: value.value,
      slug: value.slug,
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

  const selectedAttribute =
    attributes.find((attribute) => attribute.id === selectedAttributeId) ?? null;

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">الخصائص</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadBaseData().catch(() => undefined)}>إعادة تحميل</Button>
          <Button variant="contained" onClick={() => createAttribute().catch(() => undefined)}>إنشاء</Button>
          <Button variant="outlined" onClick={() => updateAttribute().catch(() => undefined)}>تحديث</Button>
          <Button color="error" variant="outlined" onClick={() => deleteAttribute().catch(() => undefined)}>حذف</Button>
        </Stack>

        <TextField label="الاسم" value={attributeForm.name} onChange={(event) => setAttributeForm((prev) => ({ ...prev, name: event.target.value }))} />
        <TextField label="المسار المختصر" value={attributeForm.slug} onChange={(event) => setAttributeForm((prev) => ({ ...prev, slug: event.target.value }))} />

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {attributes.map((attribute) => (
            <Paper key={attribute.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2">
                <strong>{attribute.name}</strong> ({attribute.slug})
              </Typography>
              <Typography variant="body2">{attribute.values?.length ?? 0} قيمة</Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectAttribute(attribute)}>اختيار</Button>
            </Paper>
          ))}
          {attributes.length === 0 ? <Typography color="text.secondary">لا توجد خصائص محملة.</Typography> : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">قيم الخصائص</Typography>
        {selectedAttribute ? (
          <Typography>
            الخاصية المحددة: <strong>{selectedAttribute.name}</strong>
          </Typography>
        ) : (
          <Typography color="text.secondary">اختر خاصية لإدارة القيم.</Typography>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" onClick={() => createValue().catch(() => undefined)}>إنشاء قيمة</Button>
          <Button variant="outlined" onClick={() => updateValue().catch(() => undefined)}>تحديث القيمة</Button>
          <Button color="error" variant="outlined" onClick={() => deleteValue().catch(() => undefined)}>حذف القيمة</Button>
        </Stack>

        <TextField label="القيمة" value={valueForm.value} onChange={(event) => setValueForm((prev) => ({ ...prev, value: event.target.value }))} />
        <TextField label="المسار المختصر" value={valueForm.slug} onChange={(event) => setValueForm((prev) => ({ ...prev, slug: event.target.value }))} />

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {(selectedAttribute?.values ?? []).map((value) => (
            <Paper key={value.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2">
                <strong>{value.value}</strong> ({value.slug})
              </Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectValue(value)}>اختيار</Button>
            </Paper>
          ))}
          {(selectedAttribute?.values ?? []).length === 0 ? <Typography color="text.secondary">لا توجد قيم للخاصية المحددة.</Typography> : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1, gridColumn: { xs: 'auto', lg: '1 / -1' } }}>
        <Typography variant="h6">ربط الخصائص بالتصنيف</Typography>
        <TextField
          select
          label="التصنيف"
          value={selectedCategoryId}
          onChange={(event) => loadCategoryAttributes(event.target.value).catch(() => undefined)}
        >
          <MenuItem value="">اختر تصنيفاً</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}>
          {attributes.map((attribute) => (
            <FormControlLabel
              key={attribute.id}
              control={
                <Checkbox
                  checked={selectedCategoryAttributeIds.includes(attribute.id)}
                  onChange={(event) => toggleCategoryAttribute(attribute.id, event.target.checked)}
                />
              }
              label={attribute.name}
            />
          ))}
        </Box>

        <Button variant="contained" sx={{ width: 'fit-content' }} onClick={() => saveCategoryAttributes().catch(() => undefined)}>
          حفظ الربط
        </Button>
      </Paper>

      {message ? <Alert severity="info">{message}</Alert> : null}
    </Box>
  );
}

function buildAttributePayload(form: typeof attributeFormDefault) {
  const payload: { name: string; slug?: string } = {
    name: form.name.trim(),
  };

  const slug = form.slug.trim();
  if (slug) {
    payload.slug = slug;
  }

  return payload;
}

function buildValuePayload(form: typeof valueFormDefault) {
  const payload: { value: string; slug?: string } = {
    value: form.value.trim(),
  };

  const slug = form.slug.trim();
  if (slug) {
    payload.slug = slug;
  }

  return payload;
}
