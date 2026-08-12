import { useEffect, useState } from 'react';
import { PieChart } from './PieChart';
import { StatEntryRow } from './StatEntryRow';
import { LockedOverlay } from '../LockedOverlay';
import { InfoTooltip } from '../InfoTooltip';
import { useInView } from '../../lib/useInView';

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
  /** Plain-language explanation of how this stat is calculated, shown via
   * an ⓘ next to the title. */
  infoText?: string;
}

export function StatSection({
  title,
  kind,
  entries,
  valueSuffix = '',
  locked,
  onOpenPremium,
  lockLabel,
  infoText,
}: StatSectionProps) {
  // The whole card fades/rises in the moment it scrolls into view, and the
  // chart inside it (pie reveal, bar fill, count-up) only starts animating
  // at that same moment — previously everything animated on page mount, so
  // anything below the fold had already finished animating long before
  // anyone scrolled down to see it. Cards already on screen at mount still
  // animate immediately, same as before (see useInView's doc comment).
  const [cardRef, inView] = useInView<HTMLDivElement>();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const raf = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(1, ...sorted.map((e) => e.value));

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
        <div
          className={locked ? 'flex items-center gap-5 blur-2xl pointer-events-none select-none' : 'flex items-center gap-5'}
          aria-hidden={locked || undefined}
        >
          {kind === 'pie' && (
            <PieChart data={sorted.map((e) => ({ value: e.value, color: e.color }))} active={animateIn} />
          )}

          <ul className="flex-1 space-y-2.5">
            {sorted.map((entry, i) => (
              <StatEntryRow
                key={entry.sender}
                sender={entry.sender}
                value={entry.value}
                color={entry.color}
                valueSuffix={valueSuffix}
                kind={kind}
                widthPercent={(entry.value / maxValue) * 100}
                animateIn={animateIn}
                delayMs={i * 80}
              />
            ))}
          </ul>
        </div>
        {locked && onOpenPremium && lockLabel && <LockedOverlay onOpenPremium={onOpenPremium} label={lockLabel} />}
      </div>
    </div>
  );
}
