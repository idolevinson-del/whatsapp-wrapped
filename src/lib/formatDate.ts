import type { Language } from '../i18n';

const LOCALES: Record<Language, string> = {
  en: 'en-US',
  he: 'he-IL',
};

/** Formats a timestamp as a short, locale-aware date for the given UI language. */
export function formatDate(timestamp: number, language: Language): string {
  return new Intl.DateTimeFormat(LOCALES[language], { dateStyle: 'medium' }).format(new Date(timestamp));
}
