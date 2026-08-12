import { useEffect } from 'react';

// A beat to read the very top of the page before it starts moving, and a
// beat to sit at the bottom before StatsPage's own autoExitMs timer
// advances to the real upload screen — the scroll itself gets whatever's
// left of totalDurationMs.
const START_DELAY_MS = 1500;
const END_PAUSE_MS = 3000;

/**
 * Auto-scrolls the page from top to bottom over `totalDurationMs` — the
 * "sit back, we'll scroll for you" tour for the first-visit auto-shown
 * example (see StatsPage's autoExitMs). A no-op when totalDurationMs is
 * undefined (every other use of StatsPage — real results, history entries,
 * a deliberately-opened "See an example").
 *
 * Cancels itself the instant it detects real touch/wheel input, so it never
 * fights someone who wants to scroll manually — listening for the generic
 * 'scroll' event instead would self-cancel immediately, since our own
 * window.scrollTo calls fire that same event.
 */
export function useAutoScrollTour(totalDurationMs: number | undefined): void {
  useEffect(() => {
    if (!totalDurationMs) return;

    const scrollDurationMs = Math.max(1000, totalDurationMs - START_DELAY_MS - END_PAUSE_MS);
    let raf: number;

    function tick(start: number, now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / scrollDurationMs);
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, maxScroll * t);
      if (t < 1) raf = requestAnimationFrame((n) => tick(start, n));
    }

    const startTimer = setTimeout(() => {
      const start = performance.now();
      raf = requestAnimationFrame((n) => tick(start, n));
    }, START_DELAY_MS);

    function cancelOnUserInput() {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    }

    window.addEventListener('wheel', cancelOnUserInput, { passive: true });
    window.addEventListener('touchmove', cancelOnUserInput, { passive: true });

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', cancelOnUserInput);
      window.removeEventListener('touchmove', cancelOnUserInput);
    };
  }, [totalDurationMs]);
}
