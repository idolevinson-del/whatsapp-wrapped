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
import { MAX_BONUS_SLOTS, getBonusSlots, redeemShareBonus } from '../lib/shareBonus';
import { useToast } from '../lib/useToast';
import { DEFAULT_THEME } from '../lib/themes';
import { formatShareBadges } from '../lib/headlinePersona';
import { trackEvent } from '../analytics';
import { CONVERSATION_GAP_HOURS } from '../config/analysisConfig';
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
  const { dictionary, language, direction } = useLanguage();
  const { personas, personaBreakdown, coreStats, conversationGapStats, busiestDay } = analysis;
  const senders = coreStats.perSender.map((s) => s.sender);
  const colors = buildSenderColorMap(senders);
  const isGroup = personaBreakdown.mentionedCount.length > 0;
  const [showPremium, setShowPremium] = useState(false);
  const [, forcePremiumRefresh] = useState(0);
  const { message: toastMessage, show: showToast } = useToast();
  const userIsPremium = isPremium();

  function withColors(values: { sender: string; value: number }[]) {
    return values.map((v) => ({ ...v, color: colors[v.sender] ?? '#94a3b8' }));
  }

  // Growth lever: sharing raises the free lifetime cap by one, up to
  // MAX_BONUS_SLOTS (see lib/shareBonus.ts). Every share still gets a
  // visible confirmation, not just the ones that grant a new slot — a
  // silent "did that even work?" moment (premium users, or a free user
  // already at the cap) reads as a bug even though nothing's actually wrong.
  // useToast (not a plain setTimeout) so the confirmation survives the tab
  // being backgrounded — which is exactly what happens on mobile the
  // instant "Share to WhatsApp" deep-links into the WhatsApp app.
  function maybeShowShareBonusToast() {
    const earnedNewSlot = !userIsPremium && redeemShareBonus();
    showToast(earnedNewSlot ? dictionary.premium.shareBonusEarned : dictionary.premium.shareThanks);
  }

  // The hint under the share buttons: only worth showing while there's
  // still something real to gain from sharing.
  const showShareBonusHint = !userIsPremium && getBonusSlots() < MAX_BONUS_SLOTS;

  const totalMessages = coreStats.perSender.reduce((sum, s) => sum + s.messageCount, 0);
  const busiestDayDate = formatDate(new Date(`${busiestDay.date}T12:00:00`).getTime(), language);
  const silence = conversationGapStats.longestSilenceRange;
  const spanDays = Math.max(
    1,
    Math.round((coreStats.lastMessage.timestamp.getTime() - coreStats.firstMessage.timestamp.getTime()) / MS_PER_DAY) + 1
  );

  // The single share action: generates the "Wrapped" badge image and hands
  // it to the OS share sheet (WhatsApp is one of the targets there — wa.me
  // links can't carry a file attachment at all, so there's no way to jump
  // straight into WhatsApp *with the image* the way the old text-only
  // button jumped straight into a chat). The link is still real and
  // clickable — it travels in the share sheet's caption text, not baked
  // into the image's pixels.
  async function handleShareToWhatsApp() {
    trackEvent('results_shared');
    const shareUrl = buildStatsShareUrl(buildStatsSharePayload(analysis, fileName, language));
    const badges = formatShareBadges(personas, dictionary, isGroup);
    const blob = await generateShareImageBlob({
      appTitle: dictionary.app.title,
      totalMessages,
      totalMessagesLabel: dictionary.stats.totalMessages,
      spanDays,
      spanLabel: formatTemplate(dictionary.stats.dateRangeValue, {
        start: formatDate(coreStats.firstMessage.timestamp.getTime(), language),
        end: formatDate(coreStats.lastMessage.timestamp.getTime(), language),
      }),
      busiestDayDate,
      busiestDayCount: busiestDay.count,
      busiestDayLabel: dictionary.stats.busiestDayTitle,
      busiestDayCountLabel: formatTemplate(dictionary.stats.messagesCountCaption, { count: busiestDay.count }),
      ctaText: dictionary.stats.shareImageCta,
      urlText: window.location.host,
      dir: direction,
      gradient: DEFAULT_THEME.hexStops,
      badges,
    });
    await shareOrDownloadImage(blob, 'whatsapp-wrapped.png', dictionary.app.title, buildStatsShareText(dictionary, shareUrl));
    maybeShowShareBonusToast();
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
    shareBonusHint: showShareBonusHint ? dictionary.stats.shareBonusHint : null,
    titleGradientClasses: DEFAULT_THEME.gradientClasses,
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
      {
        kind: 'pie',
        title: dictionary.stats.messageCount,
        entries: withColors(personaBreakdown.messageCount),
        infoText: dictionary.stats.messageCountInfo,
      },
      {
        kind: 'pie',
        title: dictionary.stats.emojiCount,
        entries: withColors(personaBreakdown.emojiCount),
        infoText: dictionary.stats.emojiCountInfo,
      },
      {
        kind: 'topEmojis',
        title: dictionary.stats.topEmojisTitle,
        rows: coreStats.perSender.map((s) => ({
          sender: s.sender,
          color: colors[s.sender] ?? '#94a3b8',
          emojis: s.topEmojis.slice(0, 3),
        })),
        infoText: dictionary.stats.topEmojisInfo,
      },
      {
        kind: 'pie',
        title: dictionary.stats.laughsTriggered,
        entries: withColors(personaBreakdown.laughsTriggered),
        infoText: dictionary.stats.laughsTriggeredInfo,
      },
      {
        kind: 'bar',
        title: dictionary.stats.streakDays,
        entries: withColors(personaBreakdown.streakDays),
        valueSuffix: ` ${dictionary.stats.daysSuffix}`,
        locked: !userIsPremium,
        infoText: dictionary.stats.streakDaysInfo,
      },
      {
        kind: 'bar',
        title: dictionary.stats.avgReplyMinutes,
        entries: withColors(personaBreakdown.avgReplyMinutes),
        valueSuffix: ` ${dictionary.stats.minutesSuffix}`,
        locked: !userIsPremium,
        infoText: formatTemplate(dictionary.stats.avgReplyMinutesInfo, { hours: CONVERSATION_GAP_HOURS }),
      },
      {
        kind: 'pie',
        title: dictionary.stats.conversationStarterCount,
        entries: withColors(personaBreakdown.conversationStarterCount),
        locked: !userIsPremium,
        infoText: formatTemplate(dictionary.stats.conversationStarterCountInfo, { hours: CONVERSATION_GAP_HOURS }),
      },
      {
        kind: 'bar',
        title: dictionary.stats.wordsPerMessage,
        entries: withColors(personaBreakdown.wordsPerMessage),
        locked: !userIsPremium,
        infoText: dictionary.stats.wordsPerMessageInfo,
      },
      ...(isGroup
        ? [
            {
              kind: 'pie' as const,
              title: dictionary.stats.mentionedCount,
              entries: withColors(personaBreakdown.mentionedCount),
              locked: !userIsPremium,
              infoText: dictionary.stats.mentionedCountInfo,
            },
          ]
        : []),
      {
        kind: 'pie',
        title: dictionary.stats.curseWordCount,
        entries: withColors(personaBreakdown.curseWordCount),
        locked: !userIsPremium,
        infoText: dictionary.stats.curseWordCountInfo,
      },
      {
        kind: 'pie',
        title: dictionary.stats.voiceMessageCount,
        entries: withColors(personaBreakdown.voiceMessageCount),
        locked: !userIsPremium,
        infoText: dictionary.stats.voiceMessageCountInfo,
      },
    ],
    likedItHeading: dictionary.stats.likedItHeading,
    tryItYourselfLabel: dictionary.stats.tryItYourselfButton,
    onTryItYourself: onBack,
    onOpenPremium: () => setShowPremium(true),
    premiumCtaLabel: dictionary.premium.buyButton,
    toastMessage,
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
