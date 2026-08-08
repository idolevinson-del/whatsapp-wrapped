interface StatTileProps {
  icon: string;
  label: string;
  /** The headline figure — kept short (a number, "21 days", a date, a word). */
  value: string;
  /** Small supporting line under the value, e.g. the exact date range. */
  caption?: string;
  /** Tailwind `from-...via-...to-...` gradient classes, matching the app's card gradients. */
  gradient: string;
  /** Spans both grid columns — for a tile whose value isn't a compact number. */
  wide?: boolean;
}

/** A single KPI tile for the overview grid — one glanceable fact, not a chart. */
export function StatTile({ icon, label, value, caption, gradient, wide }: StatTileProps) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg shadow-black/20 ${wide ? 'col-span-2' : ''}`}
    >
      <span className="text-2xl">{icon}</span>
      {/* No truncate: a long date is more useful whole and wrapped than clipped. */}
      <p className="mt-3 text-2xl font-bold leading-tight tracking-tight break-words sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
      {caption && <p className="mt-1 text-xs text-white/70">{caption}</p>}
    </div>
  );
}
