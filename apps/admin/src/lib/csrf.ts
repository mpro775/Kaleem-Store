const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER_NAME = 'x-csrf-token';

let cachedToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

function isSafeMethod(method: string | undefined): boolean {
  return SAFE_METHODS.has((method ?? 'GET').toUpperCase());
}

async function fetchCsrfToken(apiBaseUrl: string): Promise<string | null> {
  if (cachedToken) {
    return cachedToken;
  }

  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    const response = await fetch(`${apiBaseUrl}/health/live`, {
      method: 'GET',
      credentials: 'include',
    });

    const token = response.headers.get(CSRF_HEADER_NAME);
    cachedToken = token;
    return token;
  })().finally(() => {
    tokenPromise = null;
  });

  return tokenPromise;
}

export async function attachCsrfHeader(
  apiBaseUrl: string,
  method: string | undefined,
  headers: Headers,
): Promise<void> {
  if (isSafeMethod(method) || headers.has(CSRF_HEADER_NAME)) {
    return;
  }

  const token = await fetchCsrfToken(apiBaseUrl);
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }
}
