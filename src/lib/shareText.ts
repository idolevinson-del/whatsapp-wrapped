import { PERSONA_ICONS, isPersonaId } from '../components/cards/cardStyles';
import { formatTemplate } from '../i18n';
import { formatDate } from './formatDate';
import type { Dictionary, Language } from '../i18n';
import type { AnalysisResult } from '../analysis';
import type { StoryCardData } from '../pages/buildStoryCards';

/**
 * Share text for the stats page: plain "label/name + number" lines, no
 * gendered narrative sentences (unlike the retired card-based share below).
 */
export function buildStatsShareText(
  analysis: AnalysisResult,
  dictionary: Dictionary,
  language: Language,
  appUrl: string
): string {
  const totalMessages = analysis.coreStats.perSender.reduce((sum, s) => sum + s.messageCount, 0);
  const topSender = [...analysis.personaBreakdown.messageCount].sort((a, b) => b.value - a.value)[0];
  const busiestDayDate = formatDate(new Date(`${analysis.busiestDay.date}T12:00:00`).getTime(), language);

  const lines = [dictionary.stats.shareIntro, ''];
  lines.push(`💬 ${formatTemplate(dictionary.stats.messagesCountCaption, { count: totalMessages })}`);
  if (topSender) {
    lines.push(`🏆 ${topSender.sender}: ${formatTemplate(dictionary.stats.messagesCountCaption, { count: topSender.value })}`);
  }
  lines.push(formatTemplate(dictionary.wrapped.busiestDayText, { date: busiestDayDate, count: analysis.busiestDay.count }));
  lines.push('');
  lines.push(dictionary.stats.shareOutro);
  lines.push(appUrl);

  return lines.join('\n');
}

export function buildShareText(cards: StoryCardData[], appUrl: string): string {
  const lines: string[] = ['🎉 WhatsApp Wrapped!', ''];

  let shown = 0;
  for (const card of cards) {
    if (shown >= 2) break;
    if (card.kind === 'persona') {
      const icon = isPersonaId(card.id) ? PERSONA_ICONS[card.id] : '✨';
      lines.push(`${icon} ${card.text}`);
      shown++;
    } else if (card.kind === 'busiestDay') {
      lines.push(`💥 ${card.text}`);
      shown++;
    }
  }

  lines.push('');
  lines.push(`Try it yourself 👇`);
  lines.push(appUrl);

  return lines.join('\n');
}
