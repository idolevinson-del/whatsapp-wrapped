import { deflateSync, inflateSync } from 'fflate';
import { BinaryReader, BinaryWriter } from './binaryCodec';
import { firstName } from './names';
import { parseChatName } from './parseChatName';
import { LANGUAGES } from '../i18n/languages';
import type { AnalysisResult } from '../analysis';
import type { Language } from '../i18n';

/**
 * The single language byte in the wire format is this array's *index*, not
 * the language code itself (no room for variable-length strings in a
 * hand-packed binary format). LANGUAGES happens to list 'en' first and 'he'
 * second — the only two values any link in the wild was ever encoded with
 * — so this stays byte-for-byte compatible with every already-shared link:
 * old links only ever wrote 0 or 1, and still decode to the same language
 * they always did. New languages are simply appended after, at whatever
 * index they sit at in LANGUAGES — never reorder that array's first two
 * entries, or old links start decoding to the wrong language.
 */
function languageToByte(lang: Language): number {
  const index = LANGUAGES.findIndex((l) => l.code === lang);
  return index === -1 ? 0 : index;
}

function byteToLanguage(byte: number): Language {
  return LANGUAGES[byte]?.code ?? 'en';
}

/**
 * Compact snapshot of everything StatsView renders, carried entirely inside
 * the share URL — there's no backend (by design: nothing about a shared
 * chat ever touches a server), so a received link only ever shows what fits
 * here. Per-sender arrays are aligned to `s` (senders) by index.
 */
