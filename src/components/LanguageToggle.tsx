import { useLanguage } from '../i18n';

export function LanguageToggle() {
  const { language, dictionary, setLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
      className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
    >
      {dictionary.language.switchTo}
    </button>
  );
}
