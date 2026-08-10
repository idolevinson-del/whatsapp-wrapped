import { beforeEach, describe, expect, it, vi } from 'vitest';

// chatHistory.ts reads `localStorage` as a bare global (as it does in the
// browser) — Node's test environment doesn't provide one, so a minimal
// in-memory stand-in is installed before the module (and its `isPremium`
// dependency, which also touches localStorage) is imported.
function installFakeLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => void store.clear(),
  });
}

// Minimal shape reviveAnalysis() actually touches when reading history back
// — a bare {} makes getHistory() throw internally and swallow the error,
// silently returning [] and masking what these tests check.
function fakeAnalysis() {
  const message = { timestamp: new Date(), sender: 'A', text: 'hi', isMedia: false };
  return {
    coreStats: { firstMessage: message, lastMessage: message },
    conversationGapStats: { longestSilenceRange: null },
  } as never;
}

beforeEach(() => {
  vi.resetModules();
  installFakeLocalStorage();
});

describe('lifetime analysis cap', () => {
  it('is not bypassed by deleting saved history', async () => {
    const { saveHistoryEntry, deleteHistoryEntry, clearHistory, getHistory, getLifetimeAnalysisCount, FREE_MAX_ENTRIES } =
      await import('./chatHistory');

    const first = saveHistoryEntry('chat-1.txt', fakeAnalysis());
    saveHistoryEntry('chat-2.txt', fakeAnalysis());
    expect(getLifetimeAnalysisCount()).toBe(2);
    expect(getLifetimeAnalysisCount()).toBe(FREE_MAX_ENTRIES);

    // Deleting (or fully clearing) saved entries must not lower the count —
    // that's the exact loophole this cap exists to close.
    deleteHistoryEntry(first.id);
    expect(getHistory()).toHaveLength(1);
    expect(getLifetimeAnalysisCount()).toBe(2);

    clearHistory();
    expect(getHistory()).toHaveLength(0);
    expect(getLifetimeAnalysisCount()).toBe(2);
  });

  it('keeps counting past the free cap', async () => {
    // Not gating this module's own counter on premium — the upload page is
    // what skips the check for premium users. The counter itself just counts.
    const { saveHistoryEntry, getLifetimeAnalysisCount } = await import('./chatHistory');
    saveHistoryEntry('a.txt', fakeAnalysis());
    saveHistoryEntry('b.txt', fakeAnalysis());
    saveHistoryEntry('c.txt', fakeAnalysis());
    expect(getLifetimeAnalysisCount()).toBe(3);
  });
});

describe('getFreeLimit', () => {
  it('starts at the baseline and rises with each share bonus, capped', async () => {
    const { getFreeLimit, FREE_MAX_ENTRIES } = await import('./chatHistory');
    const { redeemShareBonus, MAX_BONUS_SLOTS } = await import('./shareBonus');

    expect(getFreeLimit()).toBe(FREE_MAX_ENTRIES);

    redeemShareBonus();
    expect(getFreeLimit()).toBe(FREE_MAX_ENTRIES + 1);

    for (let i = 0; i < MAX_BONUS_SLOTS + 5; i++) redeemShareBonus();
    expect(getFreeLimit()).toBe(FREE_MAX_ENTRIES + MAX_BONUS_SLOTS);
  });

  it('actually raises what blocks a free user from analyzing another chat', async () => {
    const { saveHistoryEntry, getLifetimeAnalysisCount, getFreeLimit, FREE_MAX_ENTRIES } = await import('./chatHistory');
    const { redeemShareBonus } = await import('./shareBonus');

    saveHistoryEntry('a.txt', fakeAnalysis());
    saveHistoryEntry('b.txt', fakeAnalysis());
    // At the baseline cap — a free user would be blocked here (this mirrors
    // UploadPage's own check: lifetime count >= getFreeLimit()).
    expect(getLifetimeAnalysisCount()).toBe(FREE_MAX_ENTRIES);
    expect(getLifetimeAnalysisCount() >= getFreeLimit()).toBe(true);

    redeemShareBonus();
    // Same lifetime count, but the ceiling moved — no longer blocked.
    expect(getLifetimeAnalysisCount() >= getFreeLimit()).toBe(false);
  });
});
