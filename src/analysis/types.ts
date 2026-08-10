import type { ParsedMessage } from '../parser/types';

export interface CountEntry {
  value: string;
  count: number;
}

export interface SenderCoreStats {
  sender: string;
  messageCount: number;
  wordCount: number;
  mostActiveDay: string;
  mostActiveHour: number;
  mostActiveMonth: string;
  longestStreakDays: number;
  longestGapHours: number;
  topEmojis: CountEntry[];
  topWords: CountEntry[];
}

export interface CoreStats {
  perSender: SenderCoreStats[];
  firstMessage: ParsedMessage;
  lastMessage: ParsedMessage;
}

export interface ConversationGapStats {
  /** Number of times each sender started a new conversation (after a gap > CONVERSATION_GAP_HOURS). */
  conversationStarterCounts: Record<string, number>;
  /** Same counts, expressed as a percentage of all conversation starts. */
  conversationStarterPercent: Record<string, number>;
  /** Average reply time (minutes) per sender, only counting replies within CONVERSATION_GAP_HOURS. */
  avgReplyTimeMinutes: Record<string, number>;
  /** The single largest gap (in hours) between any two consecutive messages in the whole chat. */
  longestSilenceHours: number;
  /** The two messages surrounding the longest silence, if any gap exists. */
  longestSilenceRange: { before: ParsedMessage; after: ParsedMessage } | null;
}

export interface PersonaResult {
  id: string;
  sender: string;
  insightTemplate: string;
  value: number | string;
}

export interface SenderValue {
  sender: string;
  value: number;
}

/**
 * Full per-sender values behind each persona category (not just the winner
 * picked for `PersonaResult`) — powers the "all stats" breakdown page.
 * `mentionedCount` is empty for 1-on-1 chats (name mentions only make sense
 * in groups).
 */
export interface PersonaBreakdown {
  messageCount: SenderValue[];
  wordsPerMessage: SenderValue[];
  emojiCount: SenderValue[];
  conversationStarterCount: SenderValue[];
  streakDays: SenderValue[];
  avgReplyMinutes: SenderValue[];
  nightOwlPercent: SenderValue[];
  earlyBirdPercent: SenderValue[];
  laughsTriggered: SenderValue[];
  mentionedCount: SenderValue[];
}

export interface AnalysisResult {
  coreStats: CoreStats;
  conversationGapStats: ConversationGapStats;
  personas: PersonaResult[];
  personaBreakdown: PersonaBreakdown;
  busiestDay: { date: string; count: number };
  /** Most-used word across the whole chat, stopwords/greetings/fillers excluded. */
  topWord: CountEntry | null;
}
