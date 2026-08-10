/**
 * Everything StatsView needs to render — decoupled from where the data came
 * from, so the same presentational component serves both the live results
 * (StatsPage, built from a real AnalysisResult) and a received share link
 * (SharedStatsPage, built from a decoded compact payload).
 */
export type StatsBlock = (
  | {
      kind: 'pie' | 'bar';
      title: string;
      entries: { sender: string; value: number; color: string }[];
      valueSuffix?: string;
    }
  | {
      kind: 'topEmojis';
      title: string;
      rows: { sender: string; color: string; emojis: { value: string; count: number }[] }[];
    }
) & {
  /** Premium-only block: rendered blurred with a lock overlay instead of
   * the real chart. The underlying data is still computed and present in
   * the DOM (this is a paywall nudge, not real access control — nothing
   * here is sensitive enough to need more than that). */
  locked?: boolean;
};

export interface StatsOverviewTile {
  icon: string;
  value: string;
  label: string;
  caption?: string;
  gradient: string;
}

export interface StatsViewModel {
  title: string;
  subtitle: string;
  headline: string | null;
  isExample?: boolean;
  exampleBadgeLabel?: string;
  backLabel: string;
  onBack: () => void;
  shareLabel: string;
  onShare: () => void;
  shareImageLabel: string;
  onShareImage: () => void;
  /** Tailwind `from-...via-...to-...` classes for the title text and bottom
   * CTA button — the app's brand gradient. */
  titleGradientClasses: string;
  overviewTitle: string;
  overviewTiles: StatsOverviewTile[];
  /** Rendered in order — includes both chart sections and the top-emojis block. */
  blocks: StatsBlock[];
  likedItHeading: string;
  tryItYourselfLabel: string;
  onTryItYourself: () => void;
  /** Opens the Wrapped+ modal — used by locked-block overlays. */
  onOpenPremium: () => void;
  premiumCtaLabel: string;
}
