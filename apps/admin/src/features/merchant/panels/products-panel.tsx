import { useState, useEffect } from 'react';
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
  IconButton,
  InputAdornment,
  CircularProgress,
  Grid,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import StyleIcon from '@mui/icons-material/Style';

import type { MerchantRequester } from '../merchant-dashboard';
import type {
  Attribute,
  Category,
  MediaAsset,
  PresignedMediaUpload,
  Product,
  ProductListResponse,
  ProductStatus,
  ProductVariant,
} from '../types';

interface ProductsPanelProps {
  request: MerchantRequester;
}

const productFormDefault = {
  title: '',
  slug: '',
  description: '',
  categoryId: '',
  status: 'draft' as ProductStatus,
};

function createVariantFormDefault() {
  return {
    title: '',
    sku: '',
    barcode: '',
    price: '0',
    compareAtPrice: '',
    stockQuantity: '0',
    lowStockThreshold: '0',
    selectedValueByAttributeId: {} as Record<string, string>,
    isDefault: false,
  };
}

const imageFormDefault = {
  variantId: '',
  altText: '',
  sortOrder: '0',
};

const statusColors: Record<ProductStatus, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  draft: 'default',
  active: 'success',
  archived: 'warning',
};

const statusLabels: Record<ProductStatus, string> = {
  draft: 'مسودة',
  active: 'نشط',
  archived: 'مؤرشف',
};

