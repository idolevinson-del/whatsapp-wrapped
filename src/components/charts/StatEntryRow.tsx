import { useCountUp } from '../../lib/useCountUp';

interface StatEntryRowProps {
  sender: string;
  value: number;
  color: string;
  valueSuffix: string;
  kind: 'pie' | 'bar';
  /** Target bar fill, 0-100 — only used for kind 'bar'. */
  widthPercent: number;
  /** False until the parent's mount-triggering rAF has fired — the bar
   * fill transitions from 0 to widthPercent the instant this flips true. */
  animateIn: boolean;
  /** Stagger so rows fill in one after another instead of all at once. */
  delayMs: number;
}

/** One sender's row within a StatSection — its own component (rather than
 * inline in a .map()) purely so useCountUp can be called once per row. */
export function StatEntryRow({ sender, value, color, valueSuffix, kind, widthPercent, animateIn, delayMs }: StatEntryRowProps) {
  const animatedValue = useCountUp(value);

  return (
    <li className="text-start">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-medium">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: '0 1px 2px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.4)' }}
          />
          <span className="truncate">{sender}</span>
        </span>
        <span className="shrink-0 font-mono text-white/80">
          {animatedValue}
          {valueSuffix}
        </span>
      </div>
      {kind === 'bar' && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: animateIn ? `${widthPercent}%` : '0%',
              transitionDelay: `${delayMs}ms`,
              backgroundColor: color,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      )}
    </li>
  );
}
