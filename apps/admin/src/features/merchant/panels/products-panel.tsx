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

import type { MerchantRequester } from '../merchant-dashboard.types';
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
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
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
          titleAr: (data as any).titleAr ?? '',
          titleEn: (data as any).titleEn ?? '',
          descriptionAr: (data as any).descriptionAr ?? '',
          descriptionEn: (data as any).descriptionEn ?? '',
        });
        const d = data as any;
        setFormBrand(d.brand ?? '');
        setFormWeight(d.weight != null ? String(d.weight) : '');
        setFormCostPrice(d.costPrice != null ? String(d.costPrice) : '');
        setFormSeoTitle(d.seoTitle ?? '');
        setFormSeoDescription(d.seoDescription ?? '');
        setFormDimensionsLength(d.dimensions?.length != null ? String(d.dimensions.length) : '');
        setFormDimensionsWidth(d.dimensions?.width != null ? String(d.dimensions.width) : '');
        setFormDimensionsHeight(d.dimensions?.height != null ? String(d.dimensions.height) : '');
        setFormTags(Array.isArray(d.tags) ? d.tags.join(', ') : '');
        setFormIsFeatured(Boolean(d.isFeatured));
        setFormIsTaxable(Boolean(d.isTaxable));
        setFormTaxRate(d.taxRate != null ? String(d.taxRate) : '');
        setFormMinOrderQuantity(d.minOrderQuantity != null ? String(d.minOrderQuantity) : '');
        setFormMaxOrderQuantity(d.maxOrderQuantity != null ? String(d.maxOrderQuantity) : '');
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ طھظپط§طµظٹظ„ ط§ظ„ظ…ظ†طھط¬', type: 'error' });
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
    setFormBrand('');
    setFormWeight('');
    setFormCostPrice('');
    setFormSeoTitle('');
    setFormSeoDescription('');
    setFormDimensionsLength('');
    setFormDimensionsWidth('');
    setFormDimensionsHeight('');
    setFormTags('');
    setFormIsFeatured(false);
    setFormIsTaxable(false);
    setFormTaxRate('');
    setFormMinOrderQuantity('');
    setFormMaxOrderQuantity('');
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
        body: JSON.stringify(buildProductPayload(productForm, {
          brand: formBrand, weight: formWeight, costPrice: formCostPrice,
          seoTitle: formSeoTitle, seoDescription: formSeoDescription,
          dimensionsLength: formDimensionsLength, dimensionsWidth: formDimensionsWidth, dimensionsHeight: formDimensionsHeight,
          tags: formTags, isFeatured: formIsFeatured, isTaxable: formIsTaxable, taxRate: formTaxRate,
          minOrderQuantity: formMinOrderQuantity, maxOrderQuantity: formMaxOrderQuantity,
        })),
      });
      if (created) {
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
          brand: formBrand, weight: formWeight, costPrice: formCostPrice,
          seoTitle: formSeoTitle, seoDescription: formSeoDescription,
          dimensionsLength: formDimensionsLength, dimensionsWidth: formDimensionsWidth, dimensionsHeight: formDimensionsHeight,
          tags: formTags, isFeatured: formIsFeatured, isTaxable: formIsTaxable, taxRate: formTaxRate,
          minOrderQuantity: formMinOrderQuantity, maxOrderQuantity: formMaxOrderQuantity,
        })),
      });
      await loadCatalog();
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ظ†طھط¬ ط¨ظ†ط¬ط§ط­', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ظ…ظ†طھط¬', type: 'error' });
    } finally {
      setActionLoading(false);
    }
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
        body: JSON.stringify(buildVariantPayload(variantForm)),
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
      titleAr: (variant as any).titleAr ?? '',
      titleEn: (variant as any).titleEn ?? '',
    });
    setMessage({ text: 'طھظ… طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط؛ظٹط± ظ„ظ„طھط¹ط¯ظٹظ„', type: 'info' });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function uploadAndAttachImage(): Promise<void> {
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
        body: JSON.stringify(buildAttachImagePayload(imageForm, mediaAsset.id)),
      });

      setImageForm(imageFormDefault);
      setImageFile(null);
      await loadProductDetails(selectedProduct.id);
      setMessage({ text: 'طھظ… ط±ظپط¹ ط§ظ„طµظˆط±ط© ظˆط±ط¨ط·ظ‡ط§ ط¨ط§ظ„ظ…ظ†طھط¬', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± ط±ظپط¹ ط§ظ„طµظˆط±ط©', type: 'error' });
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
                        label="ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬" 
                        fullWidth 
                        value={productForm.title} 
                        onChange={(event) => setProductForm((prev) => ({ ...prev, title: event.target.value }))} 
                        required
                      />
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField 
                          label="ط§ظ„ط§ط³ظ… (ط¹ط±ط¨ظٹ)" 
                          fullWidth 
                          value={productForm.titleAr} 
                          onChange={(event) => setProductForm((prev) => ({ ...prev, titleAr: event.target.value }))} 
                          dir="rtl"
                        />
                        <TextField 
                          label="Title (English)" 
                          fullWidth 
                          value={productForm.titleEn} 
                          onChange={(event) => setProductForm((prev) => ({ ...prev, titleEn: event.target.value }))} 
                          dir="ltr"
                        />
                      </Box>
                    </Stack>
                  </Box>
                  <Box>
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
                      label="ط§ظ„طھطµظ†ظٹظپ" 
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

                {/* Additional Information Accordion */}
                <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>ظ…ط¹ظ„ظˆظ…ط§طھ ط¥ط¶ط§ظپظٹط©</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={3}>
                      {/* ظ‚ط³ظ… ط§ظ„ط¹ظ„ط§ظ…ط© ط§ظ„طھط¬ط§ط±ظٹط© ظˆط§ظ„ظˆط²ظ† */}
                      <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط¹ظ„ط§ظ…ط© ط§ظ„طھط¬ط§ط±ظٹط© ظˆط§ظ„ظˆط²ظ†</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                        <TextField size="small" label="ط§ظ„ط¹ظ„ط§ظ…ط© ط§ظ„طھط¬ط§ط±ظٹط©" fullWidth value={formBrand} onChange={(e) => setFormBrand(e.target.value)} />
                        <TextField size="small" label="ط§ظ„ظˆط²ظ† (ظƒط¬ظ…)" type="number" fullWidth value={formWeight} onChange={(e) => setFormWeight(e.target.value)} />
                        <TextField size="small" label="ط³ط¹ط± ط§ظ„طھظƒظ„ظپط©" type="number" fullWidth value={formCostPrice} onChange={(e) => setFormCostPrice(e.target.value)} />
                      </Box>

                      {/* ظ‚ط³ظ… ط§ظ„ط£ط¨ط¹ط§ط¯ */}
                      <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط£ط¨ط¹ط§ط¯</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                        <TextField size="small" label="ط§ظ„ط·ظˆظ„ (ط³ظ…)" type="number" fullWidth value={formDimensionsLength} onChange={(e) => setFormDimensionsLength(e.target.value)} />
                        <TextField size="small" label="ط§ظ„ط¹ط±ط¶ (ط³ظ…)" type="number" fullWidth value={formDimensionsWidth} onChange={(e) => setFormDimensionsWidth(e.target.value)} />
                        <TextField size="small" label="ط§ظ„ط§ط±طھظپط§ط¹ (ط³ظ…)" type="number" fullWidth value={formDimensionsHeight} onChange={(e) => setFormDimensionsHeight(e.target.value)} />
                      </Box>

                      {/* ظ‚ط³ظ… SEO */}
                      <Typography variant="subtitle2" fontWeight={700}>طھط­ط³ظٹظ† ظ…ط­ط±ظƒط§طھ ط§ظ„ط¨ط­ط« (SEO)</Typography>
                      <Stack spacing={2}>
                        <TextField size="small" label="ط¹ظ†ظˆط§ظ† SEO" fullWidth value={formSeoTitle} onChange={(e) => setFormSeoTitle(e.target.value)} />
                        <TextField size="small" label="ظˆطµظپ SEO" fullWidth multiline minRows={2} value={formSeoDescription} onChange={(e) => setFormSeoDescription(e.target.value)} />
                      </Stack>

                      {/* ظ‚ط³ظ… ط§ظ„ظƒظ„ظ…ط§طھ ط§ظ„ظ…ظپطھط§ط­ظٹط© */}
                      <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ظƒظ„ظ…ط§طھ ط§ظ„ظ…ظپطھط§ط­ظٹط©</Typography>
                      <TextField size="small" label="ط§ظ„ظƒظ„ظ…ط§طھ ط§ظ„ظ…ظپطھط§ط­ظٹط© (ظ…ظپطµظˆظ„ط© ط¨ظپظˆط§طµظ„)" fullWidth value={formTags} onChange={(e) => setFormTags(e.target.value)} helperText="ظ…ط«ط§ظ„: ط¥ظ„ظƒطھط±ظˆظ†ظٹط§طھ, ظ‡ظˆط§طھظپ, ط°ظƒظٹ" />

                      {/* ظ‚ط³ظ… ط§ظ„ط®ظٹط§ط±ط§طھ */}
                      <Typography variant="subtitle2" fontWeight={700}>ط§ظ„ط®ظٹط§ط±ط§طھ</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        <FormControlLabel control={<Switch checked={formIsFeatured} onChange={(e) => setFormIsFeatured(e.target.checked)} />} label="ظ…ظ†طھط¬ ظ…ظ…ظٹط²" />
                        <FormControlLabel control={<Switch checked={formIsTaxable} onChange={(e) => setFormIsTaxable(e.target.checked)} />} label="ط®ط§ط¶ط¹ ظ„ظ„ط¶ط±ظٹط¨ط©" />
                      </Box>
                      {formIsTaxable && (
                        <TextField size="small" label="ظ†ط³ط¨ط© ط§ظ„ط¶ط±ظٹط¨ط© (%)" type="number" fullWidth value={formTaxRate} onChange={(e) => setFormTaxRate(e.target.value)} sx={{ maxWidth: 300 }} />
                      )}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, maxWidth: 600 }}>
                        <TextField size="small" label="ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰ ظ„ظ„ط·ظ„ط¨" type="number" fullWidth value={formMinOrderQuantity} onChange={(e) => setFormMinOrderQuantity(e.target.value)} />
                        <TextField size="small" label="ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ظ„ط·ظ„ط¨" type="number" fullWidth value={formMaxOrderQuantity} onChange={(e) => setFormMaxOrderQuantity(e.target.value)} />
                      </Box>

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
                    disabled={actionLoading}
                    size="large"
                    sx={{ px: 4 }}
                  >
                    {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸...' : selectedProduct ? 'ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ' : 'ط¥ظ†ط´ط§ط، ط§ظ„ظ…ظ†طھط¬'}
                  </Button>
                </Box>
              </Stack>
            </Paper>

            {/* Variants Card (Only if product exists) */}
            {selectedProduct && (
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
                        <TextField size="small" label="ط¹ظ†ظˆط§ظ† ط§ظ„ظ…طھط؛ظٹط±" fullWidth value={variantForm.title} onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })} placeholder="ظ…ط«ط§ظ„: ط£ط­ظ…ط± / ظƒط¨ظٹط±" />
                      </Box>
                      <Box>
                        <TextField size="small" label="SKU (ط±ظ…ط² ط§ظ„طھط®ط²ظٹظ†)" fullWidth value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="ط§ظ„ط¨ط§ط±ظƒظˆط¯ (ط§ط®طھظٹط§ط±ظٹ)" fullWidth value={variantForm.barcode} onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="ط¹ظ†ظˆط§ظ† ط§ظ„ظ…ظˆط¯ظٹظ„ (ط¹ط±ط¨ظٹ)" fullWidth value={variantForm.titleAr} onChange={(e) => setVariantForm({ ...variantForm, titleAr: e.target.value })} dir="rtl" />
                      </Box>
                      <Box>
                        <TextField size="small" label="Variant Title (English)" fullWidth value={variantForm.titleEn} onChange={(e) => setVariantForm({ ...variantForm, titleEn: e.target.value })} dir="ltr" />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
                      <Box>
                        <TextField size="small" label="ط§ظ„ط³ط¹ط±" type="number" fullWidth value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="ط§ظ„ط³ط¹ط± ظ‚ط¨ظ„ ط§ظ„ط®طµظ… (ط§ط®طھظٹط§ط±ظٹ)" type="number" fullWidth value={variantForm.compareAtPrice} onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طھظˆظپط±ط©" type="number" fullWidth value={variantForm.stockQuantity} onChange={(e) => setVariantForm({ ...variantForm, stockQuantity: e.target.value })} />
                      </Box>
                      <Box>
                        <TextField size="small" label="طھظ†ط¨ظٹظ‡ ط§ظ†ط®ظپط§ط¶ ط§ظ„ظ…ط®ط²ظˆظ†" type="number" fullWidth value={variantForm.lowStockThreshold} onChange={(e) => setVariantForm({ ...variantForm, lowStockThreshold: e.target.value })} />
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
                    <Button variant="contained" onClick={() => uploadAndAttachImage().catch(() => undefined)} disabled={actionLoading || !imageFile} sx={{ width: 'fit-content' }}>
                      {actionLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط±ظپط¹...' : 'ط±ظپط¹ ط§ظ„طµظˆط±ط© ظˆط­ظپط¸'}
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
            ط§ظ„ظ…ظ†طھط¬ط§طھ
          </Typography>
          <Typography color="text.secondary">
            ط£ط¶ظپ ظ…ظ†طھط¬ط§طھظƒ ظˆظ†ط¸ظ… ط§ظ„ظƒطھط§ظ„ظˆط¬ ط§ظ„ط®ط§طµ ط¨ظ…طھط¬ط±ظƒ ط¨ط³ظ‡ظˆظ„ط©.
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
          ظ…ظ†طھط¬ ط¬ط¯ظٹط¯
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField 
          placeholder="ط§ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬ ط£ظˆ ط§ظ„ط±ط§ط¨ط·..." 
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
          طھط­ط¯ظٹط« ط§ظ„ظ‚ط§ط¦ظ…ط©
        </Button>
      </Paper>

      {/* Products Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ width: 60 }}></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„طھطµظ†ظٹظپ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط­ط§ظ„ط©</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ظ…طھط؛ظٹط±ط§طھ</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</TableCell>
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
                    <Typography color="text.secondary">ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'ط¨ط¯ظˆظ† طھطµظ†ظٹظپ';
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
                          {(product as any).isFeatured && <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />}
                        </Box>
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
                          {product.variants?.length || 0} ظ…طھط؛ظٹط±
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
      </Paper>
    </Box>
  );
}

// Helper functions kept exactly the same for payload construction

function buildProductPayload(
  form: typeof productFormDefault,
  extra?: {
    brand: string; weight: string; costPrice: string; seoTitle: string; seoDescription: string;
    dimensionsLength: string; dimensionsWidth: string; dimensionsHeight: string;
    tags: string; isFeatured: boolean; isTaxable: boolean; taxRate: string;
    minOrderQuantity: string; maxOrderQuantity: string;
  },
) {
  const payload: {
    title: string;
    slug?: string;
    description?: string;
    categoryId?: string;
    status: ProductStatus;
    titleAr?: string;
    titleEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    brand?: string;
    weight?: number;
    costPrice?: number;
    dimensions?: { length?: number; width?: number; height?: number };
    tags?: string[];
    isFeatured?: boolean;
    isTaxable?: boolean;
    taxRate?: number;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
    seoTitle?: string;
    seoDescription?: string;
  } = {
    title: form.title.trim(),
    status: form.status,
  };

  if (extra) {
    payload.isFeatured = extra.isFeatured;
    payload.isTaxable = extra.isTaxable;
  }

  const slug = form.slug.trim();
  const description = form.description.trim();
  const categoryId = form.categoryId.trim();
  const titleAr = form.titleAr.trim();
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
  if (titleAr) {
    payload.titleAr = titleAr;
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
    if (extra.brand.trim()) {
      payload.brand = extra.brand.trim();
    }
    if (extra.weight) {
      payload.weight = Number(extra.weight);
    }
    if (extra.costPrice) {
      payload.costPrice = Number(extra.costPrice);
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
    titleAr?: string;
    titleEn?: string;
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
  const titleAr = form.titleAr.trim();
  const titleEn = form.titleEn.trim();

  if (barcode) {
    payload.barcode = barcode;
  }
  if (compareAtPrice) {
    payload.compareAtPrice = Number(compareAtPrice);
  }
  if (titleAr) {
    payload.titleAr = titleAr;
  }
  if (titleEn) {
    payload.titleEn = titleEn;
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