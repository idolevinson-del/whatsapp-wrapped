import type { ParsedMessage } from '../parser/types';
import { CONVERSATION_GAP_HOURS } from '../config/analysisConfig';
import type { ConversationGapStats } from './types';

/**
 * Computes conversation-starter, reply-speed, and ghosting/silence stats.
 *
 * - Conversation starter: whenever the gap since the previous message
 *   exceeds `gapHours`, the sender of the next message is credited as
 *   starting a new conversation. The very first message also counts.
 * - Reply speed: for messages where the next message is from a different
 *   sender AND the gap is <= `gapHours`, the gap counts as a "reply time"
 *   for that sender.
 * - Longest silence: the single largest gap in the whole chat, regardless
 *   of `gapHours`.
 */
export function computeConversationGapStats(
  messages: ParsedMessage[],
  gapHours: number = CONVERSATION_GAP_HOURS
): ConversationGapStats {
  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const conversationStarterCounts: Record<string, number> = {};
  const replyTimeTotals: Record<string, { sumMinutes: number; count: number }> = {};

  let longestSilenceMs = 0;
  let longestSilenceRange: ConversationGapStats['longestSilenceRange'] = null;

  if (sorted.length > 0) {
    conversationStarterCounts[sorted[0].sender] = (conversationStarterCounts[sorted[0].sender] ?? 0) + 1;
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const gapMs = curr.timestamp.getTime() - prev.timestamp.getTime();
    const gapHoursActual = gapMs / (1000 * 60 * 60);

    if (gapMs > longestSilenceMs) {
      longestSilenceMs = gapMs;
      longestSilenceRange = { before: prev, after: curr };
    }

    if (gapHoursActual > gapHours) {
      conversationStarterCounts[curr.sender] = (conversationStarterCounts[curr.sender] ?? 0) + 1;
    } else if (curr.sender !== prev.sender) {
      const totals = replyTimeTotals[curr.sender] ?? { sumMinutes: 0, count: 0 };
      totals.sumMinutes += gapHoursActual * 60;
      totals.count += 1;
      replyTimeTotals[curr.sender] = totals;
    }
  }

  const totalStarters = Object.values(conversationStarterCounts).reduce((sum, n) => sum + n, 0);
  const conversationStarterPercent: Record<string, number> = {};
  for (const [sender, count] of Object.entries(conversationStarterCounts)) {
    conversationStarterPercent[sender] = totalStarters > 0 ? (count / totalStarters) * 100 : 0;
  }

  const avgReplyTimeMinutes: Record<string, number> = {};
  for (const [sender, { sumMinutes, count }] of Object.entries(replyTimeTotals)) {
    avgReplyTimeMinutes[sender] = count > 0 ? sumMinutes / count : 0;
  }

  return {
    conversationStarterCounts,
    conversationStarterPercent,
    avgReplyTimeMinutes,
    longestSilenceHours: longestSilenceMs / (1000 * 60 * 60),
    longestSilenceRange,
  };
}
