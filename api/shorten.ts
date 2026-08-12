// The app's URL shortener — self-hosted on our own domain instead of
// proxying to a public third-party shortener (TinyURL, then is.gd, both
// tried and dropped). Both of those showed an interstitial "redirecting…"
// page before finally forwarding to us — a well-known anti-abuse measure
// public shorteners apply to anonymously-created links, and it made shared
// results feel slower and less trustworthy, the exact opposite of the
// point. Redirecting from our own domain (api/s/[code].ts) means there is
// no other site in the middle at all: the short link IS us.
//
// Storage is a tiny Vercel KV (Upstash Redis) key/value pair, code -> long
// URL — see _kv.ts. Still needs no account/database of our own beyond
// clicking "connect" on a KV storage integration in the Vercel dashboard.
export const config = { runtime: 'edge' };

import { kvCommand } from './_kv';

const CODE_LENGTH = 7;
const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// A year is generous for a "share your results" link while still bounding
// how long an abandoned/never-clicked code sits in storage.
const TTL_SECONDS = 60 * 60 * 24 * 365;
const MAX_COLLISION_RETRIES = 5;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function randomCode(length = CODE_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // Slight modulo bias (256 isn't a multiple of 62) — irrelevant here, this
  // is a short-link code, not a security token.
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
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
    // SET ... NX only writes if the code doesn't already exist — at 62^7
    // possible codes a collision is astronomically unlikely, but retrying
    // a few times instead of assuming it never happens costs nothing.
    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const code = randomCode();
      const result = await kvCommand(['SET', `short:${code}`, longUrl!, 'EX', TTL_SECONDS, 'NX']);
      if (result === 'OK') {
        return jsonResponse({ shortUrl: `${selfOrigin}/api/s/${code}` }, 200);
      }
    }
    return jsonResponse({ error: 'shortener_failed' }, 502);
  } catch {
    // Most commonly: KV isn't connected to this project yet. The client
    // treats this exactly like any other shortening failure and silently
    // shares the original long URL instead — see shortenUrl.ts.
    return jsonResponse({ error: 'shortener_unreachable' }, 502);
  }
}
