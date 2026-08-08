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
