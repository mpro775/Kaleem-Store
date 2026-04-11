'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addCartItem } from '../lib/storefront-client';
import { getCartIdFromStorage, saveCartIdToStorage } from '../lib/cart-storage';
import { trackStorefrontEvent } from '../lib/storefront-analytics';
import type { ProductVariant } from '../lib/types';

function bilingual(ar: string | null | undefined, en: string | null | undefined, fallback: string): string {
  if (ar && en) return `${ar} / ${en}`;
  return ar ?? en ?? fallback;
}

interface ProductPurchaseCardProps {
  variants: ProductVariant[];
}

export function ProductPurchaseCard({ variants }: ProductPurchaseCardProps) {
  if (variants.length === 0) {
    return <div className="panel">This product is currently unavailable.</div>;
  }

  return <ProductPurchaseForm variants={variants} />;
}

function ProductPurchaseForm({ variants }: ProductPurchaseCardProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(() => resolveDefaultVariant(variants)?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === variantId) ?? null,
    [variantId, variants],
  );
  const maxStock = selectedVariant?.stockQuantity ?? 0;
  const canSubmit = quantity > 0 && quantity <= maxStock && !busy;

  async function onAddToCart() {
    if (!selectedVariant || !canSubmit) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await trackStorefrontEvent('sf_add_to_cart_clicked', {
        variantId: selectedVariant.id,
        metadata: {
          quantity,
          price: selectedVariant.price,
        },
      });

      const cart = await addCartItem(buildAddToCartPayload(selectedVariant.id, quantity));
      saveCartIdToStorage(cart.cartId);
      router.push('/cart');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to add product to cart',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h3>Buy now</h3>
      <label className="field-label" htmlFor="variant-select">
        Variant
      </label>
      <select
        id="variant-select"
        className="input"
        value={variantId}
        onChange={(event) => setVariantId(event.target.value)}
      >
        {variants.map((variant) => (
          <option key={variant.id} value={variant.id}>
            {bilingual(variant.titleAr, variant.titleEn, variant.title)} - {variant.price.toFixed(2)}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="qty-input">
        Quantity
      </label>
      <div className="qty-control">
        <button
          type="button"
          className="button-secondary qty-btn"
          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
          disabled={busy || quantity <= 1}
        >
          -
        </button>
        <input
          id="qty-input"
          className="input qty-input"
          type="number"
          min={1}
          max={maxStock || 1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
        <button
          type="button"
          className="button-secondary qty-btn"
          onClick={() => setQuantity((prev) => Math.min(maxStock || 1, prev + 1))}
          disabled={busy || quantity >= (maxStock || 1)}
        >
          +
        </button>
      </div>

      {selectedVariant ? (
        <div className="stack-md">
          <p className="muted">Stock available: {selectedVariant.stockQuantity}</p>
          {selectedVariant.stockQuantity <= 5 ? (
            <p className="purchase-urgency">Hurry, only a few units left.</p>
          ) : null}
          <p className="muted">Secure checkout and fast order confirmation.</p>
        </div>
      ) : null}
      {error ? <p className="error-message">{error}</p> : null}

      <button className="button-primary" type="button" onClick={onAddToCart} disabled={!canSubmit}>
        {busy ? 'Adding...' : 'Add to cart'}
      </button>
    </div>
  );
}

function buildAddToCartPayload(
  variantId: string,
  quantity: number,
): {
  variantId: string;
  quantity: number;
  cartId?: string;
} {
  const payload: { variantId: string; quantity: number; cartId?: string } = {
    variantId,
    quantity,
  };

  const cartId = getCartIdFromStorage();
  if (cartId) {
    payload.cartId = cartId;
  }

  return payload;
}

function resolveDefaultVariant(variants: ProductVariant[]): ProductVariant | null {
  return variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
}
