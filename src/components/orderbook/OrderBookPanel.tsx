import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { executeImmediateMockMarketOrder } from '../../engine/immediateMarketFill'
import { formatByDecimals } from '../../utils/format'
import { safeArray, safeNumber } from '../../utils/safe'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { roundToTickSize } from '../../utils/rounding'
import { PanelShell } from '../common/PanelShell'

type BookRow = { price: number; quantity: number; cum: number }

function buildAskRows(asks: { price: number; quantity: number }[]): BookRow[] {
  const asc = [...safeArray(asks)].sort((a, b) => a.price - b.price)
  let cum = 0
  const withCum = asc.map((l) => {
    cum += l.quantity
    return { ...l, cum }
  })
  return [...withCum].reverse()
}

function buildBidRows(bids: { price: number; quantity: number }[]): BookRow[] {
  const desc = [...safeArray(bids)].sort((a, b) => b.price - a.price)
  let cum = 0
  return desc.map((l) => {
    cum += l.quantity
    return { ...l, cum }
  })
}

const CLICK_DEBOUNCE_MS = 320

export function OrderBookPanel() {
  const symbol = useTradingStore((s) => s.symbol)
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const orderBook = useTradingStore((s) => s.orderBook)
  const {
    orderBookOrderQty,
    orderBookOneClickEnabled,
    orderBookDoubleClickEnabled,
    setOrderBookOrderQty,
    setOrderBookOneClickEnabled,
    setOrderBookDoubleClickEnabled,
    setOrderBookPendingLimitPrice,
  } = useTradingStore(
    useShallow((s) => ({
      orderBookOrderQty: s.orderBookOrderQty,
      orderBookOneClickEnabled: s.orderBookOneClickEnabled,
      orderBookDoubleClickEnabled: s.orderBookDoubleClickEnabled,
      setOrderBookOrderQty: s.setOrderBookOrderQty,
      setOrderBookOneClickEnabled: s.setOrderBookOneClickEnabled,
      setOrderBookDoubleClickEnabled: s.setOrderBookDoubleClickEnabled,
      setOrderBookPendingLimitPrice: s.setOrderBookPendingLimitPrice,
    })),
  )

  const oneClickTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (oneClickTimerRef.current != null) window.clearTimeout(oneClickTimerRef.current)
    },
    [],
  )

  const spec = getSymbolSpec(symbol)
  const askRowsFull = buildAskRows(orderBook.asks)
  const bidRowsFull = buildBidRows(orderBook.bids)
  const askRows = askRowsFull.length > 10 ? askRowsFull.slice(-10) : askRowsFull
  const bidRows = bidRowsFull.length > 10 ? bidRowsFull.slice(0, 10) : bidRowsFull

  const lp = safeNumber(lastPrice, spec.referencePrice)
  const band = Math.max(spec.tickSize * 8, Math.abs(lp) * 0.00006)
  const bookEmpty = askRows.length === 0 && bidRows.length === 0

  const fmtP = (n: number) => formatByDecimals(n, spec.priceDecimals)
  const fmtQ = (n: number) => formatByDecimals(n, spec.qtyDecimals)

  const tickSize = spec.tickSize

  const runImmediate = (side: 'ask' | 'bid') => {
    const orderSide = side === 'bid' ? 'buy' : 'sell'
    void executeImmediateMockMarketOrder(useTradingStore, {
      side: orderSide,
      quantity: orderBookOrderQty,
    })
  }

  const handlePriceClick = (rawPrice: number, side: 'ask' | 'bid') => {
    const p = roundToTickSize(rawPrice, tickSize)
    setOrderBookPendingLimitPrice(p)

    if (!orderBookOneClickEnabled) return

    if (oneClickTimerRef.current != null) window.clearTimeout(oneClickTimerRef.current)
    oneClickTimerRef.current = window.setTimeout(() => {
      oneClickTimerRef.current = null
      runImmediate(side)
    }, CLICK_DEBOUNCE_MS)
  }

  const handlePriceDoubleClick = (rawPrice: number, side: 'ask' | 'bid') => {
    const p = roundToTickSize(rawPrice, tickSize)
    setOrderBookPendingLimitPrice(p)
    if (oneClickTimerRef.current != null) {
      window.clearTimeout(oneClickTimerRef.current)
      oneClickTimerRef.current = null
    }
    if (!orderBookDoubleClickEnabled) return
    runImmediate(side)
  }

  return (
    <PanelShell title={`호가 · ${symbol}`} className="h-full">
      <div key={symbol} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-2 border-b border-so-border px-2 py-2">
          <label className="flex items-center gap-2 text-[10px] text-so-muted">
            <span className="w-16 shrink-0">주문 수량</span>
            <input
              type="number"
              step={spec.lotSize}
              min={0}
              className="min-w-0 flex-1 rounded border border-so-border bg-so-bg px-2 py-1 font-mono text-[11px] text-white"
              value={orderBookOrderQty}
              onChange={(e) => setOrderBookOrderQty(Number(e.target.value))}
            />
          </label>
          <div className="flex flex-wrap gap-3 text-[10px] text-so-muted">
            <label className="flex cursor-pointer items-center gap-1">
              <input
                type="checkbox"
                checked={orderBookOneClickEnabled}
                onChange={(e) => setOrderBookOneClickEnabled(e.target.checked)}
              />
              원클릭 주문
            </label>
            <label className="flex cursor-pointer items-center gap-1">
              <input
                type="checkbox"
                checked={orderBookDoubleClickEnabled}
                onChange={(e) => setOrderBookDoubleClickEnabled(e.target.checked)}
              />
              더블클릭 주문
            </label>
          </div>
          <p className="text-[9px] leading-snug text-so-muted">
            매도 호가 클릭 → 매도, 매수 호가 클릭 → 매수. 클릭 시 지정가 입력용 가격이 일반 주문에 반영됩니다.
          </p>
        </div>

        {bookEmpty ? (
          <p className="flex flex-1 items-center justify-center px-3 py-8 text-center text-[11px] text-so-muted">
            호가 데이터가 비어 있습니다. 틱 시뮬레이션 또는 WebSocket 주입을 확인하세요.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-so-border text-[11px]">
              <div className="bg-so-surface px-2 py-1 text-so-muted">가격</div>
              <div className="bg-so-surface px-2 py-1 text-right text-so-muted">수량</div>
              <div className="bg-so-surface px-2 py-1 text-right text-so-muted">누적</div>
            </div>
            <div className="max-h-[min(28vh,220px)] min-h-[120px] overflow-y-auto">
              {askRows.map((r) => {
                const near = Math.abs(r.price - lp) < band
                return (
                  <button
                    key={`ask-${r.price}`}
                    type="button"
                    className={`grid w-full grid-cols-[1fr_1fr_1fr] border-b border-so-border/60 text-left text-[11px] ${
                      near ? 'bg-red-500/10' : 'bg-so-surface'
                    } hover:bg-red-500/20`}
                    onClick={() => handlePriceClick(r.price, 'ask')}
                    onDoubleClick={() => handlePriceDoubleClick(r.price, 'ask')}
                  >
                    <div className="px-2 py-0.5 font-mono text-so-ask">{fmtP(r.price)}</div>
                    <div className="px-2 py-0.5 text-right font-mono text-so-muted">{fmtQ(r.quantity)}</div>
                    <div className="px-2 py-0.5 text-right font-mono text-so-muted">{fmtQ(r.cum)}</div>
                  </button>
                )
              })}
            </div>
            <div className="sticky top-0 z-10 border-y border-so-border bg-so-bg px-2 py-1.5 text-center font-mono text-sm font-semibold text-white">
              {fmtP(lp)}
            </div>
            <div className="max-h-[min(28vh,220px)] min-h-[120px] overflow-y-auto">
              {bidRows.map((r) => {
                const near = Math.abs(r.price - lp) < band
                return (
                  <button
                    key={`bid-${r.price}`}
                    type="button"
                    className={`grid w-full grid-cols-[1fr_1fr_1fr] border-b border-so-border/60 text-left text-[11px] ${
                      near ? 'bg-emerald-500/10' : 'bg-so-surface'
                    } hover:bg-emerald-500/20`}
                    onClick={() => handlePriceClick(r.price, 'bid')}
                    onDoubleClick={() => handlePriceDoubleClick(r.price, 'bid')}
                  >
                    <div className="px-2 py-0.5 font-mono text-so-bid">{fmtP(r.price)}</div>
                    <div className="px-2 py-0.5 text-right font-mono text-so-muted">{fmtQ(r.quantity)}</div>
                    <div className="px-2 py-0.5 text-right font-mono text-so-muted">{fmtQ(r.cum)}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </PanelShell>
  )
}
