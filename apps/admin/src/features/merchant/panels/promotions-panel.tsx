import { useState } from 'react';
import type { MerchantRequester } from '../merchant-dashboard';
import type { Coupon, DiscountType, Offer, OfferTargetType } from '../types';

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

export function PromotionsPanel({ request }: PromotionsPanelProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [couponForm, setCouponForm] = useState(couponFormDefault);
  const [offerForm, setOfferForm] = useState(offerFormDefault);
  const [message, setMessage] = useState('');

  async function loadAll(): Promise<void> {
    setMessage('');
    try {
      const [couponData, offerData] = await Promise.all([
        request<Coupon[]>('/promotions/coupons', { method: 'GET' }),
        request<Offer[]>('/promotions/offers', { method: 'GET' }),
      ]);

      setCoupons(couponData ?? []);
      setOffers(offerData ?? []);
      setMessage('Promotions loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load promotions');
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
      setMessage('Coupon created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create coupon');
    }
  }

  async function updateCoupon(): Promise<void> {
    if (!selectedCouponId) {
      setMessage('Select a coupon to update');
      return;
    }

    setMessage('');
    try {
      await request(`/promotions/coupons/${selectedCouponId}`, {
        method: 'PUT',
        body: JSON.stringify(buildCouponUpdatePayload(couponForm)),
      });
      await loadAll();
      setMessage('Coupon updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update coupon');
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
      setMessage('Offer created');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create offer');
    }
  }

  async function updateOffer(): Promise<void> {
    if (!selectedOfferId) {
      setMessage('Select an offer to update');
      return;
    }

    setMessage('');
    try {
      await request(`/promotions/offers/${selectedOfferId}`, {
        method: 'PUT',
        body: JSON.stringify(buildOfferUpdatePayload(offerForm)),
      });
      await loadAll();
      setMessage('Offer updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update offer');
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

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Coupons</h3>
        <div className="actions">
          <button onClick={() => loadAll().catch(() => undefined)}>Load</button>
          <button className="primary" onClick={() => createCoupon().catch(() => undefined)}>
            Create
          </button>
          <button onClick={() => updateCoupon().catch(() => undefined)}>Update</button>
        </div>

        <label>
          Code
          <input
            value={couponForm.code}
            onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value }))}
          />
        </label>
        <label>
          Discount Type
          <select
            value={couponForm.discountType}
            onChange={(event) =>
              setCouponForm((prev) => ({
                ...prev,
                discountType: event.target.value as DiscountType,
              }))
            }
          >
            <option value="percent">percent</option>
            <option value="fixed">fixed</option>
          </select>
        </label>
        <label>
          Discount Value
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
          Min Order Amount
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
          Starts At
          <input
            type="datetime-local"
            value={couponForm.startsAt}
            onChange={(event) =>
              setCouponForm((prev) => ({ ...prev, startsAt: event.target.value }))
            }
          />
        </label>
        <label>
          Ends At
          <input
            type="datetime-local"
            value={couponForm.endsAt}
            onChange={(event) => setCouponForm((prev) => ({ ...prev, endsAt: event.target.value }))}
          />
        </label>
        <label>
          Max Uses
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
          Active
        </label>

        <div className="list">
          {coupons.map((coupon) => (
            <article key={coupon.id} className="list-item">
              <h4>{coupon.code}</h4>
              <p>
                {coupon.discountType} {coupon.discountValue} - used {coupon.usedCount}
              </p>
              <button onClick={() => selectCoupon(coupon)}>Edit</button>
            </article>
          ))}
        </div>
      </article>

      <article className="card">
        <h3>Offers</h3>
        <div className="actions">
          <button onClick={() => loadAll().catch(() => undefined)}>Load</button>
          <button className="primary" onClick={() => createOffer().catch(() => undefined)}>
            Create
          </button>
          <button onClick={() => updateOffer().catch(() => undefined)}>Update</button>
        </div>

        <label>
          Name
          <input
            value={offerForm.name}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label>
          Target Type
          <select
            value={offerForm.targetType}
            onChange={(event) =>
              setOfferForm((prev) => ({
                ...prev,
                targetType: event.target.value as OfferTargetType,
              }))
            }
          >
            <option value="cart">cart</option>
            <option value="product">product</option>
            <option value="category">category</option>
          </select>
        </label>
        <label>
          Target Product ID
          <input
            value={offerForm.targetProductId}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, targetProductId: event.target.value }))
            }
          />
        </label>
        <label>
          Target Category ID
          <input
            value={offerForm.targetCategoryId}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, targetCategoryId: event.target.value }))
            }
          />
        </label>
        <label>
          Discount Type
          <select
            value={offerForm.discountType}
            onChange={(event) =>
              setOfferForm((prev) => ({
                ...prev,
                discountType: event.target.value as DiscountType,
              }))
            }
          >
            <option value="percent">percent</option>
            <option value="fixed">fixed</option>
          </select>
        </label>
        <label>
          Discount Value
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
          Starts At
          <input
            type="datetime-local"
            value={offerForm.startsAt}
            onChange={(event) =>
              setOfferForm((prev) => ({ ...prev, startsAt: event.target.value }))
            }
          />
        </label>
        <label>
          Ends At
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
          Active
        </label>

        <div className="list">
          {offers.map((offer) => (
            <article key={offer.id} className="list-item">
              <h4>{offer.name}</h4>
              <p>
                {offer.targetType} - {offer.discountType} {offer.discountValue}
              </p>
              <button onClick={() => selectOffer(offer)}>Edit</button>
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

function toIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}
