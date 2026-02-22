'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { clearCartIdFromStorage, getCartIdFromStorage } from '../lib/cart-storage';
import { getCart, removeCartItem, updateCartItem } from '../lib/storefront-client';
import type { StorefrontCart } from '../lib/types';

export function CartPageClient() {
  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart().catch(() => {
      return;
    });
  }, []);

  const hasItems = useMemo(() => (cart?.items.length ?? 0) > 0, [cart]);

  async function loadCart() {
    const cartId = getCartIdFromStorage();
    if (!cartId) {
      setCart(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextCart = await getCart(cartId);
      setCart(nextCart);
    } catch (requestError) {
      clearCartIdFromStorage();
      setCart(null);
      setError(requestError instanceof Error ? requestError.message : 'Unable to load cart');
    } finally {
      setLoading(false);
    }
  }

  async function onChangeQuantity(variantId: string, quantity: number) {
    if (!cart) {
      return;
    }

    try {
      const nextCart = await updateCartItem(cart.cartId, variantId, quantity);
      setCart(nextCart);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update cart item');
    }
  }

  async function onRemoveItem(variantId: string) {
    if (!cart) {
      return;
    }

    try {
      const nextCart = await removeCartItem(cart.cartId, variantId);
      setCart(nextCart);
      if (nextCart.items.length === 0) {
        clearCartIdFromStorage();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove cart item');
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Your cart</h1>
        <p>Review your items and continue to checkout.</p>
      </header>

      {loading ? <div className="panel">Loading cart...</div> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {!loading && !hasItems ? (
        <div className="panel">
          <p>Your cart is empty.</p>
          <Link href="/categories" className="button-primary">
            Start shopping
          </Link>
        </div>
      ) : null}

      {cart && hasItems ? (
        <div className="stack-lg">
          <div className="panel">
            {cart.items.map((item) => (
              <article key={item.variantId} className="cart-row">
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">SKU: {item.sku}</p>
                  <p>{item.lineTotal.toFixed(2)}</p>
                </div>

                <div className="cart-actions">
                  <input
                    className="input small-input"
                    type="number"
                    min={0}
                    max={50}
                    value={item.quantity}
                    onChange={(event) =>
                      onChangeQuantity(item.variantId, Number(event.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => onRemoveItem(item.variantId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="panel">
            <h2>Summary</h2>
            <p>Total items: {cart.totalItems}</p>
            <p>
              Subtotal: {cart.subtotal.toFixed(2)} {cart.currencyCode}
            </p>
            <Link href="/checkout" className="button-primary">
              Proceed to checkout
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