export interface StatsSharePayload {
  v: 2 | 3;
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

/** Fixed order for the always-present breakdown categories — encode and
 * decode must agree on this order since the binary format has no field
 * names, only positions. */
const PB_KEYS = ['mc', 'wpm', 'ec', 'csc', 'sd', 'arm', 'lt'] as const;
/** These two categories are already rounded to 1 decimal place upstream
 * (see personas.ts), so they're carried as value*10 to stay lossless while
 * using a plain integer varint. */
const SCALED_BY_10: ReadonlySet<string> = new Set(['wpm', 'arm']);

const DAY_MS = 86_400_000;

/** Both directions only ever look at the Y-M-D components via UTC, so this
 * round-trips a plain calendar-date string exactly regardless of the
 * viewer's timezone — there's no "local midnight" ambiguity to get wrong. */
function dateStringToDayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

function dayIndexToDateString(dayIndex: number): string {
  const date = new Date(dayIndex * DAY_MS);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

/**
 * Binary encoding (v3) — hand-packed instead of JSON, since every byte here
 * shows up as visible text in a shared WhatsApp message. No field names,
 * varints instead of decimal ASCII numbers, and timestamps stored as deltas
 * from spanStart rather than full epoch values.
 */
function encodeBinaryPayload(payload: StatsSharePayload): Uint8Array {
  const w = new BinaryWriter();
  const hasSilence = payload.silenceHours !== undefined && payload.silenceBefore !== undefined && payload.silenceAfter !== undefined;
  const isGroup = Boolean(payload.isGroup);
  // Independent from the `isGroup` display flag (which depends on whether
  // the filename could be parsed) — mnc is populated whenever there's
  // enough senders for mentions to make sense, same as the old JSON format.
  const hasMnc = payload.pb.mnc.length > 0;

  w.writeUint8(3); // version
  w.writeUint8((payload.n ? 1 : 0) | (isGroup ? 2 : 0) | (hasSilence ? 4 : 0) | (hasMnc ? 8 : 0));
  w.writeUint8(languageToByte(payload.lang));
  if (payload.n) w.writeString(payload.n);

  w.writeVarint(payload.s.length);
  for (const sender of payload.s) w.writeString(sender);

  w.writeVarint(payload.total);
  w.writeVarint(payload.spanStart);
  w.writeVarint(payload.spanEnd - payload.spanStart);
  w.writeVarint(dateStringToDayIndex(payload.busiestDate));
  w.writeVarint(payload.busiestCount);

  if (hasSilence) {
    w.writeVarint(Math.round(payload.silenceHours!));
    w.writeVarint(payload.silenceBefore! - payload.spanStart);
    w.writeVarint(payload.silenceAfter! - payload.spanStart);
  }

  for (const key of PB_KEYS) {
    const scale = SCALED_BY_10.has(key) ? 10 : 1;
    for (const value of payload.pb[key]) w.writeVarint(Math.round(value * scale));
  }
  if (hasMnc) {
    for (const value of payload.pb.mnc) w.writeVarint(value);
  }

  for (const emojis of payload.te) {
    w.writeUint8(emojis.length);
    for (const [emoji, count] of emojis) {
      w.writeString(emoji);
      w.writeVarint(count);
    }
  }

  return w.build();
}

function decodeBinaryPayload(bytes: Uint8Array): StatsSharePayload | null {
  const r = new BinaryReader(bytes);
  if (r.readUint8() !== 3) return null;

  const flags = r.readUint8();
  const hasName = (flags & 1) !== 0;
  const isGroup = (flags & 2) !== 0;
  const hasSilence = (flags & 4) !== 0;
  const hasMnc = (flags & 8) !== 0;
  const lang: Language = byteToLanguage(r.readUint8());
  const n = hasName ? r.readString() : undefined;

  const senderCount = r.readVarint();
  const s: string[] = [];
  for (let i = 0; i < senderCount; i++) s.push(r.readString());

  const total = r.readVarint();
  const spanStart = r.readVarint();
  const spanEnd = spanStart + r.readVarint();
  const busiestDate = dayIndexToDateString(r.readVarint());
  const busiestCount = r.readVarint();

  let silenceHours: number | undefined;
  let silenceBefore: number | undefined;
  let silenceAfter: number | undefined;
  if (hasSilence) {
    silenceHours = r.readVarint();
    silenceBefore = spanStart + r.readVarint();
    silenceAfter = spanStart + r.readVarint();
  }

  const pb: Record<(typeof PB_KEYS)[number], number[]> = { mc: [], wpm: [], ec: [], csc: [], sd: [], arm: [], lt: [] };
  for (const key of PB_KEYS) {
    const scale = SCALED_BY_10.has(key) ? 10 : 1;
    for (let i = 0; i < senderCount; i++) pb[key].push(r.readVarint() / scale);
  }
  const mnc: number[] = [];
  if (hasMnc) {
    for (let i = 0; i < senderCount; i++) mnc.push(r.readVarint());
  }

  const te: [string, number][][] = [];
  for (let i = 0; i < senderCount; i++) {
    const emojiCount = r.readUint8();
    const emojis: [string, number][] = [];
    for (let j = 0; j < emojiCount; j++) emojis.push([r.readString(), r.readVarint()]);
    te.push(emojis);
  }

  return {
    v: 3,
    lang,
    n,
    isGroup,
    s,
    total,
    spanStart,
    spanEnd,
    busiestDate,
    busiestCount,
    silenceHours,
    silenceBefore,
    silenceAfter,
    pb: { ...pb, mnc },
    te,
  };
}

export function encodeStatsSharePayload(payload: StatsSharePayload): string {
  return toBase64Url(deflateSync(encodeBinaryPayload(payload), { level: 9 }));
}

export function decodeStatsSharePayload(encoded: string): StatsSharePayload | null {
  try {
    const raw = inflateSync(fromBase64Url(encoded));
    if (raw.length === 0) return null;

    // Legacy v2 links (JSON payload, starts with '{') stay readable so
    // links shared before this format change keep working.
    if (raw[0] === 0x7b) {
      const payload = JSON.parse(new TextDecoder().decode(raw)) as StatsSharePayload;
      return payload.v === 2 ? payload : null;
    }

    return decodeBinaryPayload(raw);
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
    // isGroup is meaningful even when no name could be extracted (e.g. a
    // renamed export file) — it shouldn't be silently lost just because the
    // headline has nothing to show. Previously this whole block was gated
    // on `parsed.name`, so a group chat with an unrecognized filename would
    // reach SharedStatsPage as isGroup: undefined and never show the
    // "mentioned by name" section.
    isGroup = parsed.isGroup;
    if (parsed.name) name = parsed.name;
  }

  // personaBreakdown arrays may not be in the same sender order as
  // coreStats.perSender — index by sender name to align everything to `senders`.
  function valuesFor(entries: { sender: string; value: number }[]): number[] {
    const bySender = new Map(entries.map((e) => [e.sender, e.value]));
    return coreStats.perSender.map((s) => bySender.get(s.sender) ?? 0);
  }

  return {
    v: 3,
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
