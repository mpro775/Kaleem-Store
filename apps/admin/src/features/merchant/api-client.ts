import type { AuthResult, MerchantSession } from './types';
import { attachCsrfHeader } from '../../lib/csrf';

export interface MerchantRequestOptions {
  requiresAuth?: boolean;
  includeStoreHeader?: boolean;
  responseType?: 'json' | 'blob' | 'text';
}

interface MerchantRequestInput {
  session: MerchantSession;
  path: string;
  init: RequestInit | undefined;
  options: MerchantRequestOptions | undefined;
  onSessionUpdate: (session: MerchantSession) => void;
  onSessionExpired: () => void;
}

let activeSession: MerchantSession | null = null;
let refreshPromise: Promise<MerchantSession | null> | null = null;

export async function merchantRequestJson<T>(input: MerchantRequestInput): Promise<T | null> {
  const init = input.init ?? {};
  const options = input.options ?? {};

  // Use the most up-to-date session to prevent race conditions during React state updates
  const currentSession = activeSession && activeSession.refreshToken !== input.session.refreshToken 
    ? activeSession 
    : input.session;

  const initial = await executeRequest<T>(currentSession, input.path, init, options);
  if (initial.ok) {
    return initial.data;
  }

  if (!shouldRefresh(initial.status, options)) {
    throw new Error(await resolveErrorMessage(initial.response));
  }

  const refreshed = await refreshSession(currentSession);
  if (!refreshed) {
    activeSession = null;
    input.onSessionExpired();
    throw new Error('Session expired. Please sign in again.');
  }

  activeSession = refreshed;
  input.onSessionUpdate(refreshed);

  const retried = await executeRequest<T>(refreshed, input.path, init, options);
  if (retried.ok) {
    return retried.data;
  }

  throw new Error(await resolveErrorMessage(retried.response));
}

interface ExecuteResult<T> {
  ok: boolean;
  status: number;
  response: Response;
  data: T | null;
}

async function executeRequest<T>(
  session: MerchantSession,
  path: string,
  init: RequestInit,
  options: MerchantRequestOptions,
): Promise<ExecuteResult<T>> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = mergeHeaders(init.headers, session, options, init.body);
  await attachCsrfHeader(session.apiBaseUrl, method, headers);

  const response = await fetch(`${session.apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      response,
      data: null,
    };
  }

  if (response.status === 204) {
    return {
      ok: true,
      status: response.status,
      response,
      data: null,
    };
  }

  return {
    ok: true,
    status: response.status,
    response,
    data: (await resolveResponseData<T>(response, options.responseType ?? 'json')),
  };
}

async function resolveResponseData<T>(
  response: Response,
  responseType: NonNullable<MerchantRequestOptions['responseType']>,
): Promise<T | null> {
  if (responseType === 'blob') {
    return (await response.blob()) as T;
  }

  if (responseType === 'text') {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

function mergeHeaders(
  headers: HeadersInit | undefined,
  session: MerchantSession,
  options: MerchantRequestOptions,
  body: BodyInit | null | undefined,
): Headers {
  const merged = new Headers(headers ?? undefined);
  const requiresAuth = options.requiresAuth ?? true;
  const includeStoreHeader = options.includeStoreHeader ?? requiresAuth;
  const hasBody = body !== undefined && body !== null;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (requiresAuth) {
    merged.set('authorization', `Bearer ${session.accessToken}`);
  }

  if (includeStoreHeader) {
    merged.set('x-store-id', session.user.storeId);
  }

  if (!merged.has('content-type') && hasBody && !isFormData) {
    merged.set('content-type', 'application/json');
  }

  return merged;
}

function shouldRefresh(status: number, options: MerchantRequestOptions): boolean {
  const requiresAuth = options.requiresAuth ?? true;
  return status === 401 && requiresAuth;
}

async function refreshSession(session: MerchantSession): Promise<MerchantSession | null> {
  // If the session we are trying to refresh is older than the active one we already refreshed,
  // we just return the active one instead of refreshing again.
  if (activeSession && activeSession.refreshToken !== session.refreshToken) {
    return activeSession;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${session.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as AuthResult;
      return {
        apiBaseUrl: session.apiBaseUrl,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function resolveErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  if (!raw) {
    return `Request failed with status ${response.status}`;
  }

  try {
    const parsed = JSON.parse(raw) as { message?: string };
    return parsed.message ?? `Request failed with status ${response.status}`;
  } catch {
    return raw;
  }
}
