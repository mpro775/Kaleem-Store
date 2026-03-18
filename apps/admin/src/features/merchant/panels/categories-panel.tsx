import { useState } from 'react';
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
} from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard';
import type { Category } from '../types';

interface CategoriesPanelProps {
  request: MerchantRequester;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
};

export function CategoriesPanel({ request }: CategoriesPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  async function loadCategories(): Promise<void> {
    setMessage('');
    try {
      const data = await request<Category[]>('/categories', { method: 'GET' });
      setCategories(data ?? []);
      setMessage('تم تحميل التصنيفات');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل التصنيفات');
    }
  }

  async function createCategory(): Promise<void> {
    setMessage('');
    try {
      await request('/categories', {
        method: 'POST',
        body: JSON.stringify(buildCategoryPayload(form)),
      });
      setForm(emptyForm);
      await loadCategories();
      setMessage('تم إنشاء التصنيف');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء التصنيف');
    }
  }

  async function updateCategory(): Promise<void> {
    if (!selectedId) {
      setMessage('اختر تصنيفاً قبل التحديث');
      return;
    }

    setMessage('');
    try {
      await request(`/categories/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(buildCategoryPayload(form)),
      });
      await loadCategories();
      setMessage('تم تحديث التصنيف');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث التصنيف');
    }
  }

  async function deleteCategory(): Promise<void> {
    if (!selectedId) {
      setMessage('اختر تصنيفاً قبل الحذف');
      return;
    }

    setMessage('');
    try {
      await request(`/categories/${selectedId}`, {
        method: 'DELETE',
      });
      setSelectedId('');
      setForm(emptyForm);
      await loadCategories();
      setMessage('تم حذف التصنيف');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف التصنيف');
    }
  }

  function selectCategory(category: Category): void {
    setSelectedId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentId: category.parentId ?? '',
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    });
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">التصنيفات</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadCategories().catch(() => undefined)}>تحميل</Button>
          <Button variant="contained" onClick={() => createCategory().catch(() => undefined)}>
            إنشاء
          </Button>
          <Button variant="outlined" onClick={() => updateCategory().catch(() => undefined)}>تحديث</Button>
          <Button color="error" variant="outlined" onClick={() => deleteCategory().catch(() => undefined)}>
            حذف
          </Button>
        </Stack>

        <TextField label="الاسم" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <TextField label="المسار المختصر" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
        <TextField label="الوصف" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        <TextField label="معرّف التصنيف الأب" value={form.parentId} onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))} />
        <TextField label="ترتيب العرض" type="number" inputProps={{ min: 0 }} value={form.sortOrder} onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))} />
        <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="نشط" />

        {message ? <Alert severity="info">{message}</Alert> : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">قائمة التصنيفات</Typography>
        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {categories.map((category) => (
            <Paper key={category.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle1">{category.name}</Typography>
              <Typography variant="body2" sx={{ mt: 0.4 }}>
                {category.slug} - {category.isActive ? 'نشط' : 'غير نشط'}
              </Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectCategory(category)}>تعديل</Button>
            </Paper>
          ))}
          {categories.length === 0 ? <Typography color="text.secondary">لا توجد تصنيفات محملة.</Typography> : null}
        </Box>
      </Paper>
    </Box>
  );
}

function buildCategoryPayload(form: {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}) {
  const payload: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
    sortOrder: number;
    isActive: boolean;
  } = {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder || '0'),
    isActive: form.isActive,
  };

  const slug = form.slug.trim();
  const description = form.description.trim();
  const parentId = form.parentId.trim();

  if (slug) {
    payload.slug = slug;
  }
  if (description) {
    payload.description = description;
  }
  if (parentId) {
    payload.parentId = parentId;
  }

  return payload;
}
