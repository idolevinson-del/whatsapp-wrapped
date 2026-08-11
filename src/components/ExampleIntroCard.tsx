import { useEffect } from 'react';
import { useLanguage } from '../i18n';

const AUTO_ADVANCE_MS = 4000;

interface ExampleIntroCardProps {
  onDone: () => void;
}

/**
 * The very first thing a brand-new visitor sees — before anything else.
 * Used to drop straight into the full interactive example results page on
 * first visit, with only a small "Example" badge marking it as a demo —
 * most people never noticed that badge (or the "upload your own chat"
 * button tucked at the bottom) and assumed it was somehow already their
 * own data. This card makes the "just an example" framing impossible to
 * miss *before* that same example page loads (see App.tsx: onDone flows
 * straight into it) — people still get to see what a Wrapped actually
 * looks like, they just can't mistake it for their own results anymore.
 *
 * Auto-advances after AUTO_ADVANCE_MS (with a fillbar progress hint reused
 * from the export guide's auto-advancing steps, see index.css), or the
 * "Continue" button skips ahead immediately.
 */
export function ExampleIntroCard({ onDone }: ExampleIntroCardProps) {
  const { dictionary } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // Auto-advance is armed once on mount — onDone is stable enough for this
    // one-shot timer, and re-arming on every render would keep pushing it out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/5 p-8 text-center">
        <span className="text-5xl">👀</span>
        <h1 className="mt-4 text-2xl font-extrabold">{dictionary.onboarding.introTitle}</h1>
        <p className="mt-3 text-neutral-400">{dictionary.onboarding.introSubtitle}</p>
        <button
          type="button"
          onClick={onDone}
          className="mt-6 w-full cursor-pointer rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 px-5 py-3 text-sm font-semibold text-neutral-950"
        >
          {dictionary.onboarding.introContinue}
        </button>
        <i className="mt-4 block h-1 w-full overflow-hidden rounded-full bg-white/10">
          <b
            className="block h-full rounded-full bg-white/50"
            style={{ animation: `fillbar ${AUTO_ADVANCE_MS}ms linear forwards` }}
          />
        </i>
      </div>
    </div>
  );
}
