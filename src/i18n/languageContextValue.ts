import { createContext } from 'react';
import type { Dictionary, Direction, Language } from './types';

export interface LanguageContextValue {
  language: Language;
  direction: Direction;
  dictionary: Dictionary;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
