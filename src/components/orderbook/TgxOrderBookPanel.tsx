import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { displayRowCountForDensity } from '../../config/orderBookStyle'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'
import { safeNumber } from '../../utils/safe'
import { roundPriceBySpec } from '../../utils/specInstrument'
import { PanelShell } from '../common/PanelShell'
import { RecentOrderActionsLog } from '../speedorder/RecentOrderActionsLog'
import {
  buildAskRows,
  buildBidRows,
  sliceAskRows,
  sliceBidRows,
} from './orderBookModel'
import {
  applyOrderBookPriceIntent,
  isPriceNearTick,
  orderBookSideToOrderSide,
} from './orderBookPriceIntent'
import { TgxOrderBookRow } from './TgxOrderBookRow'
import { tgxOrderBookTokens } from './tgxOrderBookTokens'

export function TgxOrderBookPanel() {
  const symbol = useTradingStore((s) => s.symbol)
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const orderBook = useTradingStore((s) => s.orderBook)
  const tickers = useTradingStore((s) => s.tickers)

  const {
    orderBookOrderQty,
    orderBookDoubleClickEnabled,
    orderBookHighlightPrice,
    orderBookPendingLimitPrice,
    orderBookPendingTriggerPrice,
    orderBookPendingTriggerBookSide,
    orderBookRowDensity,
    stopMitLockLocked,
    stopMitTriggerPrice,
    setOrderBookOrderQty,
    setOrderBookPendingLimitPrice,
    setOrderBookPendingTriggerPrice,
    setOrderBookPendingTriggerBookSide,
    setOrderBookHighlightPrice,
    setPendingBookOrderConfirm,
    setOrderBookRowDensity,
    uiDomWidthPx,
  } = useTradingStore(
    useShallow((s) => ({
      orderBookOrderQty: s.orderBookOrderQty,
      orderBookDoubleClickEnabled: s.orderBookDoubleClickEnabled,
      orderBookHighlightPrice: s.orderBookHighlightPrice,
      orderBookPendingLimitPrice: s.orderBookPendingLimitPrice,
      orderBookPendingTriggerPrice: s.orderBookPendingTriggerPrice,
      orderBookPendingTriggerBookSide: s.orderBookPendingTriggerBookSide,
      orderBookRowDensity: s.orderBookRowDensity,
      stopMitLockLocked: s.stopMitDraft.priceLock.locked,
      stopMitTriggerPrice: s.stopMitDraft.triggerPrice,
      setOrderBookOrderQty: s.setOrderBookOrderQty,
      setOrderBookPendingLimitPrice: s.setOrderBookPendingLimitPrice,
      setOrderBookPendingTriggerPrice: s.setOrderBookPendingTriggerPrice,
      setOrderBookPendingTriggerBookSide: s.setOrderBookPendingTriggerBookSide,
      setOrderBookHighlightPrice: s.setOrderBookHighlightPrice,
      setPendingBookOrderConfirm: s.setPendingBookOrderConfirm,
      setOrderBookRowDensity: s.setOrderBookRowDensity,
      uiDomWidthPx: s.uiDomWidthPx,
    })),
  )

  const tokens = tgxOrderBookTokens(orderBookRowDensity)
  const rowCount = displayRowCountForDensity(orderBookRowDensity)
  const lockedTriggerPrice =
    stopMitLockLocked && stopMitTriggerPrice != null ? stopMitTriggerPrice : null

  const [hoverRowKey, setHoverRowKey] = useState<string | null>(null)
  const [centerFlash, setCenterFlash] = useState<'up' | 'down' | null>(null)
  const [centerDir, setCenterDir] = useState(0)
  const prevLastRef = useRef<number | null>(null)
  const symbolRef = useRef(symbol)
  const centerFlashTimerRef = useRef<number | null>(null)
  const highlightClearTimerRef = useRef<number | null>(null)
  const highlightAnchorRef = useRef<number | null>(null)
  const bookOrderConfirmSeqRef = useRef(0)

  const spec = getSymbolSpec(symbol)

  useLayoutEffect(() => {
    const symChanged = symbolRef.current !== symbol
    symbolRef.current = symbol
    const lpN = safeNumber(lastPrice, spec.referencePrice)
    const prev = symChanged ? null : prevLastRef.current
    const d =
      prev != null && Number.isFinite(prev) ? (lpN > prev ? 1 : lpN < prev ? -1 : 0) : 0
    setCenterDir((prev) => (prev === d ? prev : d))
    prevLastRef.current = lpN
  }, [lastPrice, spec.referencePrice, symbol])

  useEffect(
    () => () => {
      if (highlightClearTimerRef.current != null) {
        window.clearTimeout(highlightClearTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (highlightClearTimerRef.current != null) {
      window.clearTimeout(highlightClearTimerRef.current)
      highlightClearTimerRef.current = null
    }
    highlightAnchorRef.current = null
  }, [symbol])

  useEffect(() => {
    const run = () => {
      if (centerFlashTimerRef.current != null) {
        window.clearTimeout(centerFlashTimerRef.current)
        centerFlashTimerRef.current = null
      }
      if (centerDir === 0) {
        setCenterFlash((prev) => (prev === null ? prev : null))
        return
      }
      const next = centerDir > 0 ? 'up' : 'down'
      setCenterFlash((prev) => (prev === next ? prev : next))
      centerFlashTimerRef.current = window.setTimeout(() => {
        setCenterFlash(null)
        centerFlashTimerRef.current = null
      }, 220)
    }
    const id = window.setTimeout(run, 0)
    return () => {
      window.clearTimeout(id)
      if (centerFlashTimerRef.current != null) {
        window.clearTimeout(centerFlashTimerRef.current)
        centerFlashTimerRef.current = null
      }
    }
  }, [centerDir])

  const intentSetters = useMemo(
    () => ({
      setOrderBookPendingLimitPrice,
      setOrderBookPendingTriggerPrice,
      setOrderBookPendingTriggerBookSide,
      setOrderBookHighlightPrice,
    }),
    [
      setOrderBookPendingLimitPrice,
      setOrderBookPendingTriggerPrice,
      setOrderBookPendingTriggerBookSide,
      setOrderBookHighlightPrice,
    ],
  )

  const bookIntentCurrent = useMemo(
    () => ({
      orderBookPendingLimitPrice,
      orderBookPendingTriggerPrice,
      orderBookPendingTriggerBookSide,
      orderBookHighlightPrice,
    }),
    [
      orderBookPendingLimitPrice,
      orderBookPendingTriggerPrice,
      orderBookPendingTriggerBookSide,
      orderBookHighlightPrice,
    ],
  )

  const armHighlightClear = useCallback(
    (roundedPrice: number) => {
      if (highlightClearTimerRef.current != null) {
        window.clearTimeout(highlightClearTimerRef.current)
      }
      highlightAnchorRef.current = roundedPrice
      highlightClearTimerRef.current = window.setTimeout(() => {
        highlightClearTimerRef.current = null
        const anchor = highlightAnchorRef.current
        highlightAnchorRef.current = null
        const cur = useTradingStore.getState().orderBookHighlightPrice
        if (anchor == null || cur == null) return
        if (isPriceNearTick(cur, anchor, spec.tickSize)) {
          setOrderBookHighlightPrice(null)
        }
      }, 1000)
    },
    [setOrderBookHighlightPrice, spec.tickSize],
  )

  const askRows = useMemo(
    () => sliceAskRows(buildAskRows(orderBook.asks), rowCount),
    [orderBook.asks, rowCount],
  )
  const bidRows = useMemo(
    () => sliceBidRows(buildBidRows(orderBook.bids), rowCount),
    [orderBook.bids, rowCount],
  )

  const lp = safeNumber(lastPrice, spec.referencePrice)
  const maxCum = Math.max(
    1e-12,
    ...askRows.map((r) => r.cum),
    ...bidRows.map((r) => r.cum),
  )
  const maxQty = Math.max(
    1e-12,
    ...askRows.map((r) => r.quantity),
    ...bidRows.map((r) => r.quantity),
  )

  const bestAsk = askRows.length ? askRows[askRows.length - 1].price : lp
  const bestBid = bidRows.length ? bidRows[0].price : lp
  const spread = Number.isFinite(bestAsk) && Number.isFinite(bestBid) ? bestAsk - bestBid : 0
  const tickerRow = tickers.find((t) => t.symbol === symbol)
  const changePct = tickerRow?.changePct ?? 0
  const bookEmpty = askRows.length === 0 && bidRows.length === 0

  const fmtP = (n: number) => formatByDecimals(n, spec.priceDecimals)
  const fmtQ = (n: number) => formatByDecimals(n, spec.qtyDecimals)

  const markerLabel =
    orderBookHighlightPrice != null
      ? `▶ ${formatByDecimals(roundPriceBySpec(spec, orderBookHighlightPrice), spec.priceDecimals)}`
      : null

  const centerPriceClass =
    centerDir > 0 ? 'text-emerald-300' : centerDir < 0 ? 'text-rose-300' : 'text-zinc-50'

  const handlePriceClick = (rawPrice: number, side: 'ask' | 'bid') => {
    const p = applyOrderBookPriceIntent(intentSetters, spec, rawPrice, side, bookIntentCurrent)
    armHighlightClear(p)
  }

  const handlePriceDoubleClick = (rawPrice: number, side: 'ask' | 'bid') => {
    const p = applyOrderBookPriceIntent(intentSetters, spec, rawPrice, side, bookIntentCurrent)
    armHighlightClear(p)
    if (!orderBookDoubleClickEnabled) return
    setPendingBookOrderConfirm({
      id: `tgx-book-${++bookOrderConfirmSeqRef.current}`,
      side: orderBookSideToOrderSide(side),
      rowPrice: p,
      quantity: orderBookOrderQty,
    })
  }

  const askPads = Math.max(0, rowCount - askRows.length)
  const bidPads = Math.max(0, rowCount - bidRows.length)

  const colHeader = (
    <div
      className={`grid shrink-0 grid-cols-[minmax(0,1.1fr)_minmax(0,0.75fr)_minmax(0,0.62fr)] gap-x-1 border-b border-[#1f2937]/50 bg-[#05080d] px-1 py-0.5 ${tokens.headerFontClass}`}
    >
      <span className="text-right">Price</span>
      <span className="text-right">Size</span>
      <span className="truncate text-right">Cum</span>
    </div>
  )

  const renderRow = (r: (typeof askRows)[number], side: 'ask' | 'bid') => {
    const rowDisplayPrice = roundPriceBySpec(spec, r.price)
    const rowKey = `${side}-${rowDisplayPrice}`
    return (
      <TgxOrderBookRow
        key={rowKey}
        row={r}
        side={side}
        tokens={tokens}
        rowDisplayPrice={rowDisplayPrice}
        tickSize={spec.tickSize}
        maxCum={maxCum}
        maxQty={maxQty}
        fmtP={fmtP}
        fmtQ={fmtQ}
        qtyDecimals={spec.qtyDecimals}
        highlightPrice={orderBookHighlightPrice}
        lockedTriggerPrice={lockedTriggerPrice}
        isHovered={hoverRowKey === rowKey}
        onHover={setHoverRowKey}
        onClick={() => handlePriceClick(r.price, side)}
        onDoubleClick={() => handlePriceDoubleClick(r.price, side)}
      />
    )
  }

  return (
    <PanelShell
      title="호가"
      titleExtra={
        <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[9px] text-violet-200">
          TGX
        </span>
      }
      variant="cexDom"
      className="h-full min-h-[280px] min-w-[260px]"
      style={uiDomWidthPx != null ? { minWidth: uiDomWidthPx } : undefined}
      scrollBody={false}
    >
      <div className="flex h-full min-h-0 flex-col" data-testid="tgx-orderbook-panel">
        <div className="shrink-0 space-y-1.5 border-b border-[#1f2937]/40 bg-[#05080d] px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">수량</span>
            <input
              type="number"
              step={spec.lotSize}
              min={0}
              className="min-w-0 flex-1 rounded border border-[#1f2937]/50 bg-[#0b1118] px-2 py-1 font-mono text-[11px] text-zinc-100 outline-none"
              value={orderBookOrderQty}
              onChange={(e) => setOrderBookOrderQty(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-200/90">
              원클릭 OFF (정책)
            </span>
            <button
              type="button"
              className={`rounded px-1.5 py-0.5 text-[9px] ${
                orderBookRowDensity === 'dense'
                  ? 'bg-violet-500/20 text-violet-100'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
              onClick={() => setOrderBookRowDensity('dense')}
            >
              Dense
            </button>
            <button
              type="button"
              className={`rounded px-1.5 py-0.5 text-[9px] ${
                orderBookRowDensity === 'compact'
                  ? 'bg-violet-500/20 text-violet-100'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
              onClick={() => setOrderBookRowDensity('compact')}
            >
              Compact
            </button>
          </div>
          {markerLabel ? (
            <div className="truncate rounded border border-violet-500/35 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-100">
              {markerLabel}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1">
          {bookEmpty ? (
            <p className="flex h-full items-center justify-center text-[10px] text-zinc-500">
              호가 없음
            </p>
          ) : (
            <div className="grid h-full min-h-0 grid-rows-[1fr_auto_1fr] bg-[#070b12]">
              <div className="flex min-h-0 flex-col overflow-hidden border border-[#1f2937]/45">
                {colHeader}
                <div className="min-h-0 flex-1 overflow-hidden">
                  {Array.from({ length: askPads }).map((_, i) => (
                    <div
                      key={`ask-pad-${i}`}
                      className={`${tokens.rowHeightClass} border-b border-[#1f2937]/30 bg-[#070b12]/80`}
                    />
                  ))}
                  {askRows.map((r) => renderRow(r, 'ask'))}
                </div>
              </div>

              <div className="relative shrink-0 border-y border-[#1f2937]/50 bg-[#0b1118] px-2 py-1.5 text-center shadow-[inset_0_0_32px_-10px_rgba(139,92,246,0.28)]">
                {centerFlash === 'up' ? (
                  <span className="pointer-events-none absolute inset-0 bg-emerald-500/12" aria-hidden />
                ) : null}
                {centerFlash === 'down' ? (
                  <span className="pointer-events-none absolute inset-0 bg-rose-500/12" aria-hidden />
                ) : null}
                <div className={`relative font-mono text-[16px] font-extrabold tabular-nums ${centerPriceClass}`}>
                  {fmtP(lp)}
                </div>
                <div className="relative mt-0.5 flex justify-center gap-2 font-mono text-[9px] text-zinc-500">
                  <span className={changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {changePct >= 0 ? '+' : ''}
                    {changePct.toFixed(2)}%
                  </span>
                  <span>SP {formatByDecimals(spread, spec.priceDecimals)}</span>
                </div>
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden border border-[#1f2937]/45">
                {colHeader}
                <div className="min-h-0 flex-1 overflow-hidden">
                  {bidRows.map((r) => renderRow(r, 'bid'))}
                  {Array.from({ length: bidPads }).map((_, i) => (
                    <div
                      key={`bid-pad-${i}`}
                      className={`${tokens.rowHeightClass} border-b border-[#1f2937]/30 bg-[#070b12]/80`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <RecentOrderActionsLog variant="cexDom" />
      </div>
    </PanelShell>
  )
}
