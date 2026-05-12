import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  ORDER_BOOK_PRESET_LABEL,
  effectiveOrderBookTokens,
  type OrderBookDesignPresetId,
} from '../../config/orderBookDesignPresets'
import { executeImmediateMockMarketOrder } from '../../engine/immediateMarketFill'
import { formatByDecimals } from '../../utils/format'
import { safeArray, safeNumber } from '../../utils/safe'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { roundPriceBySpec } from '../../utils/specInstrument'
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

function formatCumShort(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return '—'
  const ax = Math.abs(n)
  if (ax >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (ax >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return formatByDecimals(n, decimals)
}

const CLICK_DEBOUNCE_MS = 320
const ROWS = 10

export function OrderBookPanel() {
  const symbol = useTradingStore((s) => s.symbol)
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const orderBook = useTradingStore((s) => s.orderBook)
  const tickers = useTradingStore((s) => s.tickers)
  const confirmOrders = useTradingStore((s) => s.confirmOrders)

  const {
    orderBookOrderQty,
    orderBookOneClickEnabled,
    orderBookDoubleClickEnabled,
    orderBookHighlightPrice,
    orderBookDesignPreset,
    orderBookColorInvert,
    setOrderBookOrderQty,
    setOrderBookOneClickEnabled,
    setOrderBookDoubleClickEnabled,
    setOrderBookPendingLimitPrice,
    setOrderBookHighlightPrice,
    setOrderBookDesignPreset,
    setOrderBookColorInvert,
  } = useTradingStore(
    useShallow((s) => ({
      orderBookOrderQty: s.orderBookOrderQty,
      orderBookOneClickEnabled: s.orderBookOneClickEnabled,
      orderBookDoubleClickEnabled: s.orderBookDoubleClickEnabled,
      orderBookHighlightPrice: s.orderBookHighlightPrice,
      orderBookDesignPreset: s.orderBookDesignPreset,
      orderBookColorInvert: s.orderBookColorInvert,
      setOrderBookOrderQty: s.setOrderBookOrderQty,
      setOrderBookOneClickEnabled: s.setOrderBookOneClickEnabled,
      setOrderBookDoubleClickEnabled: s.setOrderBookDoubleClickEnabled,
      setOrderBookPendingLimitPrice: s.setOrderBookPendingLimitPrice,
      setOrderBookHighlightPrice: s.setOrderBookHighlightPrice,
      setOrderBookDesignPreset: s.setOrderBookDesignPreset,
      setOrderBookColorInvert: s.setOrderBookColorInvert,
    })),
  )

  const tk = effectiveOrderBookTokens(orderBookDesignPreset, orderBookColorInvert)

  const [designOpen, setDesignOpen] = useState(false)
  const [flashRowKey, setFlashRowKey] = useState<string | null>(null)
  const [centerDir, setCenterDir] = useState(0)
  const designRef = useRef<HTMLDivElement>(null)
  const oneClickTimerRef = useRef<number | null>(null)
  const prevLastRef = useRef<number | null>(null)
  const symbolRef = useRef(symbol)

  useLayoutEffect(() => {
    const symChanged = symbolRef.current !== symbol
    symbolRef.current = symbol
    const specInner = getSymbolSpec(symbol)
    const lpN = safeNumber(lastPrice, specInner.referencePrice)
    const prev = symChanged ? null : prevLastRef.current
    const d =
      prev != null && Number.isFinite(prev) ? (lpN > prev ? 1 : lpN < prev ? -1 : 0) : 0
    setCenterDir(d)
    prevLastRef.current = lpN
  }, [lastPrice, symbol])

  useEffect(
    () => () => {
      if (oneClickTimerRef.current != null) window.clearTimeout(oneClickTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!designOpen) return
    const close = (e: MouseEvent) => {
      if (designRef.current && !designRef.current.contains(e.target as Node)) setDesignOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [designOpen])

  const spec = getSymbolSpec(symbol)
  const askRowsFull = buildAskRows(orderBook.asks)
  const bidRowsFull = buildBidRows(orderBook.bids)
  const askRows = askRowsFull.length > ROWS ? askRowsFull.slice(-ROWS) : askRowsFull
  const bidRows = bidRowsFull.length > ROWS ? bidRowsFull.slice(0, ROWS) : bidRowsFull

  const lp = safeNumber(lastPrice, spec.referencePrice)
  const maxCum = Math.max(
    1e-12,
    ...askRows.map((r) => r.cum),
    ...bidRows.map((r) => r.cum),
  )

  const bestAsk = askRows.length ? askRows[askRows.length - 1].price : lp
  const bestBid = bidRows.length ? bidRows[0].price : lp
  const spread = Number.isFinite(bestAsk) && Number.isFinite(bestBid) ? bestAsk - bestBid : 0

  const tickerRow = tickers.find((t) => t.symbol === symbol)
  const changePct = tickerRow?.changePct ?? 0

  const bookEmpty = askRows.length === 0 && bidRows.length === 0

  const fmtP = (n: number) => formatByDecimals(n, spec.priceDecimals)
  const fmtQ = (n: number) => formatByDecimals(n, spec.qtyDecimals)

  const centerPriceClass =
    centerDir > 0 ? tk.priceUpClass : centerDir < 0 ? tk.priceDownClass : tk.priceFlatClass

  const triggerFlash = (side: 'ask' | 'bid', rowPrice: number) => {
    const key = `${side}-${rowPrice}`
    setFlashRowKey(key)
    window.setTimeout(() => setFlashRowKey((k) => (k === key ? null : k)), 180)
  }

  const confirmIfNeeded = () => {
    if (!confirmOrders) return true
    return window.confirm('모의 즉시 체결을 진행할까요? (실거래 아님)')
  }

  const runImmediate = (side: 'ask' | 'bid', rowPrice: number) => {
    if (!confirmIfNeeded()) return
    const orderSide = side === 'ask' ? 'buy' : 'sell'
    const ok = executeImmediateMockMarketOrder(useTradingStore, {
      side: orderSide,
      quantity: orderBookOrderQty,
    })
    if (ok) triggerFlash(side, rowPrice)
  }

  const handlePriceClick = (rawPrice: number, side: 'ask' | 'bid') => {
    const p = roundPriceBySpec(spec, rawPrice)
    setOrderBookPendingLimitPrice(p)
    setOrderBookHighlightPrice(p)

    if (!orderBookOneClickEnabled) return

    if (oneClickTimerRef.current != null) window.clearTimeout(oneClickTimerRef.current)
    oneClickTimerRef.current = window.setTimeout(() => {
      oneClickTimerRef.current = null
      runImmediate(side, p)
    }, CLICK_DEBOUNCE_MS)
  }

  const handlePriceDoubleClick = (rawPrice: number, side: 'ask' | 'bid') => {
    const p = roundPriceBySpec(spec, rawPrice)
    setOrderBookPendingLimitPrice(p)
    setOrderBookHighlightPrice(p)
    if (oneClickTimerRef.current != null) {
      window.clearTimeout(oneClickTimerRef.current)
      oneClickTimerRef.current = null
    }
    if (!orderBookDoubleClickEnabled) return
    runImmediate(side, p)
  }

  const askPads = Math.max(0, ROWS - askRows.length)
  const bidPads = Math.max(0, ROWS - bidRows.length)

  const designAction = (
    <div className="relative" ref={designRef}>
      <button
        type="button"
        className="rounded border border-so-border bg-so-bg px-2 py-0.5 text-[10px] text-so-muted hover:border-so-accent hover:text-white"
        aria-expanded={designOpen}
        onClick={() => setDesignOpen((o) => !o)}
      >
        디자인
      </button>
      {designOpen ? (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border border-so-border bg-so-surface py-1 text-[10px] shadow-xl">
          {(Object.keys(ORDER_BOOK_PRESET_LABEL) as OrderBookDesignPresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`block w-full px-2 py-1.5 text-left hover:bg-so-border ${
                orderBookDesignPreset === id ? 'text-white' : 'text-so-muted'
              }`}
              onClick={() => {
                setOrderBookDesignPreset(id)
                setDesignOpen(false)
              }}
            >
              {ORDER_BOOK_PRESET_LABEL[id]}
            </button>
          ))}
          <div className="my-1 border-t border-so-border" />
          <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-so-muted hover:bg-so-border">
            <input
              type="checkbox"
              checked={orderBookColorInvert}
              onChange={(e) => setOrderBookColorInvert(e.target.checked)}
            />
            매수/매도 색 반전
          </label>
        </div>
      ) : null}
    </div>
  )

  const headerToolbar = (
    <div className="flex min-w-0 flex-col gap-1.5 border-b border-white/[0.06] px-1.5 py-1.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <label className="flex min-w-0 flex-1 items-center gap-1 text-[9px] text-so-muted">
          <span className="shrink-0">수량</span>
          <input
            type="number"
            step={spec.lotSize}
            min={0}
            className="min-w-0 flex-1 rounded border border-so-border bg-black/30 px-1 py-0.5 font-mono text-[10px] text-white"
            value={orderBookOrderQty}
            onChange={(e) => setOrderBookOrderQty(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-so-muted">
        <label className="flex cursor-pointer items-center gap-0.5">
          <input
            type="checkbox"
            checked={orderBookOneClickEnabled}
            onChange={(e) => setOrderBookOneClickEnabled(e.target.checked)}
          />
          원클릭
        </label>
        <label className="flex cursor-pointer items-center gap-0.5">
          <input
            type="checkbox"
            checked={orderBookDoubleClickEnabled}
            onChange={(e) => setOrderBookDoubleClickEnabled(e.target.checked)}
          />
          더블클릭
        </label>
      </div>
    </div>
  )

  const colHeader = (
    <div
      className={`grid shrink-0 grid-cols-[minmax(0,1.1fr)_minmax(0,0.75fr)_minmax(0,0.65fr)] border-b px-0.5 ${tk.headerFontClass} ${tk.borderClass} text-so-muted`}
    >
      <span className="pl-0.5">가격</span>
      <span className="text-right">수량</span>
      <span className="truncate text-right" title="누적">
        누적
      </span>
    </div>
  )

  const renderRow = (r: BookRow, side: 'ask' | 'bid', depthClass: string, priceClass: string) => {
    const depthPct = (r.cum / maxCum) * 100
    const hl =
      orderBookHighlightPrice != null &&
      Math.abs(orderBookHighlightPrice - r.price) < spec.tickSize * 0.51
    const rowKey = `${side}-${r.price}`
    const isFlash = flashRowKey === rowKey
    return (
      <button
        key={rowKey}
        type="button"
        className={`relative grid w-full min-w-0 shrink-0 grid-cols-[minmax(0,1.1fr)_minmax(0,0.75fr)_minmax(0,0.65fr)] items-center border-b px-0.5 text-left ${tk.rowHeightClass} ${tk.rowFontClass} ${tk.borderClass} ${
          hl ? 'ring-1 ring-inset ring-amber-400/70' : ''
        } ${isFlash ? 'bg-white/15' : ''} hover:bg-white/[0.04]`}
        onClick={() => handlePriceClick(r.price, side)}
        onDoubleClick={() => handlePriceDoubleClick(r.price, side)}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 ${depthClass}`}
          style={{ width: `${Math.min(100, depthPct)}%` }}
        />
        <span className={`relative z-[1] truncate pl-0.5 font-mono ${priceClass}`}>{fmtP(r.price)}</span>
        <span className="relative z-[1] text-right font-mono text-zinc-400">{fmtQ(r.quantity)}</span>
        <span
          className="relative z-[1] truncate text-right font-mono text-zinc-500"
          title={String(r.cum)}
        >
          {formatCumShort(r.cum, spec.qtyDecimals)}
        </span>
      </button>
    )
  }

  return (
    <PanelShell title="호가" action={designAction} className="h-full min-h-[280px] min-w-[260px]" scrollBody={false}>
      <div className="flex h-full min-h-0 flex-col">
        {headerToolbar}

        {bookEmpty ? (
          <p className="flex flex-1 items-center justify-center px-2 py-6 text-center text-[10px] text-so-muted">
            호가 없음
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] gap-px bg-black/20">
            <div className={`flex min-h-0 flex-col overflow-hidden border ${tk.borderClass}`}>
              {colHeader}
              <div className={`flex min-h-0 flex-1 flex-col overflow-hidden`}>
                {Array.from({ length: askPads }).map((_, i) => (
                  <div
                    key={`ask-pad-${i}`}
                    className={`shrink-0 ${tk.rowHeightClass} border-b ${tk.borderClass} bg-black/10`}
                  />
                ))}
                {askRows.map((r) => renderRow(r, 'ask', tk.askDepthClass, tk.askPriceClass))}
              </div>
            </div>

            <div
              className={`shrink-0 border-x border-t border-b px-1.5 py-1 text-center ${tk.centerBgClass} ${tk.borderClass}`}
            >
              <div className={`font-mono text-sm font-bold leading-tight sm:text-base ${centerPriceClass}`}>
                {fmtP(lp)}
              </div>
              <div
                className={`mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 ${tk.centerMutedClass} text-[9px]`}
              >
                <span className="font-mono text-white/90">{symbol}</span>
                <span
                  className={
                    changePct > 0
                      ? tk.priceUpClass
                      : changePct < 0
                        ? tk.priceDownClass
                        : tk.priceFlatClass
                  }
                >
                  {changePct >= 0 ? '+' : ''}
                  {changePct.toFixed(2)}%
                </span>
                <span className="font-mono">spr {formatByDecimals(spread, spec.priceDecimals)}</span>
              </div>
            </div>

            <div className={`flex min-h-0 flex-col overflow-hidden border ${tk.borderClass}`}>
              {colHeader}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {bidRows.map((r) => renderRow(r, 'bid', tk.bidDepthClass, tk.bidPriceClass))}
                {Array.from({ length: bidPads }).map((_, i) => (
                  <div
                    key={`bid-pad-${i}`}
                    className={`shrink-0 ${tk.rowHeightClass} border-b ${tk.borderClass} bg-black/10`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PanelShell>
  )
}
