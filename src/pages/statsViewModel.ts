/**
 * Everything StatsView needs to render — decoupled from where the data came
 * from, so the same presentational component serves both the live results
 * (StatsPage, built from a real AnalysisResult) and a received share link
 * (SharedStatsPage, built from a decoded compact payload).
 */
export type StatsBlock =
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
    };

export interface StatsOverviewTile {
  icon: string;
  value: string;
  label: string;
  caption?: string;
  gradient: string;
}

/** The Premium-only activity heatmap. `locked: true` renders a teaser (real
 * data withheld) instead of the chart — only StatsPage (live analysis) ever
 * has real heatmap data to show; SharedStatsPage passes `null` (no section)
 * since that data was never part of the compact share payload. */
export interface HeatmapModel {
  title: string;
  grid: number[][];
  color: string;
  locked: boolean;
  lockedMessage: string;
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
   * CTA button — the selected Premium theme, or the default brand gradient. */
  titleGradientClasses: string;
  overviewTitle: string;
  overviewTiles: StatsOverviewTile[];
  /** Rendered in order — includes both chart sections and the top-emojis block. */
  blocks: StatsBlock[];
  heatmap: HeatmapModel | null;
  likedItHeading: string;
  tryItYourselfLabel: string;
  onTryItYourself: () => void;
  /** Opens the Wrapped+ modal — used by the locked-heatmap teaser. */
  onOpenPremium: () => void;
  premiumCtaLabel: string;
}
