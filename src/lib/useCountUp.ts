import { useEffect, useState } from 'react';

/**
 * Animates from 0 up to `target` over `durationMs` (easeOutCubic) —  the
 * "numbers climbing" moment for a big stat, instead of it just appearing
 * pre-filled. Restarts whenever `target` changes (e.g. switching between
 * saved chats). `target` of 0 just stays 0 — nothing to animate.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // No special-case for target <= 0: the tick below naturally lands on 0
    // for every t when target is 0, and setting state only inside the rAF
    // callback (never synchronously in the effect body) avoids a cascading
    // render on mount.
    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
