import { GUMROAD_PRODUCT_ID } from '../config/premiumConfig';

/**
 * Premium unlock: a one-time-purchase license key, validated against
 * Gumroad's public License Verification API and then remembered on this
 * device. Deliberately not an account system — no email/password, no
 * server of our own. The license key itself is the credential; losing it
 * means asking Gumroad to resend the purchase receipt.
 */

const STORAGE_KEY = 'whatsapp-wrapped:premium';
const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';

interface PremiumState {
  licenseKey: string;
  activatedAt: number;
}

function readState(): PremiumState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PremiumState) : null;
  } catch {
    return null;
  }
}

function writeState(state: PremiumState | null): void {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — the unlock just won't persist across reloads
  }
}

export function isPremium(): boolean {
  return readState() !== null;
}

export function getLicenseKey(): string | null {
  return readState()?.licenseKey ?? null;
}

export type ActivateResult = { ok: true } | { ok: false; reason: 'invalid' | 'network' };

/**
 * Validates a license key against Gumroad and, if valid, remembers it on
 * this device. Called directly from the browser — Gumroad's
 * `licenses/verify` endpoint is designed for exactly this client-side
 * "enter your key" flow and needs no account secret, only the product ID
 * and the key itself.
 *
 * `increment_uses_count: false` so re-checking a key (e.g. a second visit
 * that re-validates) doesn't eat into any per-license activation limit set
 * on the Gumroad product.
 */
export async function activateLicense(rawKey: string): Promise<ActivateResult> {
  const licenseKey = rawKey.trim();
  if (!licenseKey) return { ok: false, reason: 'invalid' };

  try {
    const response = await fetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey,
        increment_uses_count: 'false',
      }),
    });
    const data = (await response.json()) as { success?: boolean };
    if (!data.success) return { ok: false, reason: 'invalid' };

    writeState({ licenseKey, activatedAt: Date.now() });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export function deactivatePremium(): void {
  writeState(null);
}
