// WhatsApp's placeholder text for omitted media, across languages/platforms.
// Matched against the full (trimmed, lowercased) message text.
const MEDIA_PLACEHOLDERS = new Set([
  // English (Android/iPhone)
  '<media omitted>',
  'image omitted',
  'video omitted',
  'audio omitted',
  'gif omitted',
  'sticker omitted',
  'document omitted',
  'contact card omitted',
  // Hebrew (iPhone)
  'התמונה הושמטה',
  'סרטון הווידאו הושמט',
  'ההודעה הקולית הושמטה',
  'gif הושמט',
  'המדבקה הושמטה',
  'המסמך הושמט',
  'כרטיס איש הקשר הושמט',
]);

export function isMediaPlaceholder(text: string): boolean {
  return MEDIA_PLACEHOLDERS.has(text.trim().toLowerCase());
}

// The subset of MEDIA_PLACEHOLDERS that specifically means "voice message"
// (as opposed to a photo, video, sticker, etc.) — used for the "Voice
// Message King" stat. There's no message-duration data available here: a
// text export never includes it, and even a "with media" .zip export's
// actual audio files are never read by the parser (only the .txt entry is
// extracted, see lib/extractChatFile.ts) — so this can only ever count
// voice notes, not total recording time.
const VOICE_MESSAGE_PLACEHOLDERS = new Set(['audio omitted', 'ההודעה הקולית הושמטה']);

export function isVoiceMessagePlaceholder(text: string): boolean {
  return VOICE_MESSAGE_PLACEHOLDERS.has(text.trim().toLowerCase());
}
