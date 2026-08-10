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

beforeEach(() => {
  vi.resetModules();
});

describe('isPremium free preview (?free=1)', () => {
  it('reports premium normally when a license is stored and no override is present', async () => {
    installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(true);
  });

  it('?free=1 forces false even with a real license stored', async () => {
    installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('?free=1');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(false);
  });

  it('?free=1 never writes to storage — the real license survives untouched', async () => {
    const store = installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('?free=1');
    const { isPremium, getLicenseKey } = await import('./premium');
    isPremium();
    expect(store.get('whatsapp-wrapped:premium')).toBeDefined();
    expect(getLicenseKey()).toBe('abc'); // reading the real key still works even mid-preview
  });

  it('a value other than "1" does not trigger the preview', async () => {
    installFakeLocalStorage({ 'whatsapp-wrapped:premium': JSON.stringify({ licenseKey: 'abc', activatedAt: 0 }) });
    installFakeWindow('?free=true');
    const { isPremium } = await import('./premium');
    expect(isPremium()).toBe(true);
  });
});
