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

export interface AnalysisResult {
  coreStats: CoreStats;
  conversationGapStats: ConversationGapStats;
  personas: PersonaResult[];
  busiestDay: { date: string; count: number };
}
