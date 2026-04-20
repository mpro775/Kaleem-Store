'use client';

const RESTOCK_TOKEN_KEY = 'kaleem_restock_token';

export function saveRestockTokenToStorage(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }

  window.localStorage.setItem(RESTOCK_TOKEN_KEY, trimmed);
}

export function getRestockTokenFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(RESTOCK_TOKEN_KEY);
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function clearRestockTokenFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(RESTOCK_TOKEN_KEY);
}
