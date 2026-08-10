import { useState } from 'react';
import { formatTemplate, useLanguage } from '../i18n';
import { StatsView } from './StatsView';
import { HEADLINE_GRADIENT, OUTRO_GRADIENT, BUSIEST_DAY_GRADIENT, PERSONA_GRADIENTS } from '../components/cards/cardStyles';
import { PremiumModal } from '../components/PremiumModal';
import { buildSenderColorMap } from '../lib/senderColors';
import { formatDate } from '../lib/formatDate';
import { parseChatName } from '../lib/parseChatName';
import { buildStatsShareText } from '../lib/shareText';
import { buildStatsSharePayload, buildStatsShareUrl } from '../lib/statsShareLink';
import { generateShareImageBlob, shareOrDownloadImage } from '../lib/shareImage';
import { isPremium } from '../lib/premium';
import { DEFAULT_THEME, getSelectedTheme } from '../lib/themes';
import { formatPersona, pickHeadlinePersona } from '../lib/headlinePersona';
import { trackEvent } from '../analytics';
import type { AnalysisResult } from '../analysis';
import type { StatsViewModel } from './statsViewModel';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface StatsPageProps {
  analysis: AnalysisResult;
  onBack: () => void;
  fileName?: string;
  /** True when showing the built-in sample data instead of an uploaded chat. */
  isExample?: boolean;
}

