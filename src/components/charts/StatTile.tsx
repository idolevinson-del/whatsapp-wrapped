interface StatTileProps {
  icon: string;
  label: string;
  /** The headline figure — kept short (a number, "21 days", a date). */
  value: string;
  /** Small supporting line under the value, e.g. the exact date range. */
  caption?: string;
  /** Tailwind `from-...via-...to-...` gradient classes, matching the app's card gradients. */
  gradient: string;
}

/** A single KPI tile for the overview grid — one glanceable fact, not a chart. */
export function StatTile({ icon, label, value, caption, gradient }: StatTileProps) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg shadow-black/20`}>
      <span className="text-2xl">{icon}</span>
      <p className="mt-3 text-3xl font-bold leading-none tracking-tight sm:text-4xl">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
      {caption && <p className="mt-1 text-xs text-white/70">{caption}</p>}
    </div>
  );
}
