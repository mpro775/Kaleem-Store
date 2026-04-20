import { useEffect, useRef, useState, type ChangeEvent } from 'react';
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
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import StyleIcon from '@mui/icons-material/Style';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import type { MerchantRequester } from '../merchant-dashboard.types';
import { AppPage, DataTableWrapper, FilterBar, PageHeader } from '../components/ui';
import type {
  Attribute,
  Category,
  MediaAsset,
  PresignedMediaUpload,
  Product,
  ProductListResponse,
  ProductType,
  ProductStatus,
  ProductVariant,
} from '../types';

interface ProductsPanelProps {
  request: MerchantRequester;
}

const productFormDefault = {
  productType: 'single' as ProductType,
  isVisible: true,
  title: '',
  slug: '',
  description: '',
  categoryId: '',
  status: 'draft' as ProductStatus,
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
  shortDescriptionAr: '',
  shortDescriptionEn: '',
  detailedDescriptionAr: '',
  detailedDescriptionEn: '',
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
    titleAr: '',
    titleEn: '',
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
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [hasChosenProductType, setHasChosenProductType] = useState(true);
  
  const [productForm, setProductForm] = useState(productFormDefault);
  const [variantForm, setVariantForm] = useState(createVariantFormDefault);
  const [imageForm, setImageForm] = useState(imageFormDefault);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formBrand, setFormBrand] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [formDimensionsLength, setFormDimensionsLength] = useState('');
  const [formDimensionsWidth, setFormDimensionsWidth] = useState('');
  const [formDimensionsHeight, setFormDimensionsHeight] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsTaxable, setFormIsTaxable] = useState(false);
  const [formTaxRate, setFormTaxRate] = useState('');
  const [formMinOrderQuantity, setFormMinOrderQuantity] = useState('');
  const [formMaxOrderQuantity, setFormMaxOrderQuantity] = useState('');
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formRelatedProductIds, setFormRelatedProductIds] = useState<string[]>([]);
  const [formWeightUnit, setFormWeightUnit] = useState('');
  const [formProductLabel, setFormProductLabel] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formSeoTitleAr, setFormSeoTitleAr] = useState('');
  const [formSeoTitleEn, setFormSeoTitleEn] = useState('');
  const [formSeoDescriptionAr, setFormSeoDescriptionAr] = useState('');
  const [formSeoDescriptionEn, setFormSeoDescriptionEn] = useState('');
  const [formStockUnlimited, setFormStockUnlimited] = useState(false);
  const [formInlineDiscountEnabled, setFormInlineDiscountEnabled] = useState(false);
  const [formInlineDiscountType, setFormInlineDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [formInlineDiscountValue, setFormInlineDiscountValue] = useState('');
  const [formInlineDiscountStartsAt, setFormInlineDiscountStartsAt] = useState('');
  const [formInlineDiscountEndsAt, setFormInlineDiscountEndsAt] = useState('');
  const [formCustomFieldsJson, setFormCustomFieldsJson] = useState('[]');
  const [bundleItems, setBundleItems] = useState<Array<{ bundledProductId: string; quantity: string }>>([]);
  const [digitalFiles, setDigitalFiles] = useState<
    Array<{ mediaAssetId: string; fileName: string; sortOrder: string; url: string; fileSizeBytes: number }>
  >([]);
  const [digitalUploadFile, setDigitalUploadFile] = useState<File | null>(null);
  const [digitalUploadName, setDigitalUploadName] = useState('');
  const [formDigitalDownloadAttemptsLimit, setFormDigitalDownloadAttemptsLimit] = useState('');
  const [formDigitalDownloadExpiresAt, setFormDigitalDownloadExpiresAt] = useState('');

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCatalog().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (productForm.productType === 'digital' || productForm.productType === 'bundled') {
      setFormStockUnlimited(true);
    }
  }, [productForm.productType]);

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
        setHasChosenProductType(true);
        setProductForm({
          productType: (data as any).productType ?? 'single',
          isVisible: (data as any).isVisible ?? true,
          title: data.title,
          slug: data.slug,
          description: data.description ?? '',
          categoryId: data.categoryId ?? '',
          status: data.status,
          titleAr: (data as any).titleAr ?? data.title,
          titleEn: (data as any).titleEn ?? '',
          descriptionAr: (data as any).descriptionAr ?? '',
          descriptionEn: (data as any).descriptionEn ?? '',
          shortDescriptionAr: (data as any).shortDescriptionAr ?? '',
          shortDescriptionEn: (data as any).shortDescriptionEn ?? '',
          detailedDescriptionAr: (data as any).detailedDescriptionAr ?? '',
          detailedDescriptionEn: (data as any).detailedDescriptionEn ?? '',
        });
        const d = data as any;
        setFormBrand(d.brand ?? '');
        setFormWeight(d.weight != null ? String(d.weight) : '');
        setFormWeightUnit(d.weightUnit ?? '');
        setFormCostPrice(d.costPrice != null ? String(d.costPrice) : '');
        setFormSeoTitle(d.seoTitle ?? '');
        setFormSeoDescription(d.seoDescription ?? '');
        setFormSeoTitleAr(d.seoTitleAr ?? '');
        setFormSeoTitleEn(d.seoTitleEn ?? '');
        setFormSeoDescriptionAr(d.seoDescriptionAr ?? '');
        setFormSeoDescriptionEn(d.seoDescriptionEn ?? '');
        setFormDimensionsLength(d.dimensions?.length != null ? String(d.dimensions.length) : '');
        setFormDimensionsWidth(d.dimensions?.width != null ? String(d.dimensions.width) : '');
        setFormDimensionsHeight(d.dimensions?.height != null ? String(d.dimensions.height) : '');
        setFormTags(Array.isArray(d.tags) ? d.tags.join(', ') : '');
        setFormIsFeatured(Boolean(d.isFeatured));
        setFormIsTaxable(Boolean(d.isTaxable));
        setFormTaxRate(d.taxRate != null ? String(d.taxRate) : '');
        setFormMinOrderQuantity(d.minOrderQuantity != null ? String(d.minOrderQuantity) : '');
        setFormMaxOrderQuantity(d.maxOrderQuantity != null ? String(d.maxOrderQuantity) : '');
        setFormCategoryIds(Array.isArray(d.categoryIds) ? d.categoryIds : d.categoryId ? [d.categoryId] : []);
        setFormRelatedProductIds(Array.isArray(d.relatedProductIds) ? d.relatedProductIds : []);
        setFormProductLabel(d.productLabel ?? '');
        setFormYoutubeUrl(d.youtubeUrl ?? '');
        setFormStockUnlimited(Boolean(d.stockUnlimited));
        setFormInlineDiscountEnabled(Boolean(d.inlineDiscount));
        setFormInlineDiscountType(d.inlineDiscount?.type ?? 'percent');
        setFormInlineDiscountValue(d.inlineDiscount?.value != null ? String(d.inlineDiscount.value) : '');
        setFormInlineDiscountStartsAt(d.inlineDiscount?.startsAt ? String(d.inlineDiscount.startsAt).slice(0, 16) : '');
        setFormInlineDiscountEndsAt(d.inlineDiscount?.endsAt ? String(d.inlineDiscount.endsAt).slice(0, 16) : '');
        setFormCustomFieldsJson(
          Array.isArray(d.customFields) ? JSON.stringify(d.customFields, null, 2) : '[]',
        );
        setBundleItems(
          Array.isArray(d.bundleItems)
            ? d.bundleItems.map((item: any) => ({
                bundledProductId: item.bundledProductId,
                quantity: String(item.quantity ?? 1),
              }))
            : [],
        );
        setDigitalFiles(
          Array.isArray(d.digitalFiles)
            ? d.digitalFiles.map((file: any) => ({
                mediaAssetId: file.mediaAssetId,
                fileName: file.fileName ?? '',
                sortOrder: String(file.sortOrder ?? 0),
                url: file.url,
                fileSizeBytes: file.fileSizeBytes ?? 0,
              }))
            : [],
        );
        setFormDigitalDownloadAttemptsLimit(
          d.digitalDownloadAttemptsLimit != null ? String(d.digitalDownloadAttemptsLimit) : '',
        );
        setFormDigitalDownloadExpiresAt(
          d.digitalDownloadExpiresAt ? String(d.digitalDownloadExpiresAt).slice(0, 16) : '',
        );
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل تفاصيل المنتج', type: 'error' });
      setViewMode('list');
    } finally {
      setDetailLoading(false);
    }
  }

  async function exportProductsToExcel(): Promise<void> {
    setExportLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const file = await request<Blob>(
        '/products/export/excel',
        { method: 'GET' },
        { responseType: 'blob' },
      );

      if (!file) {
        throw new Error('تعذر إنشاء ملف التصدير');
      }

      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage({ text: 'تم تصدير المنتجات إلى ملف Excel بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تصدير المنتجات', type: 'error' });
    } finally {
      setExportLoading(false);
    }
  }

  async function importProductsFromExcel(file: File): Promise<void> {
    setImportLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await request<{
        totalRows: number;
        created: number;
        updated: number;
        failed: number;
        errors: Array<{ row: number; message: string }>;
      }>('/products/import/excel', {
        method: 'POST',
        body: formData,
      });

      const summary = result
        ? `اكتمل الاستيراد: ${result.created} إنشاء، ${result.updated} تحديث، ${result.failed} فشل من أصل ${result.totalRows} صف.`
        : 'اكتمل الاستيراد.';
      const firstError = result?.errors?.[0];
      setMessage({
        text: firstError ? `${summary} أول خطأ في الصف ${firstError.row}: ${firstError.message}` : summary,
        type: result && result.failed > 0 ? 'error' : 'success',
      });

      await loadCatalog();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر استيراد المنتجات', type: 'error' });
    } finally {
      setImportLoading(false);
      if (importFileRef.current) {
        importFileRef.current.value = '';
      }
    }
  }

  function openImportFileDialog(): void {
    importFileRef.current?.click();
  }

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    importProductsFromExcel(file).catch(() => undefined);
  }

  function handleCreateNew() {
    setSelectedProduct(null);
    setSelectedVariantId('');
    setProductForm(productFormDefault);
    setVariantForm(createVariantFormDefault());
    setImageForm(imageFormDefault);
    setImageFile(null);
    setFormBrand('');
    setFormWeight('');
    setFormWeightUnit('');
    setFormCostPrice('');
    setFormSeoTitle('');
    setFormSeoDescription('');
    setFormSeoTitleAr('');
    setFormSeoTitleEn('');
    setFormSeoDescriptionAr('');
    setFormSeoDescriptionEn('');
    setFormDimensionsLength('');
    setFormDimensionsWidth('');
    setFormDimensionsHeight('');
    setFormTags('');
    setFormIsFeatured(false);
    setFormIsTaxable(false);
    setFormTaxRate('');
    setFormMinOrderQuantity('');
    setFormMaxOrderQuantity('');
    setFormCategoryIds([]);
    setFormRelatedProductIds([]);
    setFormProductLabel('');
    setFormYoutubeUrl('');
    setFormStockUnlimited(false);
    setFormInlineDiscountEnabled(false);
    setFormInlineDiscountType('percent');
    setFormInlineDiscountValue('');
    setFormInlineDiscountStartsAt('');
    setFormInlineDiscountEndsAt('');
    setFormCustomFieldsJson('[]');
    setBundleItems([]);
    setDigitalFiles([]);
    setDigitalUploadFile(null);
    setDigitalUploadName('');
    setFormDigitalDownloadAttemptsLimit('');
    setFormDigitalDownloadExpiresAt('');
    setMessage({ text: '', type: 'info' });
    setHasChosenProductType(false);
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
        body: JSON.stringify(buildProductPayload(productForm, {
          brand: formBrand, weight: formWeight, costPrice: formCostPrice,
          seoTitle: formSeoTitle, seoDescription: formSeoDescription,
          seoTitleAr: formSeoTitleAr, seoTitleEn: formSeoTitleEn,
          seoDescriptionAr: formSeoDescriptionAr, seoDescriptionEn: formSeoDescriptionEn,
          dimensionsLength: formDimensionsLength, dimensionsWidth: formDimensionsWidth, dimensionsHeight: formDimensionsHeight,
          tags: formTags, isFeatured: formIsFeatured, isTaxable: formIsTaxable, taxRate: formTaxRate,
          minOrderQuantity: formMinOrderQuantity, maxOrderQuantity: formMaxOrderQuantity,
          categoryIds: formCategoryIds,
          relatedProductIds: formRelatedProductIds,
          weightUnit: formWeightUnit,
          productLabel: formProductLabel,
          youtubeUrl: formYoutubeUrl,
          stockUnlimited: formStockUnlimited,
          inlineDiscountEnabled: formInlineDiscountEnabled,
          inlineDiscountType: formInlineDiscountType,
          inlineDiscountValue: formInlineDiscountValue,
          inlineDiscountStartsAt: formInlineDiscountStartsAt,
          inlineDiscountEndsAt: formInlineDiscountEndsAt,
          customFieldsJson: formCustomFieldsJson,
          shortDescriptionAr: productForm.shortDescriptionAr,
          shortDescriptionEn: productForm.shortDescriptionEn,
          detailedDescriptionAr: productForm.detailedDescriptionAr,
          detailedDescriptionEn: productForm.detailedDescriptionEn,
          bundleItems,
          digitalFiles,
          digitalDownloadAttemptsLimit: formDigitalDownloadAttemptsLimit,
          digitalDownloadExpiresAt: formDigitalDownloadExpiresAt,
        })),
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
        body: JSON.stringify(buildProductPayload(productForm, {
          brand: formBrand, weight: formWeight, costPrice: formCostPrice,
          seoTitle: formSeoTitle, seoDescription: formSeoDescription,
          seoTitleAr: formSeoTitleAr, seoTitleEn: formSeoTitleEn,
          seoDescriptionAr: formSeoDescriptionAr, seoDescriptionEn: formSeoDescriptionEn,
          dimensionsLength: formDimensionsLength, dimensionsWidth: formDimensionsWidth, dimensionsHeight: formDimensionsHeight,
          tags: formTags, isFeatured: formIsFeatured, isTaxable: formIsTaxable, taxRate: formTaxRate,
          minOrderQuantity: formMinOrderQuantity, maxOrderQuantity: formMaxOrderQuantity,
          categoryIds: formCategoryIds,
          relatedProductIds: formRelatedProductIds,
          weightUnit: formWeightUnit,
          productLabel: formProductLabel,
          youtubeUrl: formYoutubeUrl,
          stockUnlimited: formStockUnlimited,
          inlineDiscountEnabled: formInlineDiscountEnabled,
          inlineDiscountType: formInlineDiscountType,
          inlineDiscountValue: formInlineDiscountValue,
          inlineDiscountStartsAt: formInlineDiscountStartsAt,
          inlineDiscountEndsAt: formInlineDiscountEndsAt,
          customFieldsJson: formCustomFieldsJson,
          shortDescriptionAr: productForm.shortDescriptionAr,
          shortDescriptionEn: productForm.shortDescriptionEn,
          detailedDescriptionAr: productForm.detailedDescriptionAr,
          detailedDescriptionEn: productForm.detailedDescriptionEn,
          bundleItems,
          digitalFiles,
          digitalDownloadAttemptsLimit: formDigitalDownloadAttemptsLimit,
          digitalDownloadExpiresAt: formDigitalDownloadExpiresAt,
        })),
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
        body: JSON.stringify(buildVariantPayload(variantForm, productForm.productType !== 'single')),
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
      titleAr: (variant as any).titleAr ?? variant.title,
      titleEn: (variant as any).titleEn ?? '',
    });
    setMessage({ text: 'تم تحميل بيانات المتغير للتعديل', type: 'info' });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function uploadAndAttachImage(isPrimary: boolean): Promise<void> {
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
        body: JSON.stringify(buildAttachImagePayload(imageForm, mediaAsset.id, isPrimary)),
      });

      setImageForm(imageFormDefault);
      setImageFile(null);
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: isPrimary ? 'تم رفع الصورة الرئيسية بنجاح' : 'تم رفع الصورة الإضافية بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر رفع الصورة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function uploadDigitalFileAsset(): Promise<void> {
    if (!digitalUploadFile) {
      setMessage({ text: 'اختر ملفاً رقمياً أولاً', type: 'error' });
      return;
    }

    if (digitalFiles.length >= 10) {
      setMessage({ text: 'الحد الأقصى للملفات الرقمية هو 10 ملفات لكل منتج', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const mediaAsset = await uploadMediaAsset(request, digitalUploadFile);
      setDigitalFiles((current) => [
        ...current,
        {
          mediaAssetId: mediaAsset.id,
          fileName: digitalUploadName.trim() || digitalUploadFile.name,
          sortOrder: String(current.length),
          url: mediaAsset.url,
          fileSizeBytes: mediaAsset.fileSizeBytes,
        },
      ]);
      setDigitalUploadFile(null);
      setDigitalUploadName('');
      setMessage({ text: 'تم رفع الملف الرقمي وإضافته لقائمة ملفات المنتج', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر رفع الملف الرقمي', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase()));
  const isSingleProduct = productForm.productType === 'single';
  const isBundledProduct = productForm.productType === 'bundled';
  const isDigitalProduct = productForm.productType === 'digital';

  // --- DETAIL VIEW ---
  if (viewMode === 'detail') {
    return (
      <AppPage maxWidth={1000}>
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
                    <Stack spacing={2}>
                      <TextField 
                        label="الاسم (عربي)" 
                        fullWidth 
                        value={productForm.titleAr} 
                        onChange={(event) => setProductForm((prev) => ({ ...prev, titleAr: event.target.value, title: event.target.value }))} 
                        required
                        dir="rtl"
                      />
                      <TextField 
                        label="Title (English)" 
                        fullWidth 
                        value={productForm.titleEn} 
                        onChange={(event) => setProductForm((prev) => ({ ...prev, titleEn: event.target.value }))} 
                        dir="ltr"
                      />
                    </Stack>
                  </Box>
                  <Box>
                    <Stack spacing={2}>
                      <TextField
                        select
                        label="نوع المنتج"
                        fullWidth
                        value={productForm.productType}
                        onChange={(event) => {
                          setHasChosenProductType(true);
                          setProductForm((prev) => ({ ...prev, productType: event.target.value as ProductType }));
                        }}
                      >
                        <MenuItem value="single">منتج فردي</MenuItem>
                        <MenuItem value="bundled">منتج مجمع</MenuItem>
                        <MenuItem value="digital">ملفات رقمية</MenuItem>
                      </TextField>
                      <Typography variant="caption" color="text.secondary">
                        {isDigitalProduct
                          ? 'نوع رقمي: سيتم إخفاء حقول المخزون والمستودعات وإظهار سياسة التحميل.'
                          : isBundledProduct
                            ? 'نوع مجمع: أضف المنتجات المضمنة وسيتم حسم مخزونها عند الشراء.'
                            : 'نوع فردي: جميع حقول المخزون والمتغيرات متاحة.'}
                      </Typography>
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
                      <FormControlLabel
                        control={
                          <Switch
                            checked={productForm.isVisible}
                            onChange={(event) =>
                              setProductForm((prev) => ({ ...prev, isVisible: event.target.checked }))
                            }
                          />
                        }
                        label={productForm.isVisible ? 'المنتج ظاهر في المتجر' : 'المنتج مخفي في المتجر'}
                      />
                    </Stack>
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
                      label="التصنيف الرئيسي" 
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

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <TextField
                    select
                    label="التصنيفات المتعددة"
                    fullWidth
                    value={formCategoryIds}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[])
                          .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                          .join('، '),
                    }}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormCategoryIds(typeof value === 'string' ? value.split(',') : (value as string[]));
                    }}
                    helperText="يمكن اختيار أكثر من تصنيف"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="المنتجات المشابهة"
                    fullWidth
                    value={formRelatedProductIds}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[])
                          .map((id) => products.find((product) => product.id === id)?.title ?? id)
                          .join('، '),
                    }}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormRelatedProductIds(typeof value === 'string' ? value.split(',') : (value as string[]));
                    }}
                    helperText="يمكن تخصيص منتجات مشابهة للظهور بجانب المنتج"
                  >
                    {products
                      .filter((product) => !selectedProduct || product.id !== selectedProduct.id)
                      .map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.title}
                        </MenuItem>
                      ))}
                  </TextField>
                </Box>

                <TextField 
                  label="الوصف" 
                  fullWidth 
                  multiline 
                  minRows={4} 
                  value={productForm.description} 
                  onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} 
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField 
                    label="الوصف (عربي)" 
                    fullWidth 
                    multiline 
                    minRows={3} 
                    value={productForm.descriptionAr} 
                    onChange={(event) => setProductForm((prev) => ({ ...prev, descriptionAr: event.target.value }))} 
                    dir="rtl"
                  />
                  <TextField 
                    label="Description (English)" 
                    fullWidth 
                    multiline 
                    minRows={3} 
                    value={productForm.descriptionEn} 
                    onChange={(event) => setProductForm((prev) => ({ ...prev, descriptionEn: event.target.value }))} 
                    dir="ltr"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="الوصف المختصر (عربي)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={productForm.shortDescriptionAr}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, shortDescriptionAr: event.target.value }))
                    }
                    dir="rtl"
                  />
                  <TextField
                    label="Short Description (English)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={productForm.shortDescriptionEn}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, shortDescriptionEn: event.target.value }))
                    }
                    dir="ltr"
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="الوصف التفصيلي (عربي)"
                    fullWidth
                    multiline
                    minRows={5}
                    value={productForm.detailedDescriptionAr}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, detailedDescriptionAr: event.target.value }))
                    }
                    dir="rtl"
                  />
                  <TextField
                    label="Detailed Description (English)"
                    fullWidth
                    multiline
                    minRows={5}
                    value={productForm.detailedDescriptionEn}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, detailedDescriptionEn: event.target.value }))
                    }
                    dir="ltr"
                  />
                </Box>

                {/* Additional Information Accordion */}
                <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>معلومات إضافية</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={3}>
                      {!isDigitalProduct ? (
                        <>
                          {/* قسم العلامة التجارية والوزن */}
                          <Typography variant="subtitle2" fontWeight={700}>العلامة التجارية والوزن</Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                            <TextField size="small" label="العلامة التجارية" fullWidth value={formBrand} onChange={(e) => setFormBrand(e.target.value)} />
                            <TextField size="small" label="الوزن (كجم)" type="number" fullWidth value={formWeight} onChange={(e) => setFormWeight(e.target.value)} />
                            <TextField size="small" label="وحدة الوزن (اختياري)" fullWidth value={formWeightUnit} onChange={(e) => setFormWeightUnit(e.target.value)} placeholder="kg / g / lb" />
                            <TextField size="small" label="سعر التكلفة" type="number" fullWidth value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value)} />
                          </Box>
                        </>
                      ) : null}

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          size="small"
                          label="ملصق المنتج"
                          fullWidth
                          value={formProductLabel}
                          onChange={(e) => setFormProductLabel(e.target.value)}
                          placeholder="جديد / الأكثر مبيعاً"
                        />
                        <TextField
                          size="small"
                          label="رابط فيديو يوتيوب"
                          fullWidth
                          value={formYoutubeUrl}
                          onChange={(e) => setFormYoutubeUrl(e.target.value)}
                          dir="ltr"
                        />
                      </Box>

                      {!isDigitalProduct ? (
                        <>
                          {/* قسم الأبعاد */}
                          <Typography variant="subtitle2" fontWeight={700}>الأبعاد</Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                            <TextField size="small" label="الطول (سم)" type="number" fullWidth value={formDimensionsLength} onChange={(e) => setFormDimensionsLength(e.target.value)} />
                            <TextField size="small" label="العرض (سم)" type="number" fullWidth value={formDimensionsWidth} onChange={(e) => setFormDimensionsWidth(e.target.value)} />
                            <TextField size="small" label="الارتفاع (سم)" type="number" fullWidth value={formDimensionsHeight} onChange={(e) => setFormDimensionsHeight(e.target.value)} />
                          </Box>
                        </>
                      ) : null}

                      {/* قسم SEO */}
                      <Typography variant="subtitle2" fontWeight={700}>تحسين محركات البحث (SEO)</Typography>
                      <Stack spacing={2}>
                        <TextField size="small" label="عنوان SEO" fullWidth value={formSeoTitle} onChange={(e) => setFormSeoTitle(e.target.value)} />
                        <TextField size="small" label="وصف SEO" fullWidth multiline minRows={2} value={formSeoDescription} onChange={(e) => setFormSeoDescription(e.target.value)} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextField size="small" label="اسم الصفحة SEO (عربي)" fullWidth value={formSeoTitleAr} onChange={(e) => setFormSeoTitleAr(e.target.value)} />
                          <TextField size="small" label="Page Title SEO (English)" fullWidth value={formSeoTitleEn} onChange={(e) => setFormSeoTitleEn(e.target.value)} />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextField size="small" label="وصف الصفحة SEO (عربي)" fullWidth multiline minRows={2} value={formSeoDescriptionAr} onChange={(e) => setFormSeoDescriptionAr(e.target.value)} />
                          <TextField size="small" label="Page Description SEO (English)" fullWidth multiline minRows={2} value={formSeoDescriptionEn} onChange={(e) => setFormSeoDescriptionEn(e.target.value)} />
                        </Box>
                      </Stack>

                      {/* قسم الكلمات المفتاحية */}
                      <Typography variant="subtitle2" fontWeight={700}>الكلمات المفتاحية</Typography>
                      <TextField size="small" label="الكلمات المفتاحية (مفصولة بفواصل)" fullWidth value={formTags} onChange={(e) => setFormTags(e.target.value)} helperText="مثال: إلكترونيات, هواتف, ذكي" />

                      {/* قسم الخيارات */}
                      <Typography variant="subtitle2" fontWeight={700}>الخيارات</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <FormControlLabel control={<Switch checked={formIsFeatured} onChange={(e) => setFormIsFeatured(e.target.checked)} />} label="منتج مميز" />
                        <FormControlLabel control={<Switch checked={formIsTaxable} onChange={(e) => setFormIsTaxable(e.target.checked)} />} label="خاضع للضريبة" />
                        {isSingleProduct ? (
                          <FormControlLabel
                            control={<Switch checked={formStockUnlimited} onChange={(e) => setFormStockUnlimited(e.target.checked)} />}
                            label="مخزون غير محدود"
                          />
                        ) : null}
                      </Box>
                      {formIsTaxable && (
                        <TextField size="small" label="نسبة الضريبة (%)" type="number" fullWidth value={formTaxRate} onChange={(e) => setFormTaxRate(e.target.value)} sx={{ maxWidth: 300 }} />
                      )}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, maxWidth: 600 }}>
                        <TextField size="small" label="الحد الأدنى للطلب" type="number" fullWidth value={formMinOrderQuantity} onChange={(e) => setFormMinOrderQuantity(e.target.value)} />
                        <TextField size="small" label="الحد الأقصى للطلب" type="number" fullWidth value={formMaxOrderQuantity} onChange={(e) => setFormMaxOrderQuantity(e.target.value)} />
                      </Box>

                      <Typography variant="subtitle2" fontWeight={700}>خصم المنتج من نفس الصفحة</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formInlineDiscountEnabled}
                            onChange={(e) => setFormInlineDiscountEnabled(e.target.checked)}
                          />
                        }
                        label="تفعيل خصم خاص لهذا المنتج"
                      />
                      {formInlineDiscountEnabled ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                          <TextField
                            size="small"
                            select
                            label="نوع الخصم"
                            value={formInlineDiscountType}
                            onChange={(e) => setFormInlineDiscountType(e.target.value as 'percent' | 'fixed')}
                          >
                            <MenuItem value="percent">نسبة مئوية</MenuItem>
                            <MenuItem value="fixed">مبلغ ثابت</MenuItem>
                          </TextField>
                          <TextField size="small" label="قيمة الخصم" type="number" value={formInlineDiscountValue} onChange={(e) => setFormInlineDiscountValue(e.target.value)} />
                          <TextField size="small" label="بداية الخصم" type="datetime-local" InputLabelProps={{ shrink: true }} value={formInlineDiscountStartsAt} onChange={(e) => setFormInlineDiscountStartsAt(e.target.value)} />
                          <TextField size="small" label="نهاية الخصم" type="datetime-local" InputLabelProps={{ shrink: true }} value={formInlineDiscountEndsAt} onChange={(e) => setFormInlineDiscountEndsAt(e.target.value)} />
                        </Box>
                      ) : null}

                      {isBundledProduct ? (
                        <>
                          <Typography variant="subtitle2" fontWeight={700}>المنتجات المضمنة داخل المنتج المجمع</Typography>
                          <Stack spacing={1.5}>
                            {bundleItems.map((item, index) => (
                              <Box key={`${item.bundledProductId}-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' }, gap: 1.5 }}>
                                <TextField
                                  size="small"
                                  select
                                  label="المنتج المضمّن"
                                  value={item.bundledProductId}
                                  onChange={(event) =>
                                    setBundleItems((rows) =>
                                      rows.map((row, rowIndex) =>
                                        rowIndex === index
                                          ? { ...row, bundledProductId: event.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                >
                                  {products
                                    .filter((product) => !selectedProduct || product.id !== selectedProduct.id)
                                    .map((product) => (
                                      <MenuItem key={product.id} value={product.id}>
                                        {product.title}
                                      </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                  size="small"
                                  label="الكمية"
                                  type="number"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    setBundleItems((rows) =>
                                      rows.map((row, rowIndex) =>
                                        rowIndex === index ? { ...row, quantity: event.target.value } : row,
                                      ),
                                    )
                                  }
                                />
                                <Button
                                  color="error"
                                  onClick={() =>
                                    setBundleItems((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
                                  }
                                >
                                  حذف
                                </Button>
                              </Box>
                            ))}
                          </Stack>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              setBundleItems((rows) => [...rows, { bundledProductId: '', quantity: '1' }])
                            }
                          >
                            إضافة منتج للمجموعة
                          </Button>
                        </>
                      ) : null}

                      {isDigitalProduct ? (
                        <>
                          <Typography variant="subtitle2" fontWeight={700}>الملفات الرقمية وسياسة التحميل</Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                              size="small"
                              label="عدد محاولات التحميل لكل عميل"
                              type="number"
                              value={formDigitalDownloadAttemptsLimit}
                              onChange={(e) => setFormDigitalDownloadAttemptsLimit(e.target.value)}
                              helperText="اتركه فارغاً = غير محدود"
                            />
                            <TextField
                              size="small"
                              label="تاريخ انتهاء صلاحية التحميل"
                              type="datetime-local"
                              InputLabelProps={{ shrink: true }}
                              value={formDigitalDownloadExpiresAt}
                              onChange={(e) => setFormDigitalDownloadExpiresAt(e.target.value)}
                              helperText="اتركه فارغاً = غير محدود"
                            />
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 2fr auto' }, gap: 1.5 }}>
                            <TextField
                              size="small"
                              type="file"
                              onChange={(e) => setDigitalUploadFile((e.target as HTMLInputElement).files?.[0] ?? null)}
                              fullWidth
                            />
                            <TextField
                              size="small"
                              label="اسم الملف (اختياري)"
                              value={digitalUploadName}
                              onChange={(e) => setDigitalUploadName(e.target.value)}
                              fullWidth
                            />
                            <Button
                              variant="outlined"
                              onClick={() => uploadDigitalFileAsset().catch(() => undefined)}
                              disabled={actionLoading || !digitalUploadFile}
                            >
                              رفع ملف رقمي
                            </Button>
                          </Box>
                          <Stack spacing={1}>
                            {digitalFiles.map((file, index) => (
                              <Box key={file.mediaAssetId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {file.fileName || `Digital File ${index + 1}`} - {(file.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                                </Typography>
                                <Button
                                  color="error"
                                  size="small"
                                  onClick={() =>
                                    setDigitalFiles((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
                                  }
                                >
                                  حذف
                                </Button>
                              </Box>
                            ))}
                          </Stack>
                        </>
                      ) : null}

                      <Typography variant="subtitle2" fontWeight={700}>الحقول المخصصة (JSON)</Typography>
                      <TextField
                        size="small"
                        label="Custom Fields JSON"
                        fullWidth
                        multiline
                        minRows={4}
                        value={formCustomFieldsJson}
                        onChange={(e) => setFormCustomFieldsJson(e.target.value)}
                        helperText={`مثال: [{"key":"origin","labelAr":"بلد المنشأ","value":{"ar":"اليمن","en":"Yemen"}}]`}
                        dir="ltr"
                      />

                      {/* قسم التقييم (عرض فقط) */}
                      {selectedProduct && (selectedProduct as any).ratingAvg != null && (
                        <>
                          <Typography variant="subtitle2" fontWeight={700}>التقييم (عرض فقط)</Typography>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <StarIcon sx={{ color: 'warning.main' }} />
                            <Typography variant="body2">متوسط التقييم: {(selectedProduct as any).ratingAvg?.toFixed(1) ?? '-'}</Typography>
                            <Typography variant="body2" color="text.secondary">|</Typography>
                            <Typography variant="body2" color="text.secondary">عدد التقييمات: {(selectedProduct as any).ratingCount ?? 0}</Typography>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    onClick={() => (selectedProduct ? updateProduct() : createProduct()).catch(() => undefined)}
                    disabled={actionLoading || !hasChosenProductType}
                    size="large"
                    sx={{ px: 4 }}
                  >
                    {actionLoading ? 'جارِ الحفظ...' : selectedProduct ? 'حفظ التعديلات' : 'إنشاء المنتج'}
                  </Button>
                </Box>
                {!hasChosenProductType ? (
                  <Alert severity="warning">يجب اختيار نوع المنتج قبل الحفظ.</Alert>
                ) : null}
              </Stack>
            </Paper>

            {/* Variants Card (Only if product exists) */}
            {selectedProduct && !isDigitalProduct && (
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
                        <TextField size="small" label="عنوان المتغير (عربي)" fullWidth value={variantForm.titleAr} onChange={(e) => setVariantForm({ ...variantForm, titleAr: e.target.value, title: e.target.value })} placeholder="مثال: أحمر / كبير" dir="rtl" />
                      </Box>
                      <Box>
                        <TextField size="small" label="SKU (رمز التخزين)" fullWidth value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="الباركود (اختياري)" fullWidth value={variantForm.barcode} onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2 }}>
                      <TextField size="small" label="Variant Title (English)" fullWidth value={variantForm.titleEn} onChange={(e) => setVariantForm({ ...variantForm, titleEn: e.target.value })} dir="ltr" />
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="السعر" type="number" fullWidth value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="السعر قبل الخصم (اختياري)" type="number" fullWidth value={variantForm.compareAtPrice} onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="الكمية المتوفرة" type="number" fullWidth value={variantForm.stockQuantity} onChange={(e) => setVariantForm({ ...variantForm, stockQuantity: e.target.value })} disabled={productForm.productType !== 'single'} helperText={productForm.productType !== 'single' ? 'المخزون يتم إدارته تلقائياً لهذا النوع' : undefined} />
                      </Box>
                      <Box>
                        <TextField size="small" label="تنبيه انخفاض المخزون" type="number" fullWidth value={variantForm.lowStockThreshold} onChange={(e) => setVariantForm({ ...variantForm, lowStockThreshold: e.target.value })} disabled={productForm.productType !== 'single'} helperText={productForm.productType !== 'single' ? 'غير مطلوب لهذا النوع' : undefined} />
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
                        {img.isPrimary && <Chip size="small" color="primary" label="الرئيسية" sx={{ mb: 0.5 }} />}
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
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button variant="contained" onClick={() => uploadAndAttachImage(true).catch(() => undefined)} disabled={actionLoading || !imageFile} sx={{ width: 'fit-content' }}>
                        {actionLoading ? 'جارِ الرفع...' : 'رفع كصورة رئيسية'}
                      </Button>
                      <Button variant="outlined" onClick={() => uploadAndAttachImage(false).catch(() => undefined)} disabled={actionLoading || !imageFile} sx={{ width: 'fit-content' }}>
                        {actionLoading ? 'جارِ الرفع...' : 'رفع كصورة إضافية'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </AppPage>
    );
  }

  // --- LIST VIEW ---
  return (
    <AppPage>
      <PageHeader
        title="المنتجات"
        description="أضف منتجاتك ونظم الكتالوج مع صورة واضحة للحالة والتصنيف."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>
            منتج جديد
          </Button>
        }
      />

      {message.text ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <FilterBar>
        <TextField
          placeholder="ابحث باسم المنتج أو الرابط..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          sx={{ maxWidth: 420, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="outlined" onClick={() => loadCatalog().catch(() => undefined)} disabled={loading}>
          تحديث القائمة
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => exportProductsToExcel().catch(() => undefined)}
          disabled={exportLoading}
        >
          {exportLoading ? 'جارِ التصدير...' : 'تصدير Excel'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<UploadFileIcon />}
          onClick={openImportFileDialog}
          disabled={importLoading}
        >
          {importLoading ? 'جارِ الاستيراد...' : 'استيراد Excel'}
        </Button>
      </FilterBar>

      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleImportFileChange}
      />

      <DataTableWrapper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}></TableCell>
                <TableCell>اسم المنتج</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>التصنيف</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>المتغيرات</TableCell>
                <TableCell align="left">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">لا توجد منتجات.</Typography>
                    </TableCell>
                  </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'بدون تصنيف';
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={700}>{product.title}</Typography>
                          {(product as any).isFeatured ? <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} /> : null}
                        </Box>
                        <Typography variant="caption" color="text.secondary" dir="ltr" display="block">/{product.slug}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={product.productType === 'digital' ? 'رقمي' : product.productType === 'bundled' ? 'مجمع' : 'فردي'}
                          color={product.productType === 'digital' ? 'info' : product.productType === 'bundled' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={categoryName} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[product.status] || product.status}
                          color={statusColors[product.status] || 'default'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {product.variants?.length || 0} متغير
                        </Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Button size="small" variant="outlined" startIcon={<EditNoteIcon />} onClick={() => loadProductDetails(product.id).catch(() => undefined)}>
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
      </DataTableWrapper>
    </AppPage>
  );
}

// Helper functions kept exactly the same for payload construction

function buildProductPayload(
  form: typeof productFormDefault,
  extra?: {
    brand: string; weight: string; costPrice: string; seoTitle: string; seoDescription: string;
    seoTitleAr: string; seoTitleEn: string; seoDescriptionAr: string; seoDescriptionEn: string;
    dimensionsLength: string; dimensionsWidth: string; dimensionsHeight: string;
    tags: string; isFeatured: boolean; isTaxable: boolean; taxRate: string;
    minOrderQuantity: string; maxOrderQuantity: string;
    categoryIds: string[];
    relatedProductIds: string[];
    weightUnit: string;
    productLabel: string;
    youtubeUrl: string;
    stockUnlimited: boolean;
    inlineDiscountEnabled: boolean;
    inlineDiscountType: 'percent' | 'fixed';
    inlineDiscountValue: string;
    inlineDiscountStartsAt: string;
    inlineDiscountEndsAt: string;
    customFieldsJson: string;
    shortDescriptionAr: string;
    shortDescriptionEn: string;
    detailedDescriptionAr: string;
    detailedDescriptionEn: string;
    bundleItems: Array<{ bundledProductId: string; quantity: string }>;
    digitalFiles: Array<{ mediaAssetId: string; fileName: string; sortOrder: string }>;
    digitalDownloadAttemptsLimit: string;
    digitalDownloadExpiresAt: string;
  },
) {
  const primaryArabicTitle = form.titleAr.trim() || form.title.trim();
  if (!primaryArabicTitle) {
    throw new Error('الاسم العربي للمنتج مطلوب');
  }

  const payload: {
    title: string;
    productType: ProductType;
    isVisible: boolean;
    slug?: string;
    description?: string;
    categoryId?: string;
    categoryIds?: string[];
    status: ProductStatus;
    titleAr?: string;
    titleEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    shortDescriptionAr?: string;
    shortDescriptionEn?: string;
    detailedDescriptionAr?: string;
    detailedDescriptionEn?: string;
    brand?: string;
    weightUnit?: string;
    weight?: number;
    costPrice?: number;
    dimensions?: { length?: number; width?: number; height?: number };
    productLabel?: string;
    youtubeUrl?: string;
    tags?: string[];
    relatedProductIds?: string[];
    stockUnlimited?: boolean;
    inlineDiscount?: {
      type: 'percent' | 'fixed';
      value: number;
      startsAt?: string;
      endsAt?: string;
    };
    inlineDiscountEnabled?: boolean;
    bundleItems?: Array<{ bundledProductId: string; quantity: number }>;
    digitalFiles?: Array<{ mediaAssetId: string; fileName?: string; sortOrder?: number }>;
    digitalDownloadAttemptsLimit?: number;
    digitalDownloadExpiresAt?: string;
    customFields?: Array<Record<string, unknown>>;
    isFeatured?: boolean;
    isTaxable?: boolean;
    taxRate?: number;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
    seoTitle?: string;
    seoDescription?: string;
    seoTitleAr?: string;
    seoTitleEn?: string;
    seoDescriptionAr?: string;
    seoDescriptionEn?: string;
  } = {
    title: primaryArabicTitle,
    productType: form.productType,
    isVisible: form.isVisible,
    titleAr: primaryArabicTitle,
    status: form.status,
  };

  if (extra) {
    payload.isFeatured = extra.isFeatured;
    payload.isTaxable = extra.isTaxable;
  }

  const slug = form.slug.trim();
  const description = form.description.trim();
  const categoryId = form.categoryId.trim();
  const titleEn = form.titleEn.trim();
  const descriptionAr = form.descriptionAr.trim();
  const descriptionEn = form.descriptionEn.trim();

  if (slug) {
    payload.slug = slug;
  }
  if (description) {
    payload.description = description;
  }
  if (categoryId) {
    payload.categoryId = categoryId;
  }
  if (titleEn) {
    payload.titleEn = titleEn;
  }
  if (descriptionAr) {
    payload.descriptionAr = descriptionAr;
  }
  if (descriptionEn) {
    payload.descriptionEn = descriptionEn;
  }
  if (extra) {
    const mergedCategoryIds = Array.from(
      new Set([categoryId, ...extra.categoryIds].filter((id): id is string => Boolean(id))),
    );
    if (mergedCategoryIds.length > 0) {
      payload.categoryIds = mergedCategoryIds;
      const primaryCategoryId = mergedCategoryIds[0];
      if (primaryCategoryId) {
        payload.categoryId = primaryCategoryId;
      }
    }

    if (extra.brand.trim()) {
      payload.brand = extra.brand.trim();
    }
    if (extra.weightUnit.trim()) {
      payload.weightUnit = extra.weightUnit.trim();
    }
    if (extra.weight) {
      payload.weight = Number(extra.weight);
    }
    if (extra.costPrice) {
      payload.costPrice = Number(extra.costPrice);
    }
    if (extra.productLabel.trim()) {
      payload.productLabel = extra.productLabel.trim();
    }
    if (extra.youtubeUrl.trim()) {
      payload.youtubeUrl = extra.youtubeUrl.trim();
    }
    if (extra.dimensionsLength || extra.dimensionsWidth || extra.dimensionsHeight) {
      payload.dimensions = {
        ...(extra.dimensionsLength ? { length: Number(extra.dimensionsLength) } : {}),
        ...(extra.dimensionsWidth ? { width: Number(extra.dimensionsWidth) } : {}),
        ...(extra.dimensionsHeight ? { height: Number(extra.dimensionsHeight) } : {}),
      };
    }
    if (extra.tags.trim()) {
      payload.tags = extra.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (extra.relatedProductIds.length > 0) {
      payload.relatedProductIds = extra.relatedProductIds;
    }

    payload.stockUnlimited = extra.stockUnlimited;
    payload.inlineDiscountEnabled = extra.inlineDiscountEnabled;

    const shortDescriptionAr = extra.shortDescriptionAr.trim();
    const shortDescriptionEn = extra.shortDescriptionEn.trim();
    const detailedDescriptionAr = extra.detailedDescriptionAr.trim();
    const detailedDescriptionEn = extra.detailedDescriptionEn.trim();
    if (shortDescriptionAr) {
      payload.shortDescriptionAr = shortDescriptionAr;
    }
    if (shortDescriptionEn) {
      payload.shortDescriptionEn = shortDescriptionEn;
    }
    if (detailedDescriptionAr) {
      payload.detailedDescriptionAr = detailedDescriptionAr;
    }
    if (detailedDescriptionEn) {
      payload.detailedDescriptionEn = detailedDescriptionEn;
    }

    if (extra.inlineDiscountEnabled && extra.inlineDiscountValue) {
      payload.inlineDiscount = {
        type: extra.inlineDiscountType,
        value: Number(extra.inlineDiscountValue),
        ...(extra.inlineDiscountStartsAt ? { startsAt: new Date(extra.inlineDiscountStartsAt).toISOString() } : {}),
        ...(extra.inlineDiscountEndsAt ? { endsAt: new Date(extra.inlineDiscountEndsAt).toISOString() } : {}),
      };
    }

    if (form.productType === 'bundled' && extra.bundleItems.length > 0) {
      payload.bundleItems = extra.bundleItems
        .filter((row) => row.bundledProductId.trim() && Number(row.quantity) > 0)
        .map((row) => ({
          bundledProductId: row.bundledProductId.trim(),
          quantity: Number(row.quantity),
        }));
    }

    if (form.productType === 'digital') {
      payload.digitalFiles = extra.digitalFiles.map((file) => ({
        mediaAssetId: file.mediaAssetId,
        ...(file.fileName.trim() ? { fileName: file.fileName.trim() } : {}),
        ...(file.sortOrder ? { sortOrder: Number(file.sortOrder) } : {}),
      }));
      if (extra.digitalDownloadAttemptsLimit) {
        payload.digitalDownloadAttemptsLimit = Number(extra.digitalDownloadAttemptsLimit);
      }
      if (extra.digitalDownloadExpiresAt) {
        payload.digitalDownloadExpiresAt = new Date(extra.digitalDownloadExpiresAt).toISOString();
      }
    }

    if (extra.customFieldsJson.trim()) {
      try {
        const parsed = JSON.parse(extra.customFieldsJson);
        if (Array.isArray(parsed)) {
          payload.customFields = parsed;
        }
      } catch {
        throw new Error('صيغة JSON للحقول المخصصة غير صحيحة');
      }
    }

    if (extra.isTaxable && extra.taxRate) {
      payload.taxRate = Number(extra.taxRate);
    }
    if (extra.minOrderQuantity) {
      payload.minOrderQuantity = Number(extra.minOrderQuantity);
    }
    if (extra.maxOrderQuantity) {
      payload.maxOrderQuantity = Number(extra.maxOrderQuantity);
    }
    if (extra.seoTitle.trim()) {
      payload.seoTitle = extra.seoTitle.trim();
    }
    if (extra.seoDescription.trim()) {
      payload.seoDescription = extra.seoDescription.trim();
    }
    if (extra.seoTitleAr.trim()) {
      payload.seoTitleAr = extra.seoTitleAr.trim();
    }
    if (extra.seoTitleEn.trim()) {
      payload.seoTitleEn = extra.seoTitleEn.trim();
    }
    if (extra.seoDescriptionAr.trim()) {
      payload.seoDescriptionAr = extra.seoDescriptionAr.trim();
    }
    if (extra.seoDescriptionEn.trim()) {
      payload.seoDescriptionEn = extra.seoDescriptionEn.trim();
    }
  }

  return payload;
}

function buildVariantPayload(
  form: ReturnType<typeof createVariantFormDefault>,
  isNonStockTrackedProduct = false,
) {
  const primaryArabicTitle = form.titleAr.trim() || form.title.trim();
  if (!primaryArabicTitle) {
    throw new Error('عنوان المتغير بالعربية مطلوب');
  }

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
    titleAr?: string;
    titleEn?: string;
  } = {
    title: primaryArabicTitle,
    titleAr: primaryArabicTitle,
    sku: form.sku.trim(),
    price: Number(form.price || '0'),
    stockQuantity: isNonStockTrackedProduct ? 0 : Number(form.stockQuantity || '0'),
    lowStockThreshold: isNonStockTrackedProduct ? 0 : Number(form.lowStockThreshold || '0'),
    attributeValueIds: extractSelectedValueIds(form.selectedValueByAttributeId),
    isDefault: form.isDefault,
  };

  const barcode = form.barcode.trim();
  const compareAtPrice = form.compareAtPrice.trim();
  const titleEn = form.titleEn.trim();

  if (barcode) {
    payload.barcode = barcode;
  }
  if (compareAtPrice) {
    payload.compareAtPrice = Number(compareAtPrice);
  }
  if (titleEn) {
    payload.titleEn = titleEn;
  }

  return payload;
}

function buildAttachImagePayload(form: typeof imageFormDefault, mediaAssetId: string, isPrimary: boolean) {
  const payload: {
    mediaAssetId: string;
    variantId?: string;
    altText?: string;
    sortOrder: number;
    isPrimary: boolean;
  } = {
    mediaAssetId,
    sortOrder: Number(form.sortOrder || '0'),
    isPrimary,
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
