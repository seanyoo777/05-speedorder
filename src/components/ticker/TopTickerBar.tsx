import { useMemo } from 'react'
import { formatPct, formatPrice } from '../../utils/format'
import { safeArray } from '../../utils/safe'
import { useTradingStore } from '../../store/tradingStore'

export function TopTickerBar() {
  const tickers = useTradingStore((s) => s.tickers)
  const symbol = useTradingStore((s) => s.symbol)
  const setSymbol = useTradingStore((s) => s.setSymbol)
  const rows = useMemo(() => {
    const list = safeArray(tickers)
    const i = list.findIndex((t) => t.symbol === symbol)
    if (i <= 0) return list
    return [list[i], ...list.slice(0, i), ...list.slice(i + 1)]
  }, [tickers, symbol])

  return (
    <div className="flex w-full flex-wrap items-stretch gap-px overflow-x-auto border-b border-so-border bg-so-surface text-[11px]">
      {rows.length === 0 ? (
        <div className="px-3 py-2 text-so-muted">티커 없음</div>
      ) : (
        rows.map((t) => {
          const active = t.symbol === symbol
          return (
            <button
              key={t.id}
              type="button"
              className={`flex min-w-[120px] flex-1 flex-col justify-center border-r border-so-border px-3 py-2 text-left transition-opacity last:border-r-0 hover:bg-so-border/40 ${
                active ? 'bg-so-border/50' : 'opacity-70 hover:opacity-100'
              }`}
              onClick={() => setSymbol(t.symbol)}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-white">{t.label}</span>
                <span className="font-mono text-[10px] text-so-muted">{t.marketType}</span>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] text-so-muted">{t.symbol}</span>
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
            </button>
          )
        })
      )}
    </div>
  )
}
