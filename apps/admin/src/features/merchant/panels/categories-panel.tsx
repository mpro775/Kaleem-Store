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
  IconButton,
  CircularProgress,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import type { MerchantRequester } from '../merchant-dashboard';
import type { Category, MediaAsset, PresignedMediaUpload } from '../types';

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
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
};

export function CategoriesPanel({ request }: CategoriesPanelProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });
  const [formMediaAssetId, setFormMediaAssetId] = useState<string | null>(null);
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadCategories().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCategories(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<Category[]>('/categories', { method: 'GET' });
      setCategories(data ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل التصنيفات', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedId('');
    setForm(emptyForm);
    setFormMediaAssetId(null);
    setFormImageUrl(null);
    setMessage({ text: '', type: 'info' });
    setViewMode('detail');
  }

  function handleBackToList() {
    setViewMode('list');
    setMessage({ text: '', type: 'info' });
  }

  async function createCategory(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request('/categories', {
        method: 'POST',
        body: JSON.stringify(buildCategoryPayload(form, formMediaAssetId, false)),
      });
      setForm(emptyForm);
      await loadCategories();
      setMessage({ text: 'تم إنشاء التصنيف بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إنشاء التصنيف', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateCategory(): Promise<void> {
    if (!selectedId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/categories/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(buildCategoryPayload(form, formMediaAssetId, true)),
      });
      await loadCategories();
      setMessage({ text: 'تم تحديث التصنيف بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث التصنيف', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteCategory(): Promise<void> {
    if (!selectedId || !window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/categories/${selectedId}`, {
        method: 'DELETE',
      });
      setSelectedId('');
      setForm(emptyForm);
      setFormMediaAssetId(null);
      setFormImageUrl(null);
      await loadCategories();
      setMessage({ text: 'تم حذف التصنيف بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حذف التصنيف', type: 'error' });
    } finally {
      setActionLoading(false);
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
      nameAr: category.nameAr ?? '',
      nameEn: category.nameEn ?? '',
      descriptionAr: category.descriptionAr ?? '',
      descriptionEn: category.descriptionEn ?? '',
    });
    setFormMediaAssetId(category.mediaAssetId);
    setFormImageUrl(category.imageUrl);
    setViewMode('detail');
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setMessage({ text: '', type: 'info' });
    try {
      const asset = await uploadMediaAsset(request, file);
      setFormMediaAssetId(asset.id);
      setFormImageUrl(asset.url);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر رفع الصورة', type: 'error' });
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }

  function handleRemoveImage() {
    setFormMediaAssetId(null);
    setFormImageUrl(null);
  }

  const getParentName = (parentId: string | null) => {
    if (!parentId) return 'بدون تصنيف أب';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : parentId;
  };

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
            العودة للتصنيفات
          </Button>
          {selectedId && (
            <Button 
              color="error" 
              startIcon={<DeleteOutlineIcon />}
              onClick={() => deleteCategory().catch(() => undefined)}
              disabled={actionLoading}
            >
              حذف التصنيف
            </Button>
          )}
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
        )}

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <AccountTreeIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>
              {selectedId ? 'تعديل التصنيف' : 'تصنيف جديد'}
            </Typography>
          </Box>
          <Divider sx={{ mb: 4 }} />
          
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="اسم التصنيف" 
                  fullWidth 
                  value={form.name} 
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} 
                  required
                />
              </Box>
              <Box>
                <TextField 
                  label="ترتيب العرض" 
                  type="number" 
                  inputProps={{ min: 0 }} 
                  fullWidth 
                  value={form.sortOrder} 
                  onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))} 
                />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="الاسم (عربي)" 
                  fullWidth 
                  value={form.nameAr} 
                  onChange={(event) => setForm((prev) => ({ ...prev, nameAr: event.target.value }))} 
                  dir="rtl"
                />
              </Box>
              <Box>
                <TextField 
                  label="Name (English)" 
                  fullWidth 
                  value={form.nameEn} 
                  onChange={(event) => setForm((prev) => ({ ...prev, nameEn: event.target.value }))} 
                  dir="ltr"
                />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="المسار المختصر (Slug)" 
                  fullWidth 
                  value={form.slug} 
                  onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} 
                  dir="ltr"
                  helperText="يستخدم في روابط المتجر"
                />
              </Box>
              <Box>
                <TextField 
                  label="معرّف التصنيف الأب (اختياري)" 
                  fullWidth 
                  value={form.parentId} 
                  onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))} 
                  helperText="لجعل هذا التصنيف فرعياً من تصنيف آخر"
                />
              </Box>
            </Box>

            <TextField 
              label="الوصف" 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.description} 
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} 
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <TextField 
                  label="الوصف (عربي)" 
                  fullWidth 
                  multiline 
                  minRows={3} 
                  value={form.descriptionAr} 
                  onChange={(event) => setForm((prev) => ({ ...prev, descriptionAr: event.target.value }))} 
                  dir="rtl"
                />
              </Box>
              <Box>
                <TextField 
                  label="Description (English)" 
                  fullWidth 
                  multiline 
                  minRows={3} 
                  value={form.descriptionEn} 
                  onChange={(event) => setForm((prev) => ({ ...prev, descriptionEn: event.target.value }))} 
                  dir="ltr"
                />
              </Box>
            </Box>

            <FormControlLabel 
              control={<Checkbox checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} 
              label={<Typography fontWeight={600}>تفعيل التصنيف وظهوره في المتجر</Typography>} 
            />

            <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>صورة التصنيف</Typography>
              {formImageUrl && (
                <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                  <Box component="img" src={formImageUrl} alt="صورة التصنيف" sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
                  <Button size="small" color="error" onClick={handleRemoveImage} sx={{ mt: 1 }}>إزالة الصورة</Button>
                </Box>
              )}
              <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} disabled={uploadingImage}>
                  {uploadingImage ? 'جارِ الرفع...' : formImageUrl ? 'تغيير الصورة' : 'رفع صورة'}
                  <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(e).catch(() => undefined)} />
                </Button>
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => (selectedId ? updateCategory() : createCategory()).catch(() => undefined)}
                disabled={actionLoading}
                sx={{ px: 4, borderRadius: 2 }}
              >
                {actionLoading ? 'جارِ الحفظ...' : selectedId ? 'حفظ التعديلات' : 'إنشاء التصنيف'}
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
            التصنيفات
          </Typography>
          <Typography color="text.secondary">
            نظم منتجاتك في مجموعات وفئات لتسهيل تصفحها على عملائك.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadCategories().catch(() => undefined)}
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
            تصنيف جديد
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
                <TableCell sx={{ fontWeight: 700 }}>الصورة</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>اسم التصنيف</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>المسار المختصر</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>التصنيف الأب</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>الترتيب</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">لا توجد تصنيفات مضافة.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      {category.imageUrl ? (
                        <Box component="img" src={category.imageUrl} alt={category.name} sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1 }} />
                      ) : (
                        <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', borderRadius: 1 }}>
                          <ImageIcon fontSize="small" color="disabled" />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{category.name}</TableCell>
                    <TableCell dir="ltr" align="right">
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        /{category.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getParentName(category.parentId)}
                      </Typography>
                    </TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={category.isActive ? 'نشط' : 'غير نشط'} 
                        color={category.isActive ? 'success' : 'default'} 
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<EditNoteIcon />}
                        onClick={() => selectCategory(category)}
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

function buildCategoryPayload(form: {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}, mediaAssetId: string | null, isUpdate: boolean) {
  const payload: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
    sortOrder: number;
    isActive: boolean;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    mediaAssetId?: string | null;
  } = {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder || '0'),
    isActive: form.isActive,
  };

  if (isUpdate) {
    payload.mediaAssetId = mediaAssetId;
  } else if (mediaAssetId) {
    payload.mediaAssetId = mediaAssetId;
  }

  const slug = form.slug.trim();
  const description = form.description.trim();
  const parentId = form.parentId.trim();
  const nameAr = form.nameAr.trim();
  const nameEn = form.nameEn.trim();
  const descriptionAr = form.descriptionAr.trim();
  const descriptionEn = form.descriptionEn.trim();

  if (slug) {
    payload.slug = slug;
  }
  if (description) {
    payload.description = description;
  }
  if (parentId) {
    payload.parentId = parentId;
  }
  if (nameAr) {
    payload.nameAr = nameAr;
  }
  if (nameEn) {
    payload.nameEn = nameEn;
  }
  if (descriptionAr) {
    payload.descriptionAr = descriptionAr;
  }
  if (descriptionEn) {
    payload.descriptionEn = descriptionEn;
  }

  return payload;
}

async function uploadMediaAsset(request: MerchantRequester, file: File): Promise<MediaAsset> {
  const presigned = await request<PresignedMediaUpload>('/media/presign-upload', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
    }),
  });

  if (!presigned) {
    throw new Error('تعذر الحصول على رابط الرفع الموقّع');
  }

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: presigned.uploadHeaders,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('فشل رفع الوسائط المباشر');
  }

  const etag = uploadResponse.headers.get('etag') ?? undefined;
  const confirmPayload: {
    objectKey: string;
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
    etag?: string;
  } = {
    objectKey: presigned.objectKey,
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
  };

  if (etag) {
    confirmPayload.etag = etag;
  }

  const mediaAsset = await request<MediaAsset>('/media/confirm', {
    method: 'POST',
    body: JSON.stringify(confirmPayload),
  });

  if (!mediaAsset) {
    throw new Error('تعذر تأكيد الوسائط المرفوعة');
  }

  return mediaAsset;
}