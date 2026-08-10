import { StoryCard } from '../StoryCard';
import { useLanguage } from '../../i18n';
import { OUTRO_GRADIENT } from './cardStyles';

interface OutroCardProps {
  onReset: () => void;
  /** Overrides the default "Upload another file" label (e.g. for the example Wrapped). */
  restartLabel?: string;
  /** Omitted in the shared-link view, where only the compact share payload is available. */
  onShowStats?: () => void;
}

export function OutroCard({ onReset, restartLabel, onShowStats }: OutroCardProps) {
  const { dictionary } = useLanguage();

  return (
    <StoryCard gradient={OUTRO_GRADIENT}>
      <p className="text-4xl font-extrabold sm:text-5xl">{dictionary.wrapped.outroTitle}</p>
      <p className="mt-4 max-w-md text-lg text-white/90">{dictionary.wrapped.outroSubtitle}</p>
      {onShowStats ? (
        <>
          {/* Full stats is the intended next stop after the reveal, so it
           * gets the prominent button; starting over is the secondary link. */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onShowStats();
            }}
            className="mt-8 cursor-pointer rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 hover:bg-white/90"
          >
            {dictionary.wrapped.viewAllStats}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
            className="mt-3 cursor-pointer text-sm font-medium text-white/80 underline-offset-2 hover:underline"
          >
            {restartLabel ?? dictionary.wrapped.restart}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onReset();
          }}
          className="mt-8 cursor-pointer rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10"
        >
          {restartLabel ?? dictionary.wrapped.restart}
        </button>
      )}
    </StoryCard>
  );
}
