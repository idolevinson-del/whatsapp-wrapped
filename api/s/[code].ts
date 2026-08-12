// The redirect half of the self-hosted shortener (see ../shorten.ts for why
// this exists instead of proxying to a public shortener). A short link
// looks like /api/s/AbC1234. Vercel also mirrors a matched [code] bracket
// segment into the URL's query string (like its Node serverless functions
// do), but that's read here only as a fallback — parsing the last path
// segment directly is what actually decides the code, since it doesn't
// depend on that mirroring behavior at all.
export const config = { runtime: 'edge' };

import { kvCommand } from '../_kv';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const homepage = url.origin;
  // ?debug=1 returns what this route actually resolved instead of
  // redirecting — lets a real short link be inspected straight from a
  // phone browser (no dev tools needed) while this is bedded in.
  const debug = url.searchParams.get('debug') === '1';

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const pathSegments = url.pathname.split('/').filter(Boolean);
  const codeFromPath = pathSegments[pathSegments.length - 1];
  const code = codeFromPath && codeFromPath !== 's' ? codeFromPath : url.searchParams.get('code');
  if (!code) {
    if (debug) return jsonResponse({ error: 'no code parsed', pathname: url.pathname }, 200);
    return Response.redirect(homepage, 302);
  }

  try {
    const longUrl = await kvCommand(['GET', `short:${code}`]);
    if (debug) return jsonResponse({ code, pathname: url.pathname, longUrl }, 200);
    if (typeof longUrl === 'string' && longUrl) {
      return Response.redirect(longUrl, 302);
    }
  } catch (err) {
    console.error('s/[code]: kvCommand threw', err);
    if (debug) return jsonResponse({ code, error: String(err) }, 200);
    // KV unreachable/not configured — fall through to the same safe
    // default as an unknown code, below.
  }

  // Unknown or expired code: land on the app itself rather than a dead end
  // (e.g. someone still holding a very old shortened link after its TTL).
  return Response.redirect(homepage, 302);
}
