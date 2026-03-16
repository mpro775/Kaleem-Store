import { useState } from 'react';
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
    <section className="card-grid">
      <article className="card">
        <h3>القسائم</h3>
        <div className="actions">
          <button onClick={() => loadAll().catch(() => undefined)}>تحميل</button>
          <button className="primary" onClick={() => createCoupon().catch(() => undefined)}>
            إنشاء
          </button>
          <button onClick={() => updateCoupon().catch(() => undefined)}>تحديث</button>
        </div>

        <label>
          الرمز
          <input
            value={couponForm.code}
            onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value }))}
          />
        </label>
        <label>
          نوع الخصم
          <select
            value={couponForm.discountType}
            onChange={(event) =>
              setCouponForm((prev) => ({
                ...prev,
                discountType: event.target.value as DiscountType,
              }))
            }
          >
            <option value="percent">نسبة</option>
            <option value="fixed">قيمة ثابتة</option>
          </select>
        </label>
        <label>
          قيمة الخصم
          <input
            type="number"
            min={0}
            step={0.01}
            value={couponForm.discountValue}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, discountValue: event.target.value }))
            }
          />
        </label>
        <label>
          الحد الأدنى للطلب
          <input
            type="number"
            min={0}
            step={0.01}
            value={couponForm.minOrderAmount}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))
            }
          />
        </label>
        <label>
          يبدأ في
          <input
            type="datetime-local"
            value={couponForm.startsAt}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, startsAt: event.target.value }))
            }
          />
        </label>
        <label>
          ينتهي في
          <input
            type="datetime-local"
            value={couponForm.endsAt}
            onChange={(event) => setCouponForm((prev) => ({ ...prev, endsAt: event.target.value }))}
          />
        </label>
        <label>
          الحد الأقصى للاستخدام
          <input
            type="number"
            min={1}
            value={couponForm.maxUses}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, maxUses: event.target.value }))
            }
          />
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={couponForm.isActive}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, isActive: event.target.checked }))
            }
          />
          نشط
        </label>

        <div className="list">
          {coupons.map((coupon) => (
            <article key={coupon.id} className="list-item">
              <h4>{coupon.code}</h4>
              <p>
                {coupon.discountType} {coupon.discountValue} - عدد الاستخدام {coupon.usedCount}
              </p>
              <button onClick={() => selectCoupon(coupon)}>تعديل</button>
            </article>
          ))}
        </div>
      </article>

      <article className="card">
        <h3>العروض</h3>
        <div className="actions">
          <button onClick={() => loadAll().catch(() => undefined)}>تحميل</button>
          <button className="primary" onClick={() => createOffer().catch(() => undefined)}>
            إنشاء
          </button>
          <button onClick={() => updateOffer().catch(() => undefined)}>تحديث</button>
        </div>

        <label>
          الاسم
          <input
            value={offerForm.name}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label>
          نوع الهدف
          <select
            value={offerForm.targetType}
            onChange={(event) =>
              setOfferForm((prev) => ({
                ...prev,
                targetType: event.target.value as OfferTargetType,
              }))
            }
          >
            <option value="cart">السلة</option>
            <option value="product">منتج</option>
            <option value="category">تصنيف</option>
          </select>
        </label>
        <label>
          معرّف المنتج المستهدف
          <input
            value={offerForm.targetProductId}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, targetProductId: event.target.value }))
            }
          />
        </label>
        <label>
          معرّف التصنيف المستهدف
          <input
            value={offerForm.targetCategoryId}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, targetCategoryId: event.target.value }))
            }
          />
        </label>
        <label>
          نوع الخصم
          <select
            value={offerForm.discountType}
            onChange={(event) =>
              setOfferForm((prev) => ({
                ...prev,
                discountType: event.target.value as DiscountType,
              }))
            }
          >
            <option value="percent">نسبة</option>
            <option value="fixed">قيمة ثابتة</option>
          </select>
        </label>
        <label>
          قيمة الخصم
          <input
            type="number"
            min={0}
            step={0.01}
            value={offerForm.discountValue}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, discountValue: event.target.value }))
            }
          />
        </label>
        <label>
          يبدأ في
          <input
            type="datetime-local"
            value={offerForm.startsAt}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, startsAt: event.target.value }))
            }
          />
        </label>
        <label>
          ينتهي في
          <input
            type="datetime-local"
            value={offerForm.endsAt}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, endsAt: event.target.value }))}
          />
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={offerForm.isActive}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, isActive: event.target.checked }))
            }
          />
          نشط
        </label>

        <div className="list">
          {offers.map((offer) => (
            <article key={offer.id} className="list-item">
              <h4>{offer.name}</h4>
              <p>
                {offer.targetType} - {offer.discountType} {offer.discountValue}
              </p>
              <button onClick={() => selectOffer(offer)}>تعديل</button>
            </article>
          ))}
        </div>
      </article>

      <article className="card">
        <h3>العروض المتقدمة</h3>
        <div className="actions">
          <button onClick={() => loadAll().catch(() => undefined)}>تحميل</button>
          <button className="primary" onClick={() => createAdvancedOffer().catch(() => undefined)}>
            إنشاء
          </button>
          <button onClick={() => updateAdvancedOffer().catch(() => undefined)}>تحديث</button>
        </div>

        <label>
          الاسم
          <input
            value={advancedOfferForm.name}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </label>
        <label>
          الوصف
          <input
            value={advancedOfferForm.description}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </label>
        <label>
          نوع العرض
          <select
            value={advancedOfferForm.offerType}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({
                ...prev,
                offerType: event.target.value as AdvancedOfferType,
              }))
            }
          >
            <option value="bxgy">bxgy</option>
            <option value="bundle">bundle</option>
            <option value="tiered_discount">tiered_discount</option>
          </select>
        </label>
        <label>
          الأولوية
          <input
            type="number"
            value={advancedOfferForm.priority}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({ ...prev, priority: event.target.value }))
            }
          />
        </label>
        <label>
          الإعدادات (JSON)
          <textarea
            value={advancedOfferForm.config}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({ ...prev, config: event.target.value }))
            }
          />
        </label>
        <label>
          يبدأ في
          <input
            type="datetime-local"
            value={advancedOfferForm.startsAt}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({ ...prev, startsAt: event.target.value }))
            }
          />
        </label>
        <label>
          ينتهي في
          <input
            type="datetime-local"
            value={advancedOfferForm.endsAt}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({ ...prev, endsAt: event.target.value }))
            }
          />
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={advancedOfferForm.isActive}
            onChange={(event) =>
              setAdvancedOfferForm((prev) => ({ ...prev, isActive: event.target.checked }))
            }
          />
          نشط
        </label>

        <div className="list">
          {advancedOffers.map((offer) => (
            <article key={offer.id} className="list-item">
              <h4>{offer.name}</h4>
              <p>
                {offer.offerType} - الأولوية {offer.priority} - نشط {String(offer.isActive)}
              </p>
              <button onClick={() => selectAdvancedOffer(offer)}>تعديل</button>
            </article>
          ))}
        </div>
      </article>

      {message ? <p className="status-message">{message}</p> : null}
    </section>
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
