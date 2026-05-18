import { OrderFormIntentStrip } from '../components/orderform/OrderFormIntentStrip'
import {
  buildOrderFormIntentSnapshot,
  resolveOneClickPolicyLabel,
  selectOrderFormIntentInputs,
} from '../components/orderform/orderFormIntentModel'
import { getOrderFormDiagnostics } from '../components/orderform/orderFormDiagnostics'
import { ORDER_EXECUTION_POLICY } from '../vendor/orderExecutionPolicy'
import { SPEED_ORDER_FEATURE_FLAGS } from './featureFlags'
import type { TradingStore } from '../store/tradingStoreTypes'
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
  getState: () => TradingStore
  setState: (partial: Partial<TradingStore> | ((s: TradingStore) => Partial<TradingStore>)) => void
}

function withStoreRestore<T>(store: StoreApi, run: () => T): T {
  const snap = {
    orderBookPendingLimitPrice: store.getState().orderBookPendingLimitPrice,
    orderBookPendingTriggerPrice: store.getState().orderBookPendingTriggerPrice,
    orderBookPendingTriggerBookSide: store.getState().orderBookPendingTriggerBookSide,
    orderBookHighlightPrice: store.getState().orderBookHighlightPrice,
    stopMitDraft: store.getState().stopMitDraft,
    workspaceOrderFormTab: store.getState().workspaceOrderFormTab,
  }
  try {
    return run()
  } finally {
    store.setState(snap)
  }
}

export function runTgxOrderFormChecks(store?: StoreApi): SelfTestCheckResult[] {
  return [
    runCheck('tgx-orderform-intent-strip', 'Order form intent strip model', () => {
      if (typeof OrderFormIntentStrip !== 'function') {
        return { status: 'fail', message: 'OrderFormIntentStrip not exported' }
      }
      const snap = buildOrderFormIntentSnapshot(
        {
          orderBookPendingLimitPrice: 100,
          orderBookPendingTriggerPrice: null,
          orderBookPendingTriggerBookSide: null,
          orderBookHighlightPrice: 100,
          stopMitLocked: false,
          stopMitTriggerPrice: null,
          stopMitLockSource: 'none',
          stopMitLockBookSide: undefined,
        },
        'standard',
      )
      if (!snap.hasVisibleIntent || snap.emphasis !== 'limit') {
        return { status: 'fail', message: `emphasis=${snap.emphasis}` }
      }
      const diag = getOrderFormDiagnostics({
        orderBookPendingLimitPrice: 100,
        orderBookPendingTriggerPrice: null,
        orderBookPendingTriggerBookSide: null,
        orderBookHighlightPrice: 100,
        stopMitDraft: {
          symbol: 'BTCUSDT',
          kind: 'MIT',
          side: 'buy',
          triggerPrice: null,
          quantity: 0.05,
          priceLock: { locked: false, price: null, source: 'none', lockedAt: null },
        },
        orderBookOneClickEnabled: false,
        orderBookStyle: 'tgx_style',
        orderBookRowDensity: 'dense',
        workspaceOrderFormTab: 'standard',
      })
      if (!diag.orderFormIntentVisible) {
        return { status: 'fail', message: 'orderFormIntentVisible false' }
      }
      return {
        status: 'pass',
        message: `limit · rhythm=${diag.tgxFormRhythm} · policy=${diag.oneClickPolicy}`,
      }
    }),

    runCheck('tgx-orderform-stopmit-lock-visible', 'Stop/MIT lock visible in diagnostics', () => {
      if (!store) {
        return { status: 'warn', message: 'No store runner' }
      }
      return withStoreRestore(store, () => {
        store.getState().patchStopMitDraft({ op: 'lockFromBook', price: 42_000, bookSide: 'ask' })
        store.getState().setWorkspaceOrderFormTab('stopMit')
        const snap = buildOrderFormIntentSnapshot(selectOrderFormIntentInputs(store.getState()), 'stopMit')
        const diag = getOrderFormDiagnostics(store.getState())
        if (!snap.stopMitLocked || snap.emphasis !== 'trigger') {
          return { status: 'fail', message: `lock=${snap.stopMitLocked} emphasis=${snap.emphasis}` }
        }
        if (!diag.stopMitLockVisible || !diag.orderFormIntentVisible) {
          return { status: 'fail', message: 'diagnostics flags false' }
        }
        return {
          status: 'pass',
          message: `locked @ ${snap.stopMitTriggerPrice} · source=${snap.lockSource}`,
        }
      })
    }),

    runCheck('tgx-orderform-oneclick-disabled', 'One-click policy intent-only', () => {
      const policy = resolveOneClickPolicyLabel(false, 'tgx_style')
      if (policy !== 'disabled_intent_only') {
        return { status: 'fail', message: `policy=${policy}` }
      }
      const legacyPolicy = resolveOneClickPolicyLabel(true, 'legacy')
      if (legacyPolicy !== 'enabled_legacy_path') {
        return { status: 'fail', message: `legacy policy=${legacyPolicy}` }
      }
      return { status: 'pass', message: 'tgx_style → disabled_intent_only' }
    }),

    runCheck('tgx-orderform-no-api-no-websocket', 'Order form no API/WS', () => {
      if (ORDER_EXECUTION_POLICY.liveOrderApiEnabled || ORDER_EXECUTION_POLICY.liveExecutionEnabled) {
        return { status: 'fail', message: 'live flags must be false' }
      }
      if (SPEED_ORDER_FEATURE_FLAGS.liveWebSocketRequired) {
        return { status: 'fail', message: 'liveWebSocketRequired must be false' }
      }
      return { status: 'pass', message: 'intent strip · store-only' }
    }),
  ]
}
