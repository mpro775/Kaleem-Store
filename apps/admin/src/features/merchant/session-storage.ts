import type { MerchantSession } from './types';

const SESSION_STORAGE_KEY = 'merchant.session.v1';
const API_BASE_URL_KEY = 'merchant.apiBaseUrl.v1';

export function readStoredSession(): MerchantSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as MerchantSession;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.storeId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: MerchantSession | null): void {
  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.localStorage.setItem(API_BASE_URL_KEY, session.apiBaseUrl);
  } catch {
    return;
  }
}

export function readStoredApiBaseUrl(): string {
  try {
    const stored = window.localStorage.getItem(API_BASE_URL_KEY);
    return stored && stored.length > 0 ? stored : 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
}
