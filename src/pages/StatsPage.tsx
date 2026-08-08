import { formatTemplate, useLanguage } from '../i18n';
import { LanguageToggle } from '../components/LanguageToggle';
import { StatSection } from '../components/charts/StatSection';
import { buildSenderColorMap } from '../lib/senderColors';
import { formatDate } from '../lib/formatDate';
import { parseChatName } from '../lib/parseChatName';
import type { AnalysisResult, SenderValue } from '../analysis';

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

        <div className="mt-6 space-y-4">
          {/* Overview — chat-wide facts, not per-sender. */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
              {dictionary.stats.overviewTitle}
            </h3>
            <div className="mt-3 space-y-2 text-sm text-white/90">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/60">{dictionary.stats.totalMessages}</span>
                <span className="font-mono">{totalMessages}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/60">{dictionary.stats.dateRangeTitle}</span>
                <span className="font-mono">
                  {formatTemplate(dictionary.stats.dateRangeValue, {
                    start: formatDate(coreStats.firstMessage.timestamp.getTime(), language),
                    end: formatDate(coreStats.lastMessage.timestamp.getTime(), language),
                  })}
                </span>
              </div>
              <p className="pt-1 text-white/80">
                {formatTemplate(dictionary.wrapped.busiestDayText, { date: busiestDayDate, count: busiestDay.count })}
              </p>
              {silence && (
                <p className="text-white/80">
                  {formatTemplate(dictionary.stats.longestSilenceText, {
                    hours: Math.round(conversationGapStats.longestSilenceHours),
                    before: formatDate(silence.before.timestamp.getTime(), language),
                    after: formatDate(silence.after.timestamp.getTime(), language),
                  })}
                </p>
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
          <StatSection
            title={dictionary.stats.nightOwlPercent}
            kind="bar"
            entries={withColors(personaBreakdown.nightOwlPercent)}
            valueSuffix="%"
          />
          <StatSection
            title={dictionary.stats.earlyBirdPercent}
            kind="bar"
            entries={withColors(personaBreakdown.earlyBirdPercent)}
            valueSuffix="%"
          />
        </div>
      </div>
    </div>
  );
}
