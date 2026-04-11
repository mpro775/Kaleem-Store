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
  CircularProgress,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DiscountIcon from '@mui/icons-material/Discount';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import type { MerchantRequester } from '../merchant-dashboard.types';
import type {
  AdvancedOffer,
  AdvancedOfferType,
  Coupon,
  DiscountType,
  Offer,
  OfferTargetType,
} from '../types';

interface PromotionsPanelProps {
  request: MerchantRequester;
}

const couponFormDefault = {
  code: '',
  discountType: 'percent' as DiscountType,
  discountValue: '10',
  minOrderAmount: '0',
  startsAt: '',
  endsAt: '',
  maxUses: '',
  isActive: true,
};

const offerFormDefault = {
  name: '',
  targetType: 'cart' as OfferTargetType,
  targetProductId: '',
  targetCategoryId: '',
  discountType: 'percent' as DiscountType,
  discountValue: '10',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

const advancedOfferFormDefault = {
  name: '',
  description: '',
  offerType: 'bxgy' as AdvancedOfferType,
  config: JSON.stringify(
    {
      bxgy: {
        buyQuantity: 2,
        buyProductIds: ['product-id-1'],
        getXQuantity: 1,
        getXProductIds: ['product-id-2'],
        discountPercent: 100,
      },
    },
    null,
    2,
  ),
  startsAt: '',
  endsAt: '',
  isActive: true,
  priority: '0',
};

export function PromotionsPanel({ request }: PromotionsPanelProps) {
  const [activeTab, setActiveTab] = useState<'coupons' | 'offers' | 'advanced'>('coupons');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [advancedOffers, setAdvancedOffers] = useState<AdvancedOffer[]>([]);
  
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedAdvancedOfferId, setSelectedAdvancedOfferId] = useState('');
  
  const [couponForm, setCouponForm] = useState(couponFormDefault);
  const [offerForm, setOfferForm] = useState(offerFormDefault);
  const [advancedOfferForm, setAdvancedOfferForm] = useState(advancedOfferFormDefault);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadAll().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const [couponData, offerData, advancedOfferData] = await Promise.all([
        request<Coupon[]>('/promotions/coupons', { method: 'GET' }),
        request<Offer[]>('/promotions/offers', { method: 'GET' }),
        request<AdvancedOffer[]>('/advanced-offers', { method: 'GET' }),
      ]);

      setCoupons(couponData ?? []);
      setOffers(offerData ?? []);
      setAdvancedOffers(advancedOfferData ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل العروض', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedCouponId('');
    setSelectedOfferId('');
    setSelectedAdvancedOfferId('');
    setCouponForm(couponFormDefault);
    setOfferForm(offerFormDefault);
    setAdvancedOfferForm(advancedOfferFormDefault);
    setMessage({ text: '', type: 'info' });
    setViewMode('detail');
  }

  function handleBackToList() {
    setViewMode('list');
    setMessage({ text: '', type: 'info' });
  }

  async function createCoupon(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request('/promotions/coupons', {
        method: 'POST',
        body: JSON.stringify(buildCouponCreatePayload(couponForm)),
      });
      setCouponForm(couponFormDefault);
      await loadAll();
      setMessage({ text: 'تم إنشاء كوبون الخصم بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إنشاء الكوبون', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateCoupon(): Promise<void> {
    if (!selectedCouponId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/promotions/coupons/${selectedCouponId}`, {
        method: 'PUT',
        body: JSON.stringify(buildCouponUpdatePayload(couponForm)),
      });
      await loadAll();
      setMessage({ text: 'تم تحديث كوبون الخصم بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث الكوبون', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function createOffer(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request('/promotions/offers', {
        method: 'POST',
        body: JSON.stringify(buildOfferCreatePayload(offerForm)),
      });
      setOfferForm(offerFormDefault);
      await loadAll();
      setMessage({ text: 'تم إنشاء العرض التلقائي بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إنشاء العرض', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateOffer(): Promise<void> {
    if (!selectedOfferId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/promotions/offers/${selectedOfferId}`, {
        method: 'PUT',
        body: JSON.stringify(buildOfferUpdatePayload(offerForm)),
      });
      await loadAll();
      setMessage({ text: 'تم تحديث العرض التلقائي بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث العرض', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function createAdvancedOffer(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request('/advanced-offers', {
        method: 'POST',
        body: JSON.stringify(buildAdvancedOfferCreatePayload(advancedOfferForm)),
      });
      setAdvancedOfferForm(advancedOfferFormDefault);
      await loadAll();
      setMessage({ text: 'تم إنشاء العرض المتقدم بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إنشاء العرض المتقدم', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateAdvancedOffer(): Promise<void> {
    if (!selectedAdvancedOfferId) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/advanced-offers/${selectedAdvancedOfferId}`, {
        method: 'PUT',
        body: JSON.stringify(buildAdvancedOfferUpdatePayload(advancedOfferForm)),
      });
      await loadAll();
      setMessage({ text: 'تم تحديث العرض المتقدم بنجاح', type: 'success' });
      setViewMode('list');
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث العرض المتقدم', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function selectCoupon(coupon: Coupon): void {
    setSelectedCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount),
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '',
      endsAt: coupon.endsAt ? coupon.endsAt.slice(0, 16) : '',
      maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : '',
      isActive: coupon.isActive,
    });
    setViewMode('detail');
  }

  function selectOffer(offer: Offer): void {
    setSelectedOfferId(offer.id);
    setOfferForm({
      name: offer.name,
      targetType: offer.targetType,
      targetProductId: offer.targetProductId ?? '',
      targetCategoryId: offer.targetCategoryId ?? '',
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      startsAt: offer.startsAt ? offer.startsAt.slice(0, 16) : '',
      endsAt: offer.endsAt ? offer.endsAt.slice(0, 16) : '',
      isActive: offer.isActive,
    });
    setViewMode('detail');
  }

  function selectAdvancedOffer(offer: AdvancedOffer): void {
    setSelectedAdvancedOfferId(offer.id);
    setAdvancedOfferForm({
      name: offer.name,
      description: offer.description ?? '',
      offerType: offer.offerType,
      config: JSON.stringify(offer.config, null, 2),
      startsAt: offer.startsAt ? offer.startsAt.slice(0, 16) : '',
      endsAt: offer.endsAt ? offer.endsAt.slice(0, 16) : '',
      isActive: offer.isActive,
      priority: String(offer.priority),
    });
    setViewMode('detail');
  }

  if (viewMode === 'detail') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Button 
            startIcon={<ArrowForwardIcon />} 
            onClick={handleBackToList}
            color="inherit"
            sx={{ fontWeight: 700 }}
          >
            العودة للقائمة
          </Button>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
        )}

        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          
          {/* COUPON FORM */}
          {activeTab === 'coupons' && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <DiscountIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>{selectedCouponId ? 'تعديل كوبون الخصم' : 'كوبون خصم جديد'}</Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Stack spacing={3}>
                <TextField label="رمز الكوبون (Code)" fullWidth value={couponForm.code} onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} dir="ltr" />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <TextField select label="نوع الخصم" fullWidth value={couponForm.discountType} onChange={(event) => setCouponForm((prev) => ({ ...prev, discountType: event.target.value as DiscountType }))}>
                    <MenuItem value="percent">نسبة مئوية (%)</MenuItem>
                    <MenuItem value="fixed">مبلغ ثابت</MenuItem>
                  </TextField>
                  <TextField label="قيمة الخصم" type="number" inputProps={{ min: 0, step: 0.01 }} fullWidth value={couponForm.discountValue} onChange={(event) => setCouponForm((prev) => ({ ...prev, discountValue: event.target.value }))} />
                </Box>
                
                <TextField label="الحد الأدنى للطلب (اختياري)" type="number" inputProps={{ min: 0, step: 0.01 }} fullWidth value={couponForm.minOrderAmount} onChange={(event) => setCouponForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))} />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <TextField label="تاريخ البدء" type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth value={couponForm.startsAt} onChange={(event) => setCouponForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
                  <TextField label="تاريخ الانتهاء" type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth value={couponForm.endsAt} onChange={(event) => setCouponForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
                </Box>

                <TextField label="الحد الأقصى لعدد الاستخدامات (اختياري)" type="number" inputProps={{ min: 1 }} fullWidth value={couponForm.maxUses} onChange={(event) => setCouponForm((prev) => ({ ...prev, maxUses: event.target.value }))} />
                <FormControlLabel control={<Checkbox checked={couponForm.isActive} onChange={(event) => setCouponForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="الكوبون فعال" />
                <Button variant="contained" size="large" onClick={() => (selectedCouponId ? updateCoupon() : createCoupon()).catch(() => undefined)} disabled={actionLoading}>
                  {actionLoading ? 'جارِ الحفظ...' : 'حفظ الكوبون'}
                </Button>
              </Stack>
            </Box>
          )}

          {/* OFFER FORM */}
          {activeTab === 'offers' && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <LocalOfferIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>{selectedOfferId ? 'تعديل العرض التلقائي' : 'عرض تلقائي جديد'}</Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Stack spacing={3}>
                <TextField label="اسم العرض" fullWidth value={offerForm.name} onChange={(event) => setOfferForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField select label="يطبق على" fullWidth value={offerForm.targetType} onChange={(event) => setOfferForm((prev) => ({ ...prev, targetType: event.target.value as OfferTargetType }))}>
                  <MenuItem value="cart">كامل السلة</MenuItem>
                  <MenuItem value="product">منتج محدد</MenuItem>
                  <MenuItem value="category">تصنيف محدد</MenuItem>
                </TextField>
                {offerForm.targetType === 'product' && (
                  <TextField label="معرّف المنتج المستهدف" fullWidth value={offerForm.targetProductId} onChange={(event) => setOfferForm((prev) => ({ ...prev, targetProductId: event.target.value }))} />
                )}
                {offerForm.targetType === 'category' && (
                  <TextField label="معرّف التصنيف المستهدف" fullWidth value={offerForm.targetCategoryId} onChange={(event) => setOfferForm((prev) => ({ ...prev, targetCategoryId: event.target.value }))} />
                )}
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <TextField select label="نوع الخصم" fullWidth value={offerForm.discountType} onChange={(event) => setOfferForm((prev) => ({ ...prev, discountType: event.target.value as DiscountType }))}>
                    <MenuItem value="percent">نسبة مئوية (%)</MenuItem>
                    <MenuItem value="fixed">مبلغ ثابت</MenuItem>
                  </TextField>
                  <TextField label="قيمة الخصم" type="number" inputProps={{ min: 0, step: 0.01 }} fullWidth value={offerForm.discountValue} onChange={(event) => setOfferForm((prev) => ({ ...prev, discountValue: event.target.value }))} />
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <TextField label="تاريخ البدء" type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth value={offerForm.startsAt} onChange={(event) => setOfferForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
                  <TextField label="تاريخ الانتهاء" type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth value={offerForm.endsAt} onChange={(event) => setOfferForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
                </Box>

                <FormControlLabel control={<Checkbox checked={offerForm.isActive} onChange={(event) => setOfferForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="العرض فعال" />
                <Button variant="contained" size="large" onClick={() => (selectedOfferId ? updateOffer() : createOffer()).catch(() => undefined)} disabled={actionLoading}>
                  {actionLoading ? 'جارِ الحفظ...' : 'حفظ العرض'}
                </Button>
              </Stack>
            </Box>
          )}

          {/* ADVANCED OFFER FORM */}
          {activeTab === 'advanced' && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <StarBorderIcon color="primary" />
                <Typography variant="h6" fontWeight={800}>{selectedAdvancedOfferId ? 'تعديل العرض المتقدم' : 'عرض متقدم جديد'}</Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Stack spacing={3}>
                <TextField label="الاسم" fullWidth value={advancedOfferForm.name} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, name: event.target.value }))} />
                <TextField label="الوصف (اختياري)" fullWidth multiline minRows={2} value={advancedOfferForm.description} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, description: event.target.value }))} />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <TextField select label="نوع العرض المتقدم" fullWidth value={advancedOfferForm.offerType} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, offerType: event.target.value as AdvancedOfferType }))}>
                    <MenuItem value="bxgy">اشتر X واحصل على Y (BXGY)</MenuItem>
                    <MenuItem value="bundle">حزمة منتجات (Bundle)</MenuItem>
                    <MenuItem value="tiered_discount">خصم تدريجي (Tiered)</MenuItem>
                  </TextField>
                  <TextField label="الأولوية (أعلى رقم يُنفذ أولاً)" type="number" fullWidth value={advancedOfferForm.priority} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, priority: event.target.value }))} />
                </Box>
                
                <TextField 
                  label="إعدادات العرض (JSON)" 
                  fullWidth 
                  multiline 
                  minRows={6} 
                  value={advancedOfferForm.config} 
                  onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, config: event.target.value }))} 
                  dir="ltr" 
                  InputProps={{ sx: { fontFamily: 'monospace' } }} 
                />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <TextField label="تاريخ البدء" type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth value={advancedOfferForm.startsAt} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
                  <TextField label="تاريخ الانتهاء" type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth value={advancedOfferForm.endsAt} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
                </Box>

                <FormControlLabel control={<Checkbox checked={advancedOfferForm.isActive} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="العرض فعال" />
                <Button variant="contained" size="large" onClick={() => (selectedAdvancedOfferId ? updateAdvancedOffer() : createAdvancedOffer()).catch(() => undefined)} disabled={actionLoading}>
                  {actionLoading ? 'جارِ الحفظ...' : 'حفظ العرض'}
                </Button>
              </Stack>
            </Box>
          )}

        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            العروض التسويقية
          </Typography>
          <Typography color="text.secondary">
            قم بإدارة كوبونات الخصم، العروض التلقائية، وعروض اشتري X واحصل على Y.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadAll().catch(() => undefined)}
            disabled={loading}
          >
            تحديث القائمة
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleCreateNew}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            {activeTab === 'coupons' ? 'كوبون جديد' : activeTab === 'offers' ? 'عرض جديد' : 'عرض متقدم'}
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {/* Tabs */}
      <Stack direction="row" spacing={1} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, overflowX: 'auto' }}>
        <Button 
          variant={activeTab === 'coupons' ? 'contained' : 'text'} 
          color={activeTab === 'coupons' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('coupons')}
          startIcon={<DiscountIcon />}
          sx={{ borderRadius: 999, px: 3, flexShrink: 0 }}
          disableElevation
        >
          كوبونات الخصم
        </Button>
        <Button 
          variant={activeTab === 'offers' ? 'contained' : 'text'} 
          color={activeTab === 'offers' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('offers')}
          startIcon={<LocalOfferIcon />}
          sx={{ borderRadius: 999, px: 3, flexShrink: 0 }}
          disableElevation
        >
          عروض تلقائية
        </Button>
        <Button 
          variant={activeTab === 'advanced' ? 'contained' : 'text'} 
          color={activeTab === 'advanced' ? 'primary' : 'inherit'}
          onClick={() => setActiveTab('advanced')}
          startIcon={<StarBorderIcon />}
          sx={{ borderRadius: 999, px: 3, flexShrink: 0 }}
          disableElevation
        >
          عروض متقدمة
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              {activeTab === 'coupons' && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>الكود</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الخصم</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>عدد الاستخدامات</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700 }}>إجراءات</TableCell>
                </TableRow>
              )}
              {activeTab === 'offers' && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>اسم العرض</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الهدف</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الخصم</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700 }}>إجراءات</TableCell>
                </TableRow>
              )}
              {activeTab === 'advanced' && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>الاسم</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>النوع</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الأولوية</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700 }}>إجراءات</TableCell>
                </TableRow>
              )}
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : activeTab === 'coupons' ? (
                coupons.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">لا توجد كوبونات.</Typography></TableCell></TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id} hover>
                      <TableCell><Typography fontWeight={700} fontFamily="monospace" dir="ltr" display="inline">{coupon.code}</Typography></TableCell>
                      <TableCell>{coupon.discountType === 'percent' ? `%${coupon.discountValue}` : `${coupon.discountValue} ثابت`}</TableCell>
                      <TableCell>{coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}</TableCell>
                      <TableCell><Chip size="small" label={coupon.isActive ? 'فعال' : 'غير فعال'} color={coupon.isActive ? 'success' : 'default'} /></TableCell>
                      <TableCell align="left">
                        <Button size="small" variant="outlined" startIcon={<EditNoteIcon />} onClick={() => selectCoupon(coupon)}>تعديل</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : activeTab === 'offers' ? (
                offers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">لا توجد عروض تلقائية.</Typography></TableCell></TableRow>
                ) : (
                  offers.map((offer) => (
                    <TableRow key={offer.id} hover>
                      <TableCell><Typography fontWeight={700}>{offer.name}</Typography></TableCell>
                      <TableCell>{offer.targetType}</TableCell>
                      <TableCell>{offer.discountType === 'percent' ? `%${offer.discountValue}` : `${offer.discountValue} ثابت`}</TableCell>
                      <TableCell><Chip size="small" label={offer.isActive ? 'فعال' : 'غير فعال'} color={offer.isActive ? 'success' : 'default'} /></TableCell>
                      <TableCell align="left">
                        <Button size="small" variant="outlined" startIcon={<EditNoteIcon />} onClick={() => selectOffer(offer)}>تعديل</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                advancedOffers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">لا توجد عروض متقدمة.</Typography></TableCell></TableRow>
                ) : (
                  advancedOffers.map((offer) => (
                    <TableRow key={offer.id} hover>
                      <TableCell><Typography fontWeight={700}>{offer.name}</Typography></TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={offer.offerType} /></TableCell>
                      <TableCell>{offer.priority}</TableCell>
                      <TableCell><Chip size="small" label={offer.isActive ? 'فعال' : 'غير فعال'} color={offer.isActive ? 'success' : 'default'} /></TableCell>
                      <TableCell align="left">
                        <Button size="small" variant="outlined" startIcon={<EditNoteIcon />} onClick={() => selectAdvancedOffer(offer)}>تعديل</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

function buildCouponCreatePayload(form: typeof couponFormDefault) {
  const payload: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderAmount: number;
    startsAt?: string;
    endsAt?: string;
    maxUses?: number;
  } = {
    code: form.code.trim().toUpperCase(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue || '0'),
    minOrderAmount: Number(form.minOrderAmount || '0'),
  };

  if (form.startsAt) {
    payload.startsAt = toIso(form.startsAt);
  }
  if (form.endsAt) {
    payload.endsAt = toIso(form.endsAt);
  }
  if (form.maxUses.trim()) {
    payload.maxUses = Number(form.maxUses);
  }

  return payload;
}

function buildCouponUpdatePayload(form: typeof couponFormDefault) {
  const payload = buildCouponCreatePayload(form) as ReturnType<typeof buildCouponCreatePayload> & {
    isActive: boolean;
  };
  payload.isActive = form.isActive;
  return payload;
}

function buildOfferCreatePayload(form: typeof offerFormDefault) {
  const payload: {
    name: string;
    targetType: OfferTargetType;
    targetProductId?: string;
    targetCategoryId?: string;
    discountType: DiscountType;
    discountValue: number;
    startsAt?: string;
    endsAt?: string;
  } = {
    name: form.name.trim(),
    targetType: form.targetType,
    discountType: form.discountType,
    discountValue: Number(form.discountValue || '0'),
  };

  const targetProductId = form.targetProductId.trim();
  const targetCategoryId = form.targetCategoryId.trim();

  if (targetProductId) {
    payload.targetProductId = targetProductId;
  }
  if (targetCategoryId) {
    payload.targetCategoryId = targetCategoryId;
  }
  if (form.startsAt) {
    payload.startsAt = toIso(form.startsAt);
  }
  if (form.endsAt) {
    payload.endsAt = toIso(form.endsAt);
  }

  return payload;
}

function buildOfferUpdatePayload(form: typeof offerFormDefault) {
  const payload = buildOfferCreatePayload(form) as ReturnType<typeof buildOfferCreatePayload> & {
    isActive: boolean;
  };
  payload.isActive = form.isActive;
  return payload;
}

function buildAdvancedOfferCreatePayload(form: typeof advancedOfferFormDefault) {
  const payload: {
    name: string;
    description?: string;
    offerType: AdvancedOfferType;
    config: Record<string, unknown>;
    startsAt?: string;
    endsAt?: string;
    isActive: boolean;
    priority: number;
  } = {
    name: form.name.trim(),
    offerType: form.offerType,
    config: parseJsonConfig(form.config),
    isActive: form.isActive,
    priority: Number(form.priority || '0'),
  };

  if (form.description.trim()) {
    payload.description = form.description.trim();
  }
  if (form.startsAt) {
    payload.startsAt = toIso(form.startsAt);
  }
  if (form.endsAt) {
    payload.endsAt = toIso(form.endsAt);
  }

  return payload;
}

function buildAdvancedOfferUpdatePayload(form: typeof advancedOfferFormDefault) {
  return buildAdvancedOfferCreatePayload(form);
}

function parseJsonConfig(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function toIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}