import { useState } from 'react';
import { useLanguage } from '../i18n';
import { buildShareText } from '../lib/shareText';
import { buildShareUrl, type SharePayload } from '../lib/shareLink';
import { trackEvent } from '../analytics';
import type { StoryCardData, PersonaCardData, BusiestDayCardData } from '../pages/buildStoryCards';

interface ShareButtonProps {
  cards: StoryCardData[];
}

export function ShareButton({ cards }: ShareButtonProps) {
  const { dictionary } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    if (status !== 'idle') return;

    const shareCards = cards.filter((c) => c.kind !== 'headline');
    const busiestDay = shareCards.find((c): c is BusiestDayCardData => c.kind === 'busiestDay');
    const payload: SharePayload = {
      v: 1,
      lang: dictionary.code,
      p: shareCards
        .filter((c): c is PersonaCardData => c.kind === 'persona')
        .map((c): [string, string, number | string] => [c.id, c.sender, c.value]),
      d: busiestDay ? [busiestDay.rawDate, busiestDay.count] : ['', 0],
    };
    const text = buildShareText(shareCards, buildShareUrl(payload));

    try {
      if (navigator.share) {
        await navigator.share({ text, title: dictionary.app.title });
      } else {
        await navigator.clipboard.writeText(text);
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
      }
      trackEvent('card_shared');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        className="cursor-pointer rounded-full border border-white/40 bg-black/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/10"
      >
        {status === 'copied' ? '✅' : '🔗'}{' '}
        {status === 'copied' ? dictionary.wrapped.shareUrlCopied : dictionary.wrapped.shareButton}
      </button>
      {status === 'error' && <p className="text-xs text-red-300">{dictionary.wrapped.shareError}</p>}
    </div>
  );
}
