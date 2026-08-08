import { isStopword } from './stopwords';

// Broad emoji match using Unicode property escapes.
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

export function containsLaugh(text: string): boolean {
  return /😂|🤣|חחח|חח+|haha|hehe|lol\b|lmao/i.test(text);
}

export function extractEmojis(text: string): string[] {
  return text.match(EMOJI_REGEX) ?? [];
}

// A "word" is a run of letters (Latin or Hebrew) and digits/apostrophes,
// stripped of surrounding punctuation/emoji.
const WORD_REGEX = /[\p{L}\p{N}']+/gu;

export function extractWords(text: string): string[] {
  return text.match(WORD_REGEX) ?? [];
}

/**
 * Words used for "top words" stats: lowercased, stopwords/pure-numbers/
 * single-characters removed.
 */
export function extractSignificantWords(text: string): string[] {
  return extractWords(text)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 1 && !/^\d+$/.test(w) && !isStopword(w));
}

export function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export function topEntries(counts: Map<string, number>, limit: number): { value: string; count: number }[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}
