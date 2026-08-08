/**
 * Shared tuning constants for the analysis layer. Keep all "magic numbers"
 * here so they can be adjusted from real chat data without touching logic
 * in src/analysis/.
 */

/**
 * Minimum silence (in hours) that separates one "conversation" from the
 * next. Used by:
 *  - conversationStarter: who sends the first message after a gap this long
 *  - replySpeed: only gaps below this count as a "reply" (otherwise it's a
 *    new conversation, not a response)
 *  - ghosting/longestSilence ignores this threshold entirely - it's always
 *    the single largest gap in the whole chat.
 *
 * Tune per chat type: ~2h for chats with near-instant replies,
 * ~12-24h for chats that are more like daily check-ins.
 */
export const CONVERSATION_GAP_HOURS = 6;

/** Hour range (inclusive start, exclusive end) considered "night owl" hours. */
export const NIGHT_OWL_HOURS: [number, number] = [0, 5];

/** Hour range (inclusive start, exclusive end) considered "early bird" hours. */
export const EARLY_BIRD_HOURS: [number, number] = [5, 9];

/** Number of top emojis / words to keep per sender. */
export const TOP_EMOJI_COUNT = 5;
export const TOP_WORD_COUNT = 10;
