import { StatSection } from '../components/charts/StatSection';
import { StatTile } from '../components/charts/StatTile';
import { LanguagePicker } from '../components/LanguagePicker';
import { LockedOverlay } from '../components/LockedOverlay';
import { Toast } from '../components/Toast';
import type { StatsViewModel } from './statsViewModel';

/** Purely presentational — renders a StatsViewModel, regardless of whether it
 * came from a live analysis or a decoded share link. */
export function StatsView({ model }: { model: StatsViewModel }) {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={model.onBack}
            className="cursor-pointer rounded-full border border-white/40 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            ← {model.backLabel}
          </button>
          <LanguagePicker />
        </div>

        {model.isExample && model.exampleBadgeLabel && (
          <div className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            {model.exampleBadgeLabel}
          </div>
        )}

        <h1 className={`mt-4 bg-gradient-to-r ${model.titleGradientClasses} bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl`}>
          {model.title}
        </h1>
        <p className="mt-2 text-neutral-400">{model.headline ?? model.subtitle}</p>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={model.onShare}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/20 transition-colors hover:bg-[#1fb959]"
          >
            <span className="text-lg">🔗</span>
            {model.shareLabel}
          </button>
          <button
            type="button"
            onClick={model.onShareImage}
            aria-label={model.shareImageLabel}
            title={model.shareImageLabel}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-colors hover:bg-white/10"
          >
            <span className="text-lg">📸</span>
          </button>
        </div>
        {model.shareBonusHint && <p className="mt-1.5 text-center text-xs text-neutral-500">{model.shareBonusHint}</p>}

        <div className="mt-6 space-y-4">
          {/* Overview — chat-wide facts, not per-sender. A KPI grid, not a chart. */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">{model.overviewTitle}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {model.overviewTiles.map((tile, i) => (
                <StatTile
                  key={i}
                  icon={tile.icon}
                  value={tile.value}
                  label={tile.label}
                  caption={tile.caption}
                  gradient={tile.gradient}
                />
              ))}
            </div>
          </div>

          {model.blocks.map((block, i) => {
            // Locking only ever blurs the data below a block's title — the
            // title itself always stays readable, so a free visitor can see
            // *what* they'd be unlocking (e.g. "Avg. Reply Time") before
            // deciding whether to pay for it, instead of a mystery lock icon.
            if (block.kind === 'topEmojis') {
              if (block.rows.length === 0) return null;
              return (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">{block.title}</h3>
                  <div className="relative mt-4 overflow-hidden rounded-xl">
                    <ul
                      className={block.locked ? 'space-y-2.5 blur-2xl pointer-events-none select-none' : 'space-y-2.5'}
                      aria-hidden={block.locked || undefined}
                    >
                      {block.rows.map((row) => (
                        <li key={row.sender} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2 font-medium">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="truncate">{row.sender}</span>
                          </span>
                          <span className="flex shrink-0 gap-3 font-mono text-white/80">
                            {row.emojis.length > 0 ? (
                              row.emojis.map((e) => (
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
                    {block.locked && <LockedOverlay onOpenPremium={model.onOpenPremium} label={model.premiumCtaLabel} />}
                  </div>
                </div>
              );
            }

            return (
              <StatSection
                key={i}
                title={block.title}
                kind={block.kind}
                entries={block.entries}
                valueSuffix={block.valueSuffix}
                locked={block.locked}
                onOpenPremium={model.onOpenPremium}
                lockLabel={model.premiumCtaLabel}
              />
            );
          })}

          <div className="pt-2 pb-4 text-center">
            <p className="text-sm text-white/70">{model.likedItHeading}</p>
            <button
              type="button"
              onClick={model.onTryItYourself}
              className={`mt-3 cursor-pointer rounded-full bg-gradient-to-r ${model.titleGradientClasses} px-6 py-3 text-sm font-semibold text-neutral-950 hover:opacity-90`}
            >
              {model.tryItYourselfLabel}
            </button>
          </div>
        </div>
      </div>
      {model.toastMessage && <Toast message={model.toastMessage} />}
    </div>
  );
}
