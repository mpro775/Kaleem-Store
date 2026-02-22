export async function requestJson<T>(
  url: string,
  init: RequestInit,
): Promise<T | null> {
  const response = await fetch(url, init);
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
