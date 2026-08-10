import type { Direction, Language } from './types';

export interface LanguageMeta {
  code: Language;
  /** Always shown in its own language, never translated — a language
   * picker conventionally lists "Español", "Português" etc. regardless of
   * which language is currently active, so someone who can't read the
   * current UI language can still find their own in the list. */
  nativeName: string;
  direction: Direction;
  /** BCP-47 tag used for Intl.DateTimeFormat. */
  intlLocale: string;
}

/**
 * Single source of truth for every supported language's metadata — display
 * name, RTL/LTR, and date-formatting locale. Adding a language is meant to
 * mean: add one entry here, add one dictionary file, done (see
 * LanguageContext.tsx and formatDate.ts, both derived from this list).
 */
export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', nativeName: 'English', direction: 'ltr', intlLocale: 'en-US' },
  { code: 'he', nativeName: 'עברית', direction: 'rtl', intlLocale: 'he-IL' },
  { code: 'es', nativeName: 'Español', direction: 'ltr', intlLocale: 'es-ES' },
  { code: 'pt', nativeName: 'Português', direction: 'ltr', intlLocale: 'pt-BR' },
  { code: 'ar', nativeName: 'العربية', direction: 'rtl', intlLocale: 'ar' },
  { code: 'fr', nativeName: 'Français', direction: 'ltr', intlLocale: 'fr-FR' },
];

const SUPPORTED_CODES: ReadonlySet<string> = new Set(LANGUAGES.map((l) => l.code));

export function isSupportedLanguage(code: string): code is Language {
  return SUPPORTED_CODES.has(code);
}
