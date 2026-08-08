import { PERSONA_ICONS, isPersonaId } from '../components/cards/cardStyles';
import type { StoryCardData } from '../pages/buildStoryCards';

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
