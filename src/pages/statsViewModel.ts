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
  /** Plain-language explanation of how this stat is actually calculated
   * (e.g. what counts as "starting a conversation"), shown via an ⓘ next
   * to the title. Safe to show even when the block is locked — it explains
   * the feature, not the sender's actual data. */
  infoText?: string;
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
  /** When set, this is the first-visit auto-shown example — it advances
   * itself to the real upload screen (calls onBack) after this many ms,
   * instead of requiring a manual tap. Shown as a fill bar next to the
   * example badge so the auto-advance isn't a surprise. Never set for a
   * deliberately-opened example ("See an example") or for real results. */
  autoExitMs?: number;
  backLabel: string;
  onBack: () => void;
  /** The one and only share action — generates the "Wrapped" badge image and
   * hands it to the OS share sheet (WhatsApp is one of the destinations
   * there, alongside everything else). */
  shareLabel: string;
  onShare: () => void;
  /** Small incentive line under the share button — only present for
   * non-premium visitors who haven't maxed out the share bonus yet. */
  shareBonusHint?: string | null;
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
  /** Brief confirmation toast (e.g. "thanks for sharing, one more unlocked!")
   * — present only right after it should show; the page clears it itself
   * after a few seconds. */
  toastMessage?: string | null;
}
