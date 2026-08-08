import { formatTemplate, useLanguage } from '../i18n';
import { LanguageToggle } from '../components/LanguageToggle';
import { StatSection } from '../components/charts/StatSection';
import { StatTile } from '../components/charts/StatTile';
import { HEADLINE_GRADIENT, OUTRO_GRADIENT, BUSIEST_DAY_GRADIENT, PERSONA_GRADIENTS } from '../components/cards/cardStyles';
import { buildSenderColorMap } from '../lib/senderColors';
import { formatDate } from '../lib/formatDate';
import { parseChatName } from '../lib/parseChatName';
import { buildStatsShareText } from '../lib/shareText';
import { trackEvent } from '../analytics';
import type { AnalysisResult, SenderValue } from '../analysis';

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
  const { personaBreakdown, coreStats, conversationGapStats, busiestDay } = analysis;
  const senders = coreStats.perSender.map((s) => s.sender);
  const colors = buildSenderColorMap(senders);
  const isGroup = personaBreakdown.mentionedCount.length > 0;

  function withColors(values: SenderValue[]) {
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
    const text = buildStatsShareText(analysis, dictionary, language, window.location.origin);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            ← {backLabel}
          </button>
          <LanguageToggle />
        </div>

        {isExample && (
          <div className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            {dictionary.onboarding.exampleBadge}
          </div>
        )}

        <h1 className="mt-4 bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          {dictionary.stats.title}
        </h1>
        <p className="mt-2 text-neutral-400">{headline ?? dictionary.stats.subtitle}</p>

        <button
          type="button"
          onClick={handleShareToWhatsApp}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/20 transition-colors hover:bg-[#1fb959]"
        >
          <span className="text-lg">🔗</span>
          {dictionary.stats.shareButton}
        </button>

        <div className="mt-6 space-y-4">
          {/* Overview — chat-wide facts, not per-sender. A KPI grid, not a chart. */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
              {dictionary.stats.overviewTitle}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatTile
                icon="💬"
                value={String(totalMessages)}
                label={dictionary.stats.totalMessages}
                gradient={HEADLINE_GRADIENT}
              />
              <StatTile
                icon="📅"
                value={`${spanDays} ${dictionary.stats.daysSuffix}`}
                label={dictionary.stats.dateRangeTitle}
                caption={formatTemplate(dictionary.stats.dateRangeValue, {
                  start: formatDate(coreStats.firstMessage.timestamp.getTime(), language),
                  end: formatDate(coreStats.lastMessage.timestamp.getTime(), language),
                })}
                gradient={OUTRO_GRADIENT}
              />
              <StatTile
                icon="💥"
                value={busiestDayDate}
                label={dictionary.stats.busiestDayTitle}
                caption={formatTemplate(dictionary.stats.messagesCountCaption, { count: busiestDay.count })}
                gradient={BUSIEST_DAY_GRADIENT}
              />
              {silence && (
                <StatTile
                  icon="🌙"
                  value={`${Math.round(conversationGapStats.longestSilenceHours)} ${dictionary.stats.hoursSuffix}`}
                  label={dictionary.stats.longestSilenceTitle}
                  caption={formatTemplate(dictionary.stats.dateRangeValue, {
                    start: formatDate(silence.before.timestamp.getTime(), language),
                    end: formatDate(silence.after.timestamp.getTime(), language),
                  })}
                  gradient={PERSONA_GRADIENTS.nightOwl}
                />
              )}
            </div>
          </div>

          <StatSection
            title={dictionary.stats.messageCount}
            kind="pie"
            entries={withColors(personaBreakdown.messageCount)}
          />
          <StatSection
            title={dictionary.stats.streakDays}
            kind="bar"
            entries={withColors(personaBreakdown.streakDays)}
            valueSuffix={` ${dictionary.stats.daysSuffix}`}
          />
          <StatSection
            title={dictionary.stats.avgReplyMinutes}
            kind="bar"
            entries={withColors(personaBreakdown.avgReplyMinutes)}
            valueSuffix={` ${dictionary.stats.minutesSuffix}`}
          />
          <StatSection
            title={dictionary.stats.conversationStarterCount}
            kind="pie"
            entries={withColors(personaBreakdown.conversationStarterCount)}
          />
          <StatSection
            title={dictionary.stats.wordsPerMessage}
            kind="bar"
            entries={withColors(personaBreakdown.wordsPerMessage)}
          />
          <StatSection
            title={dictionary.stats.emojiCount}
            kind="pie"
            entries={withColors(personaBreakdown.emojiCount)}
          />

          {/* Top emojis — which emoji each person favors, not just how many. */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
              {dictionary.stats.topEmojisTitle}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {coreStats.perSender.map((s) => (
                <li key={s.sender} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colors[s.sender] }}
                    />
                    <span className="truncate">{s.sender}</span>
                  </span>
                  <span className="flex shrink-0 gap-3 font-mono text-white/80">
                    {s.topEmojis.length > 0 ? (
                      s.topEmojis.slice(0, 3).map((e) => (
                        <span key={e.value}>
                          {e.value} <span className="text-white/50">{e.count}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <StatSection
            title={dictionary.stats.laughsTriggered}
            kind="pie"
            entries={withColors(personaBreakdown.laughsTriggered)}
          />
          {isGroup && (
            <StatSection
              title={dictionary.stats.mentionedCount}
              kind="pie"
              entries={withColors(personaBreakdown.mentionedCount)}
            />
          )}

          <div className="pt-2 pb-4 text-center">
            <p className="text-sm text-white/70">{dictionary.stats.likedItHeading}</p>
            <button
              type="button"
              onClick={onBack}
              className="mt-3 cursor-pointer rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 px-6 py-3 text-sm font-semibold text-neutral-950 hover:opacity-90"
            >
              {dictionary.stats.tryItYourselfButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
