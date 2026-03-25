'use client';

const ACCESS_TOKEN_KEY = 'kaleem.customer.accessToken';
const REFRESH_TOKEN_KEY = 'kaleem.customer.refreshToken';
const CUSTOMER_DATA_KEY = 'kaleem.customer.data';

export interface CustomerData {
  id: string;
  storeId: string;
  fullName: string;
  phone: string;
  email: string | null;
  sessionId: string;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getCustomerData(): CustomerData | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(CUSTOMER_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerData;
  } catch {
    return null;
  }
}

export function saveCustomerData(data: CustomerData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data));
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(CUSTOMER_DATA_KEY);
}

export function saveAuthSession(accessToken: string, refreshToken: string, customer: CustomerData): void {
  saveAccessToken(accessToken);
  saveRefreshToken(refreshToken);
  saveCustomerData(customer);
}
