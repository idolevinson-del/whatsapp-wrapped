import { beforeEach, describe, expect, it, vi } from 'vitest';

function installFakeLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => void store.clear(),
  });
}

beforeEach(() => {
  vi.resetModules();
  installFakeLocalStorage();
});

describe('shareBonus', () => {
  it('starts at 0 and increases by 1 per redemption', async () => {
    const { getBonusSlots, redeemShareBonus } = await import('./shareBonus');
    expect(getBonusSlots()).toBe(0);
    expect(redeemShareBonus()).toBe(true);
    expect(getBonusSlots()).toBe(1);
    expect(redeemShareBonus()).toBe(true);
    expect(getBonusSlots()).toBe(2);
  });

  it('stops granting new slots at MAX_BONUS_SLOTS and reports no new slot earned', async () => {
    const { getBonusSlots, redeemShareBonus, MAX_BONUS_SLOTS } = await import('./shareBonus');
    for (let i = 0; i < MAX_BONUS_SLOTS; i++) {
      expect(redeemShareBonus()).toBe(true);
    }
    expect(getBonusSlots()).toBe(MAX_BONUS_SLOTS);

    // Further shares don't raise the count, and the caller can tell nothing
    // new happened (so it knows not to show a "thanks!" toast again).
    expect(redeemShareBonus()).toBe(false);
    expect(getBonusSlots()).toBe(MAX_BONUS_SLOTS);
  });
});
