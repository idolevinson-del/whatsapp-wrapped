const SHORTEN_ENDPOINT = '/api/shorten';
const TIMEOUT_MS = 2500;

/**
 * Best-effort URL shortening via our own /api/shorten (a thin server-side
 * proxy to a public shortener — currently is.gd, see api/shorten.ts for why
 * that's the pick, and why this can't be called directly from the browser).
 *
 * Always resolves — falls back to the original long URL on any failure
 * (network error, timeout, non-2xx, unexpected response shape), so a
 * shortener hiccup never blocks or breaks sharing. Worst case, this behaves
 * exactly like it did before the shortener existed.
 */
export async function shortenUrl(longUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(SHORTEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: longUrl }),
      signal: controller.signal,
    });
    if (!response.ok) return longUrl;

    const data = (await response.json()) as { shortUrl?: unknown };
    return typeof data.shortUrl === 'string' && data.shortUrl.startsWith('http') ? data.shortUrl : longUrl;
  } catch {
    return longUrl;
  } finally {
    clearTimeout(timeout);
  }
}
