import { useLanguage } from '../i18n';
import { LanguageToggle } from '../components/LanguageToggle';
import { StatSection } from '../components/charts/StatSection';
import { buildSenderColorMap } from '../lib/senderColors';
import type { AnalysisResult, SenderValue } from '../analysis';

interface StatsPageProps {
  analysis: AnalysisResult;
  onBack: () => void;
}

export function StatsPage({ analysis, onBack }: StatsPageProps) {
  const { dictionary } = useLanguage();
  const { personaBreakdown, coreStats } = analysis;
  const senders = coreStats.perSender.map((s) => s.sender);
  const colors = buildSenderColorMap(senders);
  const isGroup = personaBreakdown.mentionedCount.length > 0;

  function withColors(values: SenderValue[]) {
    return values.map((v) => ({ ...v, color: colors[v.sender] ?? '#94a3b8' }));
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            ← {dictionary.stats.backButton}
          </button>
          <LanguageToggle />
        </div>

        <h1 className="mt-6 bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          {dictionary.stats.title}
        </h1>
        <p className="mt-2 text-neutral-400">{dictionary.stats.subtitle}</p>

        <div className="mt-6 space-y-4">
          <StatSection
            title={dictionary.stats.messageCount}
            kind="pie"
            entries={withColors(personaBreakdown.messageCount)}
          />
          <StatSection
            title={dictionary.stats.emojiCount}
            kind="pie"
            entries={withColors(personaBreakdown.emojiCount)}
          />
          <StatSection
            title={dictionary.stats.laughsTriggered}
            kind="pie"
            entries={withColors(personaBreakdown.laughsTriggered)}
          />
          <StatSection
            title={dictionary.stats.conversationStarterCount}
            kind="pie"
            entries={withColors(personaBreakdown.conversationStarterCount)}
          />
          {isGroup && (
            <StatSection
              title={dictionary.stats.mentionedCount}
              kind="pie"
              entries={withColors(personaBreakdown.mentionedCount)}
            />
          )}

          <StatSection
            title={dictionary.stats.wordsPerMessage}
            kind="bar"
            entries={withColors(personaBreakdown.wordsPerMessage)}
          />
          <StatSection
            title={dictionary.stats.avgReplyMinutes}
            kind="bar"
            entries={withColors(personaBreakdown.avgReplyMinutes)}
            valueSuffix={` ${dictionary.stats.minutesSuffix}`}
          />
          <StatSection
            title={dictionary.stats.streakDays}
            kind="bar"
            entries={withColors(personaBreakdown.streakDays)}
            valueSuffix={` ${dictionary.stats.daysSuffix}`}
          />
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
