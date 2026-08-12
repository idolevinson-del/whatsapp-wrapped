// Shared helper for talking to Vercel's KV storage (Upstash Redis under the
// hood) via its REST API — used by both shorten.ts (write) and s/[code].ts
// (read). Leading underscore keeps this out of Vercel's file-based API
// routing (it isn't a route itself, just a module the two route files
// import), the same convention Vercel's own docs use for shared code.
//
// KV_REST_API_URL / KV_REST_API_TOKEN are injected automatically once a KV
// (Upstash) storage integration is connected to this project in the Vercel
// dashboard — no manual key-copying needed, unlike Plausible's setup. Until
// that's done, kvCommand() throws, which both callers already treat as a
// soft failure (shorten.ts falls back to the long URL client-side; the
// redirect route falls back to sending visitors to the app's homepage).

const REST_URL = process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN;

/**
 * Runs a single Redis command through Upstash's REST API (POST a JSON array
 * of `[COMMAND, ...args]` to the base URL). Values go in the JSON body
 * rather than the URL path specifically so long, special-character-heavy
 * values (our share payloads) never hit path-encoding edge cases.
 */
export async function kvCommand(command: (string | number)[]): Promise<unknown> {
  if (!REST_URL || !REST_TOKEN) {
    throw new Error('KV not configured (KV_REST_API_URL / KV_REST_API_TOKEN missing)');
  }

  const response = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`KV request failed: ${response.status}`);
  }

  const data = (await response.json()) as { result: unknown };
  return data.result;
}
