import { deflateSync, inflateSync } from 'fflate';
import { firstName } from './names';
import { parseChatName } from './parseChatName';
import type { AnalysisResult } from '../analysis';
import type { Language } from '../i18n';

/**
 * Compact snapshot of everything StatsView renders, carried entirely inside
 * the share URL — there's no backend, so a received link only ever shows
 * what fits here. Short keys keep the (deflated, base64url) URL reasonably
 * sized; per-sender arrays are aligned to `s` (senders) by index.
 */
export interface StatsSharePayload {
  v: 2;
  lang: Language;
  /** Headline name (chat partner / group), if resolvable from the filename. */
  n?: string;
  isGroup?: boolean;
  s: string[]; // senders (first names)
  total: number;
  spanStart: number; // epoch ms
  spanEnd: number;
  busiestDate: string; // 'YYYY-MM-DD'
  busiestCount: number;
  silenceHours?: number;
  silenceBefore?: number; // epoch ms
  silenceAfter?: number;
  pb: {
    mc: number[]; // messageCount
    wpm: number[]; // wordsPerMessage
    ec: number[]; // emojiCount
    csc: number[]; // conversationStarterCount
    sd: number[]; // streakDays
    arm: number[]; // avgReplyMinutes
    lt: number[]; // laughsTriggered
    mnc: number[]; // mentionedCount (empty when not a group)
  };
  /** Per sender, up to 3 [emoji, count] pairs. */
  te: [string, number][][];
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function encodeStatsSharePayload(payload: StatsSharePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(deflateSync(bytes, { level: 9 }));
}

export function decodeStatsSharePayload(encoded: string): StatsSharePayload | null {
  try {
    const json = new TextDecoder().decode(inflateSync(fromBase64Url(encoded)));
    const payload = JSON.parse(json) as StatsSharePayload;
    if (payload.v !== 2) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Builds the payload from a live analysis — the values a share link actually carries. */
export function buildStatsSharePayload(
  analysis: AnalysisResult,
  fileName: string | undefined,
  language: Language
): StatsSharePayload {
  const { coreStats, conversationGapStats, personaBreakdown, busiestDay } = analysis;
  const senders = coreStats.perSender.map((s) => firstName(s.sender));
  const silence = conversationGapStats.longestSilenceRange;

  let name: string | undefined;
  let isGroup: boolean | undefined;
  if (fileName) {
    const parsed = parseChatName(
      fileName,
      coreStats.perSender.map((s) => s.sender)
    );
    if (parsed.name) {
      name = parsed.name;
      isGroup = parsed.isGroup;
    }
  }

  // personaBreakdown arrays may not be in the same sender order as
  // coreStats.perSender — index by sender name to align everything to `senders`.
  function valuesFor(entries: { sender: string; value: number }[]): number[] {
    const bySender = new Map(entries.map((e) => [e.sender, e.value]));
    return coreStats.perSender.map((s) => bySender.get(s.sender) ?? 0);
  }

  return {
    v: 2,
    lang: language,
    n: name,
    isGroup,
    s: senders,
    total: coreStats.perSender.reduce((sum, s) => sum + s.messageCount, 0),
    spanStart: coreStats.firstMessage.timestamp.getTime(),
    spanEnd: coreStats.lastMessage.timestamp.getTime(),
    busiestDate: busiestDay.date,
    busiestCount: busiestDay.count,
    silenceHours: silence ? conversationGapStats.longestSilenceHours : undefined,
    silenceBefore: silence ? silence.before.timestamp.getTime() : undefined,
    silenceAfter: silence ? silence.after.timestamp.getTime() : undefined,
    pb: {
      mc: valuesFor(personaBreakdown.messageCount),
      wpm: valuesFor(personaBreakdown.wordsPerMessage),
      ec: valuesFor(personaBreakdown.emojiCount),
      csc: valuesFor(personaBreakdown.conversationStarterCount),
      sd: valuesFor(personaBreakdown.streakDays),
      arm: valuesFor(personaBreakdown.avgReplyMinutes),
      lt: valuesFor(personaBreakdown.laughsTriggered),
      mnc: personaBreakdown.mentionedCount.length > 0 ? valuesFor(personaBreakdown.mentionedCount) : [],
    },
    te: coreStats.perSender.map((s) => s.topEmojis.slice(0, 3).map((e): [string, number] => [e.value, e.count])),
  };
}

export function buildStatsShareUrl(payload: StatsSharePayload): string {
  return `${window.location.origin}/?stats=${encodeStatsSharePayload(payload)}`;
}
