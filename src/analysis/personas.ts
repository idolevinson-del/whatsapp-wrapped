import type { ParsedMessage } from '../parser/types';
import { EARLY_BIRD_HOURS, NIGHT_OWL_HOURS } from '../config/analysisConfig';
import { containsLaugh, extractEmojis, extractWords } from './textUtils';
import type { CoreStats, ConversationGapStats, PersonaResult } from './types';

function inHourRange(hour: number, [start, end]: [number, number]): boolean {
  return hour >= start && hour < end;
}

function pickHighest(
  sendersWithValues: { sender: string; value: number }[]
): { sender: string; value: number } | null {
  if (sendersWithValues.length === 0) return null;
  return sendersWithValues.reduce((best, curr) => (curr.value > best.value ? curr : best));
}

function pickLowest(
  sendersWithValues: { sender: string; value: number }[]
): { sender: string; value: number } | null {
  if (sendersWithValues.length === 0) return null;
  return sendersWithValues.reduce((best, curr) => (curr.value < best.value ? curr : best));
}

/** Minimum number of senders for a chat to be treated as a group. */
const GROUP_MIN_SENDERS = 3;

/**
 * Computes up to 10 persona badges, each awarded to a single sender (the one
 * with the highest value for that persona, or lowest for the Ghost). A
 * persona is omitted if no sender has meaningful data for it (e.g. Fastest
 * Replier with no replies at all), and the Ghost only appears for groups of
 * {@link GROUP_MIN_SENDERS} or more.
 */
