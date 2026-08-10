import { useState } from 'react';
import { useLanguage } from '../i18n';
import { LanguageToggle } from '../components/LanguageToggle';
import { ShareButton } from '../components/ShareButton';
import { StoryViewer } from '../components/StoryViewer';
import { HeadlineCard } from '../components/cards/HeadlineCard';
import { PersonaCard } from '../components/cards/PersonaCard';
import { BusiestDayCard } from '../components/cards/BusiestDayCard';
import { OutroCard } from '../components/cards/OutroCard';
import { StatsPage } from './StatsPage';
import { buildStoryCards } from './buildStoryCards';
import type { StoryCardData } from './buildStoryCards';
import type { AnalysisResult } from '../analysis';

interface WrappedPageProps {
  analysis: AnalysisResult;
  onReset: () => void;
  fileName?: string;
  /** True when showing the built-in sample data instead of an uploaded chat. */
  isExample?: boolean;
}

export function WrappedPage({ analysis, onReset, fileName, isExample }: WrappedPageProps) {
  const { dictionary } = useLanguage();
  const [showStats, setShowStats] = useState(false);
  const cards = buildStoryCards(analysis, dictionary, fileName);

  if (showStats) {
    return <StatsPage analysis={analysis} fileName={fileName} onBack={() => setShowStats(false)} isExample={isExample} />;
  }

  return (
    <div className="relative">
      {isExample && (
        <div className="absolute top-4 start-4 z-30 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
          {dictionary.onboarding.exampleBadge}
        </div>
      )}
      <div className="absolute bottom-4 start-4 z-30">
        <ShareButton cards={cards} />
      </div>
      <div className="absolute bottom-4 end-4 z-30">
        <LanguageToggle />
      </div>

      <StoryViewer>
        {cards.map((card, i) => {
          switch (card.kind) {
            case 'headline':
              return <HeadlineCard key={i} {...card} />;
            case 'persona':
              return <PersonaCard key={i} {...card} />;
            case 'busiestDay':
              return <BusiestDayCard key={i} {...card} />;
            case 'outro':
              return (
                <OutroCard
                  key={i}
                  onReset={onReset}
                  restartLabel={isExample ? dictionary.onboarding.exampleCta : undefined}
                  onShowStats={() => setShowStats(true)}
                />
              );
          }
        })}
      </StoryViewer>
    </div>
  );
}

/** Renders a shared Wrapped view decoded from a share URL — no upload, no reset. */
export function SharedWrappedPage({ cards }: { cards: StoryCardData[] }) {
  const { dictionary } = useLanguage();

  return (
    <div className="relative">
      <div className="absolute bottom-4 end-4 z-30">
        <LanguageToggle />
      </div>

      <StoryViewer>
        {cards.map((card, i) => {
          switch (card.kind) {
            case 'persona':
              return <PersonaCard key={i} {...card} />;
            case 'busiestDay':
              return <BusiestDayCard key={i} {...card} />;
            case 'outro':
              return (
                <OutroCard
                  key={i}
                  onReset={() => {
                    window.location.href = window.location.origin;
                  }}
                  restartLabel={dictionary.wrapped.tryItYourself}
                />
              );
          }
        })}
      </StoryViewer>
    </div>
  );
}
