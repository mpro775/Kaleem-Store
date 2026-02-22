'use client';

import type { CheckoutResponse, ShippingZone, StorefrontCart, TrackOrderResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function addCartItem(input: {
  variantId: string;
  quantity: number;
  cartId?: string;
}): Promise<StorefrontCart> {
  return fetchJson('/sf/cart/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getCart(cartId: string): Promise<StorefrontCart> {
  return fetchJson(`/sf/cart/${encodeURIComponent(cartId)}`);
}

export async function updateCartItem(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<StorefrontCart> {
  return fetchJson(
    `/sf/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(variantId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    },
  );
}

export async function removeCartItem(cartId: string, variantId: string): Promise<StorefrontCart> {
  return fetchJson(
    `/sf/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(variantId)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function listShippingZones(): Promise<ShippingZone[]> {
  return fetchJson('/sf/shipping-zones');
}

export async function checkout(input: {
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
}): Promise<CheckoutResponse> {
  const idempotencyKey = generateIdempotencyKey();
  return fetchJson('/sf/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
}

export async function trackOrder(orderCode: string, phone?: string): Promise<TrackOrderResponse> {
  const params = new URLSearchParams();
  if (phone && phone.trim().length > 0) {
    params.set('phone', phone.trim());
  }

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return fetchJson(`/sf/orders/${encodeURIComponent(orderCode)}/track${query}`);
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const host = window.location.host;
  const headers = new Headers(init.headers ?? undefined);
  headers.set('x-forwarded-host', host);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
