import { formatTemplate } from '../i18n';
import { resolveInsightTemplate } from '../i18n/resolveInsight';
import { firstName } from '../lib/names';
import { parseChatName } from '../lib/parseChatName';
import { FREE_PERSONA_IDS, orderPersonas } from '../lib/headlinePersona';
import { LANGUAGES } from '../i18n/languages';
import type { Dictionary, Language } from '../i18n';
import type { AnalysisResult } from '../analysis';
import type { SharePayload } from '../lib/shareLink';

function localeFor(code: Language): string {
  return LANGUAGES.find((l) => l.code === code)?.intlLocale ?? 'en-US';
}

export interface HeadlineCardData {
  kind: 'headline';
  text: string;
}

export interface PersonaCardData {
  kind: 'persona';
  id: string;
  text: string;
  sender: string;
  value: number | string;
}

export interface BusiestDayCardData {
  kind: 'busiestDay';
  text: string;
  rawDate: string;
  count: number;
}

export interface OutroCardData {
  kind: 'outro';
}

export type StoryCardData = HeadlineCardData | PersonaCardData | BusiestDayCardData | OutroCardData;

export function buildStoryCards(
  analysis: AnalysisResult,
  dictionary: Dictionary,
  fileName?: string,
  /** Non-premium viewers only get personas that don't leak a locked chart's
   * number — see FREE_PERSONA_IDS. Defaults to the free (most restrictive)
   * behavior so a caller can't forget to pass it and accidentally leak. */
  userIsPremium = false
): StoryCardData[] {
  const { personas, busiestDay } = analysis;

  // Persona display order (most to least "interesting") now lives in
  // lib/headlinePersona.ts, shared with whatever just wants the single best
  // one (the share image).
  const orderedPersonas = orderPersonas(personas).filter((p) => userIsPremium || FREE_PERSONA_IDS.has(p.id));

  const cards: StoryCardData[] = [];

  if (fileName) {
    const senderNames = analysis.coreStats.perSender.map((s) => s.sender);
    const { name, isGroup } = parseChatName(fileName, senderNames);
    if (name) {
      const template = isGroup ? dictionary.wrapped.headlineGroup : dictionary.wrapped.headlineWith;
      cards.push({ kind: 'headline', text: formatTemplate(template, { name }) });
    }
  }

  for (const persona of orderedPersonas) {
    const template = resolveInsightTemplate(persona.insightTemplate, dictionary);
    if (!template) continue;
    const sender = firstName(persona.sender);
    cards.push({
      kind: 'persona',
      id: persona.id,
      sender,
      value: persona.value,
      text: formatTemplate(template, { sender, value: persona.value }),
    });
  }

  const locale = localeFor(dictionary.code);
  const dateStr = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${busiestDay.date}T12:00:00`)
  );
  cards.push({
    kind: 'busiestDay',
    rawDate: busiestDay.date,
    count: busiestDay.count,
    text: formatTemplate(dictionary.wrapped.busiestDayText, { date: dateStr, count: busiestDay.count }),
  });

  cards.push({ kind: 'outro' });

  return cards;
}

/** Rebuilds story cards from a compact share payload using the viewer's
 * dictionary and *the viewer's own* premium status — same free-persona
 * filtering as buildStoryCards, see FREE_PERSONA_IDS. */
export function rebuildCardsFromPayload(payload: SharePayload, dict: Dictionary, userIsPremium = false): StoryCardData[] {
  const cards: StoryCardData[] = [];

  for (const [id, sender, value] of payload.p) {
    if (!userIsPremium && !FREE_PERSONA_IDS.has(id)) continue;
    const template = resolveInsightTemplate(`persona.${id}`, dict);
    if (!template) continue;
    cards.push({
      kind: 'persona',
      id,
      sender,
      value,
      text: formatTemplate(template, { sender, value }),
    });
  }

  const [rawDate, count] = payload.d;
  const locale = localeFor(dict.code);
  const dateStr = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${rawDate}T12:00:00`)
  );
  cards.push({
    kind: 'busiestDay',
    rawDate,
    count,
    text: formatTemplate(dict.wrapped.busiestDayText, { date: dateStr, count }),
  });

  cards.push({ kind: 'outro' });
  return cards;
}
