import { beforeEach, describe, expect, it, vi } from 'vitest';

function installFakeLocalStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => void store.clear(),
  });
  return store;
}

function installFakeWindow(search: string) {
  vi.stubGlobal('window', { location: { search } });
}

/** These tests are about the free-preview mechanic, which is only
 * meaningful while the paywall itself is actually on — mock PREMIUM_ENABLED
 * to true regardless of its real current value in premiumConfig.ts (see the
 * "paywall switched off" describe block below for that state instead), so
 * this suite keeps testing the same thing whether or not premium happens to
 * be live right now. */
function mockPremiumEnabled(enabled: boolean) {
  vi.doMock('../config/premiumConfig', () => ({
    PREMIUM_ENABLED: enabled,
    CHECKOUT_URL: 'https://example.com',
    GUMROAD_PRODUCT_ID: 'test-product-id',
  }));
}

beforeEach(() => {
  vi.resetModules();
});

describe('isPremium free preview (?free=1)', () => {
  it('reports premium normally when a license is stored and no override is present', async () => {
    mockPremiumEnabled(true);
    installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(true);
  });

  it('?free=1 forces false even with a real license stored', async () => {
    mockPremiumEnabled(true);
    installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('?free=1');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(false);
  });

  it('?free=1 never writes to storage — the real license survives untouched', async () => {
    mockPremiumEnabled(true);
    const store = installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('?free=1');
    const { isPremium, getLicenseKey } = await import('./premium');
    isPremium();
    expect(store.get('whatsapp-wrapped:premium')).toBeDefined();
    expect(getLicenseKey()).toBe('abc'); // reading the real key still works even mid-preview
  });

  it('a value other than "1" does not trigger the preview', async () => {
    mockPremiumEnabled(true);
    installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('?free=true');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(true);
  });
});

describe('isPremium when the paywall is switched off (PREMIUM_ENABLED = false)', () => {
  it('reports premium for everyone, license or not', async () => {
    mockPremiumEnabled(false);
    installFakeLocalStorage({});
    installFakeWindow('');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(true);
  });

  it('ignores ?free=1 — there is no free tier to preview while the paywall is off', async () => {
    mockPremiumEnabled(false);
    installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('?free=1');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(true);
  });
});
