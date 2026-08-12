import { LockedOverlay } from '../LockedOverlay';
import { InfoTooltip } from '../InfoTooltip';
import { useInView } from '../../lib/useInView';

interface TopEmojisRow {
  sender: string;
  color: string;
  emojis: { value: string; count: number }[];
}

interface TopEmojisSectionProps {
  title: string;
  rows: TopEmojisRow[];
  locked?: boolean;
  onOpenPremium?: () => void;
  lockLabel?: string;
  infoText?: string;
}

/** The one chart-like block that isn't built from StatSection (its rows are
 * a fixed-width emoji list, not a pie/bar entry) — its own component (rather
 * than inline in StatsView's block map) purely so it can call useInView,
 * which — like every hook — can't be called from inside a .map() callback. */
export function TopEmojisSection({ title, rows, locked, onOpenPremium, lockLabel, infoText }: TopEmojisSectionProps) {
  const [cardRef, inView] = useInView<HTMLDivElement>();

  if (rows.length === 0) return null;

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100"
      style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(28px)' }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
        {title}
        {infoText && <InfoTooltip text={infoText} />}
      </h3>
      <div className="relative mt-4 overflow-hidden rounded-xl">
        <ul
          className={locked ? 'space-y-2.5 blur-2xl pointer-events-none select-none' : 'space-y-2.5'}
          aria-hidden={locked || undefined}
        >
          {rows.map((row) => (
            <li key={row.sender} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.sender}</span>
              </span>
              <span className="flex shrink-0 gap-3 font-mono text-white/80">
                {row.emojis.length > 0 ? (
                  row.emojis.map((e) => (
                    <span key={e.value}>
                      {e.value} <span className="text-white/50">{e.count}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-white/40">—</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {locked && onOpenPremium && lockLabel && <LockedOverlay onOpenPremium={onOpenPremium} label={lockLabel} />}
      </div>
    </div>
  );
}
