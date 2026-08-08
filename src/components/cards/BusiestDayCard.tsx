import { StoryCard } from '../StoryCard';
import { BUSIEST_DAY_GRADIENT } from './cardStyles';
import type { BusiestDayCardData } from '../../pages/buildStoryCards';

export function BusiestDayCard({ text }: Omit<BusiestDayCardData, 'kind'>) {
  return (
    <StoryCard gradient={BUSIEST_DAY_GRADIENT}>
      <span className="text-6xl">💥</span>
      <p className="mt-6 max-w-md text-2xl font-extrabold leading-snug sm:text-3xl">{text}</p>
    </StoryCard>
  );
}
