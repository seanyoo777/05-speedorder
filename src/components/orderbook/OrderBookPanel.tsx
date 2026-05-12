import { formatPrice, formatQty } from '../../utils/format'
import { safeArray } from '../../utils/safe'
import { useTradingStore } from '../../store/tradingStore'
import { PanelShell } from '../common/PanelShell'

type Row = { price: number; quantity: number; cum: number }

function buildAskRows(asks: { price: number; quantity: number }[]): Row[] {
  const asc = [...safeArray(asks)].sort((a, b) => a.price - b.price)
  let cum = 0
  const withCum = asc.map((l) => {
    cum += l.quantity
    return { ...l, cum }
  })
  return [...withCum].reverse()
}

function buildBidRows(bids: { price: number; quantity: number }[]): Row[] {
  const desc = [...safeArray(bids)].sort((a, b) => b.price - a.price)
  let cum = 0
  return desc.map((l) => {
    cum += l.quantity
    return { ...l, cum }
  })
}

export function OrderBookPanel() {
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const orderBook = useTradingStore((s) => s.orderBook)
  const askRows = buildAskRows(orderBook.asks)
  const bidRows = buildBidRows(orderBook.bids)

  return (
    <PanelShell title="호가 (Order Book)" className="h-full">
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-so-border text-[11px]">
        <div className="bg-so-surface px-2 py-1 text-so-muted">가격</div>
        <div className="bg-so-surface px-2 py-1 text-right text-so-muted">수량</div>
        <div className="bg-so-surface px-2 py-1 text-right text-so-muted">누적</div>
      </div>
      <div className="max-h-[min(42vh,320px)] overflow-y-auto">
        {askRows.map((r) => {
          const near = Math.abs(r.price - lastPrice) < (lastPrice > 1000 ? 50 : 0.1)
          return (
            <div
              key={`ask-${r.price}`}
              className={`grid grid-cols-[1fr_1fr_1fr] border-b border-so-border/60 text-[11px] ${
                near ? 'bg-red-500/10' : 'bg-so-surface'
              }`}
            >
              <div className="px-2 py-0.5 font-mono text-so-ask">{formatPrice(r.price)}</div>
              <div className="px-2 py-0.5 text-right font-mono text-so-muted">{formatQty(r.quantity)}</div>
              <div className="px-2 py-0.5 text-right font-mono text-so-muted">{formatQty(r.cum)}</div>
            </div>
          )
        })}
      </div>
      <div className="sticky top-0 z-10 border-y border-so-border bg-so-bg px-2 py-1.5 text-center font-mono text-sm font-semibold text-white">
        {formatPrice(lastPrice)}
      </div>
      <div className="max-h-[min(42vh,320px)] overflow-y-auto">
        {bidRows.map((r) => {
          const near = Math.abs(r.price - lastPrice) < (lastPrice > 1000 ? 50 : 0.1)
          return (
            <div
              key={`bid-${r.price}`}
              className={`grid grid-cols-[1fr_1fr_1fr] border-b border-so-border/60 text-[11px] ${
                near ? 'bg-emerald-500/10' : 'bg-so-surface'
              }`}
            >
              <div className="px-2 py-0.5 font-mono text-so-bid">{formatPrice(r.price)}</div>
              <div className="px-2 py-0.5 text-right font-mono text-so-muted">{formatQty(r.quantity)}</div>
              <div className="px-2 py-0.5 text-right font-mono text-so-muted">{formatQty(r.cum)}</div>
            </div>
          )
        })}
      </div>
    </PanelShell>
  )
}
