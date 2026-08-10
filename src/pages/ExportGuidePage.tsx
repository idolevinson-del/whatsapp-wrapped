import { useState } from 'react';
import { useLanguage } from '../i18n';
import { LanguagePicker } from '../components/LanguagePicker';
import { PhoneGuide } from '../components/exportGuide/PhoneGuide';
import { EXPORT_GUIDE_CONTENT } from '../components/exportGuide/content';

interface ExportGuidePageProps {
  onBack: () => void;
}

export function ExportGuidePage({ onBack }: ExportGuidePageProps) {
  const { dictionary, language } = useLanguage();
  const [platform, setPlatform] = useState<'android' | 'iphone'>('android');

  // The illustrated phone mockup (simulated WhatsApp menu items, dialog
  // text, etc.) is only fully localized for English and Hebrew so far —
  // falls back to English for the newer languages rather than erroring.
  // Everything else on this page (title, intro, captions from the
  // dictionary) still shows in the visitor's actual language.
  const guide = (EXPORT_GUIDE_CONTENT[language] ?? EXPORT_GUIDE_CONTENT.en)[platform];

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 opacity-30 blur-3xl"
        style={{ animationDuration: '6s' }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 opacity-30 blur-3xl"
        style={{ animationDuration: '8s' }}
      />

      <div className="absolute end-4 top-4 z-10">
        <LanguagePicker />
      </div>

      <div className="relative z-0 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            ← {dictionary.exportGuide.backButton}
          </button>

          <h1 className="mt-6 bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            {dictionary.exportGuide.title}
          </h1>
          <p className="mt-2 text-neutral-400">{dictionary.exportGuide.intro}</p>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setPlatform('android')}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                platform === 'android'
                  ? 'border-transparent bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600'
                  : 'border-white/40 hover:bg-white/10'
              }`}
            >
              {dictionary.exportGuide.androidTab}
            </button>
            <button
              type="button"
              onClick={() => setPlatform('iphone')}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                platform === 'iphone'
                  ? 'border-transparent bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600'
                  : 'border-white/40 hover:bg-white/10'
              }`}
            >
              {dictionary.exportGuide.iphoneTab}
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <PhoneGuide
              key={`${language}-${platform}`}
              steps={guide.steps}
              captions={guide.captions}
              contactName={guide.contactName}
              contactSub={guide.contactSub}
              messages={guide.messages}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-start">
            <p className="text-sm font-semibold text-amber-300">{dictionary.exportGuide.withoutMediaTitle}</p>
            <p className="mt-1 text-sm text-white/80">{dictionary.exportGuide.withoutMediaNote}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-start">
            <p className="text-sm font-semibold text-emerald-300">🔒 {dictionary.exportGuide.privacyNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
