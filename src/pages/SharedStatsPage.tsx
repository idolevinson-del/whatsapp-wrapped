import { useEffect, useState } from 'react';
import { formatTemplate, useLanguage } from '../i18n';
import { StatsView } from './StatsView';
import { HEADLINE_GRADIENT, OUTRO_GRADIENT, BUSIEST_DAY_GRADIENT, PERSONA_GRADIENTS } from '../components/cards/cardStyles';
import { PremiumModal } from '../components/PremiumModal';
import { buildSenderColorMap } from '../lib/senderColors';
import { formatDate } from '../lib/formatDate';
import { buildStatsShareUrl } from '../lib/statsShareLink';
import { buildStatsShareText } from '../lib/shareText';
import { generateShareImageBlob, shareOrDownloadImage } from '../lib/shareImage';
import { isPremium } from '../lib/premium';
import { DEFAULT_THEME, getSelectedTheme } from '../lib/themes';
import { formatPersona, pickHeadlinePersonaFromBreakdown } from '../lib/headlinePersona';
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
  const [showPremium, setShowPremium] = useState(false);
  const [, forcePremiumRefresh] = useState(0);
  // The theme is the viewer's own local preference, not the sender's — it
  // applies to how *you* see any results page, same as any other client-side
  // display setting.
  const userIsPremium = isPremium();
  const theme = userIsPremium ? getSelectedTheme() : DEFAULT_THEME;

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
    const text = buildStatsShareText(dictionary, shareUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function handleShareImage() {
    trackEvent('image_shared');
    let topSenderName: string | undefined;
    let topSenderCount: number | undefined;
    payload.s.forEach((sender, i) => {
      const value = payload.pb.mc[i] ?? 0;
      if (topSenderCount === undefined || value > topSenderCount) {
        topSenderName = sender;
        topSenderCount = value;
      }
    });
    let topStreakName: string | undefined;
    let topStreakDays: number | undefined;
    payload.s.forEach((sender, i) => {
      const value = payload.pb.sd[i] ?? 0;
      if (topStreakDays === undefined || value > topStreakDays) {
        topStreakName = sender;
        topStreakDays = value;
      }
    });
    // Best-effort — only what the compact link payload carries, see
    // pickHeadlinePersonaFromBreakdown's doc comment for what's excluded.
    const headlinePersona = pickHeadlinePersonaFromBreakdown({ senders: payload.s, pb: payload.pb });
    const formattedPersona = headlinePersona ? formatPersona(headlinePersona, dictionary) : undefined;
    const blob = await generateShareImageBlob({
      appTitle: dictionary.app.title,
      totalMessages: payload.total,
      totalMessagesLabel: dictionary.stats.totalMessages,
      spanDays,
      spanLabel: formatTemplate(dictionary.stats.dateRangeValue, {
        start: formatDate(payload.spanStart, language),
        end: formatDate(payload.spanEnd, language),
      }),
      topSenderName,
      topSenderCount,
      topSenderLabel: dictionary.stats.topSenderLabel,
      topStreakName,
      topStreakDays,
      topStreakLabel: dictionary.stats.streakDays,
      busiestDayDate,
      busiestDayCount: payload.busiestCount,
      busiestDayLabel: dictionary.stats.busiestDayTitle,
      busiestDayCountLabel: formatTemplate(dictionary.stats.messagesCountCaption, { count: payload.busiestCount }),
      ctaText: dictionary.stats.shareImageCta,
      urlText: window.location.host,
      dir: language === 'he' ? 'rtl' : 'ltr',
      gradient: theme.hexStops,
      personaIcon: formattedPersona?.icon,
      personaText: formattedPersona?.text,
    });
    await shareOrDownloadImage(blob, 'whatsapp-wrapped.png', dictionary.app.title, dictionary.stats.shareIntro);
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
    shareImageLabel: dictionary.stats.shareImageButton,
    onShareImage: handleShareImage,
    titleGradientClasses: theme.gradientClasses,
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
      // Free blocks first, locked ones pushed to the bottom — matches StatsPage.
      { kind: 'pie', title: dictionary.stats.messageCount, entries: withColors(payload.pb.mc) },
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
      {
        kind: 'bar',
        title: dictionary.stats.streakDays,
        entries: withColors(payload.pb.sd),
        valueSuffix: ` ${dictionary.stats.daysSuffix}`,
        locked: !userIsPremium,
      },
      {
        kind: 'bar',
        title: dictionary.stats.avgReplyMinutes,
        entries: withColors(payload.pb.arm),
        valueSuffix: ` ${dictionary.stats.minutesSuffix}`,
        locked: !userIsPremium,
      },
      {
        kind: 'pie',
        title: dictionary.stats.conversationStarterCount,
        entries: withColors(payload.pb.csc),
        locked: !userIsPremium,
      },
      {
        kind: 'bar',
        title: dictionary.stats.wordsPerMessage,
        entries: withColors(payload.pb.wpm),
        locked: !userIsPremium,
      },
      ...(isGroup
        ? [
            {
              kind: 'pie' as const,
              title: dictionary.stats.mentionedCount,
              entries: withColors(payload.pb.mnc),
              locked: !userIsPremium,
            },
          ]
        : []),
    ],
    likedItHeading: dictionary.stats.likedItHeading,
    tryItYourselfLabel: dictionary.stats.tryItYourselfButton,
    onTryItYourself: goHome,
    onOpenPremium: () => setShowPremium(true),
    premiumCtaLabel: dictionary.premium.buyButton,
  };

  return (
    <>
      <StatsView model={model} />
      {showPremium && (
        <PremiumModal onClose={() => setShowPremium(false)} onPremiumChange={() => forcePremiumRefresh((n) => n + 1)} />
      )}
    </>
  );
}
