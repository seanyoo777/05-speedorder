import { useShallow } from 'zustand/react/shallow'
import { useTradingStore } from '../../store/tradingStore'
import { buildOrderFormIntentSnapshot } from './orderFormIntentModel'
import { useTgxFormRhythm } from './useTgxFormRhythm'
import type { WorkspaceOrderFormTab } from '../../workspace/applyWorkspaceSlot'

export function OrderFormTabs() {
  const { cx } = useTgxFormRhythm()
  const { tab, setTab, limitHint, triggerHint } = useTradingStore(
    useShallow((s) => {
      const snap = buildOrderFormIntentSnapshot(s, s.workspaceOrderFormTab)
      return {
        tab: s.workspaceOrderFormTab,
        setTab: s.setWorkspaceOrderFormTab,
        limitHint: snap.limitIntent != null,
        triggerHint:
          s.stopMitDraft.priceLock.locked ||
          s.orderBookPendingTriggerPrice != null ||
          (s.workspaceOrderFormTab === 'stopMit' && s.orderBookHighlightPrice != null),
      }
    }),
  )

  const tabClass = (id: WorkspaceOrderFormTab, hint: boolean) => {
    const active = tab === id
    if (!active) {
      return `${cx.tabBtn} text-zinc-500 hover:text-zinc-200`
    }
    if (id === 'standard' && hint) {
      return `${cx.tabBtn} bg-violet-500/20 text-violet-100 ring-1 ring-inset ring-violet-500/35`
    }
    if (id === 'stopMit' && hint) {
      return `${cx.tabBtn} bg-amber-500/15 text-amber-100 ring-1 ring-inset ring-amber-500/40`
    }
    return `${cx.tabBtn} bg-[#1f2937]/80 text-zinc-100`
  }

  return (
    <div
      className="flex shrink-0 gap-1 rounded-md border border-[#1f2937]/50 bg-[#070b12] p-0.5"
      data-testid="order-form-tabs"
    >
      <button
        type="button"
        className={tabClass('standard', limitHint)}
        onClick={() => setTab('standard')}
      >
        일반 주문
      </button>
      <button
        type="button"
        className={tabClass('stopMit', triggerHint)}
        onClick={() => setTab('stopMit')}
      >
        스탑로스 + MIT
      </button>
    </div>
  )
}
