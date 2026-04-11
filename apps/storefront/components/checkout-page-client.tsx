'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { clearCartIdFromStorage, getCartIdFromStorage } from '../lib/cart-storage';
import { checkout, getCart, listShippingZones } from '../lib/storefront-client';
import { getAccessToken } from '../lib/customer-auth-storage';
import * as customerClient from '../lib/customer-client';
import { useCustomerAuth } from '../lib/customer-auth-context';
import { trackStorefrontEvent } from '../lib/storefront-analytics';
import { AuthModal } from './auth-modal';
import type { ShippingZone, StorefrontCart } from '../lib/types';
import type { CustomerAddress } from '../lib/customer-client';

export function CheckoutPageClient() {
  const { isAuthenticated, customer } = useCustomerAuth();
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine: '',
    city: '',
    area: '',
    shippingZoneId: '',
    couponCode: '',
    note: '',
    paymentMethod: 'cod' as 'cod' | 'transfer',
  });

  useEffect(() => {
    bootstrap().catch(() => {
      return;
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && customer) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || customer.fullName,
        customerPhone: prev.customerPhone || customer.phone,
        customerEmail: prev.customerEmail || customer.email || '',
      }));
      loadAddresses();
    }
  }, [isAuthenticated, customer]);

  async function loadAddresses() {
    try {
      const addrs = await customerClient.listCustomerAddresses();
      setAddresses(addrs);
      const defaultAddr = addrs.find((a) => a.isDefault);
      if (defaultAddr) {
        selectAddress(defaultAddr);
      }
    } catch {
      // Silent fail
    }
  }

  function selectAddress(addr: CustomerAddress) {
    setSelectedAddressId(addr.id);
    setForm((prev) => ({
      ...prev,
      addressLine: addr.addressLine,
      city: addr.city || '',
      area: addr.area || '',
    }));
  }

  const shippingFee = useMemo(() => {
    const zone = zones.find((entry) => entry.id === form.shippingZoneId);
    return zone?.fee ?? 0;
  }, [form.shippingZoneId, zones]);

  const estimatedTotal = (cart?.subtotal ?? 0) + shippingFee;
  const checkoutStep = resolveCheckoutStep(form, zones.length > 0);

  useEffect(() => {
    if (!loading) {
      trackStorefrontEvent('sf_checkout_started', {
        ...(cart?.cartId ? { cartId: cart.cartId } : {}),
        metadata: {
          page: 'checkout',
          hasItems: Boolean(cart?.items.length),
        },
      }).catch(() => undefined);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      trackStorefrontEvent('sf_checkout_step_completed', {
        ...(cart?.cartId ? { cartId: cart.cartId } : {}),
        metadata: {
          step: checkoutStep,
        },
      }).catch(() => undefined);
    }
  }, [checkoutStep, loading, cart?.cartId]);

  async function bootstrap() {
    const cartId = getCartIdFromStorage();
    if (!cartId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [cartResponse, zoneResponse] = await Promise.all([
        getCart(cartId),
        listShippingZones(),
      ]);
      setCart(cartResponse);
      setZones(zoneResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Failed to load checkout data',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart || submitting) {
      return;
    }

    const validationErrors = validateCheckoutForm(form, zones.length > 0);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setError('Please complete the required fields before confirming your order.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = buildCheckoutPayload(cart.cartId, form);
      await trackStorefrontEvent('sf_checkout_submitted', {
        cartId: cart.cartId,
        metadata: {
          paymentMethod: form.paymentMethod,
          hasCoupon: Boolean(form.couponCode.trim()),
        },
      });
      const response = await checkout(payload);
      await trackStorefrontEvent('sf_checkout_completed', {
        cartId: cart.cartId,
        metadata: {
          orderCode: response.orderCode,
          total: response.total,
          currencyCode: response.currencyCode,
        },
      });
      clearCartIdFromStorage();
      setOrderCode(response.orderCode);
      setCart(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <div className="panel">Loading checkout...</div>
      </main>
    );
  }

  if (orderCode) {
    return (
      <main className="page-shell">
        <div className="panel">
          <h1>تم إكمال الطلب بنجاح</h1>
          <p>رقم طلبك هو: {orderCode}</p>
          <p className="muted">سنتواصل معك قريباً لتأكيد الطلب</p>
          <Link
            href={`/track-order?orderCode=${encodeURIComponent(orderCode)}`}
            className="button-primary"
          >
            تتبع الطلب
          </Link>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="page-shell">
        <div className="panel">
          <h1>سلة التسوق فارغة</h1>
          <Link href="/categories" className="button-primary">
            تابع التسوق
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>إتمام الشراء</h1>
        <p>أكمل بياناتك وأكد طلبك</p>
      </header>

      <div className="checkout-stepper" aria-label="Checkout progress">
        <div className={`checkout-step ${checkoutStep >= 1 ? 'active' : ''}`}>1. العميل</div>
        <div className={`checkout-step ${checkoutStep >= 2 ? 'active' : ''}`}>2. العنوان</div>
        <div className={`checkout-step ${checkoutStep >= 3 ? 'active' : ''}`}>3. الدفع</div>
        <div className={`checkout-step ${checkoutStep >= 4 ? 'active' : ''}`}>4. تأكيد الطلب</div>
      </div>

      {/* Auth Prompt for Guests */}
      {!isAuthenticated && (
        <div className="checkout-auth-prompt">
          <div className="checkout-auth-info">
            <h3>هل لديك حساب؟</h3>
            <p>سجل دخولك للاستفادة من عناوينك المحفوظة وتتبع طلباتك بسهولة</p>
          </div>
          <div className="checkout-auth-actions">
            <button className="button-primary" onClick={() => setShowAuthModal(true)}>
              تسجيل الدخول
            </button>
            <span className="muted">أو اشتري كضيف</span>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="checkout-logged-in">
          <p>مرحباً <strong>{customer?.fullName}</strong>! تم تسجيل الدخول</p>
        </div>
      )}

      {error ? <p className="error-message">{error}</p> : null}

      <div className="checkout-grid">
        <form className="panel stack-md" onSubmit={onSubmit}>
          <h2>بيانات العميل</h2>
          <input
            className="input"
            aria-label="Customer full name"
            placeholder="الاسم الكامل"
            value={form.customerName}
            onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
            required
          />
          {fieldErrors.customerName ? <p className="error-message">{fieldErrors.customerName}</p> : null}
          <input
            className="input"
            aria-label="Customer phone"
            placeholder="رقم الهاتف"
            value={form.customerPhone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerPhone: event.target.value }))
            }
            required
          />
          {fieldErrors.customerPhone ? <p className="error-message">{fieldErrors.customerPhone}</p> : null}
          <input
            className="input"
            aria-label="Customer email"
            placeholder="البريد الإلكتروني (اختياري)"
            value={form.customerEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerEmail: event.target.value }))
            }
          />
          {fieldErrors.customerEmail ? <p className="error-message">{fieldErrors.customerEmail}</p> : null}

          {/* Saved Addresses */}
          {isAuthenticated && addresses.length > 0 && (
            <div className="saved-addresses">
              <h3>عناوينك المحفوظة</h3>
              <div className="address-options">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`address-option ${selectedAddressId === addr.id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => selectAddress(addr)}
                    />
                    <div>
                      <strong>{addr.addressLine}</strong>
                      {addr.city && <p className="muted">{addr.city}{addr.area && ` - ${addr.area}`}</p>}
                      {addr.isDefault && <span className="default-badge">افتراضي</span>}
                    </div>
                  </label>
                ))}
              </div>
              <label className="address-option">
                <input
                  type="radio"
                  name="savedAddress"
                  checked={selectedAddressId === ''}
                  onChange={() => setSelectedAddressId('')}
                />
                <span>إدخال عنوان جديد</span>
              </label>
            </div>
          )}

          <h2>عنوان التوصيل</h2>
          <input
            className="input"
            aria-label="Address line"
            placeholder="العنوان"
            value={form.addressLine}
            onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))}
            required
          />
          {fieldErrors.addressLine ? <p className="error-message">{fieldErrors.addressLine}</p> : null}
          <input
            className="input"
            aria-label="City"
            placeholder="المدينة"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          />
          <input
            className="input"
            aria-label="Area"
            placeholder="المنطقة"
            value={form.area}
            onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
          />

          <select
            className="input"
            aria-label="Shipping zone"
            value={form.shippingZoneId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, shippingZoneId: event.target.value }))
            }
          >
            <option value="">اختر منطقة الشحن</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} ({zone.fee.toFixed(2)})
              </option>
            ))}
          </select>
          {fieldErrors.shippingZoneId ? <p className="error-message">{fieldErrors.shippingZoneId}</p> : null}

          <h2>طريقة الدفع</h2>
          <select
            className="input"
            aria-label="Payment method"
            value={form.paymentMethod}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                paymentMethod: event.target.value as 'cod' | 'transfer',
              }))
            }
          >
            <option value="cod">الدفع عند الاستلام</option>
            <option value="transfer">تحويل بنكي</option>
          </select>

          <input
            className="input"
            aria-label="Coupon code"
            placeholder="كود الخصم (إن وجد)"
            value={form.couponCode}
            onChange={(event) => setForm((prev) => ({ ...prev, couponCode: event.target.value }))}
          />
          <textarea
            className="input"
            aria-label="Order note"
            placeholder="ملاحظات على الطلب"
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />

          <button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? 'جاري إتمام الطلب...' : 'تأكيد الطلب'}
          </button>
        </form>

        <aside className="panel stack-md checkout-summary-panel">
          <h2>ملخص الطلب</h2>
          {cart.items.map((item) => (
            <div key={item.variantId} className="summary-row">
              <span>
                {item.title} x {item.quantity}
              </span>
              <strong>{item.lineTotal.toFixed(2)}</strong>
            </div>
          ))}
          <div className="summary-row">
            <span>المجموع الفرعي</span>
            <strong>{cart.subtotal.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>الشحن</span>
            <strong>{shippingFee.toFixed(2)}</strong>
          </div>
          <div className="summary-row total-row">
            <span>الإجمالي التقديري</span>
            <strong>
              {estimatedTotal.toFixed(2)} {cart.currencyCode}
            </strong>
          </div>

          <div className="checkout-trust-grid">
            <div className="checkout-trust-item">
              <strong>دفع آمن</strong>
              <span className="muted">جميع البيانات محمية ومشفرة</span>
            </div>
            <div className="checkout-trust-item">
              <strong>تأكيد سريع</strong>
              <span className="muted">يتم تأكيد الطلب فور المراجعة</span>
            </div>
            <div className="checkout-trust-item">
              <strong>تتبع مباشر</strong>
              <span className="muted">استعرض حالة الطلب من صفحة التتبع</span>
            </div>
          </div>
        </aside>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}

function buildCheckoutPayload(
  cartId: string,
  form: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    addressLine: string;
    city: string;
    area: string;
    shippingZoneId: string;
    couponCode: string;
    note: string;
    paymentMethod: 'cod' | 'transfer';
  },
): {
  cartId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressLine: string;
  city?: string;
  area?: string;
  shippingZoneId?: string;
  couponCode?: string;
  note?: string;
  paymentMethod: 'cod' | 'transfer';
  customerAccessToken?: string;
} {
  const accessToken = getAccessToken();
  const payload: {
    cartId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    addressLine: string;
    city?: string;
    area?: string;
    shippingZoneId?: string;
    couponCode?: string;
    note?: string;
    paymentMethod: 'cod' | 'transfer';
    customerAccessToken?: string;
  } = {
    cartId,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    addressLine: form.addressLine,
    paymentMethod: form.paymentMethod,
  };

  if (form.customerEmail) {
    payload.customerEmail = form.customerEmail;
  }
  if (form.city) {
    payload.city = form.city;
  }
  if (form.area) {
    payload.area = form.area;
  }
  if (form.shippingZoneId) {
    payload.shippingZoneId = form.shippingZoneId;
  }
  if (form.couponCode) {
    payload.couponCode = form.couponCode;
  }
  if (form.note) {
    payload.note = form.note;
  }
  if (accessToken) {
    payload.customerAccessToken = accessToken;
  }

  return payload;
}

function validateCheckoutForm(
  form: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    addressLine: string;
    city: string;
    area: string;
    shippingZoneId: string;
    couponCode: string;
    note: string;
    paymentMethod: 'cod' | 'transfer';
  },
  shippingZoneRequired: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.customerName.trim().length < 2) {
    errors.customerName = 'يرجى إدخال الاسم الكامل بشكل صحيح.';
  }

  if (form.customerPhone.trim().length < 8) {
    errors.customerPhone = 'يرجى إدخال رقم هاتف صالح.';
  }

  if (form.addressLine.trim().length < 5) {
    errors.addressLine = 'يرجى إدخال عنوان واضح للتوصيل.';
  }

  if (shippingZoneRequired && !form.shippingZoneId) {
    errors.shippingZoneId = 'يرجى اختيار منطقة الشحن.';
  }

  if (form.customerEmail && !/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = 'صيغة البريد الإلكتروني غير صحيحة.';
  }

  return errors;
}

function resolveCheckoutStep(
  form: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    addressLine: string;
    city: string;
    area: string;
    shippingZoneId: string;
    couponCode: string;
    note: string;
    paymentMethod: 'cod' | 'transfer';
  },
  shippingZoneRequired: boolean,
): 1 | 2 | 3 | 4 {
  if (!form.customerName.trim() || !form.customerPhone.trim()) {
    return 1;
  }

  if (!form.addressLine.trim() || (shippingZoneRequired && !form.shippingZoneId)) {
    return 2;
  }

  if (!form.paymentMethod) {
    return 3;
  }

  return 4;
}
