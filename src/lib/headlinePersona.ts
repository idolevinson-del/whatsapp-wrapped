import { formatTemplate } from '../i18n';
import { resolveInsightTemplate } from '../i18n/resolveInsight';
import { firstName } from './names';
import { PERSONA_ICONS, isPersonaId } from '../components/cards/cardStyles';
import type { Dictionary } from '../i18n';
import type { PersonaResult } from '../analysis';

/**
 * Display order for personas, from most to least "interesting" — strong
 * headline stats first, time-of-day personas (less compelling) pushed to
 * the end. Shared between the swipeable story-card reveal (every persona,
 * in this order) and anywhere that just wants the single best one (the
 * share image). Any persona id not listed falls back to the order it was
 * computed in (Array.indexOf returning -1 for unknown ids).
 */
export const PERSONA_ORDER = [
  'chatterbox',
  'streaker',
  'fastestReplier',
  'conversationStarter',
  'philosopher',
  'emojiEnthusiast',
  'comedian',
  'mostMentioned',
  'ghost',
  'nightOwl',
  'earlyBird',
];

export function orderPersonas(personas: PersonaResult[]): PersonaResult[] {
  return [...personas].sort((a, b) => PERSONA_ORDER.indexOf(a.id) - PERSONA_ORDER.indexOf(b.id));
}

/**
 * Personas whose insight sentence doesn't reveal anything a free user
 * couldn't already see on the free part of StatsPage. The rest map onto a
 * *locked* StatsPage block (streaker -> streak days, fastestReplier -> avg
 * reply time, philosopher -> words/message, conversationStarter ->
 * conversation starts, mostMentioned -> mention count) — showing that badge
 * in the free reveal would hand over the paywalled number for free, in
 * narrative form, defeating the paywall entirely. Used to filter the
 * swipeable persona reveal for non-premium viewers; premium viewers (who
 * already have every chart unlocked) see every persona regardless.
 */
export const FREE_PERSONA_IDS: ReadonlySet<string> = new Set([
  'chatterbox', // -> messageCount (free)
  'emojiEnthusiast', // -> emojiCount (free)
  'comedian', // -> laughsTriggered (free)
  'ghost', // derived from messageCount (free), no locked equivalent
  'nightOwl', // no corresponding StatsPage block at all
  'earlyBird', // no corresponding StatsPage block at all
]);

/** The single most shareable persona for a chat — first in PERSONA_ORDER
 * among the ones this chat actually produced. */
export function pickHeadlinePersona(personas: PersonaResult[]): PersonaResult | undefined {
  return orderPersonas(personas)[0];
}

/**
 * The 5 persona ids shown as badges on the shareable "Wrapped" image, in
 * display order. Chosen for how well each reads as a one-line badge next to
 * just a name (unlike e.g. fastestReplier or conversationStarter, whose
 * insight only makes sense with a number attached).
 */
export const SHARE_BADGE_IDS = ['chatterbox', 'comedian', 'philosopher', 'nightOwl', 'ghost'] as const;

/** Fixed icon per share-image badge — independent of PERSONA_ICONS (used
 * elsewhere for the full persona set) so this list can be curated on its
 * own without affecting the persona reveal or story cards. */
export const SHARE_BADGE_ICONS: Record<(typeof SHARE_BADGE_IDS)[number], string> = {
  chatterbox: '🏆',
  comedian: '😂',
  philosopher: '💬',
  nightOwl: '🌙',
  ghost: '👻',
};

/** Short badge label per share-image badge id — see Dictionary['stats'] for
 * the actual translated strings. */
export function shareBadgeLabel(id: (typeof SHARE_BADGE_IDS)[number], dictionary: Dictionary): string {
  switch (id) {
    case 'chatterbox':
      return dictionary.stats.badgeMostActive;
    case 'comedian':
      return dictionary.stats.badgeFunniest;
    case 'philosopher':
      return dictionary.stats.badgeBiggestYapper;
    case 'nightOwl':
      return dictionary.stats.badgeNightOwl;
    case 'ghost':
      return dictionary.stats.badgeMostIgnored;
  }
}

export interface ShareBadge {
  icon: string;
  label: string;
  name: string;
}

/** Formats up to 5 persona badges for the shareable image, in SHARE_BADGE_IDS
 * order — only the ones this chat actually produced (e.g. a 1-on-1 chat has
 * no "ghost"). */
export function formatShareBadges(personas: PersonaResult[], dictionary: Dictionary): ShareBadge[] {
  return SHARE_BADGE_IDS.map((id) => personas.find((p) => p.id === id))
    .filter((p): p is PersonaResult => Boolean(p))
    .map((p) => ({
      icon: SHARE_BADGE_ICONS[p.id as (typeof SHARE_BADGE_IDS)[number]],
      label: shareBadgeLabel(p.id as (typeof SHARE_BADGE_IDS)[number], dictionary),
      name: firstName(p.sender),
    }));
}

