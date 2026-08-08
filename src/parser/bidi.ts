// Unicode bidirectional control characters that show up in WhatsApp exports
// (especially Hebrew/Arabic chats): LRM (U+200E), RLM (U+200F),
// embeddings/overrides (U+202A-U+202E), isolates (U+2066-U+2069).
const BIDI_CONTROL_CHARS = /[‎‏‪-‮⁦-⁩]/g;

export function stripBidiControls(text: string): string {
  return text.replace(BIDI_CONTROL_CHARS, '');
}
