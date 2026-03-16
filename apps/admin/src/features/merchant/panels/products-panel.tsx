import { useState } from 'react';
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
    <section className="card-grid">
      <article className="card">
        <h3>المنتجات</h3>
        <div className="actions">
          <button onClick={() => loadCatalog().catch(() => undefined)}>تحميل</button>
          <button className="primary" onClick={() => createProduct().catch(() => undefined)}>
            إنشاء
          </button>
          <button onClick={() => updateProduct().catch(() => undefined)}>تحديث</button>
          <button className="danger" onClick={() => deleteProduct().catch(() => undefined)}>
            حذف
          </button>
        </div>

        <label>
          العنوان
          <input
            value={productForm.title}
            onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))}
          />
        </label>
        <label>
          المسار المختصر
          <input
            value={productForm.slug}
            onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))}
          />
        </label>
        <label>
          الوصف
          <textarea
            value={productForm.description}
            onChange={(event) =>
              setProductForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </label>
        <label>
          التصنيف
          <select
            value={productForm.categoryId}
            onChange={(event) =>
              setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))
            }
          >
            <option value="">بدون تصنيف</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          الحالة
          <select
            value={productForm.status}
            onChange={(event) =>
              setProductForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))
            }
          >
            <option value="draft">مسودة</option>
            <option value="active">نشط</option>
            <option value="archived">مؤرشف</option>
          </select>
        </label>

        {message ? <p className="status-message">{message}</p> : null}
      </article>

      <article className="card">
        <h3>قائمة المنتجات</h3>
        <div className="list">
          {products.map((product) => (
            <article key={product.id} className="list-item">
              <h4>{product.title}</h4>
              <p>
                {product.slug} - {product.status}
              </p>
              <button onClick={() => loadProductDetails(product.id).catch(() => undefined)}>
                إدارة
              </button>
            </article>
          ))}
          {products.length === 0 ? <p className="hint">لا توجد منتجات محملة.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>المتغيرات والصور</h3>
        {selectedProduct ? (
          <p>المحدد: {selectedProduct.title}</p>
        ) : (
          <p>اختر منتجاً لإدارة الوسائط.</p>
        )}

        <h4>إضافة متغير</h4>
        <label>
          العنوان
          <input
            value={variantForm.title}
            onChange={(event) => setVariantForm((prev) => ({ ...prev, title: event.target.value }))}
          />
        </label>
        <label>
          SKU
          <input
            value={variantForm.sku}
            onChange={(event) => setVariantForm((prev) => ({ ...prev, sku: event.target.value }))}
          />
        </label>
        <label>
          الباركود
          <input
            value={variantForm.barcode}
            onChange={(event) =>
              setVariantForm((prev) => ({ ...prev, barcode: event.target.value }))
            }
          />
        </label>
        <label>
          السعر
          <input
            type="number"
            min={0}
            step={0.01}
            value={variantForm.price}
            onChange={(event) => setVariantForm((prev) => ({ ...prev, price: event.target.value }))}
          />
        </label>
        <label>
          سعر المقارنة
          <input
            type="number"
            min={0}
            step={0.01}
            value={variantForm.compareAtPrice}
            onChange={(event) =>
              setVariantForm((prev) => ({ ...prev, compareAtPrice: event.target.value }))
            }
          />
        </label>
        <label>
          كمية المخزون
          <input
            type="number"
            min={0}
            value={variantForm.stockQuantity}
            onChange={(event) =>
              setVariantForm((prev) => ({ ...prev, stockQuantity: event.target.value }))
            }
          />
        </label>
        <label>
          حد انخفاض المخزون
          <input
            type="number"
            min={0}
            value={variantForm.lowStockThreshold}
            onChange={(event) =>
              setVariantForm((prev) => ({ ...prev, lowStockThreshold: event.target.value }))
            }
          />
        </label>
        {attributes.length > 0 ? (
          <>
            <p className="hint">قيم خصائص المتغير</p>
            {attributes.map((attribute) => (
              <label key={attribute.id}>
                {attribute.name}
                <select
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
                  <option value="">بدون قيمة</option>
                  {(attribute.values ?? []).map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </>
        ) : (
          <p className="hint">لا توجد خصائص متاحة. أنشئها من تبويب الخصائص.</p>
        )}
        <label className="inline-check">
          <input
            type="checkbox"
            checked={variantForm.isDefault}
            onChange={(event) =>
              setVariantForm((prev) => ({ ...prev, isDefault: event.target.checked }))
            }
          />
          المتغير الافتراضي
        </label>
        <button onClick={() => addVariant().catch(() => undefined)}>إضافة متغير</button>
        <button onClick={() => updateVariantAttributes().catch(() => undefined)}>
          تحديث خصائص المتغير
        </button>
        {selectedVariantId ? <p className="hint">تعديل المتغير: {selectedVariantId}</p> : null}

        <h4>رفع وربط صورة</h4>
        <label>
          الملف
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          معرّف المتغير (اختياري)
          <input
            value={imageForm.variantId}
            onChange={(event) =>
              setImageForm((prev) => ({ ...prev, variantId: event.target.value }))
            }
          />
        </label>
        <label>
          النص البديل
          <input
            value={imageForm.altText}
            onChange={(event) => setImageForm((prev) => ({ ...prev, altText: event.target.value }))}
          />
        </label>
        <label>
          ترتيب العرض
          <input
            type="number"
            min={0}
            value={imageForm.sortOrder}
            onChange={(event) =>
              setImageForm((prev) => ({ ...prev, sortOrder: event.target.value }))
            }
          />
        </label>
        <button onClick={() => uploadAndAttachImage().catch(() => undefined)}>رفع الصورة</button>

        <h4>المتغيرات الحالية</h4>
        <div className="list compact-list">
          {(selectedProduct?.variants ?? []).map((variant: ProductVariant) => (
            <article key={variant.id} className="list-item">
              <p>
                {variant.title} ({variant.sku}) - المخزون {variant.stockQuantity} (الحد{' '}
                {variant.lowStockThreshold})
              </p>
              <p>الخصائص: {formatVariantAttributes(variant.attributes)}</p>
              <button onClick={() => selectVariantAttributes(variant)}>تحميل القيم</button>
            </article>
          ))}
        </div>

        <h4>الصور الحالية</h4>
        <div className="list compact-list">
          {(selectedProduct?.images ?? []).map((image) => (
            <article key={image.id} className="list-item">
              <p>{image.url}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
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
