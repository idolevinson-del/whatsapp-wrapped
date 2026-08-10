/**
 * "Share to unlock one more" — a growth lever for the free tier: sharing a
 * result raises the free lifetime chat-check cap by one, up to a cap of its
 * own. No backend, so this is honor-system (there's no way to verify the
 * share actually reached anyone) — same tradeoff every client-only reward-
 * for-sharing mechanic makes, and a low-stakes one here since the reward is
 * "one more free analysis," not money.
 */

const STORAGE_KEY = 'whatsapp-wrapped:shareBonusSlots';

/** Caps the incentive so someone can't grind the share button for an
 * unlimited free tier — a few genuine shares are rewarded, repeatedly
 * mashing the button past that isn't. */
export const MAX_BONUS_SLOTS = 3;

export function getBonusSlots(): number {
  try {
    const raw = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) || 0;
    return Math.min(MAX_BONUS_SLOTS, Math.max(0, raw));
  } catch {
    return 0;
  }
}

/**
 * Grants one more free slot for sharing, if the cap hasn't been reached yet.
 * Returns true when a new slot was actually granted, so the caller can show
 * a "thanks, one more unlocked!" confirmation only when something really
 * changed — not on the 4th, 5th, ... share once already at the cap.
 */
export function redeemShareBonus(): boolean {
  const current = getBonusSlots();
  if (current >= MAX_BONUS_SLOTS) return false;
  try {
    localStorage.setItem(STORAGE_KEY, String(current + 1));
    return true;
  } catch {
    return false;
  }
}
