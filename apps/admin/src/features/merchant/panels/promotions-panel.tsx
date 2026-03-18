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
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [advancedOffers, setAdvancedOffers] = useState<AdvancedOffer[]>([]);
  const [selectedAdvancedOfferId, setSelectedAdvancedOfferId] = useState('');
  const [couponForm, setCouponForm] = useState(couponFormDefault);
  const [offerForm, setOfferForm] = useState(offerFormDefault);
  const [advancedOfferForm, setAdvancedOfferForm] = useState(advancedOfferFormDefault);
  const [message, setMessage] = useState('');

  async function loadAll(): Promise<void> {
    setMessage('');
    try {
      const [couponData, offerData, advancedOfferData] = await Promise.all([
        request<Coupon[]>('/promotions/coupons', { method: 'GET' }),
        request<Offer[]>('/promotions/offers', { method: 'GET' }),
        request<AdvancedOffer[]>('/advanced-offers', { method: 'GET' }),
      ]);

      setCoupons(couponData ?? []);
      setOffers(offerData ?? []);
      setAdvancedOffers(advancedOfferData ?? []);
      setMessage('تم تحميل العروض');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل العروض');
    }
  }

  async function createCoupon(): Promise<void> {
    setMessage('');
    try {
      await request('/promotions/coupons', {
        method: 'POST',
        body: JSON.stringify(buildCouponCreatePayload(couponForm)),
      });
      setCouponForm(couponFormDefault);
      await loadAll();
      setMessage('تم إنشاء القسيمة');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء القسيمة');
    }
  }

  async function updateCoupon(): Promise<void> {
    if (!selectedCouponId) {
      setMessage('اختر قسيمة لتحديثها');
      return;
    }

    setMessage('');
    try {
      await request(`/promotions/coupons/${selectedCouponId}`, {
        method: 'PUT',
        body: JSON.stringify(buildCouponUpdatePayload(couponForm)),
      });
      await loadAll();
      setMessage('تم تحديث القسيمة');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث القسيمة');
    }
  }

  async function createOffer(): Promise<void> {
    setMessage('');
    try {
      await request('/promotions/offers', {
        method: 'POST',
        body: JSON.stringify(buildOfferCreatePayload(offerForm)),
      });
      setOfferForm(offerFormDefault);
      await loadAll();
      setMessage('تم إنشاء العرض');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء العرض');
    }
  }

  async function updateOffer(): Promise<void> {
    if (!selectedOfferId) {
      setMessage('اختر عرضاً لتحديثه');
      return;
    }

    setMessage('');
    try {
      await request(`/promotions/offers/${selectedOfferId}`, {
        method: 'PUT',
        body: JSON.stringify(buildOfferUpdatePayload(offerForm)),
      });
      await loadAll();
      setMessage('تم تحديث العرض');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث العرض');
    }
  }

  async function createAdvancedOffer(): Promise<void> {
    setMessage('');
    try {
      await request('/advanced-offers', {
        method: 'POST',
        body: JSON.stringify(buildAdvancedOfferCreatePayload(advancedOfferForm)),
      });
      setAdvancedOfferForm(advancedOfferFormDefault);
      await loadAll();
      setMessage('تم إنشاء العرض المتقدم');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إنشاء العرض المتقدم');
    }
  }

  async function updateAdvancedOffer(): Promise<void> {
    if (!selectedAdvancedOfferId) {
      setMessage('اختر عرضاً متقدماً لتحديثه');
      return;
    }

    setMessage('');
    try {
      await request(`/advanced-offers/${selectedAdvancedOfferId}`, {
        method: 'PUT',
        body: JSON.stringify(buildAdvancedOfferUpdatePayload(advancedOfferForm)),
      });
      await loadAll();
      setMessage('تم تحديث العرض المتقدم');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث العرض المتقدم');
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
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">القسائم</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadAll().catch(() => undefined)}>تحميل</Button>
          <Button variant="contained" onClick={() => createCoupon().catch(() => undefined)}>إنشاء</Button>
          <Button variant="outlined" onClick={() => updateCoupon().catch(() => undefined)}>تحديث</Button>
        </Stack>

        <TextField label="الرمز" value={couponForm.code} onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value }))} />
        <TextField select label="نوع الخصم" value={couponForm.discountType} onChange={(event) => setCouponForm((prev) => ({ ...prev, discountType: event.target.value as DiscountType }))}>
          <MenuItem value="percent">نسبة</MenuItem>
          <MenuItem value="fixed">قيمة ثابتة</MenuItem>
        </TextField>
        <TextField label="قيمة الخصم" type="number" inputProps={{ min: 0, step: 0.01 }} value={couponForm.discountValue} onChange={(event) => setCouponForm((prev) => ({ ...prev, discountValue: event.target.value }))} />
        <TextField label="الحد الأدنى للطلب" type="number" inputProps={{ min: 0, step: 0.01 }} value={couponForm.minOrderAmount} onChange={(event) => setCouponForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))} />
        <TextField label="يبدأ في" type="datetime-local" InputLabelProps={{ shrink: true }} value={couponForm.startsAt} onChange={(event) => setCouponForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
        <TextField label="ينتهي في" type="datetime-local" InputLabelProps={{ shrink: true }} value={couponForm.endsAt} onChange={(event) => setCouponForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
        <TextField label="الحد الأقصى للاستخدام" type="number" inputProps={{ min: 1 }} value={couponForm.maxUses} onChange={(event) => setCouponForm((prev) => ({ ...prev, maxUses: event.target.value }))} />
        <FormControlLabel control={<Checkbox checked={couponForm.isActive} onChange={(event) => setCouponForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="نشط" />

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {coupons.map((coupon) => (
            <Paper key={coupon.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle2">{coupon.code}</Typography>
              <Typography variant="body2">{coupon.discountType} {coupon.discountValue} - عدد الاستخدام {coupon.usedCount}</Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectCoupon(coupon)}>تعديل</Button>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">العروض</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadAll().catch(() => undefined)}>تحميل</Button>
          <Button variant="contained" onClick={() => createOffer().catch(() => undefined)}>إنشاء</Button>
          <Button variant="outlined" onClick={() => updateOffer().catch(() => undefined)}>تحديث</Button>
        </Stack>

        <TextField label="الاسم" value={offerForm.name} onChange={(event) => setOfferForm((prev) => ({ ...prev, name: event.target.value }))} />
        <TextField select label="نوع الهدف" value={offerForm.targetType} onChange={(event) => setOfferForm((prev) => ({ ...prev, targetType: event.target.value as OfferTargetType }))}>
          <MenuItem value="cart">السلة</MenuItem>
          <MenuItem value="product">منتج</MenuItem>
          <MenuItem value="category">تصنيف</MenuItem>
        </TextField>
        <TextField label="معرّف المنتج المستهدف" value={offerForm.targetProductId} onChange={(event) => setOfferForm((prev) => ({ ...prev, targetProductId: event.target.value }))} />
        <TextField label="معرّف التصنيف المستهدف" value={offerForm.targetCategoryId} onChange={(event) => setOfferForm((prev) => ({ ...prev, targetCategoryId: event.target.value }))} />
        <TextField select label="نوع الخصم" value={offerForm.discountType} onChange={(event) => setOfferForm((prev) => ({ ...prev, discountType: event.target.value as DiscountType }))}>
          <MenuItem value="percent">نسبة</MenuItem>
          <MenuItem value="fixed">قيمة ثابتة</MenuItem>
        </TextField>
        <TextField label="قيمة الخصم" type="number" inputProps={{ min: 0, step: 0.01 }} value={offerForm.discountValue} onChange={(event) => setOfferForm((prev) => ({ ...prev, discountValue: event.target.value }))} />
        <TextField label="يبدأ في" type="datetime-local" InputLabelProps={{ shrink: true }} value={offerForm.startsAt} onChange={(event) => setOfferForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
        <TextField label="ينتهي في" type="datetime-local" InputLabelProps={{ shrink: true }} value={offerForm.endsAt} onChange={(event) => setOfferForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
        <FormControlLabel control={<Checkbox checked={offerForm.isActive} onChange={(event) => setOfferForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="نشط" />

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {offers.map((offer) => (
            <Paper key={offer.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle2">{offer.name}</Typography>
              <Typography variant="body2">{offer.targetType} - {offer.discountType} {offer.discountValue}</Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectOffer(offer)}>تعديل</Button>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">العروض المتقدمة</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={() => loadAll().catch(() => undefined)}>تحميل</Button>
          <Button variant="contained" onClick={() => createAdvancedOffer().catch(() => undefined)}>إنشاء</Button>
          <Button variant="outlined" onClick={() => updateAdvancedOffer().catch(() => undefined)}>تحديث</Button>
        </Stack>

        <TextField label="الاسم" value={advancedOfferForm.name} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, name: event.target.value }))} />
        <TextField label="الوصف" value={advancedOfferForm.description} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, description: event.target.value }))} />
        <TextField select label="نوع العرض" value={advancedOfferForm.offerType} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, offerType: event.target.value as AdvancedOfferType }))}>
          <MenuItem value="bxgy">bxgy</MenuItem>
          <MenuItem value="bundle">bundle</MenuItem>
          <MenuItem value="tiered_discount">tiered_discount</MenuItem>
        </TextField>
        <TextField label="الأولوية" type="number" value={advancedOfferForm.priority} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, priority: event.target.value }))} />
        <TextField label="الإعدادات (JSON)" multiline minRows={6} value={advancedOfferForm.config} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, config: event.target.value }))} />
        <TextField label="يبدأ في" type="datetime-local" InputLabelProps={{ shrink: true }} value={advancedOfferForm.startsAt} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
        <TextField label="ينتهي في" type="datetime-local" InputLabelProps={{ shrink: true }} value={advancedOfferForm.endsAt} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
        <FormControlLabel control={<Checkbox checked={advancedOfferForm.isActive} onChange={(event) => setAdvancedOfferForm((prev) => ({ ...prev, isActive: event.target.checked }))} />} label="نشط" />

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {advancedOffers.map((offer) => (
            <Paper key={offer.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle2">{offer.name}</Typography>
              <Typography variant="body2">{offer.offerType} - الأولوية {offer.priority} - نشط {String(offer.isActive)}</Typography>
              <Button sx={{ mt: 0.6 }} variant="outlined" onClick={() => selectAdvancedOffer(offer)}>تعديل</Button>
            </Paper>
          ))}
        </Box>
      </Paper>

      {message ? <Alert severity="info" sx={{ gridColumn: { xs: 'auto', xl: '1 / -1' } }}>{message}</Alert> : null}
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
