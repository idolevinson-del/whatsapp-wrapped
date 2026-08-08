import type { AnalysisResult, PersonaBreakdown } from '../analysis';
import type { ParsedMessage } from '../parser/types';

const STORAGE_KEY = 'whatsapp-wrapped:history';

/** Most recent chats kept in history — older entries are dropped. */
const MAX_ENTRIES = 10;

export interface ChatHistoryEntry {
  id: string;
  fileName: string;
  analysis: AnalysisResult;
  savedAt: number;
  lastViewedAt: number;
}

/** Falls back to empty for entries saved before `personaBreakdown` existed. */
const EMPTY_PERSONA_BREAKDOWN: PersonaBreakdown = {
  messageCount: [],
  wordsPerMessage: [],
  emojiCount: [],
  conversationStarterCount: [],
  streakDays: [],
  avgReplyMinutes: [],
  nightOwlPercent: [],
  earlyBirdPercent: [],
  laughsTriggered: [],
  mentionedCount: [],
};

function reviveMessage(message: ParsedMessage): ParsedMessage {
  return { ...message, timestamp: new Date(message.timestamp) };
}

function reviveAnalysis(analysis: AnalysisResult): AnalysisResult {
  const { coreStats, conversationGapStats } = analysis;

  return {
    ...analysis,
    coreStats: {
      ...coreStats,
      firstMessage: reviveMessage(coreStats.firstMessage),
      lastMessage: reviveMessage(coreStats.lastMessage),
    },
    conversationGapStats: {
      ...conversationGapStats,
      longestSilenceRange: conversationGapStats.longestSilenceRange
        ? {
            before: reviveMessage(conversationGapStats.longestSilenceRange.before),
            after: reviveMessage(conversationGapStats.longestSilenceRange.after),
          }
        : null,
    },
    personaBreakdown: analysis.personaBreakdown ?? EMPTY_PERSONA_BREAKDOWN,
    topWord: analysis.topWord ?? null,
  };
}

/** Reads saved chat results from this device. Chat content never leaves localStorage. */
export function getHistory(): ChatHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const entries = JSON.parse(raw) as ChatHistoryEntry[];
    return entries.map((entry) => ({ ...entry, analysis: reviveAnalysis(entry.analysis) }));
  } catch {
    return [];
  }
}

function writeHistory(entries: ChatHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable or full — history just won't persist
  }
}

export function saveHistoryEntry(fileName: string, analysis: AnalysisResult): ChatHistoryEntry {
  const now = Date.now();
  const entry: ChatHistoryEntry = {
    id: crypto.randomUUID(),
    fileName,
    analysis,
    savedAt: now,
    lastViewedAt: now,
  };

  writeHistory([entry, ...getHistory()].slice(0, MAX_ENTRIES));
  return entry;
}

export function touchHistoryEntry(id: string): void {
  writeHistory(getHistory().map((entry) => (entry.id === id ? { ...entry, lastViewedAt: Date.now() } : entry)));
}

export function deleteHistoryEntry(id: string): void {
  writeHistory(getHistory().filter((entry) => entry.id !== id));
}

export function clearHistory(): void {
  writeHistory([]);
}
