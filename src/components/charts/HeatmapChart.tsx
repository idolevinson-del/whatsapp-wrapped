import type { Language } from '../../i18n';

interface HeatmapChartProps {
  title: string;
  /** [day-of-week 0-6 (Sun-Sat)][hour-of-day 0-23] message counts. */
  grid: number[][];
  language: Language;
  /** Hex color for the "fully active" cell shade — ties the chart to the
   * selected premium theme instead of a fixed color. */
  color: string;
}

const HOUR_TICKS = [0, 6, 12, 18];

/** 2024-01-07 is a Sunday — used purely as a reference week so
 * Intl.DateTimeFormat can produce a locale-correct short weekday name for
 * each day-of-week index (0 = Sunday, matching Date#getDay()). */
function weekdayLabel(dayIndex: number, language: Language): string {
  const date = new Date(2024, 0, 7 + dayIndex);
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' }).format(date);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** A 7×24 activity grid — day-of-week vs hour-of-day, cell intensity scaled
 * to the busiest single hour in the chat. */
export function HeatmapChart({ title, grid, language, color }: HeatmapChartProps) {
  const max = Math.max(1, ...grid.flat());
  const [r, g, b] = hexToRgb(color);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">{title}</h3>

      <div className="mt-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-[3px] ps-7 text-[9px] text-white/40">
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className="w-[13px] shrink-0 text-center">
                {HOUR_TICKS.includes(hour) ? hour : ''}
              </span>
            ))}
          </div>

          {grid.map((row, day) => (
            <div key={day} className="mt-[3px] flex items-center gap-[3px]">
              <span className="w-7 shrink-0 text-[10px] font-medium text-white/50">{weekdayLabel(day, language)}</span>
              {row.map((count, hour) => {
                const intensity = count / max;
                return (
                  <span
                    key={hour}
                    title={`${count}`}
                    className="h-[13px] w-[13px] shrink-0 rounded-[3px]"
                    style={{ backgroundColor: `rgba(${r},${g},${b},${0.08 + intensity * 0.92})` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
