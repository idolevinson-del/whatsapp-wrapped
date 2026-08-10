import { useLanguage } from '../i18n';
import { LANGUAGES } from '../i18n/languages';
import type { Language } from '../i18n';

/**
 * A native <select> rather than a custom-built dropdown: full keyboard and
 * screen-reader support, and the OS/browser's own picker UI on mobile (where
 * this app is mostly used), for free. Each option is always shown in its
 * own language ("Español", "العربية"...) regardless of the currently active
 * one, so someone can find their language even if they can't read the
 * current UI text.
 */
export function LanguagePicker() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      aria-label="Language"
      value={language}
      onChange={(event) => setLanguage(event.target.value as Language)}
      className="shrink-0 cursor-pointer rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-white hover:bg-neutral-900 focus:outline-none"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
