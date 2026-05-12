import { useMemo, useState } from 'react'
import type { ConditionalOrderKind, OrderSide } from '../../types/trading'
import { classifyConditionalOutcome } from '../../engine/conditionalOrderRunner'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'
import { roundPriceBySpec, roundQtyBySpec } from '../../utils/specInstrument'
import { PanelShell } from '../common/PanelShell'

export function StopMitOrderPanel() {
  const symbol = useTradingStore((s) => s.symbol)
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const positions = useTradingStore((s) => s.positions)
  const conditionalOrders = useTradingStore((s) => s.conditionalOrders)
  const registerConditionalOrder = useTradingStore((s) => s.registerConditionalOrder)
  const cancelConditionalOrder = useTradingStore((s) => s.cancelConditionalOrder)

  const [kind, setKind] = useState<ConditionalOrderKind>('MIT')
  const [side, setSide] = useState<OrderSide>('buy')
  const [triggerPrice, setTriggerPrice] = useState('')
  const [quantity, setQuantity] = useState('0.05')

  const spec = getSymbolSpec(symbol)
  const pos = positions.find((p) => p.symbol === symbol && p.size > 0)

  const preview = useMemo(() => {
    const tp = roundPriceBySpec(spec, Number(triggerPrice))
    const q = roundQtyBySpec(spec, Number(quantity))
    if (!Number.isFinite(tp) || tp <= 0 || !Number.isFinite(q) || q <= 0) return '—'
    return classifyConditionalOutcome(pos, side, q)
  }, [pos, side, triggerPrice, quantity, spec])

  const rows = useMemo(
    () => conditionalOrders.filter((c) => c.symbol === symbol),
    [conditionalOrders, symbol],
  )

  const submit = () => {
    const tp = roundPriceBySpec(spec, Number(triggerPrice))
    const q = roundQtyBySpec(spec, Number(quantity))
    if (!Number.isFinite(tp) || tp <= 0 || !Number.isFinite(q) || q <= 0) return
    registerConditionalOrder({ kind, side, triggerPrice: tp, quantity: q })
  }

  return (
    <PanelShell title="스탑로스 + MIT" className="min-h-0">
      <div className="space-y-3 p-3 text-[11px]">
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded border py-1.5 ${kind === 'MIT' ? 'border-so-accent bg-so-accent/15' : 'border-so-border'}`}
            onClick={() => setKind('MIT')}
          >
            MIT
          </button>
          <button
            type="button"
            className={`flex-1 rounded border py-1.5 ${kind === 'STOP' ? 'border-so-accent bg-so-accent/15' : 'border-so-border'}`}
            onClick={() => setKind('STOP')}
          >
            스탑로스
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded border py-1.5 ${side === 'buy' ? 'border-so-bid bg-so-bid/15' : 'border-so-border'}`}
            onClick={() => setSide('buy')}
          >
            매수
          </button>
          <button
            type="button"
            className={`flex-1 rounded border py-1.5 ${side === 'sell' ? 'border-so-ask bg-so-ask/15' : 'border-so-border'}`}
            onClick={() => setSide('sell')}
          >
            매도
          </button>
        </div>

        <label className="block text-so-muted">
          트리거 가격
          <input
            className="mt-1 w-full rounded border border-so-border bg-so-bg px-2 py-1.5 font-mono text-white"
            type="number"
            value={triggerPrice}
            onChange={(e) => setTriggerPrice(e.target.value)}
            placeholder={formatByDecimals(lastPrice, spec.priceDecimals)}
          />
        </label>

        <label className="block text-so-muted">
          주문 수량 (lot {spec.lotSize})
          <input
            className="mt-1 w-full rounded border border-so-border bg-so-bg px-2 py-1.5 font-mono text-white"
            type="number"
            step={spec.lotSize}
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        <div className="rounded border border-dashed border-so-border px-2 py-2 text-so-muted">
          실행 방식: <span className="text-white">시장가</span> (트리거 도달 시)
        </div>

        <div className="rounded border border-so-border bg-so-bg/50 px-2 py-2">
          <div className="text-[10px] text-so-muted">예상 결과 (현재가·포지션 기준)</div>
          <div className="mt-1 font-mono text-sm text-so-accent">{preview}</div>
        </div>

        <button
          type="button"
          className="w-full rounded-md bg-so-accent py-2 text-sm font-medium text-so-bg"
          onClick={submit}
        >
          조건 주문 등록
        </button>

        <div>
          <div className="mb-1 text-[10px] font-medium uppercase text-so-muted">조건 주문 목록</div>
          <ul className="max-h-[160px] space-y-1 overflow-auto font-mono text-[10px]">
            {rows.length === 0 ? (
              <li className="py-4 text-center text-so-muted">등록된 주문 없음</li>
            ) : (
              rows.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-1 rounded border border-so-border/60 bg-so-surface/40 px-2 py-1"
                >
                  <span className="text-white">
                    {c.kind} {c.side.toUpperCase()}
                  </span>
                  <span className="text-so-muted">{formatByDecimals(c.triggerPrice, spec.priceDecimals)}</span>
                  <span className="text-so-muted">×{c.quantity}</span>
                  <span
                    className={
                      c.status === 'filled'
                        ? 'text-so-bid'
                        : c.status === 'canceled'
                          ? 'text-so-ask'
                          : 'text-so-muted'
                    }
                  >
                    {c.status === 'filled' ? '체결' : c.status}
                  </span>
                  {c.status === 'pending' ? (
                    <button
                      type="button"
                      className="rounded border border-so-border px-1.5 py-0.5 text-so-ask hover:bg-so-ask/10"
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
