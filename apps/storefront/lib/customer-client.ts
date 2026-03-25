'use client';

import { getAccessToken, getRefreshToken, saveAuthSession, clearAuthStorage, type CustomerData } from './customer-auth-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const STOREFRONT_STORE_SLUG = process.env.NEXT_PUBLIC_STOREFRONT_STORE_SLUG?.trim();

export interface CustomerAuthResult {
  accessToken: string;
  refreshToken: string;
  customer: CustomerData;
}

export interface CustomerProfile {
  id: string;
  storeId: string;
  fullName: string;
  phone: string;
  email: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  addressLine: string;
  city: string | null;
  area: string | null;
  notes: string | null;
  isDefault: boolean;
}

export interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  slug: string;
  primaryImageUrl: string | null;
  priceFrom: number | null;
  createdAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { rating: number; count: number }[];
}

export interface CustomerOrder {
  id: string;
  orderCode: string;
  status: string;
  subtotal: number;
  total: number;
  shippingFee: number;
  discountTotal: number;
  currencyCode: string;
  createdAt: string;
}

// ==================== AUTH ====================

export async function customerRegister(input: {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}): Promise<CustomerAuthResult> {
  const result = await fetchJson<CustomerAuthResult>('/customers/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  saveAuthSession(result.accessToken, result.refreshToken, result.customer);
  return result;
}

export async function customerLogin(input: {
  phoneOrEmail: string;
  password: string;
}): Promise<CustomerAuthResult> {
  const result = await fetchJson<CustomerAuthResult>('/customers/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  saveAuthSession(result.accessToken, result.refreshToken, result.customer);
  return result;
}

export async function customerRefresh(): Promise<CustomerAuthResult | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const result = await fetchJson<CustomerAuthResult>('/customers/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    saveAuthSession(result.accessToken, result.refreshToken, result.customer);
    return result;
  } catch {
    clearAuthStorage();
    return null;
  }
}

export async function customerLogout(): Promise<void> {
  try {
    await fetchJson('/customers/logout', { method: 'POST' });
  } catch {
    // Ignore errors
  }
  clearAuthStorage();
}

export async function customerForgotPassword(email: string): Promise<void> {
  await fetchJson('/customers/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function customerResetPassword(input: {
  token: string;
  password: string;
}): Promise<void> {
  await fetchJson('/customers/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ==================== PROFILE ====================

export async function getCustomerProfile(): Promise<CustomerProfile> {
  return fetchJson<CustomerProfile>('/customers/me');
}

export async function updateCustomerProfile(input: {
  fullName?: string;
  phone?: string;
  email?: string;
}): Promise<CustomerProfile> {
  return fetchJson<CustomerProfile>('/customers/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

// ==================== ADDRESSES ====================

export async function listCustomerAddresses(): Promise<CustomerAddress[]> {
  return fetchJson<CustomerAddress[]>('/customers/addresses');
}

export async function createCustomerAddress(input: {
  addressLine: string;
  city?: string;
  area?: string;
  notes?: string;
  isDefault?: boolean;
}): Promise<CustomerAddress> {
  return fetchJson<CustomerAddress>('/customers/addresses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  await fetchJson(`/customers/addresses/${encodeURIComponent(addressId)}`, {
    method: 'DELETE',
  });
}

// ==================== WISHLIST ====================

export async function listWishlist(): Promise<WishlistItem[]> {
  return fetchJson<WishlistItem[]>('/customers/wishlist');
}

export async function addToWishlist(productId: string): Promise<WishlistItem> {
  return fetchJson<WishlistItem>(`/customers/wishlist/${encodeURIComponent(productId)}`, {
    method: 'POST',
  });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await fetchJson(`/customers/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

export async function checkWishlist(productId: string): Promise<boolean> {
  const result = await fetchJson<{ inWishlist: boolean }>(`/customers/wishlist/${encodeURIComponent(productId)}/check`);
  return result.inWishlist;
}

// ==================== REVIEWS ====================

export async function listMyReviews(): Promise<ProductReview[]> {
  return fetchJson<ProductReview[]>('/customers/reviews');
}

export async function createReview(input: {
  productId: string;
  rating: number;
  comment?: string;
}): Promise<ProductReview> {
  return fetchJson<ProductReview>('/customers/reviews', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateReview(
  reviewId: string,
  input: { rating?: number; comment?: string },
): Promise<ProductReview> {
  return fetchJson<ProductReview>(`/customers/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteReview(reviewId: string): Promise<void> {
  await fetchJson(`/customers/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  });
}

export async function listProductReviews(
  productId: string,
  limit = 20,
  offset = 0,
): Promise<{ reviews: ProductReview[]; stats: ProductReviewStats }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return fetchJson(`/customers/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`);
}

// ==================== ORDERS ====================

export async function listCustomerOrders(
  limit = 20,
  offset = 0,
): Promise<{ orders: CustomerOrder[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return fetchJson(`/customers/orders?${params.toString()}`);
}

// ==================== HELPERS ====================

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const headers = new Headers(init.headers ?? undefined);
  headers.set('x-forwarded-host', host);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${appendStoreSlugQuery(path)}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function appendStoreSlugQuery(path: string): string {
  if (!STOREFRONT_STORE_SLUG || path.includes('store=')) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}store=${encodeURIComponent(STOREFRONT_STORE_SLUG)}`;
}
