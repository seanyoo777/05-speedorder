import { useShallow } from 'zustand/react/shallow'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'
import { useOrderFormIntentSnapshot } from './useOrderFormIntentSnapshot'

function lockSourceKo(source: string): string {
  if (source === 'orderbook') return '호가'
  if (source === 'manual') return '수동'
  return '—'
}

type Props = {
  tab: 'standard' | 'stopMit'
}

export function OrderFormIntentStrip({ tab }: Props) {
  const symbol = useTradingStore((s) => s.symbol)
  const { snapshot, oneClickPolicy } = useOrderFormIntentSnapshot(tab)
  const {
    patchStopMitDraft,
    clearOrderBookPendingLimitPrice,
    clearOrderBookPendingTriggerPrice,
    setOrderBookHighlightPrice,
  } = useTradingStore(
    useShallow((s) => ({
      patchStopMitDraft: s.patchStopMitDraft,
      clearOrderBookPendingLimitPrice: s.clearOrderBookPendingLimitPrice,
      clearOrderBookPendingTriggerPrice: s.clearOrderBookPendingTriggerPrice,
      setOrderBookHighlightPrice: s.setOrderBookHighlightPrice,
    })),
  )

  const spec = getSymbolSpec(symbol)
  const fmt = (n: number | null) =>
    n != null && Number.isFinite(n) ? formatByDecimals(n, spec.priceDecimals) : '—'

  const limitActive = snapshot.emphasis === 'limit' && snapshot.limitIntent != null
  const triggerActive = snapshot.emphasis === 'trigger' && snapshot.triggerIntent != null

  const clearLimit = () => {
    clearOrderBookPendingLimitPrice()
    if (snapshot.limitIntent != null) setOrderBookHighlightPrice(null)
  }

  const clearTriggerPending = () => {
    if (!snapshot.stopMitLocked) clearOrderBookPendingTriggerPrice()
  }

  return (
    <section
      className="shrink-0 space-y-1.5 rounded-md border border-[#1f2937]/50 bg-[#070b12] px-2 py-1.5"
      data-testid="order-form-intent-strip"
    >
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
          Intent
        </span>
        <span
          className="rounded border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-medium text-emerald-200/95"
          data-testid="one-click-policy-badge"
        >
          {oneClickPolicy === 'disabled_intent_only'
            ? 'One-click disabled · intent only'
            : 'Legacy one-click path available'}
        </span>
      </div>

      {!snapshot.hasVisibleIntent ? (
        <p className="text-[10px] leading-snug text-zinc-500">
          호가를 클릭하면 지정가/트리거 intent가 표시됩니다. (즉시 주문 없음)
        </p>
      ) : (
        <ul className="space-y-1 font-mono text-[10px]">
          <li
            className={`flex flex-wrap items-center justify-between gap-1 rounded border px-1.5 py-1 ${
              limitActive
                ? 'border-violet-500/45 bg-violet-500/12 text-violet-100'
                : 'border-[#1f2937]/40 bg-[#0b1118]/60 text-zinc-400'
            }`}
            data-testid="intent-limit-row"
          >
            <span>
              <span className="text-zinc-500">Limit</span>{' '}
              <span className={limitActive ? 'font-semibold text-violet-200' : ''}>
                {fmt(snapshot.limitIntent)}
              </span>
            </span>
            {snapshot.limitIntent != null ? (
              <button
                type="button"
                className="text-[9px] text-zinc-500 underline hover:text-zinc-300"
                onClick={clearLimit}
              >
                clear
              </button>
            ) : null}
          </li>

          <li
            className={`flex flex-wrap items-center justify-between gap-1 rounded border px-1.5 py-1 ${
              triggerActive || snapshot.stopMitLocked
                ? 'border-amber-500/45 bg-amber-500/10 text-amber-100'
                : 'border-[#1f2937]/40 bg-[#0b1118]/60 text-zinc-400'
            }`}
            data-testid="intent-trigger-row"
          >
            <span>
              <span className="text-zinc-500">Trigger</span>{' '}
              <span
                className={
                  triggerActive || snapshot.stopMitLocked ? 'font-semibold text-amber-200' : ''
                }
              >
                {fmt(snapshot.triggerIntent ?? snapshot.stopMitTriggerPrice)}
              </span>
              {snapshot.triggerBookSide ? (
                <span className="ml-1 text-[9px] text-zinc-500">· {snapshot.triggerBookSide}</span>
              ) : null}
            </span>
            {snapshot.stopMitLocked ? (
              <span className="flex items-center gap-1">
                <span className="text-[9px] text-amber-200/80">
                  🔒 {lockSourceKo(snapshot.lockSource)}
                </span>
                <button
                  type="button"
                  className="text-[9px] text-amber-300/90 underline hover:no-underline"
                  data-testid="intent-unlock-btn"
                  onClick={() => patchStopMitDraft({ op: 'unlock' })}
                >
                  unlock
                </button>
              </span>
            ) : snapshot.triggerIntent != null ? (
              <button
                type="button"
                className="text-[9px] text-zinc-500 underline hover:text-zinc-300"
                onClick={clearTriggerPending}
              >
                clear
              </button>
            ) : null}
          </li>
        </ul>
      )}
    </section>
  )
}
