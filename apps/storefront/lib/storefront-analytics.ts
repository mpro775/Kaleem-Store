'use client';

import { attachCsrfHeader } from './csrf-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const STOREFRONT_STORE_SLUG = process.env.NEXT_PUBLIC_STOREFRONT_STORE_SLUG?.trim();

const SESSION_STORAGE_KEY = 'sf_session_id';

export const STOREFRONT_ANALYTICS_EVENT_NAMES = [
  'sf_home_viewed',
  'sf_category_viewed',
  'sf_product_viewed',
  'sf_section_clicked',
  'sf_add_to_cart_clicked',
  'sf_cart_viewed',
  'sf_cart_item_updated',
  'sf_checkout_started',
  'sf_checkout_step_completed',
  'sf_checkout_submitted',
  'sf_checkout_completed',
  'sf_order_tracking_viewed',
] as const;

export type StorefrontAnalyticsEventName = (typeof STOREFRONT_ANALYTICS_EVENT_NAMES)[number];

export async function trackStorefrontEvent(
  eventName: StorefrontAnalyticsEventName,
  input: {
    cartId?: string;
    orderId?: string;
    productId?: string;
    variantId?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const sessionId = resolveSessionId();
  const payload = {
    eventName,
    sessionId,
    ...(input.cartId ? { cartId: input.cartId } : {}),
    ...(input.orderId ? { orderId: input.orderId } : {}),
    ...(input.productId ? { productId: input.productId } : {}),
    ...(input.variantId ? { variantId: input.variantId } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };

  const url = `${API_BASE_URL}${appendStoreSlugQuery('/sf/events')}`;
  const host = window.location.host;
  const body = JSON.stringify(payload);

  const headers = new Headers({
    'content-type': 'application/json',
    'x-forwarded-host': host,
    'x-storefront-session-id': sessionId,
  });
  await attachCsrfHeader(API_BASE_URL, 'POST', headers);

  await fetch(url, {
    method: 'POST',
    headers,
    body,
    keepalive: true,
    credentials: 'include',
  }).catch(() => undefined);
}

function resolveSessionId(): string {
  const fromStorage = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (fromStorage && fromStorage.trim().length > 0) {
    return fromStorage;
  }

  const generated = `sf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
}

function appendStoreSlugQuery(path: string): string {
  if (!STOREFRONT_STORE_SLUG || path.includes('store=')) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}store=${encodeURIComponent(STOREFRONT_STORE_SLUG)}`;
}
