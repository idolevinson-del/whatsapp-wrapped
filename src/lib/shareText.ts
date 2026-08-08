import { PERSONA_ICONS, isPersonaId } from '../components/cards/cardStyles';
import type { Dictionary } from '../i18n';
import type { StoryCardData } from '../pages/buildStoryCards';

/**
 * Share text for the stats page: a short, catchy invite plus the link —
 * deliberately no stat breakdown, so the recipient discovers the numbers by
 * opening the link rather than reading them in the message.
 */
export function buildStatsShareText(dictionary: Dictionary, appUrl: string): string {
  return [dictionary.stats.shareIntro, '', appUrl].join('\n');
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
