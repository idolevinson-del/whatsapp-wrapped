import { StoryCard } from '../StoryCard';
import { DEFAULT_PERSONA_GRADIENT, PERSONA_GRADIENTS, PERSONA_ICONS, isPersonaId } from './cardStyles';
import type { PersonaCardData } from '../../pages/buildStoryCards';

export function PersonaCard({ id, text }: Omit<PersonaCardData, 'kind'>) {
  const gradient = isPersonaId(id) ? PERSONA_GRADIENTS[id] : DEFAULT_PERSONA_GRADIENT;
  const icon = isPersonaId(id) ? PERSONA_ICONS[id] : '✨';

  return (
    <StoryCard gradient={gradient}>
      <span className="text-6xl">{icon}</span>
      <p className="mt-6 max-w-md text-2xl font-extrabold leading-snug sm:text-3xl">{text}</p>
    </StoryCard>
  );
}
