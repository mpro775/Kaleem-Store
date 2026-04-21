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
  Brand,
  Category,
  Filter,
  MediaAsset,
  PresignedMediaUpload,
  Product,
  ProductFilterSelection,
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
  questionsEnabled: false,
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
  draft: 'ظ…ط³ظˆط¯ط©',
  active: 'ظ†ط´ط·',
  archived: 'ظ…ط¤ط±ط´ظپ',
};

export function ProductsPanel({ request }: ProductsPanelProps) {
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedFilterValueIds, setSelectedFilterValueIds] = useState<string[]>([]);
  const [selectedRangeByFilterId, setSelectedRangeByFilterId] = useState<Record<string, string>>({});
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [hasChosenProductType, setHasChosenProductType] = useState(true);
  
  const [productForm, setProductForm] = useState(productFormDefault);
  const [variantForm, setVariantForm] = useState(createVariantFormDefault);
  const [imageForm, setImageForm] = useState(imageFormDefault);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formBrandId, setFormBrandId] = useState('');
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
      const [productsData, categoriesData, brandsData, attributesData, filtersData] = await Promise.all([
        request<ProductListResponse>('/products?page=1&limit=30', { method: 'GET' }),
        request<Category[]>('/categories', { method: 'GET' }),
        request<Brand[]>('/brands?isActive=true', { method: 'GET' }),
        request<Attribute[]>('/attributes?includeValues=true&onlyActive=true', { method: 'GET' }),
        request<Filter[]>('/filters?includeValues=true&onlyActive=true', { method: 'GET' }),
      ]);

      setProducts(productsData?.items ?? []);
      setCategories(categoriesData ?? []);
      setBrands(brandsData ?? []);
      setAttributes(attributesData ?? []);
      setFilters(filtersData ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function loadProductDetails(productId: string): Promise<void> {
    setDetailLoading(true);
    setViewMode('detail');
    setMessage({ text: '', type: 'info' });
    try {
      const [data, filterSelection] = await Promise.all([
        request<Product>(`/products/${productId}`, { method: 'GET' }),
        request<ProductFilterSelection>(`/filters/products/${productId}/selections`, { method: 'GET' }),
      ]);
      setSelectedProduct(data ?? null);
      setSelectedVariantId('');
      setSelectedFilterValueIds(filterSelection?.valueIds ?? []);
      setSelectedRangeByFilterId(
        (filterSelection?.ranges ?? []).reduce<Record<string, string>>((acc, range) => {
          acc[range.filterId] = String(range.numericValue);
          return acc;
        }, {}),
      );
      if (data) {
        setHasChosenProductType(true);
          setProductForm({
            productType: (data as any).productType ?? 'single',
            isVisible: (data as any).isVisible ?? true,
            questionsEnabled: (data as any).questionsEnabled ?? false,
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
        setFormBrandId(d.brandId ?? '');
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
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ طھظپط§طµظٹظ„ ط§ظ„ظ…ظ†طھط¬', type: 'error' });
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
        throw new Error('طھط¹ط°ط± ط¥ظ†ط´ط§ط، ظ…ظ„ظپ ط§ظ„طھطµط¯ظٹط±');
      }

      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage({ text: 'طھظ… طھطµط¯ظٹط± ط§ظ„ظ…ظ†طھط¬ط§طھ ط¥ظ„ظ‰ ظ…ظ„ظپ Excel ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھطµط¯ظٹط± ط§ظ„ظ…ظ†طھط¬ط§طھ', type: 'error' });
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
        ? `ط§ظƒطھظ…ظ„ ط§ظ„ط§ط³طھظٹط±ط§ط¯: ${result.created} ط¥ظ†ط´ط§ط،طŒ ${result.updated} طھط­ط¯ظٹط«طŒ ${result.failed} ظپط´ظ„ ظ…ظ† ط£طµظ„ ${result.totalRows} طµظپ.`
        : 'ط§ظƒطھظ…ظ„ ط§ظ„ط§ط³طھظٹط±ط§ط¯.';
      const firstError = result?.errors?.[0];
      setMessage({
        text: firstError ? `${summary} ط£ظˆظ„ ط®ط·ط£ ظپظٹ ط§ظ„طµظپ ${firstError.row}: ${firstError.message}` : summary,
        type: result && result.failed > 0 ? 'error' : 'success',
      });

      await loadCatalog();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط§ط³طھظٹط±ط§ط¯ ط§ظ„ظ…ظ†طھط¬ط§طھ', type: 'error' });
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
    setFormBrandId('');
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
    setSelectedFilterValueIds([]);
    setSelectedRangeByFilterId({});
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
          brandId: formBrandId, weight: formWeight, costPrice: formCostPrice,
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
        await saveProductFilterSelections(created.id);
        setMessage({ text: 'طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظ…ظ†طھط¬ ط¨ظ†ط¬ط§ط­. ظٹظ…ظƒظ†ظƒ ط§ظ„ط¢ظ† ط¥ط¶ط§ظپط© ظ…طھط؛ظٹط±ط§طھ ظˆطµظˆط±.', type: 'success' });
        await loadCatalog();
        await loadProductDetails(created.id);
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ظ…ظ†طھط¬', type: 'error' });
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
          brandId: formBrandId, weight: formWeight, costPrice: formCostPrice,
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
      await saveProductFilterSelections(selectedProduct.id);
      await loadCatalog();
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ظ†طھط¬ ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ظ…ظ†طھط¬', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveProductFilterSelections(productId: string): Promise<void> {
    const ranges = Object.entries(selectedRangeByFilterId)
      .map(([filterId, value]) => ({ filterId, numericValue: Number(value) }))
      .filter((item) => Number.isFinite(item.numericValue));

    await request(`/filters/products/${productId}/selections`, {
      method: 'PUT',
      body: JSON.stringify({
        valueIds: selectedFilterValueIds,
        ranges,
      }),
    });
  }

  function toggleProductFilterValue(valueId: string, enabled: boolean): void {
    setSelectedFilterValueIds((current) => {
      const next = new Set(current);
      if (enabled) {
        next.add(valueId);
      } else {
        next.delete(valueId);
      }
      return [...next];
    });
  }

  function setProductFilterRange(filterId: string, value: string): void {
    setSelectedRangeByFilterId((current) => ({
      ...current,
      [filterId]: value,
    }));
  }

  async function deleteProduct(): Promise<void> {
    if (!selectedProduct || !window.confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ظ†طھط¬ ظ†ظ‡ط§ط¦ظٹط§ظ‹طں')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/products/${selectedProduct.id}`, { method: 'DELETE' });
      setSelectedProduct(null);
      setProductForm(productFormDefault);
      await loadCatalog();
      setViewMode('list');
      setMessage({ text: 'طھظ… ط­ط°ظپ ط§ظ„ظ…ظ†طھط¬ ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط­ط°ظپ ط§ظ„ظ…ظ†طھط¬', type: 'error' });
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
      setMessage({ text: 'طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ظ…طھط؛ظٹط± ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط¥ط¶ط§ظپط© ط§ظ„ظ…طھط؛ظٹط±', type: 'error' });
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
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ط®طµط§ط¦طµ ط§ظ„ظ…طھط؛ظٹط± ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ط®طµط§ط¦طµ', type: 'error' });
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
    setMessage({ text: 'طھظ… طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط؛ظٹط± ظ„ظ„طھط¹ط¯ظٹظ„', type: 'info' });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function uploadAndAttachImage(isPrimary: boolean): Promise<void> {
    if (!selectedProduct || !imageFile) {
      setMessage({ text: 'ط§ط®طھط± ظ…ظ„ظپ طµظˆط±ط© ط£ظˆظ„ط§ظ‹', type: 'error' });
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
      setMessage({ text: isPrimary ? 'طھظ… ط±ظپط¹ ط§ظ„طµظˆط±ط© ط§ظ„ط±ط¦ظٹط³ظٹط© ط¨ظ†ط¬ط§ط­' : 'طھظ… ط±ظپط¹ ط§ظ„طµظˆط±ط© ط§ظ„ط¥ط¶ط§ظپظٹط© ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط±ظپط¹ ط§ظ„طµظˆط±ط©', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function uploadDigitalFileAsset(): Promise<void> {
    if (!digitalUploadFile) {
      setMessage({ text: 'ط§ط®طھط± ظ…ظ„ظپط§ظ‹ ط±ظ‚ظ…ظٹط§ظ‹ ط£ظˆظ„ط§ظ‹', type: 'error' });
      return;
    }

    if (digitalFiles.length >= 10) {
      setMessage({ text: 'ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ظ„ظ…ظ„ظپط§طھ ط§ظ„ط±ظ‚ظ…ظٹط© ظ‡ظˆ 10 ظ…ظ„ظپط§طھ ظ„ظƒظ„ ظ…ظ†طھط¬', type: 'error' });
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
      setMessage({ text: 'طھظ… ط±ظپط¹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط±ظ‚ظ…ظٹ ظˆط¥ط¶ط§ظپطھظ‡ ظ„ظ‚ط§ط¦ظ…ط© ظ…ظ„ظپط§طھ ط§ظ„ظ…ظ†طھط¬', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط±ظپط¹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط±ظ‚ظ…ظٹ', type: 'error' });
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
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…ظ†طھط¬ط§طھ
          </Button>
          {selectedProduct && (
            <Button 
              color="error" 
              startIcon={<DeleteOutlineIcon />}
              onClick={() => deleteProduct().catch(() => undefined)}
              disabled={actionLoading}
            >
              ط­ط°ظپ ط§ظ„ظ…ظ†طھط¬
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
                  {selectedProduct ? 'طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظ†طھط¬' : 'ظ…ظ†طھط¬ ط¬ط¯ظٹط¯'}
                </Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Stack spacing={3}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Stack spacing={2}>
                      <TextField 
                        label="ط§ظ„ط§ط³ظ… (ط¹ط±ط¨ظٹ)" 
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
                        label="ظ†ظˆط¹ ط§ظ„ظ…ظ†طھط¬"
                        fullWidth
                        value={productForm.productType}
                        onChange={(event) => {
                          setHasChosenProductType(true);
                          setProductForm((prev) => ({ ...prev, productType: event.target.value as ProductType }));
                        }}
                      >
                        <MenuItem value="single">ظ…ظ†طھط¬ ظپط±ط¯ظٹ</MenuItem>
                        <MenuItem value="bundled">ظ…ظ†طھط¬ ظ…ط¬ظ…ط¹</MenuItem>
                        <MenuItem value="digital">ظ…ظ„ظپط§طھ ط±ظ‚ظ…ظٹط©</MenuItem>
                      </TextField>
                      <Typography variant="caption" color="text.secondary">
                        {isDigitalProduct
                          ? 'ظ†ظˆط¹ ط±ظ‚ظ…ظٹ: ط³ظٹطھظ… ط¥ط®ظپط§ط، ط­ظ‚ظˆظ„ ط§ظ„ظ…ط®ط²ظˆظ† ظˆط§ظ„ظ…ط³طھظˆط¯ط¹ط§طھ ظˆط¥ط¸ظ‡ط§ط± ط³ظٹط§ط³ط© ط§ظ„طھط­ظ…ظٹظ„.'
                          : isBundledProduct
                            ? 'ظ†ظˆط¹ ظ…ط¬ظ…ط¹: ط£ط¶ظپ ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ط¶ظ…ظ†ط© ظˆط³ظٹطھظ… ط­ط³ظ… ظ…ط®ط²ظˆظ†ظ‡ط§ ط¹ظ†ط¯ ط§ظ„ط´ط±ط§ط،.'
                            : 'ظ†ظˆط¹ ظپط±ط¯ظٹ: ط¬ظ…ظٹط¹ ط­ظ‚ظˆظ„ ط§ظ„ظ…ط®ط²ظˆظ† ظˆط§ظ„ظ…طھط؛ظٹط±ط§طھ ظ…طھط§ط­ط©.'}
                      </Typography>
                      <TextField 
                        select 
                        label="ط§ظ„ط­ط§ظ„ط©" 
                        fullWidth 
                        value={productForm.status} 
                        onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))}
                      >
                        <MenuItem value="draft">ظ…ط³ظˆط¯ط©</MenuItem>
                        <MenuItem value="active">ظ†ط´ط·</MenuItem>
                        <MenuItem value="archived">ظ…ط¤ط±ط´ظپ</MenuItem>
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
                        label={productForm.isVisible ? 'ط§ظ„ظ…ظ†طھط¬ ط¸ط§ظ‡ط± ظپظٹ ط§ظ„ظ…طھط¬ط±' : 'ط§ظ„ظ…ظ†طھط¬ ظ…ط®ظپظٹ ظپظٹ ط§ظ„ظ…طھط¬ط±'}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={productForm.questionsEnabled}
                            onChange={(event) =>
                              setProductForm((prev) => ({ ...prev, questionsEnabled: event.target.checked }))
                            }
                          />
                        }
                        label={
                          productForm.questionsEnabled
                            ? 'ط§ط³طھظ‚ط¨ط§ظ„ ط£ط³ط¦ظ„ط© ط§ظ„ط¹ظ…ظ„ط§ط، ظ…ظپط¹ظ‘ظ„'
                            : 'ط§ط³طھظ‚ط¨ط§ظ„ ط£ط³ط¦ظ„ط© ط§ظ„ط¹ظ…ظ„ط§ط، ظ…طھظˆظ‚ظپ'
                        }
                      />
                    </Stack>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <TextField 
                      label="ط±ط§ط¨ط· ط§ظ„ظ…ظ†طھط¬ (Slug)" 
                      fullWidth 
                      value={productForm.slug} 
                      onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))} 
                      dir="ltr"
                      helperText="ط§ط®طھظٹط§ط±ظٹ: ط³ظٹطھظ… طھظˆظ„ظٹط¯ظ‡ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ط¥ط°ط§ طھظڈط±ظƒ ظپط§ط±ط؛ط§ظ‹."
                    />
                  </Box>
                  <Box>
                    <TextField 
                      select 
                      label="ط§ظ„طھطµظ†ظٹظپ ط§ظ„ط±ط¦ظٹط³ظٹ" 
                      fullWidth 
                      value={productForm.categoryId} 
                      onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                    >
                      <MenuItem value="">ط¨ط¯ظˆظ† طھطµظ†ظٹظپ</MenuItem>
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
                    label="ط§ظ„طھطµظ†ظٹظپط§طھ ط§ظ„ظ…طھط¹ط¯ط¯ط©"
                    fullWidth
                    value={formCategoryIds}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[])
                          .map((id) => categories.find((category) => category.id === id)?.name ?? id)
                          .join('طŒ '),
                    }}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormCategoryIds(typeof value === 'string' ? value.split(',') : (value as string[]));
                    }}
                    helperText="ظٹظ…ظƒظ† ط§ط®طھظٹط§ط± ط£ظƒط«ط± ظ…ظ† طھطµظ†ظٹظپ"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ط´ط§ط¨ظ‡ط©"
                    fullWidth
                    value={formRelatedProductIds}
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as string[])
                          .map((id) => products.find((product) => product.id === id)?.title ?? id)
                          .join('طŒ '),
                    }}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormRelatedProductIds(typeof value === 'string' ? value.split(',') : (value as string[]));
                    }}
                    helperText="ظٹظ…ظƒظ† طھط®طµظٹطµ ظ…ظ†طھط¬ط§طھ ظ…ط´ط§ط¨ظ‡ط© ظ„ظ„ط¸ظ‡ظˆط± ط¨ط¬ط§ظ†ط¨ ط§ظ„ظ…ظ†طھط¬"
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
                  label="ط§ظ„ظˆطµظپ" 
                  fullWidth 
                  multiline 
                  minRows={4} 
                  value={productForm.description} 
                  onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} 
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField 
                    label="ط§ظ„ظˆطµظپ (ط¹ط±ط¨ظٹ)" 
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
                    label="ط§ظ„ظˆطµظپ ط§ظ„ظ…ط®طھطµط± (ط¹ط±ط¨ظٹ)"
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
                    label="ط§ظ„ظˆطµظپ ط§ظ„طھظپطµظٹظ„ظٹ (ط¹ط±ط¨ظٹ)"
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
                    <Typography fontWeight={700}>ظ…ط¹ظ„ظˆظ…ط§طھ ط¥ط¶ط§ظپظٹط©</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={3}>
                      {!isDigitalProduct ? (
                        <>
                          {/* ظ‚ط³ظ… ط§ظ„ط¹ظ„ط§ظ…ط© ط§ظ„طھط¬ط§ط±ظٹط© ظˆط§ظ„ظˆط²ظ† */}
                          <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط¹ظ„ط§ظ…ط© ط§ظ„طھط¬ط§ط±ظٹط© ظˆط§ظ„ظˆط²ظ†</Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                            <TextField size="small" select label="العلامة التجارية" fullWidth value={formBrandId} onChange={(e) => setFormBrandId(e.target.value)}><MenuItem value="">بدون علامة تجارية</MenuItem>{brands.map((brand) => (<MenuItem key={brand.id} value={brand.id}>{brand.nameAr ?? brand.name}</MenuItem>))}</TextField>
                            <TextField size="small" label="ط§ظ„ظˆط²ظ† (ظƒط¬ظ…)" type="number" fullWidth value={formWeight} onChange={(e) => setFormWeight(e.target.value)} />
                            <TextField size="small" label="ظˆط­ط¯ط© ط§ظ„ظˆط²ظ† (ط§ط®طھظٹط§ط±ظٹ)" fullWidth value={formWeightUnit} onChange={(e) => setFormWeightUnit(e.target.value)} placeholder="kg / g / lb" />
                            <TextField size="small" label="ط³ط¹ط± ط§ظ„طھظƒظ„ظپط©" type="number" fullWidth value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value)} />
                          </Box>
                        </>
                      ) : null}

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          size="small"
                          label="ظ…ظ„طµظ‚ ط§ظ„ظ…ظ†طھط¬"
                          fullWidth
                          value={formProductLabel}
                          onChange={(e) => setFormProductLabel(e.target.value)}
                          placeholder="ط¬ط¯ظٹط¯ / ط§ظ„ط£ظƒط«ط± ظ…ط¨ظٹط¹ط§ظ‹"
                        />
                        <TextField
                          size="small"
                          label="ط±ط§ط¨ط· ظپظٹط¯ظٹظˆ ظٹظˆطھظٹظˆط¨"
                          fullWidth
                          value={formYoutubeUrl}
                          onChange={(e) => setFormYoutubeUrl(e.target.value)}
                          dir="ltr"
                        />
                      </Box>

                      {!isDigitalProduct ? (
                        <>
                          {/* ظ‚ط³ظ… ط§ظ„ط£ط¨ط¹ط§ط¯ */}
                          <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط£ط¨ط¹ط§ط¯</Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                            <TextField size="small" label="ط§ظ„ط·ظˆظ„ (ط³ظ…)" type="number" fullWidth value={formDimensionsLength} onChange={(e) => setFormDimensionsLength(e.target.value)} />
                            <TextField size="small" label="ط§ظ„ط¹ط±ط¶ (ط³ظ…)" type="number" fullWidth value={formDimensionsWidth} onChange={(e) => setFormDimensionsWidth(e.target.value)} />
                            <TextField size="small" label="ط§ظ„ط§ط±طھظپط§ط¹ (ط³ظ…)" type="number" fullWidth value={formDimensionsHeight} onChange={(e) => setFormDimensionsHeight(e.target.value)} />
                          </Box>
                        </>
                      ) : null}

                      {/* ظ‚ط³ظ… SEO */}
                      <Typography variant="subtitle2" fontWeight={700}>طھط­ط³ظٹظ† ظ…ط­ط±ظƒط§طھ ط§ظ„ط¨ط­ط« (SEO)</Typography>
                      <Stack spacing={2}>
                        <TextField size="small" label="ط¹ظ†ظˆط§ظ† SEO" fullWidth value={formSeoTitle} onChange={(e) => setFormSeoTitle(e.target.value)} />
                        <TextField size="small" label="ظˆطµظپ SEO" fullWidth multiline minRows={2} value={formSeoDescription} onChange={(e) => setFormSeoDescription(e.target.value)} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextField size="small" label="ط§ط³ظ… ط§ظ„طµظپط­ط© SEO (ط¹ط±ط¨ظٹ)" fullWidth value={formSeoTitleAr} onChange={(e) => setFormSeoTitleAr(e.target.value)} />
                          <TextField size="small" label="Page Title SEO (English)" fullWidth value={formSeoTitleEn} onChange={(e) => setFormSeoTitleEn(e.target.value)} />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextField size="small" label="ظˆطµظپ ط§ظ„طµظپط­ط© SEO (ط¹ط±ط¨ظٹ)" fullWidth multiline minRows={2} value={formSeoDescriptionAr} onChange={(e) => setFormSeoDescriptionAr(e.target.value)} />
                          <TextField size="small" label="Page Description SEO (English)" fullWidth multiline minRows={2} value={formSeoDescriptionEn} onChange={(e) => setFormSeoDescriptionEn(e.target.value)} />
                        </Box>
                      </Stack>

                      {/* ظ‚ط³ظ… ط§ظ„ظƒظ„ظ…ط§طھ ط§ظ„ظ…ظپطھط§ط­ظٹط© */}
                      <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ظƒظ„ظ…ط§طھ ط§ظ„ظ…ظپطھط§ط­ظٹط©</Typography>
                      <TextField size="small" label="ط§ظ„ظƒظ„ظ…ط§طھ ط§ظ„ظ…ظپطھط§ط­ظٹط© (ظ…ظپطµظˆظ„ط© ط¨ظپظˆط§طµظ„)" fullWidth value={formTags} onChange={(e) => setFormTags(e.target.value)} helperText="ظ…ط«ط§ظ„: ط¥ظ„ظƒطھط±ظˆظ†ظٹط§طھ, ظ‡ظˆط§طھظپ, ط°ظƒظٹ" />

                      {/* ظ‚ط³ظ… ط§ظ„ط®ظٹط§ط±ط§طھ */}
                      <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط®ظٹط§ط±ط§طھ</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <FormControlLabel control={<Switch checked={formIsFeatured} onChange={(e) => setFormIsFeatured(e.target.checked)} />} label="ظ…ظ†طھط¬ ظ…ظ…ظٹط²" />
                        <FormControlLabel control={<Switch checked={formIsTaxable} onChange={(e) => setFormIsTaxable(e.target.checked)} />} label="ط®ط§ط¶ط¹ ظ„ظ„ط¶ط±ظٹط¨ط©" />
                        {isSingleProduct ? (
                          <FormControlLabel
                            control={<Switch checked={formStockUnlimited} onChange={(e) => setFormStockUnlimited(e.target.checked)} />}
                            label="ظ…ط®ط²ظˆظ† ط؛ظٹط± ظ…ط­ط¯ظˆط¯"
                          />
                        ) : null}
                      </Box>
                      {formIsTaxable && (
                        <TextField size="small" label="ظ†ط³ط¨ط© ط§ظ„ط¶ط±ظٹط¨ط© (%)" type="number" fullWidth value={formTaxRate} onChange={(e) => setFormTaxRate(e.target.value)} sx={{ maxWidth: 300 }} />
                      )}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, maxWidth: 600 }}>
                        <TextField size="small" label="ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰ ظ„ظ„ط·ظ„ط¨" type="number" fullWidth value={formMinOrderQuantity} onChange={(e) => setFormMinOrderQuantity(e.target.value)} />
                        <TextField size="small" label="ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ظ„ط·ظ„ط¨" type="number" fullWidth value={formMaxOrderQuantity} onChange={(e) => setFormMaxOrderQuantity(e.target.value)} />
                      </Box>

                      <Typography variant="subtitle2" fontWeight={700}>ط®طµظ… ط§ظ„ظ…ظ†طھط¬ ظ…ظ† ظ†ظپط³ ط§ظ„طµظپط­ط©</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formInlineDiscountEnabled}
                            onChange={(e) => setFormInlineDiscountEnabled(e.target.checked)}
                          />
                        }
                        label="طھظپط¹ظٹظ„ ط®طµظ… ط®ط§طµ ظ„ظ‡ط°ط§ ط§ظ„ظ…ظ†طھط¬"
                      />
                      {formInlineDiscountEnabled ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                          <TextField
                            size="small"
                            select
                            label="ظ†ظˆط¹ ط§ظ„ط®طµظ…"
                            value={formInlineDiscountType}
                            onChange={(e) => setFormInlineDiscountType(e.target.value as 'percent' | 'fixed')}
                          >
                            <MenuItem value="percent">ظ†ط³ط¨ط© ظ…ط¦ظˆظٹط©</MenuItem>
                            <MenuItem value="fixed">ظ…ط¨ظ„ط؛ ط«ط§ط¨طھ</MenuItem>
                          </TextField>
                          <TextField size="small" label="ظ‚ظٹظ…ط© ط§ظ„ط®طµظ…" type="number" value={formInlineDiscountValue} onChange={(e) => setFormInlineDiscountValue(e.target.value)} />
                          <TextField size="small" label="ط¨ط¯ط§ظٹط© ط§ظ„ط®طµظ…" type="datetime-local" InputLabelProps={{ shrink: true }} value={formInlineDiscountStartsAt} onChange={(e) => setFormInlineDiscountStartsAt(e.target.value)} />
                          <TextField size="small" label="ظ†ظ‡ط§ظٹط© ط§ظ„ط®طµظ…" type="datetime-local" InputLabelProps={{ shrink: true }} value={formInlineDiscountEndsAt} onChange={(e) => setFormInlineDiscountEndsAt(e.target.value)} />
                        </Box>
                      ) : null}

                      {isBundledProduct ? (
                        <>
                          <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ط¶ظ…ظ†ط© ط¯ط§ط®ظ„ ط§ظ„ظ…ظ†طھط¬ ط§ظ„ظ…ط¬ظ…ط¹</Typography>
                          <Stack spacing={1.5}>
                            {bundleItems.map((item, index) => (
                              <Box key={`${item.bundledProductId}-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' }, gap: 1.5 }}>
                                <TextField
                                  size="small"
                                  select
                                  label="ط§ظ„ظ…ظ†طھط¬ ط§ظ„ظ…ط¶ظ…ظ‘ظ†"
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
                                  label="ط§ظ„ظƒظ…ظٹط©"
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
                                  ط­ط°ظپ
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
                            ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ ظ„ظ„ظ…ط¬ظ…ظˆط¹ط©
                          </Button>
                        </>
                      ) : null}

                      {isDigitalProduct ? (
                        <>
                          <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ط±ظ‚ظ…ظٹط© ظˆط³ظٹط§ط³ط© ط§ظ„طھط­ظ…ظٹظ„</Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                              size="small"
                              label="ط¹ط¯ط¯ ظ…ط­ط§ظˆظ„ط§طھ ط§ظ„طھط­ظ…ظٹظ„ ظ„ظƒظ„ ط¹ظ…ظٹظ„"
                              type="number"
                              value={formDigitalDownloadAttemptsLimit}
                              onChange={(e) => setFormDigitalDownloadAttemptsLimit(e.target.value)}
                              helperText="ط§طھط±ظƒظ‡ ظپط§ط±ط؛ط§ظ‹ = ط؛ظٹط± ظ…ط­ط¯ظˆط¯"
                            />
                            <TextField
                              size="small"
                              label="طھط§ط±ظٹط® ط§ظ†طھظ‡ط§ط، طµظ„ط§ط­ظٹط© ط§ظ„طھط­ظ…ظٹظ„"
                              type="datetime-local"
                              InputLabelProps={{ shrink: true }}
                              value={formDigitalDownloadExpiresAt}
                              onChange={(e) => setFormDigitalDownloadExpiresAt(e.target.value)}
                              helperText="ط§طھط±ظƒظ‡ ظپط§ط±ط؛ط§ظ‹ = ط؛ظٹط± ظ…ط­ط¯ظˆط¯"
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
                              label="ط§ط³ظ… ط§ظ„ظ…ظ„ظپ (ط§ط®طھظٹط§ط±ظٹ)"
                              value={digitalUploadName}
                              onChange={(e) => setDigitalUploadName(e.target.value)}
                              fullWidth
                            />
                            <Button
                              variant="outlined"
                              onClick={() => uploadDigitalFileAsset().catch(() => undefined)}
                              disabled={actionLoading || !digitalUploadFile}
                            >
                              ط±ظپط¹ ظ…ظ„ظپ ط±ظ‚ظ…ظٹ
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
                                  ط­ط°ظپ
                                </Button>
                              </Box>
                            ))}
                          </Stack>
                        </>
                      ) : null}

                      <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط®طµطµط© (JSON)</Typography>
                      <TextField
                        size="small"
                        label="Custom Fields JSON"
                        fullWidth
                        multiline
                        minRows={4}
                        value={formCustomFieldsJson}
                        onChange={(e) => setFormCustomFieldsJson(e.target.value)}
                        helperText={`ظ…ط«ط§ظ„: [{"key":"origin","labelAr":"ط¨ظ„ط¯ ط§ظ„ظ…ظ†ط´ط£","value":{"ar":"ط§ظ„ظٹظ…ظ†","en":"Yemen"}}]`}
                        dir="ltr"
                      />

                      {/* ظ‚ط³ظ… ط§ظ„طھظ‚ظٹظٹظ… (ط¹ط±ط¶ ظپظ‚ط·) */}
                      {selectedProduct && (selectedProduct as any).ratingAvg != null && (
                        <>
                          <Typography variant="subtitle2" fontWeight={700}>ط§ظ„طھظ‚ظٹظٹظ… (ط¹ط±ط¶ ظپظ‚ط·)</Typography>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <StarIcon sx={{ color: 'warning.main' }} />
                            <Typography variant="body2">ظ…طھظˆط³ط· ط§ظ„طھظ‚ظٹظٹظ…: {(selectedProduct as any).ratingAvg?.toFixed(1) ?? '-'}</Typography>
                            <Typography variant="body2" color="text.secondary">|</Typography>
                            <Typography variant="body2" color="text.secondary">ط¹ط¯ط¯ ط§ظ„طھظ‚ظٹظٹظ…ط§طھ: {(selectedProduct as any).ratingCount ?? 0}</Typography>
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
                    {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸...' : selectedProduct ? 'ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ' : 'ط¥ظ†ط´ط§ط، ط§ظ„ظ…ظ†طھط¬'}
                  </Button>
                </Box>
                {!hasChosenProductType ? (
                  <Alert severity="warning">ظٹط¬ط¨ ط§ط®طھظٹط§ط± ظ†ظˆط¹ ط§ظ„ظ…ظ†طھط¬ ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸.</Alert>
                ) : null}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <StyleIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>ظپظ„ط§طھط± ط§ظ„ظ…ظ†طھط¬</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {!selectedProduct ? (
                <Alert severity="info">ط§ط­ظپط¸ ط§ظ„ظ…ظ†طھط¬ ط£ظˆظ„ط§ظ‹ ظ„طھط«ط¨ظٹطھ ط¥ط³ظ†ط§ط¯ ط§ظ„ظپظ„ط§طھط±.</Alert>
              ) : filters.length === 0 ? (
                <Alert severity="info">ظ„ط§ طھظˆط¬ط¯ ظپظ„ط§طھط± ظ†ط´ط·ط© ط­ط§ظ„ظٹط§ظ‹.</Alert>
              ) : (
                <Stack spacing={2}>
                  {filters.map((filter) => (
                    <Box key={filter.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        {filter.nameAr}
                      </Typography>
                      {filter.type === 'range' ? (
                        <TextField
                          size="small"
                          type="number"
                          label="ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ط±ظ‚ظ…ظٹط©"
                          value={selectedRangeByFilterId[filter.id] ?? ''}
                          onChange={(event) => setProductFilterRange(filter.id, event.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                      ) : (
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                          {(filter.values ?? []).map((value) => {
                            const checked = selectedFilterValueIds.includes(value.id);
                            return (
                              <FormControlLabel
                                key={value.id}
                                control={
                                  <Checkbox
                                    checked={checked}
                                    onChange={(event) => {
                                      if (filter.type === 'radio' && event.target.checked) {
                                        const removable = new Set((filter.values ?? []).map((item) => item.id));
                                        setSelectedFilterValueIds((current) =>
                                          current.filter((item) => !removable.has(item)).concat(value.id),
                                        );
                                        return;
                                      }
                                      toggleProductFilterValue(value.id, event.target.checked);
                                    }}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {filter.type === 'color' && value.colorHex ? (
                                      <Box
                                        sx={{
                                          width: 14,
                                          height: 14,
                                          borderRadius: '50%',
                                          bgcolor: value.colorHex,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                        }}
                                      />
                                    ) : null}
                                    <span>{value.valueAr}</span>
                                  </Box>
                                }
                              />
                            );
                          })}
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* Variants Card (Only if product exists) */}
            {selectedProduct && !isDigitalProduct && (
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <StyleIcon color="primary" />
                  <Typography variant="h6" fontWeight={800}>ط§ظ„ظ…طھط؛ظٹط±ط§طھ ظˆط§ظ„ط£ط³ط¹ط§ط± (Variants)</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                
                {/* List of existing variants */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ظ…ط¶ط§ظپط©:</Typography>
                    <TableContainer component={Box} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط¹ظ†ظˆط§ظ†</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط³ط¹ط±</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ظ…ط®ط²ظˆظ†</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط®طµط§ط¦طµ</TableCell>
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
                                <Button size="small" onClick={() => selectVariantForEdit(variant)}>طھط¹ط¯ظٹظ„</Button>
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
                    {selectedVariantId ? 'طھط¹ط¯ظٹظ„ ط®طµط§ط¦طµ ط§ظ„ظ…طھط؛ظٹط± ط§ظ„ظ…ط­ط¯ط¯' : 'ط¥ط¶ط§ظپط© ظ…طھط؛ظٹط± ط¬ط¯ظٹط¯'}
                  </Typography>
                  
                  <Stack spacing={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="ط¹ظ†ظˆط§ظ† ط§ظ„ظ…طھط؛ظٹط± (ط¹ط±ط¨ظٹ)" fullWidth value={variantForm.titleAr} onChange={(e) => setVariantForm({ ...variantForm, titleAr: e.target.value, title: e.target.value })} placeholder="ظ…ط«ط§ظ„: ط£ط­ظ…ط± / ظƒط¨ظٹط±" dir="rtl" />
                      </Box>
                      <Box>
                        <TextField size="small" label="SKU (ط±ظ…ط² ط§ظ„طھط®ط²ظٹظ†)" fullWidth value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="ط§ظ„ط¨ط§ط±ظƒظˆط¯ (ط§ط®طھظٹط§ط±ظٹ)" fullWidth value={variantForm.barcode} onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2 }}>
                      <TextField size="small" label="Variant Title (English)" fullWidth value={variantForm.titleEn} onChange={(e) => setVariantForm({ ...variantForm, titleEn: e.target.value })} dir="ltr" />
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="ط§ظ„ط³ط¹ط±" type="number" fullWidth value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="ط§ظ„ط³ط¹ط± ظ‚ط¨ظ„ ط§ظ„ط®طµظ… (ط§ط®طھظٹط§ط±ظٹ)" type="number" fullWidth value={variantForm.compareAtPrice} onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طھظˆظپط±ط©" type="number" fullWidth value={variantForm.stockQuantity} onChange={(e) => setVariantForm({ ...variantForm, stockQuantity: e.target.value })} disabled={productForm.productType !== 'single'} helperText={productForm.productType !== 'single' ? 'ط§ظ„ظ…ط®ط²ظˆظ† ظٹطھظ… ط¥ط¯ط§ط±طھظ‡ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظ„ظ‡ط°ط§ ط§ظ„ظ†ظˆط¹' : undefined} />
                      </Box>
                      <Box>
                        <TextField size="small" label="طھظ†ط¨ظٹظ‡ ط§ظ†ط®ظپط§ط¶ ط§ظ„ظ…ط®ط²ظˆظ†" type="number" fullWidth value={variantForm.lowStockThreshold} onChange={(e) => setVariantForm({ ...variantForm, lowStockThreshold: e.target.value })} disabled={productForm.productType !== 'single'} helperText={productForm.productType !== 'single' ? 'ط؛ظٹط± ظ…ط·ظ„ظˆط¨ ظ„ظ‡ط°ط§ ط§ظ„ظ†ظˆط¹' : undefined} />
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="body2" fontWeight={700} mb={1}>ط±ط¨ط· ط¨ط®طµط§ط¦طµ ط§ظ„ظ…ظ†طھط¬ (ط§ظ„ط£ظ„ظˆط§ظ†طŒ ط§ظ„ظ…ظ‚ط§ط³ط§طھطŒ ط§ظ„ط®):</Typography>
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
                                <MenuItem value="">ط¨ط¯ظˆظ† ط§ط®طھظٹط§ط±</MenuItem>
                                {(attribute.values ?? []).map((val) => (
                                  <MenuItem key={val.id} value={val.id}>{val.value}</MenuItem>
                                ))}
                              </TextField>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">ظ„ظ… ظٹطھظ… ط¥ظ†ط´ط§ط، ط£ظٹ ط®طµط§ط¦طµ ظپظٹ ظ‚ط³ظ… "ط§ظ„ط®طµط§ط¦طµ" ط¨ط¹ط¯.</Typography>
                      )}
                    </Box>

                    <FormControlLabel control={<Checkbox checked={variantForm.isDefault} onChange={(e) => setVariantForm({ ...variantForm, isDefault: e.target.checked })} />} label="طھط¹ظٹظٹظ† ظƒظ…طھط؛ظٹط± ط§ظپطھط±ط§ط¶ظٹ ظٹط¸ظ‡ط± ط£ظˆظ„ط§ظ‹" />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {selectedVariantId ? (
                        <>
                          <Button variant="contained" onClick={() => updateVariantAttributes().catch(() => undefined)} disabled={actionLoading}>
                            ط­ظپط¸ طھط¹ط¯ظٹظ„ط§طھ ط§ظ„ط®طµط§ط¦طµ
                          </Button>
                          <Button variant="outlined" onClick={() => { setSelectedVariantId(''); setVariantForm(createVariantFormDefault()); }}>
                            ط¥ظ„ط؛ط§ط، ط§ظ„طھط¹ط¯ظٹظ„ ظˆ ط¥ط¶ط§ظپط© ط¬ط¯ظٹط¯
                          </Button>
                        </>
                      ) : (
                        <Button variant="contained" color="secondary" onClick={() => addVariant().catch(() => undefined)} disabled={actionLoading}>
                          ط¥ط¶ط§ظپط© ط§ظ„ظ…طھط؛ظٹط±
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
                  <Typography variant="h6" fontWeight={800}>ط§ظ„طµظˆط± ظˆط§ظ„ظˆط³ط§ط¦ط·</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                
                {/* Existing Images */}
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                    {selectedProduct.images.map((img) => (
                      <Paper key={img.id} sx={{ p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', width: 120, textAlign: 'center' }}>
                        <Box component="img" src={img.url} alt={img.altText || ''} sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1, mb: 1, bgcolor: 'background.default' }} />
                        {img.isPrimary && <Chip size="small" color="primary" label="ط§ظ„ط±ط¦ظٹط³ظٹط©" sx={{ mb: 0.5 }} />}
                        <Typography variant="caption" noWrap display="block" color="text.secondary">ط§ظ„طھط±طھظٹط¨: {img.sortOrder}</Typography>
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Upload Form */}
                <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 3, border: '1px dashed', borderColor: 'primary.main' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={2}>ط¥ط¶ط§ظپط© طµظˆط±ط© ط¬ط¯ظٹط¯ط©</Typography>
                  <Stack spacing={2}>
                    <TextField size="small" type="file" inputProps={{ accept: 'image/*' }} onChange={(e) => setImageFile((e.target as HTMLInputElement).files?.[0] ?? null)} fullWidth />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="ظ†طµ ط¨ط¯ظٹظ„ (Alt)" fullWidth value={imageForm.altText} onChange={(e) => setImageForm({ ...imageForm, altText: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="ط§ظ„طھط±طھظٹط¨ (0 ظٹط¸ظ‡ط± ط£ظˆظ„ط§ظ‹)" type="number" fullWidth value={imageForm.sortOrder} onChange={(e) => setImageForm({ ...imageForm, sortOrder: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" select label="ط±ط¨ط· ط¨ظ…طھط؛ظٹط± (ط§ط®طھظٹط§ط±ظٹ)" fullWidth value={imageForm.variantId} onChange={(e) => setImageForm({ ...imageForm, variantId: e.target.value })}>
                          <MenuItem value="">ط¨ط¯ظˆظ† ط±ط¨ط· (طµظˆط±ط© ط¹ط§ظ…ط©)</MenuItem>
                          {(selectedProduct?.variants ?? []).map(v => (
                            <MenuItem key={v.id} value={v.id}>{v.title}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button variant="contained" onClick={() => uploadAndAttachImage(true).catch(() => undefined)} disabled={actionLoading || !imageFile} sx={{ width: 'fit-content' }}>
                        {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط±ظپط¹...' : 'ط±ظپط¹ ظƒطµظˆط±ط© ط±ط¦ظٹط³ظٹط©'}
                      </Button>
                      <Button variant="outlined" onClick={() => uploadAndAttachImage(false).catch(() => undefined)} disabled={actionLoading || !imageFile} sx={{ width: 'fit-content' }}>
                        {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط±ظپط¹...' : 'ط±ظپط¹ ظƒطµظˆط±ط© ط¥ط¶ط§ظپظٹط©'}
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
        title="ط§ظ„ظ…ظ†طھط¬ط§طھ"
        description="ط£ط¶ظپ ظ…ظ†طھط¬ط§طھظƒ ظˆظ†ط¸ظ… ط§ظ„ظƒطھط§ظ„ظˆط¬ ظ…ط¹ طµظˆط±ط© ظˆط§ط¶ط­ط© ظ„ظ„ط­ط§ظ„ط© ظˆط§ظ„طھطµظ†ظٹظپ."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>
            ظ…ظ†طھط¬ ط¬ط¯ظٹط¯
          </Button>
        }
      />

      {message.text ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <FilterBar>
        <TextField
          placeholder="ط§ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬ ط£ظˆ ط§ظ„ط±ط§ط¨ط·..."
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
          طھط­ط¯ظٹط« ط§ظ„ظ‚ط§ط¦ظ…ط©
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => exportProductsToExcel().catch(() => undefined)}
          disabled={exportLoading}
        >
          {exportLoading ? 'ط¬ط§ط±ظگ ط§ظ„طھطµط¯ظٹط±...' : 'طھطµط¯ظٹط± Excel'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<UploadFileIcon />}
          onClick={openImportFileDialog}
          disabled={importLoading}
        >
          {importLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط§ط³طھظٹط±ط§ط¯...' : 'ط§ط³طھظٹط±ط§ط¯ Excel'}
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
                <TableCell>ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬</TableCell>
                <TableCell>ط§ظ„ظ†ظˆط¹</TableCell>
                <TableCell>ط§ظ„طھطµظ†ظٹظپ</TableCell>
                <TableCell>ط§ظ„ط­ط§ظ„ط©</TableCell>
                <TableCell>ط§ظ„ظ…طھط؛ظٹط±ط§طھ</TableCell>
                <TableCell align="left">ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</TableCell>
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
                      <Typography color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ.</Typography>
                    </TableCell>
                  </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const categoryName = categories.find((c) => c.id === product.categoryId)?.name || 'ط¨ط¯ظˆظ† طھطµظ†ظٹظپ';
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
                          label={product.productType === 'digital' ? 'ط±ظ‚ظ…ظٹ' : product.productType === 'bundled' ? 'ظ…ط¬ظ…ط¹' : 'ظپط±ط¯ظٹ'}
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
                          {product.variants?.length || 0} ظ…طھط؛ظٹط±
                        </Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Button size="small" variant="outlined" startIcon={<EditNoteIcon />} onClick={() => loadProductDetails(product.id).catch(() => undefined)}>
                          طھط¹ط¯ظٹظ„
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
    brandId: string; weight: string; costPrice: string; seoTitle: string; seoDescription: string;
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
    throw new Error('ط§ظ„ط§ط³ظ… ط§ظ„ط¹ط±ط¨ظٹ ظ„ظ„ظ…ظ†طھط¬ ظ…ط·ظ„ظˆط¨');
  }

  const payload: {
    title: string;
    productType: ProductType;
    isVisible: boolean;
    questionsEnabled: boolean;
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
    brandId?: string | null;
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
    questionsEnabled: form.questionsEnabled,
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

    payload.brandId = extra.brandId.trim() ? extra.brandId.trim() : null;
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
        throw new Error('طµظٹط؛ط© JSON ظ„ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط®طµطµط© ط؛ظٹط± طµط­ظٹط­ط©');
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
    throw new Error('ط¹ظ†ظˆط§ظ† ط§ظ„ظ…طھط؛ظٹط± ط¨ط§ظ„ط¹ط±ط¨ظٹط© ظ…ط·ظ„ظˆط¨');
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
    return 'ظ„ط§ ظٹظˆط¬ط¯';
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
    throw new Error('طھط¹ط°ط± ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط±ط§ط¨ط· ط§ظ„ط±ظپط¹ ط§ظ„ظ…ظˆظ‚ظ‘ط¹');
  }

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: presigned.uploadHeaders,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('ظپط´ظ„ ط±ظپط¹ ط§ظ„ظˆط³ط§ط¦ط· ط§ظ„ظ…ط¨ط§ط´ط±');
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
    throw new Error('طھط¹ط°ط± طھط£ظƒظٹط¯ ط§ظ„ظˆط³ط§ط¦ط· ط§ظ„ظ…ط±ظپظˆط¹ط©');
  }

  return mediaAsset;
}



