import type { AuthResult, MerchantSession } from './types';

export interface MerchantRequestOptions {
  requiresAuth?: boolean;
  includeStoreHeader?: boolean;
}

interface MerchantRequestInput {
  session: MerchantSession;
  path: string;
  init: RequestInit | undefined;
  options: MerchantRequestOptions | undefined;
  onSessionUpdate: (session: MerchantSession) => void;
  onSessionExpired: () => void;
}

export async function merchantRequestJson<T>(input: MerchantRequestInput): Promise<T | null> {
  const init = input.init ?? {};
  const options = input.options ?? {};

  const initial = await executeRequest<T>(input.session, input.path, init, options);
  if (initial.ok) {
    return initial.data;
  }

  if (!shouldRefresh(initial.status, options)) {
    throw new Error(await resolveErrorMessage(initial.response));
  }

  const refreshed = await refreshSession(input.session);
  if (!refreshed) {
    input.onSessionExpired();
    throw new Error('Session expired. Please sign in again.');
  }

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
  const response = await fetch(`${session.apiBaseUrl}${path}`, {
    ...init,
    headers: mergeHeaders(init.headers, session, options, init.body !== undefined),
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

function mergeHeaders(
  headers: HeadersInit | undefined,
  session: MerchantSession,
  options: MerchantRequestOptions,
  hasBody: boolean,
): Headers {
  const merged = new Headers(headers ?? undefined);
  const requiresAuth = options.requiresAuth ?? true;
  const includeStoreHeader = options.includeStoreHeader ?? requiresAuth;

  if (requiresAuth) {
    merged.set('authorization', `Bearer ${session.accessToken}`);
  }

  if (includeStoreHeader) {
    merged.set('x-store-id', session.user.storeId);
  }

  if (!merged.has('content-type') && hasBody) {
    merged.set('content-type', 'application/json');
  }

  return merged;
}

function shouldRefresh(status: number, options: MerchantRequestOptions): boolean {
  const requiresAuth = options.requiresAuth ?? true;
  return status === 401 && requiresAuth;
}

async function refreshSession(session: MerchantSession): Promise<MerchantSession | null> {
  const response = await fetch(`${session.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
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
