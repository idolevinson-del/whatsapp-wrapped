import { stripBidiControls } from './bidi';
import { isMediaPlaceholder } from './mediaPlaceholders';
import { matchMessageHeader, type MessageHeader } from './patterns';
import type { ParsedMessage, ParseResult } from './types';

// Known substrings that appear in WhatsApp system message text (Hebrew + English).
const SYSTEM_TEXT_PATTERNS = [
  'מוצפנות מקצה לקצה',
  'end-to-end encrypted',
  'Messages and calls are end-to-end',
];

// WhatsApp uses these pseudo-sender names for system actions attributed to the
// local user ("you added X", "you were added", etc.) on iPhone exports.
const SYSTEM_SENDER_NAMES = new Set(['את/ה', 'You']);

function buildTimestamp(header: MessageHeader): Date {
  let { hour } = header;
  const { year, month, day, minute, second, ampm } = header;

  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  // Two-digit years: 00-69 -> 2000-2069, 70-99 -> 1970-1999.
  const fullYear = year < 100 ? (year < 70 ? 2000 + year : 1900 + year) : year;

  return new Date(fullYear, month - 1, day, hour, minute, second);
}

/**
 * Parses a raw WhatsApp chat export (.txt) into structured messages.
 * Lines that don't match a "new message" header are appended to the
 * previous message's text (multi-line messages).
 */
export function parseChat(raw: string): ParseResult {
  // Split before stripping so we can detect system messages via the U+200E
  // (LRM) marker WhatsApp places right after ": " in group system messages
  // (e.g. "נדיה פרמיום: ‎הוספת עידו לקבוצה").
  const lines = raw.split(/\r\n|\r|\n/);

  const messages: ParsedMessage[] = [];
  const unmatchedLines: string[] = [];

  for (const line of lines) {
    // Detect WhatsApp system messages before stripping bidi characters.
    // System messages use U+202B (RLE) right after ": ", e.g. join/leave/create.
    // The encryption notice uses U+200F (RLM) and matches known text patterns.
    const isSystemMessage =
      line.includes(': ‫') ||
      line.includes(':‫') ||
      SYSTEM_TEXT_PATTERNS.some((p) => line.includes(p));
    const cleaned = stripBidiControls(line);
    const header = matchMessageHeader(cleaned);

    if (isSystemMessage && header) continue;
    if (header && SYSTEM_SENDER_NAMES.has(stripBidiControls(header.sender).trim())) continue;

    if (header) {
      messages.push({
        timestamp: buildTimestamp(header),
        sender: header.sender.trim(),
        text: header.text,
        isMedia: isMediaPlaceholder(header.text),
      });
      continue;
    }

    const previous = messages[messages.length - 1];
    if (previous) {
      previous.text += '\n' + line;
      previous.isMedia = isMediaPlaceholder(previous.text);
    } else if (line !== '') {
      unmatchedLines.push(line);
    }
  }

  return {
    messages,
    diagnostics: {
      totalLines: lines.length,
      parsedMessages: messages.length,
      unmatchedLines,
    },
  };
}
