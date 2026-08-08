import { formatTemplate } from '../i18n';
import { pickMax, pickMin } from '../lib/pickExtreme';
import type { Dictionary } from '../i18n';

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

/** A single "superlative" — the extreme (highest/lowest) sender for one fun
 * category, e.g. fewest messages, slowest replies. Framed as a metric about
 * the number, not an adjective describing the person, so it stays
 * gender-neutral in Hebrew without needing "הוא/היא" forms. */
export interface SuperlativeBadge {
  icon: string;
  eyebrow: string;
  sender: string;
  value: string;
  color: string;
}

interface ColoredEntry {
  sender: string;
  value: number;
  color: string;
}

/**
 * Builds the fun "extremes" badge row from four already-colored breakdown
 * categories. Shared by StatsPage and SharedStatsPage so the picks and
 * copy stay identical between live results and a received link.
 */
export function buildSuperlatives(
  breakdown: {
    messageCount: ColoredEntry[];
    avgReplyMinutes: ColoredEntry[];
    laughsTriggered: ColoredEntry[];
    wordsPerMessage: ColoredEntry[];
  },
  dictionary: Dictionary
): SuperlativeBadge[] {
  const badges: SuperlativeBadge[] = [];

  const ghost = pickMin(breakdown.messageCount);
  if (ghost) {
    badges.push({
      icon: '👻',
      eyebrow: dictionary.stats.fewestMessagesLabel,
      sender: ghost.sender,
      value: formatTemplate(dictionary.stats.messagesCountCaption, { count: ghost.value }),
      color: ghost.color,
    });
  }

  const slowReplier = pickMax(breakdown.avgReplyMinutes.filter((e) => e.value > 0));
  if (slowReplier) {
    badges.push({
      icon: '🐌',
      eyebrow: dictionary.stats.avgReplyMinutes,
      sender: slowReplier.sender,
      value: `${slowReplier.value} ${dictionary.stats.minutesSuffix}`,
      color: slowReplier.color,
    });
  }

  const comedian = pickMax(breakdown.laughsTriggered.filter((e) => e.value > 0));
  if (comedian) {
    badges.push({
      icon: '😂',
      eyebrow: dictionary.stats.laughsTriggered,
      sender: comedian.sender,
      value: String(comedian.value),
      color: comedian.color,
    });
  }

  const philosopher = pickMax(breakdown.wordsPerMessage.filter((e) => e.value > 0));
  if (philosopher) {
    badges.push({
      icon: '📝',
      eyebrow: dictionary.stats.wordsPerMessage,
      sender: philosopher.sender,
      value: String(philosopher.value),
      color: philosopher.color,
    });
  }

  return badges;
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
  superlativesTitle: string;
  superlatives: SuperlativeBadge[];
  overviewTitle: string;
  overviewTiles: StatsOverviewTile[];
  /** Rendered in order — includes both chart sections and the top-emojis block. */
  blocks: StatsBlock[];
  likedItHeading: string;
  tryItYourselfLabel: string;
  onTryItYourself: () => void;
}
