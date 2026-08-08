import { useEffect } from 'react';
import { formatTemplate, useLanguage } from '../i18n';
import { StatsView } from './StatsView';
import { HEADLINE_GRADIENT, OUTRO_GRADIENT, BUSIEST_DAY_GRADIENT, PERSONA_GRADIENTS } from '../components/cards/cardStyles';
import { buildSenderColorMap } from '../lib/senderColors';
import { formatDate } from '../lib/formatDate';
import { buildStatsShareUrl } from '../lib/statsShareLink';
import { trackEvent } from '../analytics';
import type { StatsSharePayload } from '../lib/statsShareLink';
import type { StatsViewModel } from './statsViewModel';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function goHome() {
  window.location.href = window.location.origin;
}

/**
 * Renders a received `?stats=` link — someone else's chat, reconstructed
 * entirely from the compact payload in the URL (there's no backend, so this
 * is genuinely everything that's available). Opens in the language it was
 * shared in, but the visitor can still toggle.
 */
export function SharedStatsPage({ payload }: { payload: StatsSharePayload }) {
  const { dictionary, language, setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage(payload.lang);
    // Nudge to the sender's language once, on arrival — not a controlled sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colors = buildSenderColorMap(payload.s);
  const isGroup = Boolean(payload.isGroup) && payload.pb.mnc.length > 0;

  function withColors(values: number[]) {
    return payload.s.map((sender, i) => ({ sender, value: values[i] ?? 0, color: colors[sender] ?? '#94a3b8' }));
  }

  const busiestDayDate = formatDate(new Date(`${payload.busiestDate}T12:00:00`).getTime(), language);
  const hasSilence = payload.silenceHours !== undefined && payload.silenceBefore !== undefined && payload.silenceAfter !== undefined;
  const spanDays = Math.max(1, Math.round((payload.spanEnd - payload.spanStart) / MS_PER_DAY) + 1);

  function handleShareToWhatsApp() {
    trackEvent('results_shared');
    // Re-share the same link — we only ever have the payload we received.
    const shareUrl = buildStatsShareUrl(payload);
    const lines = [dictionary.stats.shareIntro, '', shareUrl];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  }

  const headline = payload.n
    ? formatTemplate(payload.isGroup ? dictionary.wrapped.headlineGroup : dictionary.wrapped.headlineWith, {
        name: payload.n,
      })
    : null;

  const model: StatsViewModel = {
    title: dictionary.stats.title,
    subtitle: dictionary.stats.subtitle,
    headline,
    backLabel: dictionary.stats.tryItYourselfButton,
    onBack: goHome,
    shareLabel: dictionary.stats.shareButton,
    onShare: handleShareToWhatsApp,
    overviewTitle: dictionary.stats.overviewTitle,
    overviewTiles: [
      { icon: '💬', value: String(payload.total), label: dictionary.stats.totalMessages, gradient: HEADLINE_GRADIENT },
      {
        icon: '📅',
        value: `${spanDays} ${dictionary.stats.daysSuffix}`,
        label: dictionary.stats.dateRangeTitle,
        caption: formatTemplate(dictionary.stats.dateRangeValue, {
          start: formatDate(payload.spanStart, language),
          end: formatDate(payload.spanEnd, language),
        }),
        gradient: OUTRO_GRADIENT,
      },
      {
        icon: '💥',
        value: busiestDayDate,
        label: dictionary.stats.busiestDayTitle,
        caption: formatTemplate(dictionary.stats.messagesCountCaption, { count: payload.busiestCount }),
        gradient: BUSIEST_DAY_GRADIENT,
      },
      ...(hasSilence
        ? [
            {
              icon: '🌙',
              value: `${Math.round(payload.silenceHours!)} ${dictionary.stats.hoursSuffix}`,
              label: dictionary.stats.longestSilenceTitle,
              caption: formatTemplate(dictionary.stats.dateRangeValue, {
                start: formatDate(payload.silenceBefore!, language),
                end: formatDate(payload.silenceAfter!, language),
              }),
              gradient: PERSONA_GRADIENTS.nightOwl,
            },
          ]
        : []),
    ],
    blocks: [
      { kind: 'pie', title: dictionary.stats.messageCount, entries: withColors(payload.pb.mc) },
      {
        kind: 'bar',
        title: dictionary.stats.streakDays,
        entries: withColors(payload.pb.sd),
        valueSuffix: ` ${dictionary.stats.daysSuffix}`,
      },
      {
        kind: 'bar',
        title: dictionary.stats.avgReplyMinutes,
        entries: withColors(payload.pb.arm),
        valueSuffix: ` ${dictionary.stats.minutesSuffix}`,
      },
      { kind: 'pie', title: dictionary.stats.conversationStarterCount, entries: withColors(payload.pb.csc) },
      { kind: 'bar', title: dictionary.stats.wordsPerMessage, entries: withColors(payload.pb.wpm) },
      { kind: 'pie', title: dictionary.stats.emojiCount, entries: withColors(payload.pb.ec) },
      {
        kind: 'topEmojis',
        title: dictionary.stats.topEmojisTitle,
        rows: payload.s.map((sender, i) => ({
          sender,
          color: colors[sender] ?? '#94a3b8',
          emojis: (payload.te[i] ?? []).map(([value, count]) => ({ value, count })),
        })),
      },
      { kind: 'pie', title: dictionary.stats.laughsTriggered, entries: withColors(payload.pb.lt) },
      ...(isGroup
        ? [{ kind: 'pie' as const, title: dictionary.stats.mentionedCount, entries: withColors(payload.pb.mnc) }]
        : []),
    ],
    likedItHeading: dictionary.stats.likedItHeading,
    tryItYourselfLabel: dictionary.stats.tryItYourselfButton,
    onTryItYourself: goHome,
  };

  return <StatsView model={model} />;
}
