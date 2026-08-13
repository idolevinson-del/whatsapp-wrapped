import { useEffect, useState } from 'react';

interface PieSlice {
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
  /** False holds the reveal at its clipped/scaled-down start state instead
   * of animating in on mount — StatSection uses this to gate the reveal
   * until the chart has actually scrolled into view. Defaults to true so
   * every other caller keeps today's mount-triggered behavior unchanged. */
  active?: boolean;
}

// A bigger, softer drop shadow (two layers: a tight contact shadow plus a
// wider ambient one) so the disc reads as floating above the card, plus a
// stronger inset highlight/shadow ring for a beveled edge. Shared by both
// the real chart and its zero-data placeholder so the two match.
const DEPTH_SHADOW =
  '0 16px 32px -12px rgba(0,0,0,0.65), 0 6px 14px -6px rgba(0,0,0,0.5), inset 0 3px 5px rgba(255,255,255,0.32), inset 0 -5px 10px rgba(0,0,0,0.45)';

// A soft highlight near the upper-left plus a darker shade near the
// lower-right, layered on top of the flat conic-gradient slices — turns
// what would otherwise read as a flat colored disc into something closer
// to a lit glass marble, without touching the slice colors' own legibility
// (both fade to fully transparent well before the disc's edge).
const GLOSS =
  'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.45), rgba(255,255,255,0) 45%), ' +
  'radial-gradient(circle at 70% 76%, rgba(0,0,0,0.3), rgba(0,0,0,0) 55%)';

/**
 * Dependency-free pie chart built from a single CSS conic-gradient — no SVG
 * arc math, no charting library. Renders a placeholder ring (styled to
 * match the real chart, not a flat default circle) if every value is zero
 * (e.g. nobody triggered a laugh in this chat).
 *
 * Reveals itself with a grow-from-center animation on mount instead of
 * popping in fully drawn — the "numbers/graphs climbing in" reveal beat
 * this app leans on elsewhere (see useCountUp).
 */
export function PieChart({ data, size = 132, active = true }: PieChartProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!active) return;
    // Starts clipped/scaled down; flipping this one frame after becoming
    // active lets the CSS transition actually run instead of jumping
    // straight to its end state.
    const raf = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          // Same gloss treatment as the real chart, over a flat near-
          // transparent fill (the shorthand's trailing color) instead of
          // Tailwind's bg-white/5 — kept inline so the two share one
          // background declaration rather than fighting each other.
          background: `${GLOSS}, rgba(255,255,255,0.05)`,
          boxShadow: DEPTH_SHADOW,
          transform: animateIn ? 'scale(1)' : 'scale(0.6)',
          opacity: animateIn ? 1 : 0,
          transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease-out',
        }}
        className="flex shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-white/40"
      >
        —
      </div>
    );
  }

  const slices = data.filter((d) => d.value > 0);
  const stops = slices
    .map((d, i) => {
      const before = slices.slice(0, i).reduce((sum, s) => sum + s.value, 0);
      const start = (before / total) * 360;
      const end = ((before + d.value) / total) * 360;
      return `${d.color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <div
      role="img"
      style={{
        width: size,
        height: size,
        background: `${GLOSS}, conic-gradient(${stops})`,
        boxShadow: DEPTH_SHADOW,
        // Pixel-based (not %) so the reveal always lands exactly on the
        // chart's own edge regardless of clip-path's percentage reference.
        clipPath: animateIn ? `circle(${size / 2}px at 50% 50%)` : 'circle(0px at 50% 50%)',
        transition: 'clip-path 700ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className="shrink-0 rounded-full"
    />
  );
}