export function ProductsPanel({ request }: ProductsPanelProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  
  const [productForm, setProductForm] = useState(productFormDefault);
  const [variantForm, setVariantForm] = useState(createVariantFormDefault);
  const [imageForm, setImageForm] = useState(imageFormDefault);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCatalog().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCatalog(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const [productsData, categoriesData, attributesData] = await Promise.all([
        request<ProductListResponse>('/products?page=1&limit=30', { method: 'GET' }),
        request<Category[]>('/categories', { method: 'GET' }),
        request<Attribute[]>('/attributes?includeValues=true', { method: 'GET' }),
      ]);

      setProducts(productsData?.items ?? []);
      setCategories(categoriesData ?? []);
      setAttributes(attributesData ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل المنتجات', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function loadProductDetails(productId: string): Promise<void> {
    setDetailLoading(true);
    setViewMode('detail');
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<Product>(`/products/${productId}`, { method: 'GET' });
      setSelectedProduct(data ?? null);
      setSelectedVariantId('');
      if (data) {
        setProductForm({
          title: data.title,
          slug: data.slug,
          description: data.description ?? '',
          categoryId: data.categoryId ?? '',
          status: data.status,
        });
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل تفاصيل المنتج', type: 'error' });
      setViewMode('list');
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedProduct(null);
    setSelectedVariantId('');
    setProductForm(productFormDefault);
    setVariantForm(createVariantFormDefault());
    setImageForm(imageFormDefault);
    setImageFile(null);
    setMessage({ text: '', type: 'info' });
    setViewMode('detail');
  }

  function handleBackToList() {
    setViewMode('list');
    setMessage({ text: '', type: 'info' });
  }

  async function createProduct(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const created = await request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(buildProductPayload(productForm)),
      });
      if (created) {
        setMessage({ text: 'تم إنشاء المنتج بنجاح. يمكنك الآن إضافة متغيرات وصور.', type: 'success' });
        await loadCatalog();
        await loadProductDetails(created.id);
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إنشاء المنتج', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateProduct(): Promise<void> {
    if (!selectedProduct) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(buildProductPayload(productForm)),
      });
      await loadCatalog();
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: 'تم تحديث المنتج بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث المنتج', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteProduct(): Promise<void> {
    if (!selectedProduct || !window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/products/${selectedProduct.id}`, { method: 'DELETE' });
      setSelectedProduct(null);
      setProductForm(productFormDefault);
      await loadCatalog();
      setViewMode('list');
      setMessage({ text: 'تم حذف المنتج بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حذف المنتج', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function addVariant(): Promise<void> {
    if (!selectedProduct) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/products/${selectedProduct.id}/variants`, {
        method: 'POST',
        body: JSON.stringify(buildVariantPayload(variantForm)),
      });
      setVariantForm(createVariantFormDefault());
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: 'تمت إضافة المتغير بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إضافة المتغير', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateVariantAttributes(): Promise<void> {
    if (!selectedProduct || !selectedVariantId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/products/${selectedProduct.id}/variants/${selectedVariantId}/attributes`, {
        method: 'PUT',
        body: JSON.stringify({
          attributeValueIds: extractSelectedValueIds(variantForm.selectedValueByAttributeId),
        }),
      });
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: 'تم تحديث خصائص المتغير بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث الخصائص', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function selectVariantForEdit(variant: ProductVariant): void {
    setSelectedVariantId(variant.id);
    setVariantForm({
      title: variant.title,
      sku: variant.sku,
      barcode: variant.barcode ?? '',
      price: String(variant.price),
      compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : '',
      stockQuantity: String(variant.stockQuantity),
      lowStockThreshold: String(variant.lowStockThreshold),
      selectedValueByAttributeId: buildVariantValueSelection(attributes, variant.attributeValueIds),
      isDefault: variant.isDefault,
    });
    setMessage({ text: 'تم تحميل بيانات المتغير للتعديل', type: 'info' });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function uploadAndAttachImage(): Promise<void> {
    if (!selectedProduct || !imageFile) {
      setMessage({ text: 'اختر ملف صورة أولاً', type: 'error' });
      return;
    }
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const mediaAsset = await uploadMediaAsset(request, imageFile);
      await request(`/products/${selectedProduct.id}/images`, {
        method: 'POST',
        body: JSON.stringify(buildAttachImagePayload(imageForm, mediaAsset.id)),
      });

      setImageForm(imageFormDefault);
      setImageFile(null);
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: 'تم رفع الصورة وربطها بالمنتج', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر رفع الصورة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- DETAIL VIEW ---
  if (viewMode === 'detail') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 1000, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Button 
            startIcon={<ArrowForwardIcon />} 
            onClick={handleBackToList}
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            العودة للمنتجات
          </Button>
          {selectedProduct && (
            <Button 
              color="error" 
              startIcon={<DeleteOutlineIcon />}
              onClick={() => deleteProduct().catch(() => undefined)}
              disabled={actionLoading}
            >
              حذف المنتج
            </Button>
          )}
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
        )}

        {detailLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 3 }}>
            
            {/* Basic Info Card */}
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <InventoryIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>
                  {selectedProduct ? 'تعديل المنتج' : 'منتج جديد'}
                </Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Stack spacing={3}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                  <Box>
                    <TextField 
                      label="اسم المنتج" 
                      fullWidth 
                      value={productForm.title} 
                      onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))} 
                      required
                    />
                  </Box>
                  <Box>
                    <TextField 
                      select 
                      label="الحالة" 
                      fullWidth 
                      value={productForm.status} 
                      onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}
                    >
                      <MenuItem value="draft">مسودة</MenuItem>
                      <MenuItem value="active">نشط</MenuItem>
                      <MenuItem value="archived">مؤرشف</MenuItem>
                    </TextField>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <TextField 
                      label="رابط المنتج (Slug)" 
                      fullWidth 
                      value={productForm.slug} 
                      onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))} 
                      dir="ltr"
                      helperText="اختياري: سيتم توليده تلقائياً إذا تُرك فارغاً."
                    />
                  </Box>
                  <Box>
                    <TextField 
                      select 
                      label="التصنيف" 
                      fullWidth 
                      value={productForm.categoryId} 
                      onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                    >
                      <MenuItem value="">بدون تصنيف</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Box>

                <TextField 
                  label="الوصف" 
                  fullWidth 
                  multiline 
                  minRows={4} 
                  value={productForm.description} 
                  onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} 
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    onClick={() => (selectedProduct ? updateProduct() : createProduct()).catch(() => undefined)}
                    disabled={actionLoading}
                    size="large"
                    sx={{ px: 4 }}
                  >
                    {actionLoading ? 'جارِ الحفظ...' : selectedProduct ? 'حفظ التعديلات' : 'إنشاء المنتج'}
                  </Button>
                </Box>
              </Stack>
            </Paper>

            {/* Variants Card (Only if product exists) */}
            {selectedProduct && (
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <StyleIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>المتغيرات والأسعار (Variants)</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                
                {/* List of existing variants */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>المتغيرات المضافة:</Typography>
                    <TableContainer component={Box} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>العنوان</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>السعر</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>المخزون</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>الخصائص</TableCell>
                            <TableCell align="left"></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedProduct.variants.map((variant) => (
                            <TableRow key={variant.id} hover selected={selectedVariantId === variant.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{variant.title}</Typography>
                                <Typography variant="caption" color="text.secondary" fontFamily="monospace">SKU: {variant.sku}</Typography>
                              </TableCell>
                              <TableCell>{variant.price}</TableCell>
                              <TableCell>
                                <Chip size="small" label={variant.stockQuantity} color={variant.stockQuantity <= variant.lowStockThreshold ? 'error' : 'default'} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {formatVariantAttributes(variant.attributes)}
                                </Typography>
                              </TableCell>
                              <TableCell align="left">
                                <Button size="small" onClick={() => selectVariantForEdit(variant)}>تعديل</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Add/Edit Variant Form */}
                <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    {selectedVariantId ? 'تعديل خصائص المتغير المحدد' : 'إضافة متغير جديد'}
                  </Typography>
                  
                  <Stack spacing={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="عنوان المتغير" fullWidth value={variantForm.title} onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })} placeholder="مثال: أحمر / كبير" />
                      </Box>
                      <Box>
                        <TextField size="small" label="SKU (رمز التخزين)" fullWidth value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="الباركود (اختياري)" fullWidth value={variantForm.barcode} onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })} />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="السعر" type="number" fullWidth value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="السعر قبل الخصم (اختياري)" type="number" fullWidth value={variantForm.compareAtPrice} onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="الكمية المتوفرة" type="number" fullWidth value={variantForm.stockQuantity} onChange={(e) => setVariantForm({ ...variantForm, stockQuantity: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="تنبيه انخفاض المخزون" type="number" fullWidth value={variantForm.lowStockThreshold} onChange={(e) => setVariantForm({ ...variantForm, lowStockThreshold: e.target.value })} />
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="body2" fontWeight={700} mb={1}>ربط بخصائص المنتج (الألوان، المقاسات، الخ):</Typography>
                      {attributes.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                          {attributes.map((attribute) => (
                            <Box key={attribute.id}>
                              <TextField
                                size="small"
                                select
                                fullWidth
                                label={attribute.name}
                                value={variantForm.selectedValueByAttributeId[attribute.id] ?? ''}
                                onChange={(e) =>
                                  setVariantForm({
                                    ...variantForm,
                                    selectedValueByAttributeId: { ...variantForm.selectedValueByAttributeId, [attribute.id]: e.target.value },
                                  })
                                }
                              >
                                <MenuItem value="">بدون اختيار</MenuItem>
                                {(attribute.values ?? []).map((val) => (
                                  <MenuItem key={val.id} value={val.id}>{val.value}</MenuItem>
                                ))}
                              </TextField>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">لم يتم إنشاء أي خصائص في قسم "الخصائص" بعد.</Typography>
                      )}
                    </Box>

                    <FormControlLabel control={<Checkbox checked={variantForm.isDefault} onChange={(e) => setVariantForm({ ...variantForm, isDefault: e.target.checked })} />} label="تعيين كمتغير افتراضي يظهر أولاً" />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {selectedVariantId ? (
                        <>
                          <Button variant="contained" onClick={() => updateVariantAttributes().catch(() => undefined)} disabled={actionLoading}>
                            حفظ تعديلات الخصائص
                          </Button>
                          <Button variant="outlined" onClick={() => { setSelectedVariantId(''); setVariantForm(createVariantFormDefault()); }}>
                            إلغاء التعديل و إضافة جديد
                          </Button>
                        </>
                      ) : (
                        <Button variant="contained" color="secondary" onClick={() => addVariant().catch(() => undefined)} disabled={actionLoading}>
                          إضافة المتغير
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            )}

            {/* Images Card (Only if product exists) */}
            {selectedProduct && (
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <ImageIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>الصور والوسائط</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                
                {/* Existing Images */}
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                    {selectedProduct.images.map((img) => (
                      <Paper key={img.id} sx={{ p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', width: 120, textAlign: 'center' }}>
                        <Box component="img" src={img.url} alt={img.altText || ''} sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1, mb: 1, bgcolor: 'background.default' }} />
                        <Typography variant="caption" noWrap display="block" color="text.secondary">الترتيب: {img.sortOrder}</Typography>
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Upload Form */}
                <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 3, border: '1px dashed', borderColor: 'primary.main' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>إضافة صورة جديدة</Typography>
                  <Stack spacing={2}>
                    <TextField size="small" type="file" inputProps={{ accept: 'image/*' }} onChange={(e) => setImageFile((e.target as HTMLInputElement).files?.[0] ?? null)} fullWidth />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="نص بديل (Alt)" fullWidth value={imageForm.altText} onChange={(e) => setImageForm({ ...imageForm, altText: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="الترتيب (0 يظهر أولاً)" type="number" fullWidth value={imageForm.sortOrder} onChange={(e) => setImageForm({ ...imageForm, sortOrder: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" select label="ربط بمتغير (اختياري)" fullWidth value={imageForm.variantId} onChange={(e) => setImageForm({ ...imageForm, variantId: e.target.value })}>
                          <MenuItem value="">بدون ربط (صورة عامة)</MenuItem>
                          {(selectedProduct?.variants ?? []).map(v => (
                            <MenuItem key={v.id} value={v.id}>{v.title}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Box>
                    <Button variant="contained" onClick={() => uploadAndAttachImage().catch(() => undefined)} disabled={actionLoading || !imageFile} sx={{ width: 'fit-content' }}>
                      {actionLoading ? 'جارِ الرفع...' : 'رفع الصورة وحفظ'}
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // --- LIST VIEW ---
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            المنتجات
          </Typography>
          <Typography color="text.secondary">
            أضف منتجاتك ونظم الكتالوج الخاص بمتجرك بسهولة.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleCreateNew}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          منتج جديد
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField 
          placeholder="ابحث باسم المنتج أو الرابط..." 
          value={searchQuery} 
          onChange={(event) => setSearchQuery(event.target.value)} 
          size="small"
          sx={{ maxWidth: 400, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="outlined" 
          onClick={() => loadCatalog().catch(() => undefined)}
          disabled={loading}
          sx={{ height: 40 }}
        >
          تحديث القائمة
        </Button>
      </Paper>

      {/* Products Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ width: 60 }}></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>اسم المنتج</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>التصنيف</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>المتغيرات</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">لا توجد منتجات.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'بدون تصنيف';
                  return (
                    <TableRow key={product.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {product.images && product.images.length > 0 ? (
                            <Box component="img" src={product.images[0]?.url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <ImageIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{product.title}</Typography>
                        <Typography variant="caption" color="text.secondary" dir="ltr" display="block">/{product.slug}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={categoryName} variant="outlined" sx={{ borderRadius: 1.5 }} />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={statusLabels[product.status] || product.status} 
                          color={statusColors[product.status] || 'default'} 
                          size="small" 
                          sx={{ fontWeight: 700, borderRadius: 1.5 }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {product.variants?.length || 0} متغير
                        </Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<EditNoteIcon />}
                          onClick={() => loadProductDetails(product.id).catch(() => undefined)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// Helper functions kept exactly the same for payload construction

function buildProductPayload(form: typeof productFormDefault) {
  const payload: {
    title: string;
    slug?: string;
    description?: string;
    categoryId?: string;
    status: ProductStatus;
  } = {
    title: form.title.trim(),
    status: form.status,
  };

  const slug = form.slug.trim();
  const description = form.description.trim();
  const categoryId = form.categoryId.trim();

  if (slug) {
    payload.slug = slug;
  }
  if (description) {
    payload.description = description;
  }
  if (categoryId) {
    payload.categoryId = categoryId;
  }

  return payload;
}

function buildVariantPayload(form: ReturnType<typeof createVariantFormDefault>) {
  const payload: {
    title: string;
    sku: string;
    barcode?: string;
    price: number;
    compareAtPrice?: number;
    stockQuantity: number;
    lowStockThreshold: number;
    attributeValueIds: string[];
    isDefault: boolean;
  } = {
    title: form.title.trim(),
    sku: form.sku.trim(),
    price: Number(form.price || '0'),
    stockQuantity: Number(form.stockQuantity || '0'),
    lowStockThreshold: Number(form.lowStockThreshold || '0'),
    attributeValueIds: extractSelectedValueIds(form.selectedValueByAttributeId),
    isDefault: form.isDefault,
  };

  const barcode = form.barcode.trim();
  const compareAtPrice = form.compareAtPrice.trim();

  if (barcode) {
    payload.barcode = barcode;
  }
  if (compareAtPrice) {
    payload.compareAtPrice = Number(compareAtPrice);
  }

  return payload;
}

function buildAttachImagePayload(form: typeof imageFormDefault, mediaAssetId: string) {
  const payload: {
    mediaAssetId: string;
    variantId?: string;
    altText?: string;
    sortOrder: number;
  } = {
    mediaAssetId,
    sortOrder: Number(form.sortOrder || '0'),
  };

  const variantId = form.variantId.trim();
  const altText = form.altText.trim();

  if (variantId) {
    payload.variantId = variantId;
  }
  if (altText) {
    payload.altText = altText;
  }

  return payload;
}

function extractSelectedValueIds(selectedValueByAttributeId: Record<string, string>): string[] {
  return Object.values(selectedValueByAttributeId)
    .map((valueId) => valueId.trim())
    .filter((valueId) => valueId.length > 0);
}

function buildVariantValueSelection(
  attributes: Attribute[],
  attributeValueIds: string[],
): Record<string, string> {
  const selectedValueSet = new Set(attributeValueIds);
  const selectedByAttribute: Record<string, string> = {};

  for (const attribute of attributes) {
    for (const value of attribute.values ?? []) {
      if (!selectedValueSet.has(value.id)) {
        continue;
      }

      selectedByAttribute[attribute.id] = value.id;
      break;
    }
  }

  return selectedByAttribute;
}

function formatVariantAttributes(attributes: Record<string, string>): string {
  const entries = Object.entries(attributes);
  if (entries.length === 0) {
    return 'لا يوجد';
  }

  return entries.map(([key, value]) => `${key}:${value}`).join(', ');
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