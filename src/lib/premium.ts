/**
 * Premium unlock: a one-time-purchase license key, validated against
 * LemonSqueezy's public License API and then remembered on this device.
 * Deliberately not an account system — no email/password, no server of our
 * own. The license key itself is the credential; losing it means asking
 * LemonSqueezy to resend the purchase email.
 */

const STORAGE_KEY = 'whatsapp-wrapped:premium';
const LEMONSQUEEZY_VALIDATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/validate';

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
 * Validates a license key against LemonSqueezy and, if valid, remembers it
 * on this device. Called directly from the browser — LemonSqueezy's
 * `licenses/validate` endpoint is designed for exactly this client-side
 * "enter your key" flow and needs no store secret, only the key itself.
 */
export async function activateLicense(rawKey: string): Promise<ActivateResult> {
  const licenseKey = rawKey.trim();
  if (!licenseKey) return { ok: false, reason: 'invalid' };

  try {
    const response = await fetch(LEMONSQUEEZY_VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ license_key: licenseKey }),
    });
    const data = (await response.json()) as { valid?: boolean };
    if (!data.valid) return { ok: false, reason: 'invalid' };

    writeState({ licenseKey, activatedAt: Date.now() });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export function deactivatePremium(): void {
  writeState(null);
}
