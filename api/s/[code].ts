// The redirect half of the self-hosted shortener (see ../shorten.ts for why
// this exists instead of proxying to a public shortener). A short link
// looks like /api/s/AbC1234. Vercel also mirrors a matched [code] bracket
// segment into the URL's query string (like its Node serverless functions
// do), but that's read here only as a fallback — parsing the last path
// segment directly is what actually decides the code, since it doesn't
// depend on that mirroring behavior at all.
export const config = { runtime: 'edge' };

import { kvCommand } from '../_kv';

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const homepage = url.origin;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const pathSegments = url.pathname.split('/').filter(Boolean);
  const codeFromPath = pathSegments[pathSegments.length - 1];
  const code = codeFromPath && codeFromPath !== 's' ? codeFromPath : url.searchParams.get('code');
  if (!code) {
    return Response.redirect(homepage, 302);
  }

  try {
    const longUrl = await kvCommand(['GET', `short:${code}`]);
    if (typeof longUrl === 'string' && longUrl) {
      return Response.redirect(longUrl, 302);
    }
  } catch {
    // KV unreachable/not configured — fall through to the same safe
    // default as an unknown code, below.
  }

  // Unknown or expired code: land on the app itself rather than a dead end
  // (e.g. someone still holding a very old shortened link after its TTL).
  return Response.redirect(homepage, 302);
}
