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
      setMessage('Products, categories, and attributes loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load products');
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
      setMessage(error instanceof Error ? error.message : 'Failed to load product details');
    }
  }

  async function updateVariantAttributes(): Promise<void> {
    if (!selectedProduct) {
      setMessage('Select a product first');
      return;
    }
    if (!selectedVariantId) {
      setMessage('Select a variant first');
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
      setMessage('Variant attributes updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update variant attributes');
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
      setMessage('Product created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create product');
    }
  }

  async function updateProduct(): Promise<void> {
    if (!selectedProduct) {
      setMessage('Select a product first');
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
      setMessage('Product updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update product');
    }
  }

  async function deleteProduct(): Promise<void> {
    if (!selectedProduct) {
      setMessage('Select a product first');
      return;
    }

    setMessage('');
    try {
      await request(`/products/${selectedProduct.id}`, { method: 'DELETE' });
      setSelectedProduct(null);
      setProductForm(productFormDefault);
      await loadCatalog();
      setMessage('Product deleted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete product');
    }
  }

  async function addVariant(): Promise<void> {
    if (!selectedProduct) {
      setMessage('Select a product first');
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
      setMessage('Variant added');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add variant');
    }
  }

  async function uploadAndAttachImage(): Promise<void> {
    if (!selectedProduct) {
      setMessage('Select a product first');
      return;
    }
    if (!imageFile) {
      setMessage('Choose an image file');
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
      setMessage('Image uploaded and attached');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Products</h3>
        <div className="actions">
          <button onClick={() => loadCatalog().catch(() => undefined)}>Load</button>
          <button className="primary" onClick={() => createProduct().catch(() => undefined)}>
            Create
          </button>
          <button onClick={() => updateProduct().catch(() => undefined)}>Update</button>
          <button className="danger" onClick={() => deleteProduct().catch(() => undefined)}>
            Delete
          </button>
        </div>

        <label>
          Title
          <input
            value={productForm.title}
            onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))}
          />
        </label>
        <label>
          Slug
          <input
            value={productForm.slug}
            onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))}
          />
        </label>
        <label>
          Description
          <textarea
            value={productForm.description}
            onChange={(event) =>
              setProductForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </label>
        <label>
          Category
          <select
            value={productForm.categoryId}
            onChange={(event) =>
              setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))
            }
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={productForm.status}
            onChange={(event) =>
              setProductForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))
            }
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>

        {message ? <p className="status-message">{message}</p> : null}
      </article>

      <article className="card">
        <h3>Product List</h3>
        <div className="list">
          {products.map((product) => (
            <article key={product.id} className="list-item">
              <h4>{product.title}</h4>
              <p>
                {product.slug} - {product.status}
              </p>
              <button onClick={() => loadProductDetails(product.id).catch(() => undefined)}>
                Manage
              </button>
            </article>
          ))}
          {products.length === 0 ? <p className="hint">No products loaded.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>Variants and Images</h3>
        {selectedProduct ? (
          <p>Selected: {selectedProduct.title}</p>
        ) : (
          <p>Select a product to manage media.</p>
        )}

        <h4>Add Variant</h4>
        <label>
          Title
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
          Barcode
          <input
            value={variantForm.barcode}
            onChange={(event) =>
              setVariantForm((prev) => ({ ...prev, barcode: event.target.value }))
            }
          />
        </label>
        <label>
          Price
          <input
            type="number"
            min={0}
            step={0.01}
            value={variantForm.price}
            onChange={(event) => setVariantForm((prev) => ({ ...prev, price: event.target.value }))}
          />
        </label>
        <label>
          Compare At Price
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
          Stock Quantity
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
          Low Stock Threshold
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
            <p className="hint">Variant Attribute Values</p>
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
                  <option value="">No value</option>
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
          <p className="hint">No attributes available. Create them in the Attributes tab.</p>
        )}
        <label className="inline-check">
          <input
            type="checkbox"
            checked={variantForm.isDefault}
            onChange={(event) =>
              setVariantForm((prev) => ({ ...prev, isDefault: event.target.checked }))
            }
          />
          Default Variant
        </label>
        <button onClick={() => addVariant().catch(() => undefined)}>Add Variant</button>
        <button onClick={() => updateVariantAttributes().catch(() => undefined)}>
          Update Variant Attributes
        </button>
        {selectedVariantId ? <p className="hint">Editing variant: {selectedVariantId}</p> : null}

        <h4>Upload and Attach Image</h4>
        <label>
          File
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Variant ID (optional)
          <input
            value={imageForm.variantId}
            onChange={(event) =>
              setImageForm((prev) => ({ ...prev, variantId: event.target.value }))
            }
          />
        </label>
        <label>
          Alt Text
          <input
            value={imageForm.altText}
            onChange={(event) => setImageForm((prev) => ({ ...prev, altText: event.target.value }))}
          />
        </label>
        <label>
          Sort Order
          <input
            type="number"
            min={0}
            value={imageForm.sortOrder}
            onChange={(event) =>
              setImageForm((prev) => ({ ...prev, sortOrder: event.target.value }))
            }
          />
        </label>
        <button onClick={() => uploadAndAttachImage().catch(() => undefined)}>Upload Image</button>

        <h4>Current Variants</h4>
        <div className="list compact-list">
          {(selectedProduct?.variants ?? []).map((variant: ProductVariant) => (
            <article key={variant.id} className="list-item">
              <p>
                {variant.title} ({variant.sku}) - stock {variant.stockQuantity} (low at{' '}
                {variant.lowStockThreshold})
              </p>
              <p>Attributes: {formatVariantAttributes(variant.attributes)}</p>
              <button onClick={() => selectVariantAttributes(variant)}>Load Values</button>
            </article>
          ))}
        </div>

        <h4>Current Images</h4>
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
    return 'none';
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
    throw new Error('Failed to get presigned upload URL');
  }

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: presigned.uploadHeaders,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Direct media upload failed');
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
    throw new Error('Failed to confirm uploaded media');
  }

  return mediaAsset;
}
