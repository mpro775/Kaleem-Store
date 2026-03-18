import { useState } from 'react';
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

export function ProductsPanel({ request }: ProductsPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [productForm, setProductForm] = useState(productFormDefault);
  const [variantForm, setVariantForm] = useState(createVariantFormDefault);
  const [imageForm, setImageForm] = useState(imageFormDefault);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  async function loadCatalog(): Promise<void> {
    setMessage('');
    try {
      const [productsData, categoriesData, attributesData] = await Promise.all([
        request<ProductListResponse>('/products?page=1&limit=30', { method: 'GET' }),
        request<Category[]>('/categories', { method: 'GET' }),
        request<Attribute[]>('/attributes?includeValues=true', { method: 'GET' }),
      ]);

      setProducts(productsData?.items ?? []);
      setCategories(categoriesData ?? []);
      setAttributes(attributesData ?? []);
      setMessage('تم تحميل المنتجات والتصنيفات والخصائص');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل المنتجات');
    }
  }

  async function loadProductDetails(productId: string): Promise<void> {
    setMessage('');
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
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل تفاصيل المنتج');
    }
  }

  async function updateVariantAttributes(): Promise<void> {
    if (!selectedProduct) {
      setMessage('اختر منتجاً أولاً');
      return;
    }
    if (!selectedVariantId) {
      setMessage('اختر متغيراً أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/products/${selectedProduct.id}/variants/${selectedVariantId}/attributes`, {
        method: 'PUT',
        body: JSON.stringify({
          attributeValueIds: extractSelectedValueIds(variantForm.selectedValueByAttributeId),
        }),
      });
      await loadProductDetails(selectedProduct.id);
      setMessage('تم تحديث خصائص المتغير');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث خصائص المتغير');
    }
  }

  function selectVariantAttributes(variant: ProductVariant): void {
    setSelectedVariantId(variant.id);
    setVariantForm((prev) => ({
      ...prev,
      selectedValueByAttributeId: buildVariantValueSelection(attributes, variant.attributeValueIds),
    }));
  }

  async function createProduct(): Promise<void> {
    setMessage('');
    try {
      await request('/products', {
        method: 'POST',
        body: JSON.stringify(buildProductPayload(productForm)),
      });
      setProductForm(productFormDefault);
      await loadCatalog();
      setMessage('تم إنشاء المنتج');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء المنتج');
    }
  }

  async function updateProduct(): Promise<void> {
    if (!selectedProduct) {
      setMessage('اختر منتجاً أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(buildProductPayload(productForm)),
      });
      await loadCatalog();
      await loadProductDetails(selectedProduct.id);
      setMessage('تم تحديث المنتج');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث المنتج');
    }
  }

  async function deleteProduct(): Promise<void> {
    if (!selectedProduct) {
      setMessage('اختر منتجاً أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/products/${selectedProduct.id}`, { method: 'DELETE' });
      setSelectedProduct(null);
      setProductForm(productFormDefault);
      await loadCatalog();
      setMessage('تم حذف المنتج');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف المنتج');
    }
  }

  async function addVariant(): Promise<void> {
    if (!selectedProduct) {
      setMessage('اختر منتجاً أولاً');
      return;
    }

    setMessage('');
    try {
      await request(`/products/${selectedProduct.id}/variants`, {
        method: 'POST',
        body: JSON.stringify(buildVariantPayload(variantForm)),
      });
      setVariantForm(createVariantFormDefault());
      await loadProductDetails(selectedProduct.id);
      setMessage('تمت إضافة المتغير');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إضافة المتغير');
    }
  }

  async function uploadAndAttachImage(): Promise<void> {
    if (!selectedProduct) {
      setMessage('اختر منتجاً أولاً');
      return;
    }
    if (!imageFile) {
      setMessage('اختر ملف صورة');
      return;
    }

    setMessage('');
    try {
      const mediaAsset = await uploadMediaAsset(request, imageFile);
      await request(`/products/${selectedProduct.id}/images`, {
        method: 'POST',
        body: JSON.stringify(buildAttachImagePayload(imageForm, mediaAsset.id)),
      });

      setImageForm(imageFormDefault);
      setImageFile(null);
      await loadProductDetails(selectedProduct.id);
      setMessage('تم رفع الصورة وربطها');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر رفع الصورة');
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">المنتجات</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadCatalog().catch(() => undefined)}>تحميل</Button>
          <Button variant="contained" onClick={() => createProduct().catch(() => undefined)}>إنشاء</Button>
          <Button variant="outlined" onClick={() => updateProduct().catch(() => undefined)}>تحديث</Button>
          <Button color="error" variant="outlined" onClick={() => deleteProduct().catch(() => undefined)}>حذف</Button>
        </Stack>

        <TextField label="العنوان" value={productForm.title} onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))} />
        <TextField label="المسار المختصر" value={productForm.slug} onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))} />
        <TextField label="الوصف" multiline minRows={4} value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} />
        <TextField select label="التصنيف" value={productForm.categoryId} onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
          <MenuItem value="">بدون تصنيف</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="الحالة" value={productForm.status} onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}>
          <MenuItem value="draft">مسودة</MenuItem>
          <MenuItem value="active">نشط</MenuItem>
          <MenuItem value="archived">مؤرشف</MenuItem>
        </TextField>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">قائمة المنتجات</Typography>
        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {products.map((product) => (
            <Paper key={product.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle2">{product.title}</Typography>
              <Typography variant="body2">{product.slug} - {product.status}</Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => loadProductDetails(product.id).catch(() => undefined)}>إدارة</Button>
            </Paper>
          ))}
          {products.length === 0 ? <Typography color="text.secondary">لا توجد منتجات محملة.</Typography> : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1, gridColumn: { xs: 'auto', xl: '1 / -1' } }}>
        <Typography variant="h6">المتغيرات والصور</Typography>
        <Typography color="text.secondary">{selectedProduct ? `المحدد: ${selectedProduct.title}` : 'اختر منتجاً لإدارة الوسائط.'}</Typography>

        <Typography variant="subtitle1">إضافة متغير</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField label="العنوان" value={variantForm.title} onChange={(event) => setVariantForm((prev) => ({ ...prev, title: event.target.value }))} />
          <TextField label="SKU" value={variantForm.sku} onChange={(event) => setVariantForm((prev) => ({ ...prev, sku: event.target.value }))} />
          <TextField label="الباركود" value={variantForm.barcode} onChange={(event) => setVariantForm((prev) => ({ ...prev, barcode: event.target.value }))} />
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField label="السعر" type="number" inputProps={{ min: 0, step: 0.01 }} value={variantForm.price} onChange={(event) => setVariantForm((prev) => ({ ...prev, price: event.target.value }))} />
          <TextField label="سعر المقارنة" type="number" inputProps={{ min: 0, step: 0.01 }} value={variantForm.compareAtPrice} onChange={(event) => setVariantForm((prev) => ({ ...prev, compareAtPrice: event.target.value }))} />
          <TextField label="كمية المخزون" type="number" inputProps={{ min: 0 }} value={variantForm.stockQuantity} onChange={(event) => setVariantForm((prev) => ({ ...prev, stockQuantity: event.target.value }))} />
          <TextField label="حد انخفاض المخزون" type="number" inputProps={{ min: 0 }} value={variantForm.lowStockThreshold} onChange={(event) => setVariantForm((prev) => ({ ...prev, lowStockThreshold: event.target.value }))} />
        </Stack>

        {attributes.length > 0 ? (
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
            {attributes.map((attribute) => (
              <TextField
                key={attribute.id}
                select
                label={attribute.name}
                value={variantForm.selectedValueByAttributeId[attribute.id] ?? ''}
                onChange={(event) =>
                  setVariantForm((prev) => ({
                    ...prev,
                    selectedValueByAttributeId: {
                      ...prev.selectedValueByAttributeId,
                      [attribute.id]: event.target.value,
                    },
                  }))
                }
              >
                <MenuItem value="">بدون قيمة</MenuItem>
                {(attribute.values ?? []).map((value) => (
                  <MenuItem key={value.id} value={value.id}>
                    {value.value}
                  </MenuItem>
                ))}
              </TextField>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">لا توجد خصائص متاحة. أنشئها من تبويب الخصائص.</Typography>
        )}

        <FormControlLabel control={<Checkbox checked={variantForm.isDefault} onChange={(event) => setVariantForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />} label="المتغير الافتراضي" />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" onClick={() => addVariant().catch(() => undefined)}>إضافة متغير</Button>
          <Button variant="outlined" onClick={() => updateVariantAttributes().catch(() => undefined)}>تحديث خصائص المتغير</Button>
        </Stack>
        {selectedVariantId ? <Typography color="text.secondary">تعديل المتغير: {selectedVariantId}</Typography> : null}

        <Typography variant="subtitle1">رفع وربط صورة</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField type="file" inputProps={{ accept: 'image/*' }} onChange={(event) => setImageFile((event.target as HTMLInputElement).files?.[0] ?? null)} />
          <TextField label="معرّف المتغير (اختياري)" value={imageForm.variantId} onChange={(event) => setImageForm((prev) => ({ ...prev, variantId: event.target.value }))} />
          <TextField label="النص البديل" value={imageForm.altText} onChange={(event) => setImageForm((prev) => ({ ...prev, altText: event.target.value }))} />
          <TextField label="ترتيب العرض" type="number" inputProps={{ min: 0 }} value={imageForm.sortOrder} onChange={(event) => setImageForm((prev) => ({ ...prev, sortOrder: event.target.value }))} />
        </Stack>
        <Button variant="outlined" sx={{ width: 'fit-content' }} onClick={() => uploadAndAttachImage().catch(() => undefined)}>رفع الصورة</Button>

        <Typography variant="subtitle1">المتغيرات الحالية</Typography>
        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {(selectedProduct?.variants ?? []).map((variant: ProductVariant) => (
            <Paper key={variant.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2">{variant.title} ({variant.sku}) - المخزون {variant.stockQuantity} (الحد {variant.lowStockThreshold})</Typography>
              <Typography variant="body2">الخصائص: {formatVariantAttributes(variant.attributes)}</Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectVariantAttributes(variant)}>تحميل القيم</Button>
            </Paper>
          ))}
        </Box>

        <Typography variant="subtitle1">الصور الحالية</Typography>
        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {(selectedProduct?.images ?? []).map((image) => (
            <Paper key={image.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="body2">{image.url}</Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {message ? <Alert severity="info" sx={{ gridColumn: { xs: 'auto', xl: '1 / -1' } }}>{message}</Alert> : null}
    </Box>
  );
}

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
