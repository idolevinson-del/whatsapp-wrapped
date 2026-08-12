import { useEffect, useRef, useState } from 'react';

/**
 * True once the attached element has scrolled into view — and stays true
 * forever after. Entrance animations (bar fills, count-ups, the pie chart's
 * reveal) should only ever play once, not replay every time a block gets
 * scrolled off-screen and back, so this deliberately disconnects the
 * observer on the first hit instead of tracking in/out on every crossing.
 *
 * `rootMargin`'s negative bottom value means a block only counts as "in
 * view" once it's meaningfully on screen (not the instant its very top
 * pixel appears at the bottom edge) — it also means anything already on
 * screen at mount reports `inView` on IntersectionObserver's first
 * (synchronous-ish) callback, so above-the-fold content still animates
 * immediately on load exactly like before this hook existed; only content
 * that starts off-screen gets the new scroll-triggered behavior.
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px'): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  // No IO support (very old browser / some test environments) — start
  // already "in view" rather than never animating at all. Decided in the
  // initializer, not inside the effect below, so there's no synchronous
  // setState-in-effect render cascade for that fallback path.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView];
}
