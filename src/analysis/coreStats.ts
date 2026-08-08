import type { ParsedMessage } from '../parser/types';
import { TOP_EMOJI_COUNT, TOP_WORD_COUNT } from '../config/analysisConfig';
import { countBy, extractEmojis, extractSignificantWords, extractWords, topEntries } from './textUtils';
import type { CoreStats, SenderCoreStats } from './types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function longestStreakDays(messages: ParsedMessage[]): number {
  if (messages.length === 0) return 0;

  const uniqueDays = [...new Set(messages.map((m) => dateKey(m.timestamp)))]
    .map((key) => {
      const [year, month, day] = key.split('-').map(Number);
      return new Date(year, month, day).getTime();
    })
    .sort((a, b) => a - b);

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i] - uniqueDays[i - 1] === ONE_DAY_MS) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function longestGapHours(messages: ParsedMessage[]): number {
  if (messages.length < 2) return 0;

  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  let maxGapMs = 0;

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime();
    maxGapMs = Math.max(maxGapMs, gap);
  }

  return maxGapMs / (1000 * 60 * 60);
}

function mostCommon<T>(items: T[], label: (item: T) => string): string {
  const counts = countBy(items, label);
  let best = '';
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function computeSenderStats(sender: string, messages: ParsedMessage[]): SenderCoreStats {
  const textMessages = messages.filter((m) => !m.isMedia);

  const wordCount = textMessages.reduce((sum, m) => sum + extractWords(m.text).length, 0);

  const emojiCounts = countBy(
    textMessages.flatMap((m) => extractEmojis(m.text)),
    (emoji) => emoji
  );
  const wordFreq = countBy(
    textMessages.flatMap((m) => extractSignificantWords(m.text)),
    (word) => word
  );

  return {
    sender,
    messageCount: messages.length,
    wordCount,
    mostActiveDay: DAY_NAMES[Number(mostCommon(messages, (m) => String(m.timestamp.getDay())))],
    mostActiveHour: Number(mostCommon(messages, (m) => String(m.timestamp.getHours()))),
    mostActiveMonth: MONTH_NAMES[Number(mostCommon(messages, (m) => String(m.timestamp.getMonth())))],
    longestStreakDays: longestStreakDays(messages),
    longestGapHours: longestGapHours(messages),
    topEmojis: topEntries(emojiCounts, TOP_EMOJI_COUNT).map((e) => ({ value: e.value, count: e.count })),
    topWords: topEntries(wordFreq, TOP_WORD_COUNT).map((w) => ({ value: w.value, count: w.count })),
  };
}

export function computeCoreStats(messages: ParsedMessage[]): CoreStats {
  if (messages.length === 0) {
    throw new Error('computeCoreStats requires at least one message');
  }

  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const senders = [...new Set(messages.map((m) => m.sender))];

  return {
    perSender: senders.map((sender) =>
      computeSenderStats(sender, messages.filter((m) => m.sender === sender))
    ),
    firstMessage: sorted[0],
    lastMessage: sorted[sorted.length - 1],
  };
}
