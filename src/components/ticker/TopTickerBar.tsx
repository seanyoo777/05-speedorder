import { formatPct, formatPrice } from '../../utils/format'
import { safeArray } from '../../utils/safe'
import { useTradingStore } from '../../store/tradingStore'

export function TopTickerBar() {
  const tickers = useTradingStore((s) => s.tickers)
  const rows = safeArray(tickers)

  return (
    <div className="flex w-full flex-wrap items-stretch gap-px overflow-x-auto border-b border-so-border bg-so-surface text-[11px]">
      {rows.length === 0 ? (
        <div className="px-3 py-2 text-so-muted">티커 없음</div>
      ) : (
        rows.map((t) => (
          <div
            key={t.id}
            className="flex min-w-[120px] flex-1 flex-col justify-center border-r border-so-border px-3 py-2 last:border-r-0"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-white">{t.label}</span>
              <span className="font-mono text-so-muted">{t.symbol}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm text-white">{formatPrice(t.price)}</span>
              <span
                className={`font-mono text-[11px] ${
                  t.changePct >= 0 ? 'text-so-bid' : 'text-so-ask'
                }`}
              >
                {formatPct(t.changePct)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