export function computePersonas(
  messages: ParsedMessage[],
  coreStats: CoreStats,
  gapStats: ConversationGapStats
): PersonaResult[] {
  const senders = coreStats.perSender.map((s) => s.sender);
  const personas: PersonaResult[] = [];

  const byHourRange = (range: [number, number]) =>
    senders.map((sender) => {
      const senderMessages = messages.filter((m) => m.sender === sender);
      const inRange = senderMessages.filter((m) => inHourRange(m.timestamp.getHours(), range)).length;
      const percent = senderMessages.length > 0 ? (inRange / senderMessages.length) * 100 : 0;
      return { sender, value: percent };
    });

  // 1. Night Owl
  const nightOwl = pickHighest(byHourRange(NIGHT_OWL_HOURS).filter((s) => s.value > 0));
  if (nightOwl) {
    personas.push({
      id: 'nightOwl',
      sender: nightOwl.sender,
      insightTemplate: 'persona.nightOwl',
      value: Math.round(nightOwl.value),
    });
  }

  // 2. Early Bird
  const earlyBird = pickHighest(byHourRange(EARLY_BIRD_HOURS).filter((s) => s.value > 0));
  if (earlyBird) {
    personas.push({
      id: 'earlyBird',
      sender: earlyBird.sender,
      insightTemplate: 'persona.earlyBird',
      value: Math.round(earlyBird.value),
    });
  }

  // 3. Fastest Replier
  const replyTimes = Object.entries(gapStats.avgReplyTimeMinutes)
    .filter(([, minutes]) => minutes > 0)
    .map(([sender, minutes]) => ({ sender, minutes }));
  if (replyTimes.length > 0) {
    const fastest = replyTimes.reduce((best, curr) => (curr.minutes < best.minutes ? curr : best));
    personas.push({
      id: 'fastestReplier',
      sender: fastest.sender,
      insightTemplate: 'persona.fastestReplier',
      value: Math.round(fastest.minutes * 10) / 10,
    });
  }

  // 4. The Philosopher (longest average message length, in words)
  const avgLengths = senders.map((sender) => {
    const textMessages = messages.filter((m) => m.sender === sender && !m.isMedia);
    const totalWords = textMessages.reduce((sum, m) => sum + extractWords(m.text).length, 0);
    const avg = textMessages.length > 0 ? totalWords / textMessages.length : 0;
    return { sender, value: avg };
  });
  const philosopher = pickHighest(avgLengths.filter((s) => s.value > 0));
  if (philosopher) {
    personas.push({
      id: 'philosopher',
      sender: philosopher.sender,
      insightTemplate: 'persona.philosopher',
      value: Math.round(philosopher.value * 10) / 10,
    });
  }

  // 5. Conversation Starter
  const starters = Object.entries(gapStats.conversationStarterPercent).map(([sender, percent]) => ({
    sender,
    value: percent,
  }));
  const starter = pickHighest(starters.filter((s) => s.value > 0));
  if (starter) {
    personas.push({
      id: 'conversationStarter',
      sender: starter.sender,
      insightTemplate: 'persona.conversationStarter',
      value: Math.round(starter.value),
    });
  }

  // 6. The Streaker (longest streak of consecutive days)
  const streaks = coreStats.perSender.map((s) => ({ sender: s.sender, value: s.longestStreakDays }));
  const streaker = pickHighest(streaks.filter((s) => s.value > 1));
  if (streaker) {
    personas.push({
      id: 'streaker',
      sender: streaker.sender,
      insightTemplate: 'persona.streaker',
      value: streaker.value,
    });
  }

  // 7. Emoji Enthusiast
  const emojiCounts = senders.map((sender) => {
    const total = messages
      .filter((m) => m.sender === sender && !m.isMedia)
      .reduce((sum, m) => sum + extractEmojis(m.text).length, 0);
    return { sender, value: total };
  });
  const emojiEnthusiast = pickHighest(emojiCounts.filter((s) => s.value > 0));
  if (emojiEnthusiast) {
    personas.push({
      id: 'emojiEnthusiast',
      sender: emojiEnthusiast.sender,
      insightTemplate: 'persona.emojiEnthusiast',
      value: emojiEnthusiast.value,
    });
  }

  // 8. Chatterbox (most messages overall)
  const messageCounts = coreStats.perSender.map((s) => ({ sender: s.sender, value: s.messageCount }));
  const chatterbox = pickHighest(messageCounts.filter((s) => s.value > 0));
  if (chatterbox) {
    personas.push({
      id: 'chatterbox',
      sender: chatterbox.sender,
      insightTemplate: 'persona.chatterbox',
      value: chatterbox.value,
    });
  }

  // 9. Comedian (triggers the most laughter in the reply that follows)
  const laughTriggers = senders.map((sender) => {
    let count = 0;
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].sender === sender && !messages[i].isMedia) {
        const next = messages[i + 1];
        if (next.sender !== sender && !next.isMedia && containsLaugh(next.text)) {
          count++;
        }
      }
    }
    return { sender, value: count };
  });
  const comedian = pickHighest(laughTriggers.filter((s) => s.value > 0));
  if (comedian) {
    personas.push({
      id: 'comedian',
      sender: comedian.sender,
      insightTemplate: 'persona.comedian',
      value: comedian.value,
    });
  }

  // 10. Most Mentioned — groups only (name mentions only make sense with 3+ people)
  if (senders.length >= GROUP_MIN_SENDERS) {
    const mentionCounts = senders.map((sender) => {
      const nameParts = sender
        .trim()
        .split(/\s+/)
        .map((part) => part.toLowerCase())
        .filter((part) => part.length > 1);
      const count =
        nameParts.length > 0
          ? messages
              .filter((m) => m.sender !== sender && !m.isMedia)
              .reduce(
                (sum, m) => sum + extractWords(m.text).filter((w) => nameParts.includes(w.toLowerCase())).length,
                0
              )
          : 0;
      return { sender, value: count };
    });
    const mostMentioned = pickHighest(mentionCounts.filter((s) => s.value > 0));
    if (mostMentioned) {
      personas.push({
        id: 'mostMentioned',
        sender: mostMentioned.sender,
        insightTemplate: 'persona.mostMentioned',
        value: mostMentioned.value,
      });
    }
  }

  // 11. Ghost (groups only: sent the fewest messages)
  if (senders.length >= GROUP_MIN_SENDERS) {
    const ghost = pickLowest(messageCounts);
    if (ghost) {
      personas.push({
        id: 'ghost',
        sender: ghost.sender,
        insightTemplate: 'persona.ghost',
        value: ghost.value,
      });
    }
  }

  return personas;
}
