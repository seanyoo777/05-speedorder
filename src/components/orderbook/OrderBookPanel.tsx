import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  ORDER_BOOK_PRESET_LABEL,
  ORDER_BOOK_PRESET_META,
  ORDER_BOOK_PRESET_ORDER,
  effectiveOrderBookTokens,
  type OrderBookPresetTag,
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

function depthBarMetrics(cum: number, qty: number, maxCum: number, maxQty: number) {
  const cr = Math.min(1, cum / maxCum)
  const qr = Math.min(1, qty / maxQty)
  const strength = Math.min(1, cr * 0.62 + Math.pow(qr, 0.78) * 0.38)
  const widthPct = strength * 100
  const alpha = 0.034 + 0.5 * Math.pow(strength, 0.45)
  return { widthPct, alpha }
}

function presetTagLabel(t: OrderBookPresetTag) {
  return t === 'pro' ? 'Pro' : 'Compact'
}

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
    setOrderBookPendingTriggerPrice,
    setOrderBookHighlightPrice,
    setOrderBookDesignPreset,
    setOrderBookColorInvert,
    uiOrderBookFontScale,
    uiCompactMode,
    uiDomWidthPx,
    uiFontScale,
    setUiFontScale,
    setUiOrderBookFontScale,
    setUiCompactMode,
    setUiDomWidthPx,
  } = useTradingStore(
    useShallow((s) => ({
      orderBookOrderQty: s.orderBookOrderQty,
      orderBookOneClickEnabled: s.orderBookOneClickEnabled,
      orderBookDoubleClickEnabled: s.orderBookDoubleClickEnabled,
      orderBookHighlightPrice: s.orderBookHighlightPrice,
      orderBookDesignPreset: s.orderBookDesignPreset,
      orderBookColorInvert: s.orderBookColorInvert,
      uiOrderBookFontScale: s.uiOrderBookFontScale,
      uiCompactMode: s.uiCompactMode,
      uiDomWidthPx: s.uiDomWidthPx,
      uiFontScale: s.uiFontScale,
      setOrderBookOrderQty: s.setOrderBookOrderQty,
      setOrderBookOneClickEnabled: s.setOrderBookOneClickEnabled,
      setOrderBookDoubleClickEnabled: s.setOrderBookDoubleClickEnabled,
      setOrderBookPendingLimitPrice: s.setOrderBookPendingLimitPrice,
      setOrderBookPendingTriggerPrice: s.setOrderBookPendingTriggerPrice,
      setOrderBookHighlightPrice: s.setOrderBookHighlightPrice,
      setOrderBookDesignPreset: s.setOrderBookDesignPreset,
      setOrderBookColorInvert: s.setOrderBookColorInvert,
      setUiFontScale: s.setUiFontScale,
      setUiOrderBookFontScale: s.setUiOrderBookFontScale,
      setUiCompactMode: s.setUiCompactMode,
      setUiDomWidthPx: s.setUiDomWidthPx,
    })),
  )

  const tk = effectiveOrderBookTokens(orderBookDesignPreset, orderBookColorInvert)

  const [designOpen, setDesignOpen] = useState(false)
  const [flashRowKey, setFlashRowKey] = useState<string | null>(null)
  const [pulseRowKey, setPulseRowKey] = useState<string | null>(null)
  const [centerFlash, setCenterFlash] = useState<'up' | 'down' | null>(null)
  const [centerDir, setCenterDir] = useState(0)
  const designRef = useRef<HTMLDivElement>(null)
  const oneClickTimerRef = useRef<number | null>(null)
  const prevLastRef = useRef<number | null>(null)
  const symbolRef = useRef(symbol)
  const centerFlashTimerRef = useRef<number | null>(null)

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

  useEffect(() => {
    const run = () => {
      if (centerFlashTimerRef.current != null) {
        window.clearTimeout(centerFlashTimerRef.current)
        centerFlashTimerRef.current = null
      }
      if (centerDir === 0) {
        setCenterFlash(null)
        return
      }
      setCenterFlash(centerDir > 0 ? 'up' : 'down')
      centerFlashTimerRef.current = window.setTimeout(() => {
        setCenterFlash(null)
        centerFlashTimerRef.current = null
      }, 260)
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

  const obFontMult = uiOrderBookFontScale * (uiCompactMode ? 0.94 : 1)
  const markerLabel =
    orderBookHighlightPrice != null
      ? `▶ ${formatByDecimals(roundPriceBySpec(spec, orderBookHighlightPrice), spec.priceDecimals)}`
      : null

  const centerPriceClass =
    centerDir > 0 ? tk.priceUpClass : centerDir < 0 ? tk.priceDownClass : tk.priceFlatClass

  const triggerFlash = (side: 'ask' | 'bid', rowPrice: number) => {
    const key = `${side}-${rowPrice}`
    setFlashRowKey(key)
    window.setTimeout(() => setFlashRowKey((k) => (k === key ? null : k)), 320)
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

  const pulseRow = (side: 'ask' | 'bid', p: number) => {
    const key = `${side}-${p}`
    setPulseRowKey(key)
    window.setTimeout(() => setPulseRowKey((k) => (k === key ? null : k)), 300)
  }

  const handlePriceClick = (rawPrice: number, side: 'ask' | 'bid') => {
    const p = roundPriceBySpec(spec, rawPrice)
    setOrderBookPendingLimitPrice(p)
    setOrderBookPendingTriggerPrice(p)
    setOrderBookHighlightPrice(p)
    pulseRow(side, p)

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
    setOrderBookPendingTriggerPrice(p)
    setOrderBookHighlightPrice(p)
    pulseRow(side, p)
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
        className="rounded border border-[#1f2937]/30 bg-[#0b1118] px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 transition hover:border-violet-500/40 hover:text-violet-200/90"
        aria-expanded={designOpen}
        onClick={() => setDesignOpen((o) => !o)}
      >
        디자인
      </button>
      {designOpen ? (
        <div className="absolute right-0 z-50 mt-1 w-[15.5rem] overflow-hidden rounded-lg border border-[#1f2937]/30 bg-[#0b1118] text-[10px] shadow-2xl ring-1 ring-violet-500/10">
          <div className="border-b border-[#1f2937] bg-[#070b12] px-2.5 py-2">
            <div className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">현재 프리셋</div>
            <div className="mt-0.5 truncate text-[11px] font-semibold text-zinc-100">
              {ORDER_BOOK_PRESET_LABEL[orderBookDesignPreset]}
            </div>
          </div>
          <div className="py-1">
            {ORDER_BOOK_PRESET_ORDER.map((id) => {
              const selected = orderBookDesignPreset === id
              const tags = ORDER_BOOK_PRESET_META[id].tags
              return (
                <button
                  key={id}
                  type="button"
                  className={`flex w-full items-start gap-2 px-2.5 py-2 text-left transition-colors hover:bg-[#070b12] ${
                    selected ? 'bg-violet-500/10 ring-1 ring-inset ring-violet-500/25' : ''
                  }`}
                  onClick={() => {
                    setOrderBookDesignPreset(id)
                    setDesignOpen(false)
                  }}
                >
                  <span className={`min-w-0 flex-1 ${selected ? 'text-zinc-100' : 'text-zinc-400'}`}>
                    <span className="block truncate font-medium">{ORDER_BOOK_PRESET_LABEL[id]}</span>
                    {selected ? (
                      <span className="mt-0.5 block text-[9px] text-violet-300/90">적용 중</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded px-1 py-px text-[7px] font-semibold uppercase tracking-wide ${
                          t === 'pro'
                            ? 'border border-violet-500/35 bg-violet-500/15 text-violet-200/90'
                            : 'border border-[#1f2937] bg-[#070b12] text-zinc-400'
                        }`}
                      >
                        {presetTagLabel(t)}
                      </span>
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="space-y-2 border-t border-[#1f2937]/30 bg-[#070b12] px-2.5 py-2">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">화면</div>
            <label className="block text-[9px] text-zinc-500">
              패널 글자
              <input
                type="range"
                min={0.8}
                max={1.25}
                step={0.05}
                className="mt-1 w-full accent-violet-500"
                value={uiFontScale}
                onChange={(e) => setUiFontScale(Number(e.target.value))}
              />
              <span className="font-mono text-zinc-400">{uiFontScale.toFixed(2)}×</span>
            </label>
            <label className="block text-[9px] text-zinc-500">
              호가 글자
              <input
                type="range"
                min={0.8}
                max={1.25}
                step={0.05}
                className="mt-1 w-full accent-violet-500"
                value={uiOrderBookFontScale}
                onChange={(e) => setUiOrderBookFontScale(Number(e.target.value))}
              />
              <span className="font-mono text-zinc-400">{uiOrderBookFontScale.toFixed(2)}×</span>
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-2 text-[10px] text-zinc-400">
              <span>컴팩트 모드</span>
              <input
                type="checkbox"
                className="accent-violet-500"
                checked={uiCompactMode}
                onChange={(e) => setUiCompactMode(e.target.checked)}
              />
            </label>
            <label className="block text-[9px] text-zinc-500">
              DOM 최소 너비 (px, 비우면 기본)
              <input
                type="number"
                min={220}
                max={560}
                placeholder="260"
                className="mt-1 w-full rounded border border-[#1f2937]/30 bg-[#0b1118] px-2 py-1 font-mono text-[10px] text-zinc-200 outline-none"
                value={uiDomWidthPx ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') setUiDomWidthPx(null)
                  else setUiDomWidthPx(Number(v))
                }}
              />
            </label>
          </div>
          <div className="border-t border-[#1f2937]/30 bg-[#070b12] px-2.5 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-[10px] text-zinc-400 hover:text-zinc-200">
              <input
                type="checkbox"
                checked={orderBookColorInvert}
                onChange={(e) => setOrderBookColorInvert(e.target.checked)}
                className="accent-violet-500"
              />
              매수/매도 색 반전 (한국 HTS)
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )

  const headerToolbar = (
    <div className="flex min-w-0 shrink-0 flex-col gap-1.5 border-b border-[#1f2937]/30 bg-[#070b12] px-2 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[10px] font-medium text-zinc-500">수량</span>
        <div className="flex min-w-0 flex-1 items-center gap-2 border border-[#1f2937]/30 bg-[#0b1118] px-2 py-1">
          <input
            type="number"
            step={spec.lotSize}
            min={0}
            className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-zinc-200 outline-none placeholder:text-zinc-600"
            value={orderBookOrderQty}
            onChange={(e) => setOrderBookOrderQty(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded border border-[#1f2937]/30 bg-[#0b1118] px-2 py-1.5">
          <span className="text-[10px] text-zinc-400">원클릭 주문</span>
          <input
            type="checkbox"
            className="accent-violet-500"
            checked={orderBookOneClickEnabled}
            onChange={(e) => setOrderBookOneClickEnabled(e.target.checked)}
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded border border-[#1f2937]/30 bg-[#0b1118] px-2 py-1.5">
          <span className="text-[10px] text-zinc-400">더블클릭 주문</span>
          <input
            type="checkbox"
            className="accent-violet-500"
            checked={orderBookDoubleClickEnabled}
            onChange={(e) => setOrderBookDoubleClickEnabled(e.target.checked)}
          />
        </label>
      </div>
      {markerLabel ? (
        <div className="flex min-w-0 items-center gap-1.5 rounded border border-violet-500/25 bg-violet-500/[0.06] px-2 py-1 font-mono text-[0.95em] leading-none text-violet-100/95">
          <span className="shrink-0 text-violet-400">트리거</span>
          <span className="min-w-0 truncate">{markerLabel}</span>
        </div>
      ) : null}
    </div>
  )

  const colHeader = (
    <div
      className={`grid shrink-0 grid-cols-[minmax(0,1.05fr)_minmax(0,0.72fr)_minmax(0,0.58fr)] gap-x-0.5 border-b border-[#1f2937]/30 bg-[#070b12] ${tk.headerFontClass} ${tk.rowCellPaddingClass}`}
    >
      <span className="block text-right font-medium">가격</span>
      <span className="block text-right font-medium">수량</span>
      <span className="block truncate text-right font-medium" title="누적">
        누적
      </span>
    </div>
  )

  const renderRow = (r: BookRow, side: 'ask' | 'bid', priceClass: string) => {
    const rowDisplayPrice = roundPriceBySpec(spec, r.price)
    const { widthPct, alpha } = depthBarMetrics(r.cum, r.quantity, maxCum, maxQty)
    const rgb = side === 'ask' ? tk.askDepthRgb : tk.bidDepthRgb
    const a2 = alpha * 0.22
    const a1 = alpha * 0.55
    const depthStyle = {
      width: `${widthPct}%`,
      background: `linear-gradient(90deg, rgba(${rgb},0) 0%, rgba(${rgb},${a2}) 38%, rgba(${rgb},${a1}) 72%, rgba(${rgb},${alpha}) 100%)`,
    } as const

    const hl =
      orderBookHighlightPrice != null &&
      Math.abs(orderBookHighlightPrice - rowDisplayPrice) < spec.tickSize * 0.51
    const rowKey = `${side}-${rowDisplayPrice}`
    const isFlash = flashRowKey === rowKey
    const isPulse = pulseRowKey === rowKey
    return (
      <button
        key={rowKey}
        type="button"
        className={`relative grid w-full min-w-0 shrink-0 grid-cols-[minmax(0,1.05fr)_minmax(0,0.72fr)_minmax(0,0.58fr)] gap-x-0.5 items-stretch border-b border-[#1f2937]/30 transition-colors duration-100 ${uiCompactMode ? 'h-[17px] min-h-[16px]' : tk.rowHeightClass} ${tk.rowFontClass} ${tk.rowCellPaddingClass} ${
          hl ? 'z-[1] bg-violet-500/[0.07] ring-1 ring-inset ring-violet-500/35' : ''
        } ${isFlash ? 'z-[1] motion-safe:animate-pulse bg-violet-500/18 ring-1 ring-inset ring-violet-400/25' : ''} ${
          isPulse && !isFlash ? 'z-[1] bg-violet-500/[0.06] ring-1 ring-inset ring-violet-400/20' : ''
        } hover:bg-[#0b1118]/90 active:bg-[#0b1118]`}
        onClick={() => handlePriceClick(r.price, side)}
        onDoubleClick={() => handlePriceDoubleClick(r.price, side)}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-0 rounded-[1px]"
          style={depthStyle}
        />
        <span
          className={`relative z-[1] flex min-w-0 items-center justify-end text-right font-mono [text-shadow:0_1px_0_rgba(0,0,0,0.55)] ${priceClass}`}
        >
          <span className="truncate">{fmtP(r.price)}</span>
        </span>
        <span className="relative z-[1] flex min-w-0 items-center justify-end text-right font-mono text-zinc-500 [text-shadow:0_1px_0_rgba(0,0,0,0.55)]">
          <span className="truncate">{fmtQ(r.quantity)}</span>
        </span>
        <span
          className="relative z-[1] flex min-w-0 items-center justify-end text-right font-mono text-zinc-600 [text-shadow:0_1px_0_rgba(0,0,0,0.55)]"
          title={String(r.cum)}
        >
          <span className="truncate">{formatCumShort(r.cum, spec.qtyDecimals)}</span>
        </span>
      </button>
    )
  }

  return (
    <PanelShell
      title="호가"
      titleExtra={<span className="font-mono text-[10px] font-medium text-zinc-500">{symbol}</span>}
      variant="cexDom"
      action={designAction}
      className="h-full min-h-[280px] min-w-[260px]"
      style={uiDomWidthPx != null ? { minWidth: uiDomWidthPx } : undefined}
      scrollBody={false}
    >
      <div
        className="flex h-full min-h-0 flex-col"
        style={{ fontSize: `calc(11px * ${obFontMult})` }}
      >
        {headerToolbar}

        {bookEmpty ? (
          <p className="flex flex-1 items-center justify-center px-2 py-6 text-center text-[10px] text-zinc-500">
            호가 없음
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] gap-0 bg-[#070b12]">
            <div className="flex min-h-0 flex-col overflow-hidden border border-[#1f2937]/30 bg-[#070b12]">
              {colHeader}
              <div className={`flex min-h-0 flex-1 flex-col overflow-hidden`}>
                {Array.from({ length: askPads }).map((_, i) => (
                  <div
                    key={`ask-pad-${i}`}
                    className={`shrink-0 ${uiCompactMode ? 'h-[17px] min-h-[16px]' : tk.rowHeightClass} border-b border-[#1f2937]/25 bg-[#070b12]/90`}
                  />
                ))}
                {askRows.map((r) => renderRow(r, 'ask', tk.askPriceClass))}
              </div>
            </div>

            <div
              className={`relative shrink-0 text-center ${tk.centerBgClass} ${tk.centerShellClass}`}
            >
              {centerFlash === 'up' ? (
                <span
                  className={`pointer-events-none absolute inset-0 z-[2] ${tk.tradeUpFlashClass} motion-safe:animate-pulse`}
                  aria-hidden
                />
              ) : null}
              {centerFlash === 'down' ? (
                <span
                  className={`pointer-events-none absolute inset-0 z-[2] ${tk.tradeDownFlashClass} motion-safe:animate-pulse`}
                  aria-hidden
                />
              ) : null}
              <div className={`relative z-[1] font-mono leading-none ${tk.centerPriceFontClass} ${centerPriceClass}`}>
                {fmtP(lp)}
              </div>
              <div
                className={`relative z-[1] mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 ${tk.centerMetaFontClass}`}
              >
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
                <span className={`font-mono ${tk.centerMutedClass}`}>
                  SP {formatByDecimals(spread, spec.priceDecimals)}
                </span>
              </div>
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden border border-[#1f2937]/30 bg-[#070b12]">
              {colHeader}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {bidRows.map((r) => renderRow(r, 'bid', tk.bidPriceClass))}
                {Array.from({ length: bidPads }).map((_, i) => (
                  <div
                    key={`bid-pad-${i}`}
                    className={`shrink-0 ${uiCompactMode ? 'h-[17px] min-h-[16px]' : tk.rowHeightClass} border-b border-[#1f2937]/25 bg-[#070b12]/90`}
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
