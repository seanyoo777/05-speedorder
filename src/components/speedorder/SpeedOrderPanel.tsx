import { useEffect, useMemo, useState } from 'react'
import { placeSpeedOrderDemo, useTradingStore } from '../../store/tradingStore'
import { formatPrice } from '../../utils/format'
import { PanelShell } from '../common/PanelShell'

const QTY_PRESETS = [0.01, 0.05, 0.1, 0.5] as const

export function SpeedOrderPanel() {
  const symbol = useTradingStore((s) => s.symbol)
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const beginnerMode = useTradingStore((s) => s.beginnerMode)
  const confirmOrders = useTradingStore((s) => s.confirmOrders)
  const setBeginnerMode = useTradingStore((s) => s.setBeginnerMode)
  const setConfirmOrders = useTradingStore((s) => s.setConfirmOrders)

  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [qty, setQty] = useState(0.05)
  const [limitPrice, setLimitPrice] = useState(lastPrice)

  useEffect(() => {
    setLimitPrice(lastPrice)
  }, [lastPrice])

  const effectiveLimit = useMemo(() => {
    const p = Number(limitPrice)
    return Number.isFinite(p) && p > 0 ? p : lastPrice
  }, [limitPrice, lastPrice])

  const submit = (side: 'buy' | 'sell', label: string) => {
    const type = beginnerMode ? 'market' : orderType
    const go = () =>
      placeSpeedOrderDemo({
        side,
        orderType: type,
        quantity: qty,
        limitPrice: type === 'limit' ? effectiveLimit : undefined,
      })

    if (confirmOrders) {
      const ok = window.confirm(
        `${label} · ${type === 'market' ? '시장가' : '지정가'} · 수량 ${qty} ${symbol} (모의)`,
      )
      if (!ok) return
    }
    go()
  }

  return (
    <PanelShell
      title="원클릭 주문"
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
      <div className="space-y-3 p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex rounded-md border border-so-border p-0.5">
            <button
              type="button"
              className={`rounded px-2 py-1 ${!beginnerMode ? 'bg-so-border text-white' : 'text-so-muted'}`}
              onClick={() => setBeginnerMode(false)}
            >
              전문가
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${beginnerMode ? 'bg-so-border text-white' : 'text-so-muted'}`}
              onClick={() => setBeginnerMode(true)}
            >
              초보자
            </button>
          </div>
          <span className="font-mono text-[11px] text-so-muted">{symbol}</span>
        </div>

        {!beginnerMode ? (
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-md border py-1.5 ${
                orderType === 'market' ? 'border-so-accent bg-so-accent/15' : 'border-so-border'
              }`}
              onClick={() => setOrderType('market')}
            >
              시장가
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md border py-1.5 ${
                orderType === 'limit' ? 'border-so-accent bg-so-accent/15' : 'border-so-border'
              }`}
              onClick={() => setOrderType('limit')}
            >
              지정가
            </button>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-so-border px-2 py-2 text-so-muted">
            초보자 모드: 시장가만 표시됩니다. (구조 분리용 플래그)
          </p>
        )}

        {!beginnerMode && orderType === 'limit' ? (
          <label className="block text-so-muted">
            지정가
            <input
              className="mt-1 w-full rounded-md border border-so-border bg-so-bg px-2 py-1.5 font-mono text-white"
              type="number"
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
                className={`rounded border px-2 py-1 font-mono ${
                  qty === q ? 'border-so-accent text-so-accent' : 'border-so-border text-so-muted'
                }`}
                onClick={() => setQty(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <label className="block text-so-muted">
          수량
          <input
            className="mt-1 w-full rounded-md border border-so-border bg-so-bg px-2 py-1.5 font-mono text-white"
            type="number"
            step="0.001"
            min={0}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>

        <div className="text-[11px] text-so-muted">
          참고가 <span className="font-mono text-white">{formatPrice(lastPrice)}</span>
        </div>

        {beginnerMode ? (
          <button
            type="button"
            className="w-full rounded-md border border-so-border py-2 text-sm font-medium"
            onClick={() => submit('buy', '매수(모의)')}
          >
            빠른 매수 (시장가)
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-md bg-so-bid py-2.5 text-sm font-semibold text-so-bg"
              onClick={() => submit('buy', '롱(매수)')}
            >
              롱
            </button>
            <button
              type="button"
              className="rounded-md bg-so-ask py-2.5 text-sm font-semibold text-white"
              onClick={() => submit('sell', '숏(매도)')}
            >
              숏
            </button>
          </div>
        )}
      </div>
    </PanelShell>
  )
}
