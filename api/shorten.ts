// A thin server-side proxy to a public URL shortener (is.gd) — the app's
// first and only backend endpoint. Exists purely because a client-side
// fetch() straight to a shortener's API almost always fails: most of these
// "create a short link" endpoints don't send CORS headers (they're built
// for server-to-server or plain browser-navigation use, not XHR/fetch from
// another origin), so the browser blocks the response before our code ever
// sees it. Running the same request from here (server-to-server) sidesteps
// that entirely, and needs no API key, database, or state of our own — the
// mapping lives on is.gd's infrastructure, not ours.
//
// Was TinyURL originally — switched after real shared links turned out to
// land visitors on a TinyURL interstitial ("Redirecting in 10 seconds…")
// before bouncing them here, which defeated the whole point of shortening
// (TinyURL shows that warning page for links created anonymously through
// its free API, as an anti-abuse measure). is.gd redirects straight to the
// destination with no such page, which is the entire reason it was picked.
//
// Only ever shortens links that point back at this same deployment's own
// origin, so this can't be reused as an open URL-shortening proxy for
// anything else.
export const config = { runtime: 'edge' };

const ISGD_API = 'https://is.gd/create.php';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let longUrl: string | undefined;
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url === 'string') longUrl = body.url;
  } catch {
    // longUrl stays undefined — rejected by the validity check below.
  }

  const selfOrigin = new URL(request.url).origin;
  const isSameOrigin = (() => {
    if (!longUrl) return false;
    try {
      return new URL(longUrl).origin === selfOrigin;
    } catch {
      return false;
    }
  })();

  if (!isSameOrigin) {
    return jsonResponse({ error: 'invalid_url' }, 400);
  }

  try {
    // format=simple: the whole response body is just the short URL (or an
    // "Error: ..." message) — same shape TinyURL returned, so the check
    // below (and everything downstream in shortenUrl.ts) needed no changes.
    const isgdResponse = await fetch(`${ISGD_API}?format=simple&url=${encodeURIComponent(longUrl!)}`);
    const text = (await isgdResponse.text()).trim();
    if (!text.startsWith('http')) {
      return jsonResponse({ error: 'shortener_failed' }, 502);
    }
    return jsonResponse({ shortUrl: text }, 200);
  } catch {
    return jsonResponse({ error: 'shortener_unreachable' }, 502);
  }
}
