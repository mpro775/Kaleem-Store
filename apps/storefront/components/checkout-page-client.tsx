'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { clearCartIdFromStorage, getCartIdFromStorage, saveCartIdToStorage } from '../lib/cart-storage';
import { checkout, checkoutQuote, getCart, listShippingZones } from '../lib/storefront-client';
import { getAccessToken } from '../lib/customer-auth-storage';
import {
  clearRestockTokenFromStorage,
  getRestockTokenFromStorage,
} from '../lib/restock-token-storage';
import * as customerClient from '../lib/customer-client';
import { useCustomerAuth } from '../lib/customer-auth-context';
import { trackStorefrontEvent } from '../lib/storefront-analytics';
import { AuthModal } from './auth-modal';
import type {
  CheckoutQuoteResponse,
  ShippingMethodQuote,
  ShippingZone,
  StorefrontCart,
} from '../lib/types';
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
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine: '',
    city: '',
    area: '',
    shippingZoneId: '',
    shippingMethodId: '',
    couponCode: '',
    pointsToRedeem: '',
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

  const availableShippingMethods = quote?.availableShippingMethods ?? [];
  const selectedShippingMethod = useMemo(() => {
    return availableShippingMethods.find((method) => method.id === form.shippingMethodId) ?? null;
  }, [availableShippingMethods, form.shippingMethodId]);
  const shippingFee = quote?.shippingFee ?? selectedShippingMethod?.cost ?? 0;

  const estimatedTotal = quote?.total ?? (cart?.subtotal ?? 0) + shippingFee;
  const checkoutStep = resolveCheckoutStep(form, zones.length > 0);

  useEffect(() => {
    if (!cart) {
      return;
    }
    void refreshQuote();
  }, [cart?.cartId, form.shippingZoneId, form.shippingMethodId, form.couponCode, form.pointsToRedeem]);

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
    const urlParams = new URLSearchParams(window.location.search);
    const cartIdFromUrl = urlParams.get('cartId')?.trim() ?? '';
    if (cartIdFromUrl) {
      saveCartIdToStorage(cartIdFromUrl);
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('cartId');
      nextUrl.searchParams.delete('recoveryToken');
      window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);
    }

    const cartId = cartIdFromUrl || getCartIdFromStorage();
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
      const accessToken = getAccessToken();
      const quoteData = await checkoutQuote({
        cartId: cartResponse.cartId,
        ...(form.shippingZoneId ? { shippingZoneId: form.shippingZoneId } : {}),
        ...(form.shippingMethodId ? { shippingMethodId: form.shippingMethodId } : {}),
        ...(form.couponCode.trim() ? { couponCode: form.couponCode.trim() } : {}),
        ...(accessToken ? { customerAccessToken: accessToken } : {}),
        ...(form.pointsToRedeem.trim() ? { pointsToRedeem: Number(form.pointsToRedeem) } : {}),
      });
      setQuote(quoteData);
      if (!form.shippingMethodId && quoteData.selectedShippingMethodId) {
        setForm((prev) => ({ ...prev, shippingMethodId: quoteData.selectedShippingMethodId ?? '' }));
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Failed to load checkout data',
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshQuote() {
    if (!cart) {
      return;
    }
    try {
      const accessToken = getAccessToken();
      const quoteData = await checkoutQuote({
        cartId: cart.cartId,
        ...(form.shippingZoneId ? { shippingZoneId: form.shippingZoneId } : {}),
        ...(form.shippingMethodId ? { shippingMethodId: form.shippingMethodId } : {}),
        ...(form.couponCode.trim() ? { couponCode: form.couponCode.trim() } : {}),
        ...(accessToken ? { customerAccessToken: accessToken } : {}),
        ...(form.pointsToRedeem.trim() ? { pointsToRedeem: Number(form.pointsToRedeem) } : {}),
      });
      setQuote(quoteData);
      if (!form.shippingMethodId && quoteData.selectedShippingMethodId) {
        setForm((prev) => ({ ...prev, shippingMethodId: quoteData.selectedShippingMethodId ?? '' }));
      }
    } catch {
      setQuote(null);
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
      const payload = buildCheckoutPayload(cart.cartId, form, getRestockTokenFromStorage());
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
      clearRestockTokenFromStorage();
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
          <h1>طھظ… ط¥ظƒظ…ط§ظ„ ط§ظ„ط·ظ„ط¨ ط¨ظ†ط¬ط§ط­</h1>
          <p>ط±ظ‚ظ… ط·ظ„ط¨ظƒ ظ‡ظˆ: {orderCode}</p>
          <p className="muted">ط³ظ†طھظˆط§طµظ„ ظ…ط¹ظƒ ظ‚ط±ظٹط¨ط§ظ‹ ظ„طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨</p>
          <Link
            href={`/track-order?orderCode=${encodeURIComponent(orderCode)}`}
            className="button-primary"
          >
            طھطھط¨ط¹ ط§ظ„ط·ظ„ط¨
          </Link>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="page-shell">
        <div className="panel">
          <h1>ط³ظ„ط© ط§ظ„طھط³ظˆظ‚ ظپط§ط±ط؛ط©</h1>
          <Link href="/categories" className="button-primary">
            طھط§ط¨ط¹ ط§ظ„طھط³ظˆظ‚
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>ط¥طھظ…ط§ظ… ط§ظ„ط´ط±ط§ط،</h1>
        <p>ط£ظƒظ…ظ„ ط¨ظٹط§ظ†ط§طھظƒ ظˆط£ظƒط¯ ط·ظ„ط¨ظƒ</p>
      </header>

      <div className="checkout-stepper" aria-label="Checkout progress">
        <div className={`checkout-step ${checkoutStep >= 1 ? 'active' : ''}`}>1. ط§ظ„ط¹ظ…ظٹظ„</div>
        <div className={`checkout-step ${checkoutStep >= 2 ? 'active' : ''}`}>2. ط§ظ„ط¹ظ†ظˆط§ظ†</div>
        <div className={`checkout-step ${checkoutStep >= 3 ? 'active' : ''}`}>3. ط§ظ„ط¯ظپط¹</div>
        <div className={`checkout-step ${checkoutStep >= 4 ? 'active' : ''}`}>4. طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨</div>
      </div>

      {/* Auth Prompt for Guests */}
      {!isAuthenticated && (
        <div className="checkout-auth-prompt">
          <div className="checkout-auth-info">
            <h3>ظ‡ظ„ ظ„ط¯ظٹظƒ ط­ط³ط§ط¨طں</h3>
            <p>ط³ط¬ظ„ ط¯ط®ظˆظ„ظƒ ظ„ظ„ط§ط³طھظپط§ط¯ط© ظ…ظ† ط¹ظ†ط§ظˆظٹظ†ظƒ ط§ظ„ظ…ط­ظپظˆط¸ط© ظˆطھطھط¨ط¹ ط·ظ„ط¨ط§طھظƒ ط¨ط³ظ‡ظˆظ„ط©</p>
          </div>
          <div className="checkout-auth-actions">
            <button className="button-primary" onClick={() => setShowAuthModal(true)}>
              طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
            </button>
            <span className="muted">ط£ظˆ ط§ط´طھط±ظٹ ظƒط¶ظٹظپ</span>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="checkout-logged-in">
          <p>ظ…ط±ط­ط¨ط§ظ‹ <strong>{customer?.fullName}</strong>! طھظ… طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„</p>
        </div>
      )}

      {error ? <p className="error-message">{error}</p> : null}

      <div className="checkout-grid">
        <form className="panel stack-md" onSubmit={onSubmit}>
          <h2>ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„</h2>
          <input
            className="input"
            aria-label="Customer full name"
            placeholder="ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„"
            value={form.customerName}
            onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
            required
          />
          {fieldErrors.customerName ? <p className="error-message">{fieldErrors.customerName}</p> : null}
          <input
            className="input"
            aria-label="Customer phone"
            placeholder="ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ"
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
            placeholder="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ (ط§ط®طھظٹط§ط±ظٹ)"
            value={form.customerEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerEmail: event.target.value }))
            }
          />
          {fieldErrors.customerEmail ? <p className="error-message">{fieldErrors.customerEmail}</p> : null}

          {/* Saved Addresses */}
          {isAuthenticated && addresses.length > 0 && (
            <div className="saved-addresses">
              <h3>ط¹ظ†ط§ظˆظٹظ†ظƒ ط§ظ„ظ…ط­ظپظˆط¸ط©</h3>
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
                      {addr.isDefault && <span className="default-badge">ط§ظپطھط±ط§ط¶ظٹ</span>}
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
                <span>ط¥ط¯ط®ط§ظ„ ط¹ظ†ظˆط§ظ† ط¬ط¯ظٹط¯</span>
              </label>
            </div>
          )}

          <h2>ط¹ظ†ظˆط§ظ† ط§ظ„طھظˆطµظٹظ„</h2>
          <input
            className="input"
            aria-label="Address line"
            placeholder="ط§ظ„ط¹ظ†ظˆط§ظ†"
            value={form.addressLine}
            onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))}
            required
          />
          {fieldErrors.addressLine ? <p className="error-message">{fieldErrors.addressLine}</p> : null}
          <input
            className="input"
            aria-label="City"
            placeholder="ط§ظ„ظ…ط¯ظٹظ†ط©"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          />
          <input
            className="input"
            aria-label="Area"
            placeholder="ط§ظ„ظ…ظ†ط·ظ‚ط©"
            value={form.area}
            onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
          />

          <select
            className="input"
            aria-label="Shipping zone"
            value={form.shippingZoneId}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                shippingZoneId: event.target.value,
                shippingMethodId: '',
              }))
            }
          >
            <option value="">ط§ط®طھط± ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ†</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} ({zone.fee.toFixed(2)})
              </option>
            ))}
          </select>
          {fieldErrors.shippingZoneId ? <p className="error-message">{fieldErrors.shippingZoneId}</p> : null}

          {form.shippingZoneId && availableShippingMethods.length > 0 ? (
            <>
              <select
                className="input"
                aria-label="Shipping method"
                value={form.shippingMethodId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, shippingMethodId: event.target.value }))
                }
              >
                <option value="">ط§ط®طھط± ط·ط±ظٹظ‚ط© ط§ظ„ط´ط­ظ†</option>
                {availableShippingMethods.map((method: ShippingMethodQuote) => (
                  <option key={method.id} value={method.id}>
                    {method.displayName} ({method.cost.toFixed(2)})
                  </option>
                ))}
              </select>
              {selectedShippingMethod?.description ? (
                <p className="muted">{selectedShippingMethod.description}</p>
              ) : null}
              {fieldErrors.shippingMethodId ? (
                <p className="error-message">{fieldErrors.shippingMethodId}</p>
              ) : null}
            </>
          ) : null}

          <h2>ط·ط±ظٹظ‚ط© ط§ظ„ط¯ظپط¹</h2>
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
            <option value="cod">ط§ظ„ط¯ظپط¹ ط¹ظ†ط¯ ط§ظ„ط§ط³طھظ„ط§ظ…</option>
            <option value="transfer">طھط­ظˆظٹظ„ ط¨ظ†ظƒظٹ</option>
          </select>

          <input
            className="input"
            aria-label="Coupon code"
            placeholder="ظƒظˆط¯ ط§ظ„ط®طµظ… (ط¥ظ† ظˆط¬ط¯)"
            value={form.couponCode}
            onChange={(event) => setForm((prev) => ({ ...prev, couponCode: event.target.value }))}
            disabled={Number(form.pointsToRedeem || 0) > 0}
          />
          <input
            className="input"
            type="number"
            min={0}
            step={1}
            aria-label="Points to redeem"
            placeholder="ط§ظ„ظ†ظ‚ط§ط· ط§ظ„ظ…ط±ط§ط¯ طµط±ظپظ‡ط§"
            value={form.pointsToRedeem}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, pointsToRedeem: event.target.value }))
            }
            disabled={Boolean(form.couponCode.trim())}
          />
          {fieldErrors.pointsToRedeem ? <p className="error-message">{fieldErrors.pointsToRedeem}</p> : null}
          <p className="muted">ظ„ط§ ظٹظ…ظƒظ† ط§ظ„ط¬ظ…ط¹ ط¨ظٹظ† ط§ظ„ظƒظˆط¨ظˆظ† ظˆط§ظ„ظ†ظ‚ط§ط· ظپظٹ ظ†ظپط³ ط§ظ„ط·ظ„ط¨.</p>
          <textarea
            className="input"
            aria-label="Order note"
            placeholder="ظ…ظ„ط§ط­ط¸ط§طھ ط¹ظ„ظ‰ ط§ظ„ط·ظ„ط¨"
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />

          <button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? 'ط¬ط§ط±ظٹ ط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨...' : 'طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨'}
          </button>
        </form>

        <aside className="panel stack-md checkout-summary-panel">
          <h2>ظ…ظ„ط®طµ ط§ظ„ط·ظ„ط¨</h2>
          {cart.items.map((item) => (
            <div key={item.variantId} className="summary-row">
              <span>
                {item.title} x {item.quantity}
              </span>
              <strong>{item.lineTotal.toFixed(2)}</strong>
            </div>
          ))}
          <div className="summary-row">
            <span>ط§ظ„ظ…ط¬ظ…ظˆط¹ ط§ظ„ظپط±ط¹ظٹ</span>
            <strong>{cart.subtotal.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>ط§ظ„ط´ط­ظ†</span>
            <strong>{shippingFee.toFixed(2)}</strong>
          </div>
          {quote && quote.pointsDiscount > 0 ? (
            <div className="summary-row">
              <span>ط®طµظ… ط§ظ„ظ†ظ‚ط§ط·</span>
              <strong>-{quote.pointsDiscount.toFixed(2)}</strong>
            </div>
          ) : null}
          <div className="summary-row total-row">
            <span>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھظ‚ط¯ظٹط±ظٹ</span>
            <strong>
              {estimatedTotal.toFixed(2)} {cart.currencyCode}
            </strong>
          </div>
          {quote ? (
            <p className="muted">ط§ظ„ظ†ظ‚ط§ط· ط§ظ„ظ…طھظˆظ‚ط¹ط© ط¨ط¹ط¯ ط§ظ„ط¥ظƒظ…ط§ظ„: {quote.potentialEarnPoints}</p>
          ) : null}

          <div className="checkout-trust-grid">
            <div className="checkout-trust-item">
              <strong>ط¯ظپط¹ ط¢ظ…ظ†</strong>
              <span className="muted">ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ط­ظ…ظٹط© ظˆظ…ط´ظپط±ط©</span>
            </div>
            <div className="checkout-trust-item">
              <strong>طھط£ظƒظٹط¯ ط³ط±ظٹط¹</strong>
              <span className="muted">ظٹطھظ… طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨ ظپظˆط± ط§ظ„ظ…ط±ط§ط¬ط¹ط©</span>
            </div>
            <div className="checkout-trust-item">
              <strong>طھطھط¨ط¹ ظ…ط¨ط§ط´ط±</strong>
              <span className="muted">ط§ط³طھط¹ط±ط¶ ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨ ظ…ظ† طµظپط­ط© ط§ظ„طھطھط¨ط¹</span>
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
    shippingMethodId: string;
    couponCode: string;
    pointsToRedeem: string;
    note: string;
    paymentMethod: 'cod' | 'transfer';
  },
  restockToken: string | null,
): {
  cartId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressLine: string;
  city?: string;
  area?: string;
  shippingZoneId?: string;
  shippingMethodId?: string;
  couponCode?: string;
  note?: string;
  paymentMethod: 'cod' | 'transfer';
  customerAccessToken?: string;
  restockToken?: string;
  pointsToRedeem?: number;
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
    shippingMethodId?: string;
    couponCode?: string;
    note?: string;
    paymentMethod: 'cod' | 'transfer';
    customerAccessToken?: string;
    restockToken?: string;
    pointsToRedeem?: number;
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
  if (form.shippingMethodId) {
    payload.shippingMethodId = form.shippingMethodId;
  }
  if (form.couponCode) {
    payload.couponCode = form.couponCode;
  }
  const pointsToRedeem = Number(form.pointsToRedeem);
  if (Number.isFinite(pointsToRedeem) && pointsToRedeem > 0) {
    payload.pointsToRedeem = Math.floor(pointsToRedeem);
  }
  if (form.note) {
    payload.note = form.note;
  }
  if (accessToken) {
    payload.customerAccessToken = accessToken;
  }
  if (restockToken) {
    payload.restockToken = restockToken;
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
    shippingMethodId: string;
    couponCode: string;
    pointsToRedeem: string;
    note: string;
    paymentMethod: 'cod' | 'transfer';
  },
  shippingZoneRequired: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.customerName.trim().length < 2) {
    errors.customerName = 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„ ط¨ط´ظƒظ„ طµط­ظٹط­.';
  }

  if (form.customerPhone.trim().length < 8) {
    errors.customerPhone = 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط±ظ‚ظ… ظ‡ط§طھظپ طµط§ظ„ط­.';
  }

  if (form.addressLine.trim().length < 5) {
    errors.addressLine = 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط¹ظ†ظˆط§ظ† ظˆط§ط¶ط­ ظ„ظ„طھظˆطµظٹظ„.';
  }

  if (shippingZoneRequired && !form.shippingZoneId) {
    errors.shippingZoneId = 'ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ…ظ†ط·ظ‚ط© ط§ظ„ط´ط­ظ†.';
  }

  if (shippingZoneRequired && form.shippingZoneId && !form.shippingMethodId) {
    errors.shippingMethodId = 'يرجى اختيار طريقة الشحن.';
  }

  if (form.customerEmail && !/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = 'طµظٹط؛ط© ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط؛ظٹط± طµط­ظٹط­ط©.';
  }
  if (form.pointsToRedeem.trim()) {
    const points = Number(form.pointsToRedeem);
    if (!Number.isFinite(points) || points < 0 || !Number.isInteger(points)) {
      errors.pointsToRedeem = 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط¹ط¯ط¯ طµط­ظٹط­ طµط§ظ„ط­ ظ„ظ„ظ†ظ‚ط§ط·.';
    }
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
    shippingMethodId: string;
    couponCode: string;
    pointsToRedeem: string;
    note: string;
    paymentMethod: 'cod' | 'transfer';
  },
  shippingZoneRequired: boolean,
): 1 | 2 | 3 | 4 {
  if (!form.customerName.trim() || !form.customerPhone.trim()) {
    return 1;
  }

  if (
    !form.addressLine.trim() ||
    (shippingZoneRequired && (!form.shippingZoneId || !form.shippingMethodId))
  ) {
    return 2;
  }

  if (!form.paymentMethod) {
    return 3;
  }

  return 4;
}
