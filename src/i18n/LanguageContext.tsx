import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { he } from './he';
import { es } from './es';
import { pt } from './pt';
import { ar } from './ar';
import { fr } from './fr';
import { LanguageContext, type LanguageContextValue } from './languageContextValue';
import { LANGUAGES, isSupportedLanguage } from './languages';
import type { Dictionary, Direction, Language } from './types';

const DICTIONARIES: Record<Language, Dictionary> = { en, he, es, pt, ar, fr };
const DIRECTIONS: Record<Language, Direction> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.direction])
) as Record<Language, Direction>;
const STORAGE_KEY = 'whatsapp-wrapped-language';

/** Matches the browser's preferred languages against what's supported here
 * — "pt-BR" and plain "pt" both resolve to our 'pt' dictionary. Falls back
 * to English when nothing in the visitor's list is supported yet. */
function detectBrowserLanguage(): Language {
  const preferences = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const preference of preferences) {
    const base = preference.slice(0, 2).toLowerCase();
    if (isSupportedLanguage(base)) return base;
  }
  return 'en';
}

function detectInitialLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isSupportedLanguage(stored)) return stored;
  // No explicit choice remembered yet — a first-time visitor gets whatever
  // their browser is set to (if supported) instead of always defaulting to
  // English, so more of the world lands on a page they can actually read.
  return detectBrowserLanguage();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(detectInitialLanguage);
  const direction = DIRECTIONS[language];
  const dictionary = DICTIONARIES[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language, direction]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, direction, dictionary, setLanguage }),
    [language, direction, dictionary]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
