import { headers } from 'next/headers';

export async function getSiteOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get('x-forwarded-proto');
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3001';
  const protocol = forwardedProto === 'http' || forwardedProto === 'https'
    ? forwardedProto
    : host.includes('localhost')
      ? 'http'
      : 'https';

  return `${protocol}://${host}`;
}

export async function absoluteUrl(path: string): Promise<string> {
  const origin = await getSiteOrigin();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export function cleanText(value: string | null | undefined, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}
