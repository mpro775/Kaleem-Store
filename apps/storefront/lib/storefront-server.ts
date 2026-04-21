/* eslint-disable complexity */
import { headers } from 'next/headers';
import type {
  PublicStoreResolveResponse,
  StorefrontPolicies,
  StorefrontCategory,
  StorefrontFilterAttribute,
  StorefrontProductDetail,
  StorefrontProductsResponse,
  StorefrontThemeResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const STOREFRONT_STORE_SLUG = process.env.NEXT_PUBLIC_STOREFRONT_STORE_SLUG?.trim();

export async function resolveStore(): Promise<PublicStoreResolveResponse> {
  return serverGet('/public/store/resolve', { revalidate: 60 });
}

export async function getPublishedTheme(): Promise<StorefrontThemeResponse> {
  return serverGet('/sf/theme', { revalidate: 60 });
}

export async function listCategories(): Promise<StorefrontCategory[]> {
  return serverGet('/sf/categories', { revalidate: 60 });
}

export async function listProducts(
  input: {
    page?: number;
    limit?: number;
    q?: string;
    categorySlug?: string;
    filters?: Record<string, string[]>;
    ranges?: Record<string, { min?: number; max?: number }>;
  } = {},
): Promise<StorefrontProductsResponse> {
  const params = new URLSearchParams();
  if (input.page) {
    params.set('page', String(input.page));
  }
  if (input.limit) {
    params.set('limit', String(input.limit));
  }
  if (input.q) {
    params.set('q', input.q);
  }
  if (input.categorySlug) {
    params.set('categorySlug', input.categorySlug);
  }
  if (input.filters) {
    for (const [filterSlug, valueSlugs] of Object.entries(input.filters)) {
      for (const valueSlug of valueSlugs) {
        params.append(`filters[${filterSlug}]`, valueSlug);
      }
    }
  }
  if (input.ranges) {
    for (const [filterSlug, range] of Object.entries(input.ranges)) {
      if (range.min !== undefined) {
        params.append(`ranges[${filterSlug}][min]`, String(range.min));
      }
      if (range.max !== undefined) {
        params.append(`ranges[${filterSlug}][max]`, String(range.max));
      }
    }
  }

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return serverGet(`/sf/products${query}`, { revalidate: 60 });
}

export async function listFilterAttributes(input: {
  categorySlug?: string;
}): Promise<StorefrontFilterAttribute[]> {
  const params = new URLSearchParams();
  if (input.categorySlug) {
    params.set('categorySlug', input.categorySlug);
  }

  const query = params.size > 0 ? `?${params.toString()}` : '';
  return serverGet(`/sf/filters${query}`, { revalidate: 60 });
}

export async function getProduct(slug: string): Promise<StorefrontProductDetail> {
  return serverGet(`/sf/products/${encodeURIComponent(slug)}`, { revalidate: 60 });
}

export async function getPolicies(): Promise<StorefrontPolicies> {
  return serverGet('/sf/policies', { revalidate: 60 });
}

async function serverGet<T>(path: string, cacheOptions: { revalidate: number }): Promise<T> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3001';

  const response = await fetch(`${API_BASE_URL}${appendStoreSlugQuery(path)}`, {
    headers: {
      'x-forwarded-host': host,
    },
    next: {
      revalidate: cacheOptions.revalidate,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${path} (${response.status})`);
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
