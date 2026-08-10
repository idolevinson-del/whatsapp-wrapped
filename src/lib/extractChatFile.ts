import { strFromU8, unzipSync } from 'fflate';
import { matchMessageHeader } from '../parser/patterns';

const TXT_EXTENSION = '.txt';
const ZIP_EXTENSION = '.zip';
/** ZIP local-file-header signature ("PK\x03\x04") — enough to identify a zip
 * without unzipping it first. */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
/** How many lines to scan when sniffing plain text — a real export has a
 * matching line almost immediately, so this stays cheap even for huge files. */
const SNIFF_LINE_LIMIT = 200;

export type ExtractResult =
  | { ok: true; text: string }
  | { ok: false; code: 'not-supported' | 'zip-no-chat' };

async function looksLikeZip(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, ZIP_MAGIC.length).arrayBuffer());
  return ZIP_MAGIC.every((byte, i) => head[i] === byte);
}

/** True if at least one of the first lines parses as a WhatsApp message
 * header — good enough to tell real chat text apart from an unrelated file
 * without running the full parser. */
function looksLikeChatText(text: string): boolean {
  const lines = text.split('\n', SNIFF_LINE_LIMIT);
  return lines.some((line) => matchMessageHeader(line.trim()) !== null);
}

async function readZipChat(file: File): Promise<ExtractResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(bytes);
  const chatEntryName = Object.keys(entries).find((name) => name.toLowerCase().endsWith(TXT_EXTENSION));

  if (!chatEntryName) {
    return { ok: false, code: 'zip-no-chat' };
  }

  return { ok: true, text: strFromU8(entries[chatEntryName]) };
}

/**
 * Reads a WhatsApp chat export, accepting either the raw `_chat.txt` file or
 * the `.zip` file WhatsApp shares directly (so users don't have to unzip it
 * themselves, especially on mobile).
 *
 * Falls back to sniffing the actual content when the filename's extension
 * is missing or unrecognized. This matters on Android in particular: when
 * there's no "Save to Files" option, people save the export via Drive (or
 * another app) instead, and the file that comes back out of that picker
 * doesn't always keep a clean `.txt`/`.zip` name — the app used to reject
 * those outright even though the content is a perfectly valid export.
 */
export async function extractChatText(file: File): Promise<ExtractResult> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(TXT_EXTENSION)) {
    return { ok: true, text: await file.text() };
  }

  if (lowerName.endsWith(ZIP_EXTENSION)) {
    return readZipChat(file);
  }

  if (await looksLikeZip(file)) {
    return readZipChat(file);
  }

  const text = await file.text();
  if (looksLikeChatText(text)) {
    return { ok: true, text };
  }

  return { ok: false, code: 'not-supported' };
}