export interface FormattedPersona {
  icon: string;
  /** Full sentence, e.g. "Alex is the Comedian — made others laugh 12 times." */
  text: string;
}

/** Formats a persona into display-ready icon + sentence, or undefined if its
 * insight template can't be resolved (shouldn't normally happen). */
export function formatPersona(persona: PersonaResult, dictionary: Dictionary): FormattedPersona | undefined {
  const template = resolveInsightTemplate(persona.insightTemplate, dictionary);
  if (!template) return undefined;

  const sender = firstName(persona.sender);
  return {
    icon: isPersonaId(persona.id) ? PERSONA_ICONS[persona.id] : '✨',
    text: formatTemplate(template, { sender, value: persona.value }),
  };
}

function pickHighest(values: { sender: string; value: number }[]): { sender: string; value: number } | null {
  if (values.length === 0) return null;
  return values.reduce((best, curr) => (curr.value > best.value ? curr : best));
}

function pickLowest(values: { sender: string; value: number }[]): { sender: string; value: number } | null {
  if (values.length === 0) return null;
  return values.reduce((best, curr) => (curr.value < best.value ? curr : best));
}

/** Minimum senders for "Ghost" to make sense — matches personas.ts. */
const GROUP_MIN_SENDERS = 3;

export interface BreakdownPersonaInput {
  senders: string[];
  pb: {
    mc: number[];
    wpm: number[];
    ec: number[];
    sd: number[];
    arm: number[];
    lt: number[];
    mnc: number[];
  };
}

/**
 * Best-effort headline persona derived from a *compact share-link payload*
 * (StatsSharePayload), not the full analysis — used by SharedStatsPage,
 * which only ever has whatever the sender's link carried, never the raw
 * messages. Deliberately narrower than computePersonas:
 *
 *  - conversationStarter is excluded: its insight sentence needs a
 *    *percentage* ("starting {value}% of conversations"), but the payload
 *    only carries a raw count (csc) — showing the count in that sentence
 *    would silently misstate what the number means.
 *  - nightOwl/earlyBird are excluded: they need hour-of-day breakdowns the
 *    compact payload never carries at all.
 *
 * Every category that *is* included uses the exact same source values (and
 * therefore the exact same winner and displayed number) as the full
 * computation would, so results match whenever both are derivable.
 */
function computeBreakdownWinners(
  input: BreakdownPersonaInput
): Partial<Record<string, { sender: string; value: number } | null>> {
  const { senders, pb } = input;
  const zip = (values: number[]) => senders.map((sender, i) => ({ sender, value: values[i] ?? 0 }));

  return {
    chatterbox: pickHighest(zip(pb.mc).filter((s) => s.value > 0)),
    streaker: pickHighest(zip(pb.sd).filter((s) => s.value > 1)),
    fastestReplier: pickLowest(zip(pb.arm).filter((s) => s.value > 0)),
    philosopher: pickHighest(zip(pb.wpm).filter((s) => s.value > 0)),
    emojiEnthusiast: pickHighest(zip(pb.ec).filter((s) => s.value > 0)),
    comedian: pickHighest(zip(pb.lt).filter((s) => s.value > 0)),
    mostMentioned: pb.mnc.length > 0 ? pickHighest(zip(pb.mnc).filter((s) => s.value > 0)) : null,
    ghost: senders.length >= GROUP_MIN_SENDERS ? pickLowest(zip(pb.mc)) : null,
  };
}

export function pickHeadlinePersonaFromBreakdown(input: BreakdownPersonaInput): PersonaResult | undefined {
  const winners = computeBreakdownWinners(input);
  for (const id of PERSONA_ORDER) {
    const winner = winners[id];
    if (winner) return { id, sender: winner.sender, insightTemplate: `persona.${id}`, value: winner.value };
  }
  return undefined;
}

/**
 * Same 5 badges as formatShareBadges, but derived from a compact share-link
 * payload instead of a full analysis — used by SharedStatsPage. Night Owl is
 * never included: the payload carries no hour-of-day breakdown at all (see
 * pickHeadlinePersonaFromBreakdown's doc comment), so a re-shared image
 * simply shows 4 badges instead of 5 rather than a fake one.
 */
export function pickShareBadgesFromBreakdown(input: BreakdownPersonaInput, dictionary: Dictionary): ShareBadge[] {
  const winners = computeBreakdownWinners(input);
  const badges: ShareBadge[] = [];
  for (const id of SHARE_BADGE_IDS) {
    if (id === 'nightOwl') continue;
    const winner = winners[id];
    if (!winner) continue;
    badges.push({ icon: SHARE_BADGE_ICONS[id], label: shareBadgeLabel(id, dictionary), name: firstName(winner.sender) });
  }
  return badges;
}
