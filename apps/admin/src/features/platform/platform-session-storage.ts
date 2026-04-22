import type { PlatformSession } from './platform-types';

const PLATFORM_SESSION_STORAGE_KEY = 'platform.session.v1';
const PLATFORM_API_BASE_URL_KEY = 'platform.apiBaseUrl.v1';

function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function readEnvApiBaseUrl(): string {
  const envValue = import.meta.env.VITE_API_BASE_URL;
  if (typeof envValue !== 'string') {
    return '';
  }

  return normalizeApiBaseUrl(envValue);
}

export function readStoredPlatformSession(): PlatformSession | null {
  try {
    const raw = window.localStorage.getItem(PLATFORM_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PlatformSession;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.id) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredPlatformSession(session: PlatformSession | null): void {
  try {
    if (!session) {
      window.localStorage.removeItem(PLATFORM_SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(PLATFORM_SESSION_STORAGE_KEY, JSON.stringify(session));
    window.localStorage.setItem(
      PLATFORM_API_BASE_URL_KEY,
      normalizeApiBaseUrl(session.apiBaseUrl),
    );
  } catch {
    return;
  }
}

export function readStoredPlatformApiBaseUrl(): string {
  const envApiBaseUrl = readEnvApiBaseUrl();
  if (envApiBaseUrl) {
    return envApiBaseUrl;
  }

  try {
    const stored = window.localStorage.getItem(PLATFORM_API_BASE_URL_KEY);
    return stored && stored.length > 0
      ? normalizeApiBaseUrl(stored)
      : 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
}
