import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { OrderSide } from '../../types/trading'
import { speedOrderUxFeedback } from '../../feedback/speedOrderUxFeedback'
import { STANDARD_SYMBOLS, getSymbolSpec } from '../../symbols/registry'
import { selectSpeedOrderShell } from '../../store/selectors'
import { submitMockSpeedOrder, tradingStoreApi, useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'
import { estimateInitialMarginUsdt } from '../../utils/margin'
import { roundPriceBySpec, roundQtyBySpec } from '../../utils/specInstrument'
import { PanelShell } from '../common/PanelShell'
import { useTgxFormRhythm } from '../orderform/useTgxFormRhythm'
import { RecentOrderActionsLog } from './RecentOrderActionsLog'
import { OrderConfirmModal, type OrderConfirmDraft } from './OrderConfirmModal'

const QTY_PRESETS = [0.01, 0.05, 0.1, 0.5] as const

export function SpeedOrderPanel() {
  const {
    symbol,
    lastPrice,
    beginnerMode,
    confirmOrders,
    mockOrderInFlightId,
    setSymbol,
    setBeginnerMode,
    setConfirmOrders,
  } = useTradingStore(useShallow(selectSpeedOrderShell))

  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [qty, setQty] = useState(0.05)
  const [limitPrice, setLimitPrice] = useState(lastPrice)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingSide, setPendingSide] = useState<OrderSide | null>(null)

  const spec = getSymbolSpec(symbol)
  const busy = mockOrderInFlightId != null
  const { cx } = useTgxFormRhythm()

  const prevSymRef = useRef(useTradingStore.getState().symbol)

  useEffect(() => {
    return useTradingStore.subscribe((st, prev) => {
      const p = st.orderBookPendingLimitPrice
      const prevP = prev.orderBookPendingLimitPrice
      if (p != null && p !== prevP && Number.isFinite(p) && p > 0) {
        setLimitPrice(p)
        useTradingStore.getState().clearOrderBookPendingLimitPrice()
      }
    })
  }, [])

  useEffect(() => {
    prevSymRef.current = useTradingStore.getState().symbol
    return useTradingStore.subscribe((st) => {
      if (st.symbol !== prevSymRef.current) {
        prevSymRef.current = st.symbol
        setLimitPrice(st.lastPrice)
      }
    })
  }, [])

  const effectiveLimit = useMemo(() => {
    const p = Number(limitPrice)
    return Number.isFinite(p) && p > 0 ? p : lastPrice
  }, [limitPrice, lastPrice])

  const effectiveOrderType = beginnerMode ? 'market' : orderType

  const draft = useMemo((): OrderConfirmDraft | null => {
    if (pendingSide == null) return null
    const rawQty = roundQtyBySpec(spec, Number(qty))
    const refPx =
      effectiveOrderType === 'market' ? lastPrice : roundPriceBySpec(spec, effectiveLimit)
    const margin = estimateInitialMarginUsdt(spec, refPx, rawQty)
    const priceDisplay =
      effectiveOrderType === 'market'
        ? `시장 (참고 ${formatByDecimals(lastPrice, spec.priceDecimals)})`
        : formatByDecimals(roundPriceBySpec(spec, effectiveLimit), spec.priceDecimals)
    return {
      symbol: spec.symbol,
      displayName: spec.displayName,
      marketType: spec.marketType,
      directionLabel: pendingSide === 'buy' ? '롱 (매수)' : '숏 (매도)',
      orderType: effectiveOrderType,
      priceDisplay,
      quantity: rawQty,
      qtyDecimals: spec.qtyDecimals,
      estimatedMargin: margin,
    }
  }, [
    pendingSide,
    qty,
    spec,
    effectiveOrderType,
    lastPrice,
    effectiveLimit,
  ])

  const runSubmit = () => {
    if (pendingSide == null) return
    const q = roundQtyBySpec(spec, Number(qty))
    if (!Number.isFinite(q) || q <= 0) {
      speedOrderUxFeedback(tradingStoreApi, 'skip_qty', '수량 오류')
      setModalOpen(false)
      setPendingSide(null)
      return
    }
    void submitMockSpeedOrder({
      side: pendingSide,
      orderType: effectiveOrderType,
      quantity: qty,
      limitPrice: effectiveOrderType === 'limit' ? effectiveLimit : undefined,
    }).finally(() => {
      setModalOpen(false)
      setPendingSide(null)
    })
  }

  const requestSubmit = (side: OrderSide) => {
    if (busy) {
      speedOrderUxFeedback(tradingStoreApi, 'skip_busy', '주문 진행 중')
      return
    }
    const q = roundQtyBySpec(spec, Number(qty))
    if (!Number.isFinite(q) || q <= 0) {
      speedOrderUxFeedback(tradingStoreApi, 'skip_qty', '수량 오류')
      return
    }
    if (confirmOrders) {
      setPendingSide(side)
      setModalOpen(true)
      return
    }
    void submitMockSpeedOrder({
      side,
      orderType: effectiveOrderType,
      quantity: qty,
      limitPrice: effectiveOrderType === 'limit' ? effectiveLimit : undefined,
    })
  }

  return (
    <PanelShell
      title={`스피드 주문 · ${symbol}`}
      action={
        <label className="flex items-center gap-1 text-[10px] text-so-muted">
          <input
            type="checkbox"
            checked={confirmOrders}
            onChange={(e) => setConfirmOrders(e.target.checked)}
          />
          확인
        </label>
      }
    >
      <OrderConfirmModal
        open={modalOpen}
        draft={draft}
        onClose={() => {
          setModalOpen(false)
          setPendingSide(null)
        }}
        onConfirm={runSubmit}
      />
      <div className={`${cx.stack} ${cx.panelPad}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex rounded border border-[#1f2937]/50 bg-[#0b1118] p-0.5">
            <button
              type="button"
              className={`${cx.chipBtn} ${!beginnerMode ? 'bg-[#1f2937]/80 text-zinc-100' : 'text-zinc-500'}`}
              onClick={() => setBeginnerMode(false)}
            >
              전문가
            </button>
            <button
              type="button"
              className={`${cx.chipBtn} ${beginnerMode ? 'bg-[#1f2937]/80 text-zinc-100' : 'text-zinc-500'}`}
              onClick={() => setBeginnerMode(true)}
            >
              초보자
            </button>
          </div>
          <select
            className={`${cx.input} max-w-[140px]`}
            value={symbol}
            disabled={busy}
            onChange={(e) => {
              const v = e.target.value
              setSymbol(v)
              setLimitPrice(useTradingStore.getState().lastPrice)
            }}
          >
            {STANDARD_SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {!beginnerMode ? (
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={busy}
              className={`${cx.segmentBtn} border ${
                orderType === 'market'
                  ? 'border-violet-500/45 bg-violet-500/15 text-violet-100'
                  : 'border-[#1f2937]/50 text-zinc-500'
              }`}
              onClick={() => setOrderType('market')}
            >
              시장가
            </button>
            <button
              type="button"
              disabled={busy}
              className={`${cx.segmentBtn} border ${
                orderType === 'limit'
                  ? 'border-violet-500/45 bg-violet-500/15 text-violet-100'
                  : 'border-[#1f2937]/50 text-zinc-500'
              }`}
              onClick={() => setOrderType('limit')}
            >
              지정가
            </button>
          </div>
        ) : (
          <p className={`rounded border border-dashed border-[#1f2937]/50 px-2 py-1.5 ${cx.meta}`}>
            초보자 모드: 시장가만 표시됩니다. (구조 분리용 플래그)
          </p>
        )}

        {!beginnerMode && orderType === 'limit' ? (
          <label className={`block ${cx.label}`}>
            지정가
            <input
              className={`mt-0.5 ${cx.input}`}
              type="number"
              disabled={busy}
              value={limitPrice}
              onChange={(e) => setLimitPrice(Number(e.target.value))}
            />
          </label>
        ) : null}

        {beginnerMode ? null : (
          <div className="flex flex-wrap gap-1">
            {QTY_PRESETS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                className={`${cx.chipBtn} font-mono ${
                  qty === q
                    ? 'border-violet-500/45 text-violet-200'
                    : 'border-[#1f2937]/50 text-zinc-500'
                }`}
                onClick={() => setQty(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <label className={`block ${cx.label}`}>
          수량 (lot {spec.lotSize})
          <input
            className={`mt-0.5 ${cx.input}`}
            type="number"
            step={spec.lotSize}
            min={0}
            disabled={busy}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>

        <div className={cx.meta}>
          참고가{' '}
          <span className="font-mono text-zinc-200">
            {formatByDecimals(lastPrice, spec.priceDecimals)}
          </span>
          {busy ? <span className="ml-2 text-violet-300">주문 처리 중…</span> : null}
        </div>

        {beginnerMode ? (
          <button
            type="button"
            disabled={busy}
            className={`${cx.primaryBtn} w-full border border-[#1f2937]/50 text-zinc-200 disabled:opacity-50`}
            onClick={() => requestSubmit('buy')}
          >
            빠른 매수 (시장가)
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={busy}
              className={`${cx.primaryBtn} bg-emerald-500 text-[#070b12] shadow-[0_0_12px_-4px_rgba(52,211,153,0.55)] disabled:opacity-50`}
              onClick={() => requestSubmit('buy')}
            >
              롱
            </button>
            <button
              type="button"
              disabled={busy}
              className={`${cx.primaryBtn} bg-rose-500 text-white shadow-[0_0_12px_-4px_rgba(244,63,94,0.5)] disabled:opacity-50`}
              onClick={() => requestSubmit('sell')}
            >
              숏
            </button>
          </div>
        )}
        <RecentOrderActionsLog variant="default" />
      </div>
    </PanelShell>
  )
}
