import { attachCsrfHeader } from '../../lib/csrf';
import type { PlatformAuthResult, PlatformSession } from './platform-types';

interface PlatformRequestInput {
  session: PlatformSession;
  path: string;
  init?: RequestInit;
  onSessionUpdate: (nextSession: PlatformSession) => void;
  onSessionExpired: () => void;
}

let refreshPromise: Promise<PlatformSession | null> | null = null;

export async function platformRequestJson<T>(input: PlatformRequestInput): Promise<T | null> {
  const initial = await executeRequest<T>(input.session, input.path, input.init);
  if (initial.ok) {
    return initial.data;
  }

  if (initial.status !== 401) {
    throw new Error(await resolveErrorMessage(initial.response));
  }

  const refreshed = await refreshPlatformSession(input.session);
  if (!refreshed) {
    input.onSessionExpired();
    throw new Error('Platform session expired. Please sign in again.');
  }

  input.onSessionUpdate(refreshed);
  const retried = await executeRequest<T>(refreshed, input.path, input.init);
  if (retried.ok) {
    return retried.data;
  }

  throw new Error(await resolveErrorMessage(retried.response));
}

async function executeRequest<T>(
  session: PlatformSession,
  path: string,
  init: RequestInit | undefined,
): Promise<{ ok: boolean; status: number; response: Response; data: T | null }> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = new Headers(init?.headers ?? undefined);
  headers.set('authorization', `Bearer ${session.accessToken}`);
  if (!headers.has('content-type') && init?.body) {
    headers.set('content-type', 'application/json');
  }
  if (method !== 'GET' && method !== 'HEAD' && session.stepUpToken) {
    if (!session.stepUpExpiresAt || new Date(session.stepUpExpiresAt).getTime() > Date.now()) {
      headers.set('x-platform-step-up-token', session.stepUpToken);
    }
  }

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
    data: (await response.json()) as T,
  };
}

async function refreshPlatformSession(session: PlatformSession): Promise<PlatformSession | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const headers = new Headers({
        'content-type': 'application/json',
      });
      await attachCsrfHeader(session.apiBaseUrl, 'POST', headers);

      const response = await fetch(`${session.apiBaseUrl}/platform/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as PlatformAuthResult;
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
