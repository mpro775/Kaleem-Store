'use client';

const CART_STORAGE_KEY = 'kaleem.storefront.cartId';

export function getCartIdFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(CART_STORAGE_KEY);
  return value && value.trim().length > 0 ? value : null;
}

export function saveCartIdToStorage(cartId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, cartId);
}

export function clearCartIdFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(CART_STORAGE_KEY);
}
