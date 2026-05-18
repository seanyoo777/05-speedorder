import type { ResearchFeedItem } from '../../research/researchFeedTypes'

type Props = {
  item: ResearchFeedItem
}

function directionClass(direction: ResearchFeedItem['direction']): string {
  if (direction === 'long') return 'text-so-bid border-so-bid/40'
  if (direction === 'short') return 'text-so-ask border-so-ask/40'
  return 'text-zinc-300 border-so-border'
}

export function ResearchFeedCard({ item }: Props) {
  return (
    <article className="rounded border border-so-border bg-so-bg/50 p-2">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
        <span className="font-mono text-[10px] text-violet-300">{item.strategyType}</span>
        <span
          className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${directionClass(item.direction)}`}
        >
          {item.direction}
        </span>
      </div>
      <p className="mb-1 text-[10px] leading-snug text-zinc-200">{item.reasoningSummary}</p>
      <div className="mb-1 flex flex-wrap gap-1">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-so-surface px-1 py-0.5 font-mono text-[8px] text-so-muted"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-1 font-mono text-[9px] text-so-muted">
        <span>conf {item.confidenceMock}%</span>
        <span>{item.marketType}</span>
        <span>regime {item.marketRegimeRef}</span>
        {item.publishedAt ? <span>{item.publishedAt}</span> : null}
      </div>
    </article>
  )
}
