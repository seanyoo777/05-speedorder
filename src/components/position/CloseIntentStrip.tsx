import { useShallow } from 'zustand/react/shallow'
import { formatCloseIntentSummary } from '../../domain/positionCloseIntent'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'

export function CloseIntentStrip() {
  const { intent, orderType, setOrderType, setQty, clearIntent } = useTradingStore(
    useShallow((s) => ({
      intent: s.positionCloseIntent,
      orderType: s.positionCloseOrderType,
      setOrderType: s.setPositionCloseOrderType,
      setQty: s.setPositionCloseIntentQty,
      clearIntent: s.clearPositionCloseIntent,
    })),
  )

  if (!intent) return null

  const spec = getSymbolSpec(intent.symbol)
  const fmt = (n: number) => formatByDecimals(n, spec.priceDecimals)

  return (
    <section
      className="mb-2 shrink-0 space-y-1.5 rounded-md border border-rose-500/35 bg-rose-500/5 px-2 py-1.5"
      data-testid="close-intent-strip"
    >
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-rose-300/90">
          Close intent
        </span>
        <span className="rounded border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] text-emerald-200/95">
          mock only · no live close
        </span>
      </div>
      <ul className="space-y-1 font-mono text-[10px] text-zinc-200">
        <li className="rounded border border-[#1f2937]/50 bg-[#0b1118]/80 px-1.5 py-1">
          <span className="text-zinc-500">Target </span>
          {intent.batchMode === 'single' ? intent.symbol : `${intent.batchMode} (${intent.positionIds.length})`}
        </li>
        <li className="flex flex-wrap gap-2 rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-1">
          <span>
            <span className="text-zinc-500">Qty</span> {formatByDecimals(intent.qty, spec.qtyDecimals)}
          </span>
          <span>
            <span className="text-zinc-500">Ratio</span> {intent.ratio}%
          </span>
          <span>
            <span className="text-zinc-500">Ref</span> {fmt(intent.referencePrice)}
          </span>
        </li>
      </ul>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`rounded px-1.5 py-0.5 text-[9px] ${
            orderType === 'market' ? 'bg-rose-500/20 text-rose-100' : 'text-zinc-500'
          }`}
          onClick={() => setOrderType('market')}
        >
          시장가
        </button>
        <button
          type="button"
          className={`rounded px-1.5 py-0.5 text-[9px] ${
            orderType === 'limit' ? 'bg-rose-500/20 text-rose-100' : 'text-zinc-500'
          }`}
          onClick={() => setOrderType('limit')}
        >
          지정가
        </button>
        <label className="ml-auto flex items-center gap-1 text-[9px] text-zinc-500">
          qty
          <input
            type="number"
            step={spec.lotSize}
            min={0}
            className="h-[22px] w-16 rounded border border-[#1f2937]/50 bg-[#0b1118] px-1 font-mono text-[10px] text-zinc-100"
            value={intent.qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="text-[9px] text-zinc-500 underline hover:text-zinc-300"
          onClick={clearIntent}
        >
          clear
        </button>
      </div>
      <p className="truncate text-[9px] text-zinc-600" title={formatCloseIntentSummary(intent)}>
        {formatCloseIntentSummary(intent)}
      </p>
    </section>
  )
}
