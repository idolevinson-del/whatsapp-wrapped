interface PieSlice {
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
}

/**
 * Dependency-free pie chart built from a single CSS conic-gradient — no SVG
 * arc math, no charting library. Renders an empty gray ring if every value
 * is zero (e.g. nobody triggered a laugh in this chat).
 */
export function PieChart({ data, size = 112 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return (
      <div
        style={{ width: size, height: size }}
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
      style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
      className="shrink-0 rounded-full"
    />
  );
}
