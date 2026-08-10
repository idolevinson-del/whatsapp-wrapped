import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';

const SWIPE_THRESHOLD_PX = 50;
/** How long each card stays up before auto-advancing — real Stories UX, not
 * a manual slideshow that stalls if nobody taps. */
const CARD_DURATION_MS = 4500;

/**
 * The active segment's animated fill. Mounting straight at width:100% with a
 * CSS transition wouldn't visibly animate — a transition only fires on a
 * *change* after the initial paint, not on the values present at mount. So
 * this starts at 0% and flips to 100% one frame later, which is what
 * actually triggers the transition. Remounted (via `key`) on every card
 * change so it always restarts from 0%.
 */
function ProgressFill({ durationMs }: { durationMs: number }) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      className="h-full bg-white transition-[width] ease-linear"
      style={{ transitionDuration: `${durationMs}ms`, width: filled ? '100%' : '0%' }}
    />
  );
}

interface StoryViewerProps {
  children: ReactNode[];
  /** Called once, automatically, when the last card's timer runs out — so
   * the reveal always ends up somewhere (e.g. the full stats page) without
   * requiring anyone to tap a button. Manual navigation past the last card
   * (tap/swipe) triggers it immediately instead of waiting out the timer. */
  onComplete?: () => void;
}

export function StoryViewer({ children, onComplete }: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  // Bumped on every mount of the active segment's fill bar so its width
  // transition restarts from 0 — see the progress bar below.
  const [fillKey, setFillKey] = useState(0);
  const total = children.length;
  const touchStartX = useRef<number | null>(null);
  const completedRef = useRef(false);

  function goTo(next: number) {
    if (next >= total) {
      fireComplete();
      return;
    }
    setIndex(Math.max(0, next));
    setFillKey((k) => k + 1);
  }

  function fireComplete() {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }

  // Auto-advance timer for the active card, including the last one (which
  // completes the whole reveal instead of advancing to a next card).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (index === total - 1) fireComplete();
      else goTo(index + 1);
    }, CARD_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') goTo(index + 1);
      else if (event.key === 'ArrowLeft') goTo(Math.max(0, index - 1));
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (deltaX > SWIPE_THRESHOLD_PX) goTo(Math.max(0, index - 1));
    else if (deltaX < -SWIPE_THRESHOLD_PX) goTo(index + 1);
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-3">
        {children.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            {i < index ? (
              <div className="h-full w-full bg-white" />
            ) : i === index ? (
              // key={fillKey} remounts this on every card change, restarting
              // the fill animation from 0%.
              <ProgressFill key={fillKey} durationMs={CARD_DURATION_MS} />
            ) : (
              <div className="h-full w-0 bg-white" />
            )}
          </div>
        ))}
      </div>

      <div className="h-full w-full">
        {children[index]}
      </div>

      {index > 0 && (
        <button
          type="button"
          aria-label="Previous"
          onClick={() => goTo(Math.max(0, index - 1))}
          className="absolute inset-y-0 start-0 z-10 w-1/4 cursor-pointer"
        />
      )}
      <button
        type="button"
        aria-label="Next"
        onClick={() => goTo(index + 1)}
        className="absolute inset-y-0 end-0 z-10 w-1/4 cursor-pointer"
      />
    </div>
  );
}
