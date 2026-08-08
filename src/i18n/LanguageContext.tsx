import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { he } from './he';
import { LanguageContext, type LanguageContextValue } from './languageContextValue';
import type { Dictionary, Direction, Language } from './types';

const DICTIONARIES: Record<Language, Dictionary> = { en, he };
const DIRECTIONS: Record<Language, Direction> = { en: 'ltr', he: 'rtl' };
const STORAGE_KEY = 'whatsapp-wrapped-language';

function detectInitialLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'he') return stored;
  return 'en';
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
