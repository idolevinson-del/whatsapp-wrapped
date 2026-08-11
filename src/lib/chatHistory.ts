import { isPremium } from './premium';
import { getBonusSlots } from './shareBonus';
import type { AnalysisResult, PersonaBreakdown } from '../analysis';
import type { ParsedMessage } from '../parser/types';

const STORAGE_KEY = 'whatsapp-wrapped:history';
const LIFETIME_COUNT_KEY = 'whatsapp-wrapped:lifetimeAnalysisCount';

/** Baseline free lifetime cap on real analyses, before any share bonus —
 * see getFreeLimit() for the number that actually gates uploads. */
export const FREE_MAX_ENTRIES = 2;
const PREMIUM_MAX_ENTRIES = 200;

/** The free tier's actual lifetime cap: the baseline plus whatever bonus
 * slots sharing has earned (see lib/shareBonus.ts), capped there too. This
 * is what the upload flow should check against — not FREE_MAX_ENTRIES
 * directly — so earning a bonus slot actually raises the ceiling. */
export function getFreeLimit(): number {
  return FREE_MAX_ENTRIES + getBonusSlots();
}

function maxEntries(): number {
  return isPremium() ? PREMIUM_MAX_ENTRIES : getFreeLimit();
}

/** Total chats ever analyzed on this device, all-time. Deliberately separate
 * from getHistory().length: that count drops when an entry is deleted or
 * history is cleared, which would let a free user reset their "2 free
 * chats" cap indefinitely just by deleting old ones. This counter only ever
 * goes up. (A full browser-data wipe still resets it — there's no server to
 * check against in a no-backend app — but that's a much higher-friction
 * loophole than a delete button inside the app.) */
export function getLifetimeAnalysisCount(): number {
  try {
    return parseInt(localStorage.getItem(LIFETIME_COUNT_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function incrementLifetimeAnalysisCount(): void {
  try {
    localStorage.setItem(LIFETIME_COUNT_KEY, String(getLifetimeAnalysisCount() + 1));
  } catch {
    // localStorage unavailable — the free cap silently becomes best-effort
  }
}

export interface ChatHistoryEntry {
  id: string;
  fileName: string;
  analysis: AnalysisResult;
  savedAt: number;
  lastViewedAt: number;
}

/** Falls back to empty for entries saved before `personaBreakdown` existed
 * (or before curseWordCount was added to it). */
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
  curseWordCount: [],
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

  writeHistory([entry, ...getHistory()].slice(0, maxEntries()));
  incrementLifetimeAnalysisCount();
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
