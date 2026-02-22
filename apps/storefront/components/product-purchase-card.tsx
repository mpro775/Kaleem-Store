'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addCartItem } from '../lib/storefront-client';
import { getCartIdFromStorage, saveCartIdToStorage } from '../lib/cart-storage';
import type { ProductVariant } from '../lib/types';

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
            {variant.title} - {variant.price.toFixed(2)}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="qty-input">
        Quantity
      </label>
      <input
        id="qty-input"
        className="input"
        type="number"
        min={1}
        max={maxStock || 1}
        value={quantity}
        onChange={(event) => setQuantity(Number(event.target.value))}
      />

      {selectedVariant ? (
        <p className="muted">Stock available: {selectedVariant.stockQuantity}</p>
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
