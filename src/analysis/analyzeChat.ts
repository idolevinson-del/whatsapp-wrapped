import type { ParsedMessage } from '../parser/types';
import { CONVERSATION_GAP_HOURS } from '../config/analysisConfig';
import { computeCoreStats, computeTopWord } from './coreStats';
import { computeConversationGapStats } from './conversationGaps';
import { computePersonas } from './personas';
import type { AnalysisResult } from './types';

/**
 * Runs the full analysis layer on a set of parsed messages: core stats,
 * conversation gap stats, and persona badges.
 */
function computeBusiestDay(messages: ParsedMessage[]): { date: string; count: number } {
  const counts = new Map<string, number>();
  for (const m of messages) {
    const d = m.timestamp;
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  let maxDate = '';
  let maxCount = 0;
  for (const [date, count] of counts) {
    if (count > maxCount) { maxCount = count; maxDate = date; }
  }
  return { date: maxDate, count: maxCount };
}

/** [day-of-week 0-6][hour-of-day 0-23] message counts, in local time. */
function computeActivityHeatmap(messages: ParsedMessage[]): number[][] {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const m of messages) {
    grid[m.timestamp.getDay()][m.timestamp.getHours()]++;
  }
  return grid;
}

export function analyzeChat(
  messages: ParsedMessage[],
  gapHours: number = CONVERSATION_GAP_HOURS
): AnalysisResult {
  if (messages.length === 0) {
    throw new Error('analyzeChat requires at least one message');
  }

  const coreStats = computeCoreStats(messages);
  const conversationGapStats = computeConversationGapStats(messages, gapHours);
  const { personas, breakdown: personaBreakdown } = computePersonas(messages, coreStats, conversationGapStats);
  const busiestDay = computeBusiestDay(messages);
  const topWord = computeTopWord(messages);
  const activityHeatmap = computeActivityHeatmap(messages);

  return { coreStats, conversationGapStats, personas, personaBreakdown, busiestDay, topWord, activityHeatmap };
}
