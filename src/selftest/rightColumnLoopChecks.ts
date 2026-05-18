import {
  areOrderFormIntentSnapshotsEqual,
  buildOrderFormIntentSnapshot,
  selectOrderFormIntentInputs,
} from '../components/orderform/orderFormIntentModel'
import { applyOrderBookPriceIntent } from '../components/orderbook/orderBookPriceIntent'
import { getResearchFeedDiagnostics } from '../research/researchFeedDiagnostics'
import { getSymbolSpec } from '../symbols/registry'
import { createTradingStoreForWorkspace } from '../store/workspaceStoreRegistry'
import { resetRightColumnLoopDiagnostics } from '../components/ordercolumn/rightColumnLoopDiagnostics'
import type { TradingStoreView } from '../store/tradingStore'
import type { SelfTestCheckResult, SelfTestStatus } from './types'

function runCheck(
  id: string,
  label: string,
  fn: () => { status: SelfTestStatus; message: string },
): SelfTestCheckResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  try {
    const { status, message } = fn()
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    return { id, label, status, message, durationMs: Math.round(t1 - t0) }
  } catch (e) {
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const msg = e instanceof Error ? e.message : String(e)
    return { id, label, status: 'fail', message: `Exception: ${msg}`, durationMs: Math.round(t1 - t0) }
  }
}

type StoreApi = {
  getState: () => TradingStoreView
  setState: (partial: Partial<TradingStoreView> | ((s: TradingStoreView) => Partial<TradingStoreView>)) => void
}

function countStoreUpdates(api: ReturnType<typeof createTradingStoreForWorkspace>, run: () => void): number {
  let n = 0
  const unsub = api.subscribe(() => {
    n += 1
  })
  run()
  unsub()
  return n
}

export function runRightColumnLoopChecks(store?: StoreApi): SelfTestCheckResult[] {
  return [
    runCheck('right-column-no-render-loop', 'Right column store update guards', () => {
      if (!store) return { status: 'warn', message: 'No store runner' }
      resetRightColumnLoopDiagnostics()
      const api = createTradingStoreForWorkspace('domestic_futures:1')
      const sym = api.getState().symbol
      let updates = 0
      const unsub = api.subscribe(() => {
        updates += 1
      })
      api.getState().setSymbol(sym)
      const afterFirst = updates
      api.getState().setSymbol(sym)
      api.getState().setSymbol(sym)
      unsub()
      const redundant = updates - afterFirst
      if (redundant > 0) {
        return { status: 'fail', message: `same-symbol setSymbol caused ${redundant} redundant updates` }
      }
      return { status: 'pass', message: 'setSymbol guard · 0 redundant updates' }
    }),

    runCheck('tgx-orderbook-stable-render', 'TGX orderbook intent idempotent', () => {
      const api = createTradingStoreForWorkspace('crypto:1')
      const s = api.getState()
      const spec = getSymbolSpec(s.symbol)
      const setters = {
        setOrderBookPendingLimitPrice: s.setOrderBookPendingLimitPrice,
        setOrderBookPendingTriggerPrice: s.setOrderBookPendingTriggerPrice,
        setOrderBookPendingTriggerBookSide: s.setOrderBookPendingTriggerBookSide,
        setOrderBookHighlightPrice: s.setOrderBookHighlightPrice,
      }
      const price = spec.referencePrice
      const current = {
        orderBookPendingLimitPrice: s.orderBookPendingLimitPrice,
        orderBookPendingTriggerPrice: s.orderBookPendingTriggerPrice,
        orderBookPendingTriggerBookSide: s.orderBookPendingTriggerBookSide,
        orderBookHighlightPrice: s.orderBookHighlightPrice,
      }
      let n = 0
      const unsub = api.subscribe(() => {
        n += 1
      })
      applyOrderBookPriceIntent(setters, spec, price, 'ask', current)
      const afterFirst = n
      applyOrderBookPriceIntent(setters, spec, price, 'ask', {
        orderBookPendingLimitPrice: api.getState().orderBookPendingLimitPrice,
        orderBookPendingTriggerPrice: api.getState().orderBookPendingTriggerPrice,
        orderBookPendingTriggerBookSide: api.getState().orderBookPendingTriggerBookSide,
        orderBookHighlightPrice: api.getState().orderBookHighlightPrice,
      })
      unsub()
      const redundant = n - afterFirst
      if (redundant > 0) {
        return { status: 'fail', message: `duplicate intent apply → ${redundant} redundant updates` }
      }
      return { status: 'pass', message: 'idempotent applyOrderBookPriceIntent' }
    }),

    runCheck('research-feed-stable-render', 'Research feed diagnostics stable', () => {
      const a = getResearchFeedDiagnostics('BTCUSDT')
      const b = getResearchFeedDiagnostics('BTCUSDT')
      if (a.researchFeedItemCount !== b.researchFeedItemCount) {
        return { status: 'fail', message: 'item count drift' }
      }
      return { status: 'pass', message: `items=${a.researchFeedItemCount}` }
    }),

    runCheck('intent-strip-stable-render', 'Intent snapshot stable equality', () => {
      const api = createTradingStoreForWorkspace('domestic_futures:1')
      const inputs = selectOrderFormIntentInputs(api.getState())
      const a = buildOrderFormIntentSnapshot(inputs, 'standard')
      const b = buildOrderFormIntentSnapshot(inputs, 'standard')
      if (!areOrderFormIntentSnapshotsEqual(a, b)) {
        return { status: 'fail', message: 'snapshot equality failed' }
      }
      return { status: 'pass', message: 'snapshot memo guard OK' }
    }),
  ]
}
