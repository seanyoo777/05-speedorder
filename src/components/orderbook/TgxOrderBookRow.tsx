import type { BookRow } from './orderBookModel'
import { formatCumShort, tgxDepthBarMetrics } from './orderBookModel'
import type { TgxOrderBookTokens } from './tgxOrderBookTokens'
import { isPriceNearTick } from './orderBookPriceIntent'

type Props = {
  row: BookRow
  side: 'ask' | 'bid'
  tokens: TgxOrderBookTokens
  rowDisplayPrice: number
  tickSize: number
  maxCum: number
  maxQty: number
  fmtP: (n: number) => string
  fmtQ: (n: number) => string
  qtyDecimals: number
  highlightPrice: number | null
  lockedTriggerPrice: number | null
  isHovered: boolean
  onHover: (key: string | null) => void
  onClick: () => void
  onDoubleClick: () => void
}

export function TgxOrderBookRow({
  row,
  side,
  tokens,
  rowDisplayPrice,
  tickSize,
  maxCum,
  maxQty,
  fmtP,
  fmtQ,
  qtyDecimals,
  highlightPrice,
  lockedTriggerPrice,
  isHovered,
  onHover,
  onClick,
  onDoubleClick,
}: Props) {
  const rowKey = `${side}-${rowDisplayPrice}`
  const { widthPct, alpha } = tgxDepthBarMetrics(row.cum, row.quantity, maxCum, maxQty)
  const rgb = side === 'ask' ? tokens.askDepthRgb : tokens.bidDepthRgb
  const depthStyle = {
    width: `${widthPct}%`,
    background: `linear-gradient(90deg, rgba(${rgb},0) 0%, rgba(${rgb},${alpha * 0.35}) 42%, rgba(${rgb},${alpha}) 100%)`,
  } as const

  const qtyStrength = Math.min(1, row.quantity / maxQty)
  const qtyBarStyle = {
    width: `${qtyStrength * 100}%`,
    background: `linear-gradient(90deg, rgba(${tokens.qtyBarRgb},0.05) 0%, rgba(${tokens.qtyBarRgb},${0.12 + qtyStrength * 0.28}) 100%)`,
  } as const

  const intentHl =
    highlightPrice != null && isPriceNearTick(highlightPrice, rowDisplayPrice, tickSize)
  const lockHl =
    lockedTriggerPrice != null && isPriceNearTick(lockedTriggerPrice, rowDisplayPrice, tickSize)
  const priceClass = side === 'ask' ? tokens.askPriceClass : tokens.bidPriceClass

  return (
    <button
      type="button"
      data-testid={`tgx-book-row-${side}`}
      data-price={rowDisplayPrice}
      className={`group relative grid w-full min-w-0 shrink-0 grid-cols-[minmax(0,1.1fr)_minmax(0,0.75fr)_minmax(0,0.62fr)] items-stretch gap-x-1 border-b border-[#1f2937]/40 px-1 transition-[background,box-shadow] duration-75 ${tokens.rowHeightClass} ${tokens.rowFontClass} ${
        intentHl
          ? 'z-[2] bg-violet-500/14 ring-2 ring-inset ring-violet-400/55'
          : lockHl
            ? 'z-[1] bg-amber-500/10 ring-1 ring-inset ring-amber-400/40'
            : ''
      } ${
        isHovered && !intentHl
          ? 'z-[1] bg-[#0f1623]/95 ring-1 ring-inset ring-violet-500/25'
          : 'hover:bg-[#0d121c]/90'
      } active:bg-[#0b1118]`}
      onMouseEnter={() => onHover(rowKey)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-0"
        style={depthStyle}
      />
      <span
        className={`relative z-[1] flex min-w-0 items-center justify-end text-right font-mono [text-shadow:0_1px_0_rgba(0,0,0,0.65)] ${priceClass}`}
      >
        <span className="truncate">{fmtP(row.price)}</span>
      </span>
      <span className="relative z-[1] flex min-w-0 items-center justify-end text-right font-mono text-zinc-300">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-0 max-w-full"
          style={qtyBarStyle}
        />
        <span className="relative z-[1] truncate [text-shadow:0_1px_0_rgba(0,0,0,0.55)]">
          {fmtQ(row.quantity)}
        </span>
      </span>
      <span
        className="relative z-[1] flex min-w-0 items-center justify-end text-right font-mono text-zinc-500"
        title={String(row.cum)}
      >
        <span className="truncate">{formatCumShort(row.cum, qtyDecimals)}</span>
      </span>
    </button>
  )
}
