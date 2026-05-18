import { SPEED_ORDER_FEATURE_FLAGS } from '../../selftest/featureFlags'
import { readMockResearchFeedSnapshot } from '../../research/mockResearchFeedAdapter'
import { useTradingStore } from '../../store/tradingStore'
import { ResearchFeedCard } from './ResearchFeedCard'

export function ResearchFeedPanel() {
  const symbol = useTradingStore((s) => s.symbol)

  if (!SPEED_ORDER_FEATURE_FLAGS.enableResearchFeedPanel) {
    return null
  }
  const feed = readMockResearchFeedSnapshot({ symbol })

  return (
    <section
      className="flex max-h-[220px] shrink-0 flex-col gap-1.5 rounded-md border border-violet-500/30 bg-so-surface/80 p-2"
      data-testid="research-feed-panel"
    >
      <header className="flex flex-wrap items-center justify-between gap-1 border-b border-so-border/60 pb-1">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">
          OneAI Signal Research
        </h3>
        <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[8px] text-violet-200">
          mock · {feed.source}
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {feed.items.map((item) => (
          <ResearchFeedCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
