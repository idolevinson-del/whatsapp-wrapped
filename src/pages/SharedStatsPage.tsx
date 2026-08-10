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
import { MAX_BONUS_SLOTS, getBonusSlots, redeemShareBonus } from '../lib/shareBonus';
import { DEFAULT_THEME } from '../lib/themes';
import { formatPersona, pickHeadlinePersonaFromBreakdown } from '../lib/headlinePersona';
import { trackEvent } from '../analytics';
import { CONVERSATION_GAP_HOURS } from '../config/analysisConfig';
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
  const { dictionary, language, direction, setLanguage } = useLanguage();
  const [showPremium, setShowPremium] = useState(false);
  const [, forcePremiumRefresh] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const userIsPremium = isPremium();

  // Growth lever: sharing (even re-sharing a link you received) raises the
  // viewer's own free lifetime cap by one, up to MAX_BONUS_SLOTS — see
  // lib/shareBonus.ts and StatsPage's identical helper. Every share still
  // gets a visible confirmation, not just the ones that grant a new slot.
  function maybeShowShareBonusToast() {
    const earnedNewSlot = !userIsPremium && redeemShareBonus();
    setToastMessage(earnedNewSlot ? dictionary.premium.shareBonusEarned : dictionary.premium.shareThanks);
    setTimeout(() => setToastMessage(null), 4000);
  }

  const showShareBonusHint = !userIsPremium && getBonusSlots() < MAX_BONUS_SLOTS;

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
    maybeShowShareBonusToast();
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
      dir: direction,
      gradient: DEFAULT_THEME.hexStops,
      personaIcon: formattedPersona?.icon,
      personaText: formattedPersona?.text,
    });
    await shareOrDownloadImage(blob, 'whatsapp-wrapped.png', dictionary.app.title, dictionary.stats.shareIntro);
    maybeShowShareBonusToast();
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
    shareBonusHint: showShareBonusHint ? dictionary.stats.shareBonusHint : null,
    shareImageLabel: dictionary.stats.shareImageButton,
    onShareImage: handleShareImage,
    titleGradientClasses: DEFAULT_THEME.gradientClasses,
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
      {
        kind: 'pie',
        title: dictionary.stats.messageCount,
        entries: withColors(payload.pb.mc),
        infoText: dictionary.stats.messageCountInfo,
      },
      {
        kind: 'pie',
        title: dictionary.stats.emojiCount,
        entries: withColors(payload.pb.ec),
        infoText: dictionary.stats.emojiCountInfo,
      },
      {
        kind: 'topEmojis',
        title: dictionary.stats.topEmojisTitle,
        rows: payload.s.map((sender, i) => ({
          sender,
          color: colors[sender] ?? '#94a3b8',
          emojis: (payload.te[i] ?? []).map(([value, count]) => ({ value, count })),
        })),
        infoText: dictionary.stats.topEmojisInfo,
      },
      {
        kind: 'pie',
        title: dictionary.stats.laughsTriggered,
        entries: withColors(payload.pb.lt),
        infoText: dictionary.stats.laughsTriggeredInfo,
      },
      {
        kind: 'bar',
        title: dictionary.stats.streakDays,
        entries: withColors(payload.pb.sd),
        valueSuffix: ` ${dictionary.stats.daysSuffix}`,
        locked: !userIsPremium,
        infoText: dictionary.stats.streakDaysInfo,
      },
      {
        kind: 'bar',
        title: dictionary.stats.avgReplyMinutes,
        entries: withColors(payload.pb.arm),
        valueSuffix: ` ${dictionary.stats.minutesSuffix}`,
        locked: !userIsPremium,
        infoText: formatTemplate(dictionary.stats.avgReplyMinutesInfo, { hours: CONVERSATION_GAP_HOURS }),
      },
      {
        kind: 'pie',
        title: dictionary.stats.conversationStarterCount,
        entries: withColors(payload.pb.csc),
        locked: !userIsPremium,
        infoText: formatTemplate(dictionary.stats.conversationStarterCountInfo, { hours: CONVERSATION_GAP_HOURS }),
      },
      {
        kind: 'bar',
        title: dictionary.stats.wordsPerMessage,
        entries: withColors(payload.pb.wpm),
        locked: !userIsPremium,
        infoText: dictionary.stats.wordsPerMessageInfo,
      },
      ...(isGroup
        ? [
            {
              kind: 'pie' as const,
              title: dictionary.stats.mentionedCount,
              entries: withColors(payload.pb.mnc),
              locked: !userIsPremium,
              infoText: dictionary.stats.mentionedCountInfo,
            },
          ]
        : []),
    ],
    likedItHeading: dictionary.stats.likedItHeading,
    tryItYourselfLabel: dictionary.stats.tryItYourselfButton,
    onTryItYourself: goHome,
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
