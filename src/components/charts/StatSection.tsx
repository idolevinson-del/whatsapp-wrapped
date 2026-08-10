import { PieChart } from './PieChart';
import { LockedOverlay } from '../LockedOverlay';

interface StatEntry {
  sender: string;
  value: number;
  color: string;
}

interface StatSectionProps {
  title: string;
  /** 'pie' for counts that sum to a whole (messages, emojis, laughs...);
   * 'bar' for rates/rankings that don't (reply speed, streak days, %...). */
  kind: 'pie' | 'bar';
  entries: StatEntry[];
  /** Appended after the number, e.g. '%' or a translated " min"/" days". */
  valueSuffix?: string;
  /** When true, blurs and locks only the data below the title — the title
   * itself always stays readable, so a free visitor knows what they'd be
   * unlocking before deciding to pay for it. */
  locked?: boolean;
  onOpenPremium?: () => void;
  lockLabel?: string;
}

export function StatSection({ title, kind, entries, valueSuffix = '', locked, onOpenPremium, lockLabel }: StatSectionProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(1, ...sorted.map((e) => e.value));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">{title}</h3>

      <div className="relative mt-4 overflow-hidden rounded-xl">
        <div
          className={locked ? 'flex items-center gap-5 blur-2xl pointer-events-none select-none' : 'flex items-center gap-5'}
          aria-hidden={locked || undefined}
        >
          {kind === 'pie' && (
            <PieChart data={sorted.map((e) => ({ value: e.value, color: e.color }))} />
          )}

          <ul className="flex-1 space-y-2.5">
            {sorted.map((entry) => (
              <li key={entry.sender} className="text-start">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate">{entry.sender}</span>
                  </span>
                  <span className="shrink-0 font-mono text-white/80">
                    {entry.value}
                    {valueSuffix}
                  </span>
                </div>
                {kind === 'bar' && (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(entry.value / maxValue) * 100}%`, backgroundColor: entry.color }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        {locked && onOpenPremium && lockLabel && <LockedOverlay onOpenPremium={onOpenPremium} label={lockLabel} />}
      </div>
    </div>
  );
}
