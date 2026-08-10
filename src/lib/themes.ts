/**
 * The app's brand gradient — used for the results page title, CTA buttons,
 * and the canvas-rendered share image. Previously came in several
 * selectable premium color themes; that feature was cut (not compelling
 * enough to matter), leaving just this one, used unconditionally.
 */
export interface AppTheme {
  /** Tailwind `from-...via-...to-...` classes, for the title text and CTA button. */
  gradientClasses: string;
  /** The same three stops as hex, for the canvas-rendered share image. */
  hexStops: [string, string, string];
}

export const DEFAULT_THEME: AppTheme = {
  gradientClasses: 'from-amber-400 via-rose-400 to-purple-400',
  hexStops: ['#fbbf24', '#fb7185', '#c084fc'],
};
