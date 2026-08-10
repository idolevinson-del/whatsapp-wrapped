import { parseChat } from '../parser';
import { analyzeChat } from '../analysis';
import { parseChatName } from '../lib/parseChatName';
import type { ParsedMessage } from '../parser';
import type { AnalysisOutcome, ProgressStage } from './types';

/**
 * Drops any "message" whose sender is exactly the group's own name. A real
 * WhatsApp group can never send a message itself — every message comes from
 * an actual participant — so a sender matching the group name is always a
 * system notification our text-pattern detection in parseChat.ts didn't
 * recognize (WhatsApp has many such notifications, in every language, and
 * new ones appear with app updates; matching against the group's own name
 * catches all of them structurally instead of chasing each string).
 *
 * Guarded by an actual participant count, not just parseChatName's `isGroup`
 * guess: that guess comes from the filename shape alone (e.g. a "Chat - X"
 * pattern), and at least one real export format uses that same dash shape
 * for ordinary 1-on-1 chats too. Trusting it blindly meant a two-person chat
 * whose filename happened to look "group-shaped" would have every message
 * from the other person silently deleted, because her name matched the
 * (wrongly) inferred "group name". A real group needs 3+ distinct senders by
 * definition — a "group" of one other person doesn't exist — so requiring
 * that here makes the filter self-correcting regardless of what the filename
 * looks like.
 */
export function dropGroupNameAsSender(messages: ParsedMessage[], fileName: string | undefined) {
  if (!fileName) return messages;

  const senders = [...new Set(messages.map((m) => m.sender.trim()))];
  if (senders.length < 3) return messages;

  const { name, isGroup } = parseChatName(fileName, senders);
  if (!isGroup || !name) return messages;

  return messages.filter((m) => m.sender.trim() !== name.trim());
}

/**
 * Runs the parser and analysis pipeline on raw chat text. Pure function so it
 * can be unit tested directly and reused inside the Web Worker.
 */
export function runAnalysis(
  text: string,
  fileName?: string,
  onProgress?: (stage: ProgressStage) => void
): AnalysisOutcome {
  onProgress?.('parsing');
  const { messages: parsedMessages, diagnostics } = parseChat(text);
  const messages = dropGroupNameAsSender(parsedMessages, fileName);

  if (messages.length === 0) {
    return { ok: false, error: { code: 'no-messages' } };
  }

  onProgress?.('analyzing');
  const analysis = analyzeChat(messages);

  return { ok: true, diagnostics, analysis };
}
