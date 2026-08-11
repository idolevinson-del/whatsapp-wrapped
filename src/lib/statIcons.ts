/**
 * A small matching emoji shown next to each stat block's title on the
 * results page — purely decorative/thematic, shared between StatsPage and
 * SharedStatsPage so both prefix titles the same way.
 */
export const STAT_ICONS = {
  messageCount: '🗣️',
  emojiCount: '😄',
  topEmojis: '🔝',
  laughsTriggered: '🤡',
  streakDays: '🔥',
  avgReplyMinutes: '⚡',
  conversationStarterCount: '📣',
  wordsPerMessage: '📝',
  mentionedCount: '🌟',
  curseWordCount: '🤬',
} as const;
