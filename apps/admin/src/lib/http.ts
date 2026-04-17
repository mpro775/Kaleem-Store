import { attachCsrfHeader } from './csrf';

export async function requestJson<T>(
  url: string,
  init: RequestInit,
): Promise<T | null> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers ?? undefined);

  try {
    const parsedUrl = new URL(url, window.location.origin);
    await attachCsrfHeader(parsedUrl.origin, method, headers);
  } catch {
    // Ignore URL parsing errors and continue request without CSRF header.
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    const message = await resolveErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
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