export function StatsPage({ analysis, onBack, fileName, isExample }: StatsPageProps) {
  const { dictionary, language } = useLanguage();
  const { personas, personaBreakdown, coreStats, conversationGapStats, busiestDay } = analysis;
  const senders = coreStats.perSender.map((s) => s.sender);
  const colors = buildSenderColorMap(senders);
  const isGroup = personaBreakdown.mentionedCount.length > 0;
  const [showPremium, setShowPremium] = useState(false);
  const [, forcePremiumRefresh] = useState(0);
  const userIsPremium = isPremium();
  const theme = userIsPremium ? getSelectedTheme() : DEFAULT_THEME;

  function withColors(values: { sender: string; value: number }[]) {
    return values.map((v) => ({ ...v, color: colors[v.sender] ?? '#94a3b8' }));
  }

  const totalMessages = coreStats.perSender.reduce((sum, s) => sum + s.messageCount, 0);
  const busiestDayDate = formatDate(new Date(`${busiestDay.date}T12:00:00`).getTime(), language);
  const silence = conversationGapStats.longestSilenceRange;
  const spanDays = Math.max(
    1,
    Math.round((coreStats.lastMessage.timestamp.getTime() - coreStats.firstMessage.timestamp.getTime()) / MS_PER_DAY) + 1
  );

  function handleShareToWhatsApp() {
    trackEvent('results_shared');
    const shareUrl = buildStatsShareUrl(buildStatsSharePayload(analysis, fileName, language));
    const text = buildStatsShareText(dictionary, shareUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function handleShareImage() {
    trackEvent('image_shared');
    const topSender = [...personaBreakdown.messageCount].sort((a, b) => b.value - a.value)[0];
    const topStreak = [...personaBreakdown.streakDays].sort((a, b) => b.value - a.value)[0];
    // The single most shareable "you are the ___" badge for this chat — the
    // whole point of a share image is to be about *someone*, not just numbers.
    const headlinePersona = pickHeadlinePersona(personas);
    const formattedPersona = headlinePersona ? formatPersona(headlinePersona, dictionary) : undefined;
    const blob = await generateShareImageBlob({
      appTitle: dictionary.app.title,
      totalMessages,
      totalMessagesLabel: dictionary.stats.totalMessages,
      spanDays,
      spanLabel: formatTemplate(dictionary.stats.dateRangeValue, {
        start: formatDate(coreStats.firstMessage.timestamp.getTime(), language),
        end: formatDate(coreStats.lastMessage.timestamp.getTime(), language),
      }),
      topSenderName: topSender?.sender,
      topSenderCount: topSender?.value,
      topSenderLabel: dictionary.stats.topSenderLabel,
      topStreakName: topStreak?.sender,
      topStreakDays: topStreak?.value,
      topStreakLabel: dictionary.stats.streakDays,
      busiestDayDate,
      busiestDayCount: busiestDay.count,
      busiestDayLabel: dictionary.stats.busiestDayTitle,
      busiestDayCountLabel: formatTemplate(dictionary.stats.messagesCountCaption, { count: busiestDay.count }),
      ctaText: dictionary.stats.shareImageCta,
      urlText: window.location.host,
      dir: language === 'he' ? 'rtl' : 'ltr',
      gradient: theme.hexStops,
      personaIcon: formattedPersona?.icon,
      personaText: formattedPersona?.text,
    });
    await shareOrDownloadImage(blob, 'whatsapp-wrapped.png', dictionary.app.title, dictionary.stats.shareIntro);
  }

  let headline: string | null = null;
  if (fileName) {
    const { name, isGroup: nameIsGroup } = parseChatName(fileName, senders);
    if (name) {
      const template = nameIsGroup ? dictionary.wrapped.headlineGroup : dictionary.wrapped.headlineWith;
      headline = formatTemplate(template, { name });
    }
  }

  const backLabel = isExample ? dictionary.onboarding.exampleCta : dictionary.stats.backButton;

  const model: StatsViewModel = {
    title: dictionary.stats.title,
    subtitle: dictionary.stats.subtitle,
    headline,
    isExample,
    exampleBadgeLabel: dictionary.onboarding.exampleBadge,
    backLabel,
    onBack,
    shareLabel: dictionary.stats.shareButton,
    onShare: handleShareToWhatsApp,
    shareImageLabel: dictionary.stats.shareImageButton,
    onShareImage: handleShareImage,
    titleGradientClasses: theme.gradientClasses,
    overviewTitle: dictionary.stats.overviewTitle,
    overviewTiles: [
      {
        icon: '💬',
        value: String(totalMessages),
        label: dictionary.stats.totalMessages,
        gradient: HEADLINE_GRADIENT,
      },
      {
        icon: '📅',
        value: `${spanDays} ${dictionary.stats.daysSuffix}`,
        label: dictionary.stats.dateRangeTitle,
        caption: formatTemplate(dictionary.stats.dateRangeValue, {
          start: formatDate(coreStats.firstMessage.timestamp.getTime(), language),
          end: formatDate(coreStats.lastMessage.timestamp.getTime(), language),
        }),
        gradient: OUTRO_GRADIENT,
      },
      {
        icon: '💥',
        value: busiestDayDate,
        label: dictionary.stats.busiestDayTitle,
        caption: formatTemplate(dictionary.stats.messagesCountCaption, { count: busiestDay.count }),
        gradient: BUSIEST_DAY_GRADIENT,
      },
      ...(silence
        ? [
            {
              icon: '🌙',
              value: `${Math.round(conversationGapStats.longestSilenceHours)} ${dictionary.stats.hoursSuffix}`,
              label: dictionary.stats.longestSilenceTitle,
              caption: formatTemplate(dictionary.stats.dateRangeValue, {
                start: formatDate(silence.before.timestamp.getTime(), language),
                end: formatDate(silence.after.timestamp.getTime(), language),
              }),
              gradient: PERSONA_GRADIENTS.nightOwl,
            },
          ]
        : []),
    ],
    blocks: [
      // Free blocks first, locked ones pushed to the bottom — so the page
      // opens with content everyone can actually see, and the paywall
      // teasers read as "there's more below" rather than interrupting.
      { kind: 'pie', title: dictionary.stats.messageCount, entries: withColors(personaBreakdown.messageCount) },
      { kind: 'pie', title: dictionary.stats.emojiCount, entries: withColors(personaBreakdown.emojiCount) },
      {
        kind: 'topEmojis',
        title: dictionary.stats.topEmojisTitle,
        rows: coreStats.perSender.map((s) => ({
          sender: s.sender,
          color: colors[s.sender] ?? '#94a3b8',
          emojis: s.topEmojis.slice(0, 3),
        })),
      },
      { kind: 'pie', title: dictionary.stats.laughsTriggered, entries: withColors(personaBreakdown.laughsTriggered) },
      {
        kind: 'bar',
        title: dictionary.stats.streakDays,
        entries: withColors(personaBreakdown.streakDays),
        valueSuffix: ` ${dictionary.stats.daysSuffix}`,
        locked: !userIsPremium,
      },
      {
        kind: 'bar',
        title: dictionary.stats.avgReplyMinutes,
        entries: withColors(personaBreakdown.avgReplyMinutes),
        valueSuffix: ` ${dictionary.stats.minutesSuffix}`,
        locked: !userIsPremium,
      },
      {
        kind: 'pie',
        title: dictionary.stats.conversationStarterCount,
        entries: withColors(personaBreakdown.conversationStarterCount),
        locked: !userIsPremium,
      },
      {
        kind: 'bar',
        title: dictionary.stats.wordsPerMessage,
        entries: withColors(personaBreakdown.wordsPerMessage),
        locked: !userIsPremium,
      },
      ...(isGroup
        ? [
            {
              kind: 'pie' as const,
              title: dictionary.stats.mentionedCount,
              entries: withColors(personaBreakdown.mentionedCount),
              locked: !userIsPremium,
            },
          ]
        : []),
    ],
    likedItHeading: dictionary.stats.likedItHeading,
    tryItYourselfLabel: dictionary.stats.tryItYourselfButton,
    onTryItYourself: onBack,
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
