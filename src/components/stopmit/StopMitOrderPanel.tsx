import { useEffect, useMemo } from 'react'
import { classifyConditionalOutcome } from '../../engine/conditionalOrderRunner'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'
import { roundQtyBySpec } from '../../utils/specInstrument'
import { PanelShell } from '../common/PanelShell'
import { useTgxFormRhythm } from '../orderform/useTgxFormRhythm'

function lockSourceLabel(source: string): string {
  if (source === 'orderbook') return '호가'
  if (source === 'manual') return '수동'
  return '—'
}

export function StopMitOrderPanel() {
  const symbol = useTradingStore((s) => s.symbol)
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const positions = useTradingStore((s) => s.positions)
  const conditionalOrders = useTradingStore((s) => s.conditionalOrders)
  const stopMitDraft = useTradingStore((s) => s.stopMitDraft)
  const patchStopMitDraft = useTradingStore((s) => s.patchStopMitDraft)
  const consumeOrderBookPendingTrigger = useTradingStore((s) => s.consumeOrderBookPendingTrigger)
  const registerConditionalOrder = useTradingStore((s) => s.registerConditionalOrder)
  const cancelConditionalOrder = useTradingStore((s) => s.cancelConditionalOrder)

  const { kind, side, triggerPrice, quantity, priceLock } = stopMitDraft

  const spec = getSymbolSpec(symbol)
  const pos = positions.find((p) => p.symbol === symbol && p.size > 0)
  const { cx } = useTgxFormRhythm()

  useEffect(() => {
    if (useTradingStore.getState().orderBookPendingTriggerPrice != null) {
      consumeOrderBookPendingTrigger()
    }
    return useTradingStore.subscribe((st, prev) => {
      const p = st.orderBookPendingTriggerPrice
      if (p != null && p !== prev.orderBookPendingTriggerPrice) {
        st.consumeOrderBookPendingTrigger()
      }
    })
  }, [consumeOrderBookPendingTrigger])

  const triggerInputValue = triggerPrice != null ? String(triggerPrice) : ''

  const preview = useMemo(() => {
    const tp = triggerPrice
    const q = quantity != null ? roundQtyBySpec(spec, quantity) : NaN
    if (tp == null || !Number.isFinite(tp) || tp <= 0 || !Number.isFinite(q) || q <= 0) return '—'
    return classifyConditionalOutcome(pos, side, q)
  }, [pos, side, triggerPrice, quantity, spec])

  const rows = useMemo(
    () => conditionalOrders.filter((c) => c.symbol === symbol),
    [conditionalOrders, symbol],
  )

  const submit = () => {
    const tp = triggerPrice
    const q = quantity != null ? roundQtyBySpec(spec, quantity) : NaN
    if (tp == null || !Number.isFinite(tp) || tp <= 0 || !Number.isFinite(q) || q <= 0) return
    registerConditionalOrder({ kind, side, triggerPrice: tp, quantity: q })
  }

  return (
    <PanelShell title="스탑로스 + MIT" className="min-h-0">
      <div className={`${cx.stack} ${cx.panelPad} text-[10px]`}>
        <div className="flex gap-1.5">
          <button
            type="button"
            className={`${cx.segmentBtn} border ${
              kind === 'MIT'
                ? 'border-amber-500/45 bg-amber-500/12 text-amber-100'
                : 'border-[#1f2937]/50 text-zinc-500'
            }`}
            onClick={() => patchStopMitDraft({ op: 'setKind', kind: 'MIT' })}
          >
            MIT
          </button>
          <button
            type="button"
            className={`${cx.segmentBtn} border ${
              kind === 'STOP'
                ? 'border-amber-500/45 bg-amber-500/12 text-amber-100'
                : 'border-[#1f2937]/50 text-zinc-500'
            }`}
            onClick={() => patchStopMitDraft({ op: 'setKind', kind: 'STOP' })}
          >
            스탑로스
          </button>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            className={`${cx.segmentBtn} border ${
              side === 'buy'
                ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-200'
                : 'border-[#1f2937]/50 text-zinc-500'
            }`}
            onClick={() => patchStopMitDraft({ op: 'setSide', side: 'buy' })}
          >
            매수
          </button>
          <button
            type="button"
            className={`${cx.segmentBtn} border ${
              side === 'sell'
                ? 'border-rose-500/40 bg-rose-500/12 text-rose-200'
                : 'border-[#1f2937]/50 text-zinc-500'
            }`}
            onClick={() => patchStopMitDraft({ op: 'setSide', side: 'sell' })}
          >
            매도
          </button>
        </div>

        <label className={`block ${cx.label}`}>
          <span className="mb-0.5 block">
            {kind === 'STOP' ? '스탑 가격' : '트리거 가격'}
            {priceLock.locked ? (
              <span className="ml-1 text-[9px] text-amber-300/90">
                🔒 {lockSourceLabel(priceLock.source)}
              </span>
            ) : null}
          </span>
          <input
            className={cx.input}
            type="number"
            value={triggerInputValue}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                patchStopMitDraft({ op: 'unlock' })
                return
              }
              const n = Number(raw)
              if (Number.isFinite(n) && n > 0) patchStopMitDraft({ op: 'setManualPrice', price: n })
            }}
            placeholder={priceLock.locked ? undefined : '호가 클릭 또는 직접 입력'}
          />
          <p className={`mt-0.5 ${cx.meta}`}>
            참고 현재가{' '}
            <span className="font-mono text-zinc-400">
              {formatByDecimals(lastPrice, spec.priceDecimals)}
            </span>
            <span className="text-zinc-600"> (자동 추종 안 함)</span>
          </p>
        </label>

        <label className={`block ${cx.label}`}>
          주문 수량 (lot {spec.lotSize})
          <input
            className={`mt-0.5 ${cx.input}`}
            type="number"
            step={spec.lotSize}
            min={0}
            value={quantity ?? ''}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n) && n > 0) patchStopMitDraft({ op: 'setQuantity', quantity: n })
            }}
          />
        </label>

        <div className={`rounded border border-dashed border-[#1f2937]/50 px-2 py-1.5 ${cx.meta}`}>
          실행 방식: <span className="text-zinc-200">시장가</span> (트리거 도달 시)
        </div>

        <div className="rounded border border-[#1f2937]/50 bg-[#0b1118]/80 px-2 py-1.5">
          <div className={cx.meta}>예상 결과 (현재가·포지션 기준)</div>
          <div className="mt-0.5 font-mono text-[11px] text-amber-200/95">{preview}</div>
        </div>

        <button
          type="button"
          className={`${cx.primaryBtn} w-full bg-violet-600 text-white shadow-[0_0_14px_-4px_rgba(139,92,246,0.55)]`}
          onClick={submit}
        >
          조건 주문 등록
        </button>

        <div>
          <div className={`mb-1 font-medium uppercase ${cx.meta}`}>조건 주문 목록</div>
          <ul className="max-h-[160px] space-y-1 overflow-auto font-mono text-[10px]">
            {rows.length === 0 ? (
              <li className="py-4 text-center text-zinc-500">등록된 주문 없음</li>
            ) : (
              rows.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-1 rounded border border-[#1f2937]/50 bg-[#0b1118]/60 px-2 py-1"
                >
                  <span className="text-zinc-200">
                    {c.kind} {c.side.toUpperCase()}
                  </span>
                  <span className="text-zinc-500">
                    {formatByDecimals(c.triggerPrice, spec.priceDecimals)}
                  </span>
                  <span className="text-zinc-500">×{c.quantity}</span>
                  <span
                    className={
                      c.status === 'filled'
                        ? 'text-emerald-400'
                        : c.status === 'canceled'
                          ? 'text-rose-400'
                          : 'text-zinc-500'
                    }
                  >
                    {c.status === 'filled' ? '체결' : c.status}
                  </span>
                  {c.status === 'pending' ? (
                    <button
                      type="button"
                      className="rounded border border-[#1f2937]/50 px-1.5 py-0.5 text-rose-400 hover:bg-rose-500/10"
                      onClick={() => cancelConditionalOrder(c.id)}
                    >
                      취소
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </PanelShell>
  )
}
