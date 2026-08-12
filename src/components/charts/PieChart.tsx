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

// Outer drop shadow + an inset highlight/shadow ring, so the disc reads as
// a lit sphere instead of a flat conic-gradient tile. Shared by both the
// real chart and its zero-data placeholder so the two match.
const DEPTH_SHADOW =
  '0 6px 14px -4px rgba(0,0,0,0.55), inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.35)';

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
export function PieChart({ data, size = 112, active = true }: PieChartProps) {
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
          boxShadow: DEPTH_SHADOW,
          transform: animateIn ? 'scale(1)' : 'scale(0.6)',
          opacity: animateIn ? 1 : 0,
          transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease-out',
        }}
        className="flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/40"
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
        background: `conic-gradient(${stops})`,
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
