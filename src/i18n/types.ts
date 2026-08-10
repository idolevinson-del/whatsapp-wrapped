export type Language = 'en' | 'he' | 'es' | 'pt' | 'ar' | 'fr';
export type Direction = 'ltr' | 'rtl';

export type PersonaId =
  | 'nightOwl'
  | 'earlyBird'
  | 'fastestReplier'
  | 'philosopher'
  | 'conversationStarter'
  | 'streaker'
  | 'emojiEnthusiast'
  | 'chatterbox'
  | 'comedian'
  | 'ghost'
  | 'mostMentioned';

export interface Dictionary {
  code: Language;
  app: {
    title: string;
    tagline: string;
  };
  upload: {
    description: string;
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    stageParsing: string;
    stageAnalyzing: string;
    /** Template with {fileName} */
    errorNotTxt: string;
    errorZipNoChat: string;
    errorNoMessages: string;
    errorUnknown: string;
    /** Link to the export guide page. */
    guideLink: string;
    /** Shown only to non-premium visitors, right under the description —
     * sets expectations up front rather than only at the limit wall.
     * Template with {count} — the free baseline (before any share bonus). */
    freeLimitNote: string;
  };
  exportGuide: {
    title: string;
    intro: string;
    androidTab: string;
    iphoneTab: string;
    androidSteps: string[];
    iphoneSteps: string[];
    withoutMediaTitle: string;
    withoutMediaNote: string;
    privacyNote: string;
    backButton: string;
  };
  history: {
    title: string;
    openButton: string;
    deleteButton: string;
    /** Template with {count}. */
    messageCountLabel: string;
    /** Template with {date}. */
    lastViewedLabel: string;
    confirmDeleteTitle: string;
    confirmDeleteMessage: string;
    confirmDeleteConfirm: string;
    confirmDeleteCancel: string;
    /** Button next to the history title that clears every saved chat. */
    clearAllButton: string;
    confirmClearAllTitle: string;
    confirmClearAllMessage: string;
  };
  onboarding: {
    bannerTitle: string;
    bannerSubtitle: string;
    viewExample: string;
    dismiss: string;
    /** Persistent link shown even after the first-visit banner is dismissed. */
    viewExampleLink: string;
    /** Badge shown on the Wrapped view when browsing the example. */
    exampleBadge: string;
    /** Outro button label when viewing the example (instead of "Upload another file"). */
    exampleCta: string;
  };
  wrapped: {
    outroTitle: string;
    outroSubtitle: string;
    restart: string;
    shareButton: string;
    shareUrlCopied: string;
    shareError: string;
    /** Button label on the outro card in shared-link view. */
    tryItYourself: string;
    /** Template with {date} and {count} for the busiest day card. */
    busiestDayText: string;
    /** Template with {name} — shown on the first card for a 1-on-1 chat. */
    headlineWith: string;
    /** Template with {name} — shown on the first card for a group chat. */
    headlineGroup: string;
    /** Link on the outro card to the full stats breakdown page. */
    viewAllStats: string;
  };
  /** Insight templates for persona badges. Each is a template with {sender} and {value}. */
  personas: Record<PersonaId, string>;
  /** The "all stats" breakdown page — now the main results page. */
  stats: {
    title: string;
    subtitle: string;
    backButton: string;
    shareButton: string;
    /** Small incentive line under the share button — shown only to
     * non-premium visitors who haven't maxed out the share bonus yet
     * (see lib/shareBonus.ts). */
    shareBonusHint: string;
    /** The whole WhatsApp share message, minus the link. Short and catchy by
     * design — no stat breakdown. Gender-neutral. */
    shareIntro: string;
    /** Bottom call-to-action printed on the shareable image card. */
    shareImageCta: string;
    /** Short badge labels printed on the shareable image's "Wrapped" badge
     * grid — see lib/headlinePersona.ts's pickShareBadges/
     * pickShareBadgesFromBreakdown for which persona each badge is derived
     * from. Free-tier stats only, by design — see SHARE_BADGE_IDS's doc
     * comment. Most Active and Funniest each have a Group/Solo variant:
     * "the group's ___" doesn't make sense in a 1-on-1 chat, so that one
     * uses a plain gender-neutral dual form (X/ית) instead — see
     * shareBadgeLabel's call sites for which is picked when. */
    badgeMostActiveGroup: string;
    badgeMostActiveSolo: string;
    badgeFunniestGroup: string;
    badgeFunniestSolo: string;
    badgeMostIgnored: string;
    /** Heading above the bottom "try it yourself" CTA button. */
    likedItHeading: string;
    tryItYourselfButton: string;
    overviewTitle: string;
    totalMessages: string;
    dateRangeTitle: string;
    /** Template with {start} and {end} (formatted dates). */
    dateRangeValue: string;
    busiestDayTitle: string;
    longestSilenceTitle: string;
    /** Template with {count}, used as a stat-tile caption. */
    messagesCountCaption: string;
    topWordTitle: string;
    /** Template with {count}, used as the top-word tile's caption. */
    topWordCaption: string;
    topEmojisTitle: string;
    messageCount: string;
    emojiCount: string;
    laughsTriggered: string;
    conversationStarterCount: string;
    mentionedCount: string;
    wordsPerMessage: string;
    avgReplyMinutes: string;
    streakDays: string;
    nightOwlPercent: string;
    earlyBirdPercent: string;
    minutesSuffix: string;
    daysSuffix: string;
    hoursSuffix: string;
    /** Plain-language explanations of how each stat is actually calculated,
     * shown via an ⓘ next to that stat's title (see InfoTooltip). Two are
     * templated with {hours} — the live value of CONVERSATION_GAP_HOURS. */
    messageCountInfo: string;
    emojiCountInfo: string;
    topEmojisInfo: string;
    laughsTriggeredInfo: string;
    streakDaysInfo: string;
    /** Template with {hours}. */
    avgReplyMinutesInfo: string;
    /** Template with {hours}. */
    conversationStarterCountInfo: string;
    wordsPerMessageInfo: string;
    mentionedCountInfo: string;
    /** "Potty Mouth" — curse-word count per sender, see analysis/curseWords.ts. */
    curseWordCount: string;
    curseWordCountInfo: string;
    /** "Voice Message King" — count only, no duration (see
     * isVoiceMessagePlaceholder's doc comment for why). */
    voiceMessageCount: string;
    voiceMessageCountInfo: string;
  };
  /** The one-time-purchase "Wrapped+" unlock: license key entry and feature
   * pitch. No accounts — the license key itself is the credential. */
  premium: {
    /** Entry-point link/button on the upload page. */
    entryLabel: string;
    modalTitle: string;
    pitch: string;
    /** Shown above the pitch when the modal opens because a free-tier limit
     * was hit (e.g. the 2-chat history cap), instead of the plain entry
     * point. Template with {count} — the free limit. */
    historyLimitReason: string;
    /** Bullet describing the locked per-sender chart blocks on the results page. */
    featureDeeperStats: string;
    featureHistory: string;
    buyButton: string;
    licenseLabel: string;
    licensePlaceholder: string;
    activateButton: string;
    activating: string;
    activateError: string;
    activeTitle: string;
    activeBody: string;
    deactivateButton: string;
    closeButton: string;
    /** Toast shown right after sharing earns a bonus free chat check — see
     * lib/shareBonus.ts. Only shown when a new slot was actually granted. */
    shareBonusEarned: string;
    /** Toast shown after sharing when no new bonus slot was granted (already
     * premium, or already at the bonus cap) — every share still gets some
     * visible confirmation, not silence. */
    shareThanks: string;
  };
}
