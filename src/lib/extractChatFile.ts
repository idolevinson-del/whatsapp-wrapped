import { strFromU8, unzipSync } from 'fflate';

const TXT_EXTENSION = '.txt';
const ZIP_EXTENSION = '.zip';

export type ExtractResult =
  | { ok: true; text: string }
  | { ok: false; code: 'not-supported' | 'zip-no-chat' };

/**
 * Reads a WhatsApp chat export, accepting either the raw `_chat.txt` file or
 * the `.zip` file WhatsApp shares directly (so users don't have to unzip it
 * themselves, especially on mobile).
 */
export async function extractChatText(file: File): Promise<ExtractResult> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(TXT_EXTENSION)) {
    return { ok: true, text: await file.text() };
  }

  if (lowerName.endsWith(ZIP_EXTENSION)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const entries = unzipSync(bytes);
    const chatEntryName = Object.keys(entries).find((name) => name.toLowerCase().endsWith(TXT_EXTENSION));

    if (!chatEntryName) {
      return { ok: false, code: 'zip-no-chat' };
    }

    return { ok: true, text: strFromU8(entries[chatEntryName]) };
  }

  return { ok: false, code: 'not-supported' };
}
