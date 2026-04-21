'use client';

import { getAccessToken, getRefreshToken, saveAuthSession, clearAuthStorage, type CustomerData } from './customer-auth-storage';
import { attachCsrfHeader } from './csrf-client';

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
  productTitle: string | null;
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

export interface ProductQuestion {
  id: string;
  productId: string;
  productTitle: string;
  customerId: string | null;
  customerName: string | null;
  question: string;
  answer: string | null;
  answeredBy: string | null;
  answeredByName: string | null;
  answeredAt: string | null;
  moderationStatus: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: string;
  updatedAt: string;
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

export interface CustomerLoyaltyWallet {
  customerId: string;
  availablePoints: number;
  lockedPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
}

export interface CustomerLoyaltyLedgerEntry {
  id: string;
  customerId: string;
  orderId: string | null;
  entryType: 'earn' | 'redeem' | 'adjust' | 'reverse';
  pointsDelta: number;
  amountDelta: number;
  balanceAfter: number;
  referenceEntryId: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdByStoreUserId: string | null;
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

// ==================== PRODUCT QUESTIONS ====================

export async function listPublicProductQuestions(
  productId: string,
  limit = 20,
  offset = 0,
): Promise<{ items: ProductQuestion[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return fetchJson(`/customers/products/${encodeURIComponent(productId)}/questions?${params.toString()}`);
}

export async function createProductQuestion(
  productId: string,
  question: string,
): Promise<ProductQuestion> {
  return fetchJson<ProductQuestion>(`/customers/products/${encodeURIComponent(productId)}/questions`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

export async function subscribeToRestock(
  productId: string,
): Promise<{ subscriptionId: string; message: string }> {
  return fetchJson<{ subscriptionId: string; message: string }>(
    `/customers/products/${encodeURIComponent(productId)}/restock-subscriptions`,
    {
      method: 'POST',
    },
  );
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
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = createRequestHeaders(init.headers);

  await attachCsrfHeader(API_BASE_URL, method, headers);

  const response = await fetch(`${API_BASE_URL}${appendStoreSlugQuery(path)}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getCustomerLoyaltyWallet(): Promise<CustomerLoyaltyWallet> {
  return fetchJson('/customers/loyalty/wallet');
}

export async function listCustomerLoyaltyLedger(): Promise<CustomerLoyaltyLedgerEntry[]> {
  return fetchJson('/customers/loyalty/ledger');
}

function createRequestHeaders(headers: HeadersInit | undefined): Headers {
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const result = new Headers(headers ?? undefined);
  result.set('x-forwarded-host', host);
  if (!result.has('content-type')) {
    result.set('content-type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    result.set('authorization', `Bearer ${accessToken}`);
  }

  return result;
}

async function resolveErrorMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? `Request failed: ${response.status}`;
}

function appendStoreSlugQuery(path: string): string {
  if (!STOREFRONT_STORE_SLUG || path.includes('store=')) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}store=${encodeURIComponent(STOREFRONT_STORE_SLUG)}`;
}
