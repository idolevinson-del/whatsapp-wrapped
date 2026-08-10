import { deflateSync, inflateSync } from 'fflate';
import type { Language } from '../i18n';

/** Compact payload stored in share URLs — raw values only, no formatted text. */
export interface SharePayload {
  v: 1;
  lang: Language;
  p: Array<[string, string, number | string]>; // [personaId, senderFirstName, value]
  d: [string, number]; // ['YYYY-MM-DD', count]
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeSharePayload(payload: SharePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(deflateSync(bytes, { level: 9 }));
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const json = new TextDecoder().decode(inflateSync(fromBase64Url(encoded)));
    const payload = JSON.parse(json) as SharePayload;
    if (payload.v !== 1) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildShareUrl(payload: SharePayload): string {
  return `${window.location.origin}/?share=${encodeSharePayload(payload)}`;
}
