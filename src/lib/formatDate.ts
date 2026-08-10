import { LANGUAGES } from '../i18n/languages';
import type { Language } from '../i18n';

const LOCALES: Record<Language, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.intlLocale])
) as Record<Language, string>;

/** Formats a timestamp as a short, locale-aware date for the given UI language. */
export function formatDate(timestamp: number, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], { dateStyle: 'medium' }).format(new Date(timestamp));
}
