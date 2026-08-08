import { formatTemplate } from '../i18n';
import { resolveInsightTemplate } from '../i18n/resolveInsight';
import { firstName } from '../lib/names';
import { parseChatName } from '../lib/parseChatName';
import type { Dictionary } from '../i18n';
import type { AnalysisResult } from '../analysis';
import type { SharePayload } from '../lib/shareLink';

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
  fileName?: string
): StoryCardData[] {
  const { personas, busiestDay } = analysis;

  const orderedPersonas = [...personas].sort((a, b) => {
    if (a.id === 'chatterbox') return -1;
    if (b.id === 'chatterbox') return 1;
    return 0;
  });

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

  const locale = dictionary.code === 'he' ? 'he-IL' : 'en-US';
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

/** Rebuilds story cards from a compact share payload using the viewer's dictionary. */
export function rebuildCardsFromPayload(payload: SharePayload, dict: Dictionary): StoryCardData[] {
  const cards: StoryCardData[] = [];

  for (const [id, sender, value] of payload.p) {
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
  const locale = dict.code === 'he' ? 'he-IL' : 'en-US';
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
