import { OrderBookHost } from '../components/orderbook/OrderBookHost'
import { TgxOrderBookPanel } from '../components/orderbook/TgxOrderBookPanel'
import { TgxOrderBookRow } from '../components/orderbook/TgxOrderBookRow'
import { applyOrderBookPriceIntent } from '../components/orderbook/orderBookPriceIntent'
import { getOrderBookDiagnostics } from '../components/orderbook/orderBookDiagnostics'
import { getSymbolSpec } from '../symbols/registry'
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
    lastPrice: store.getState().lastPrice,
    orderBookOneClickEnabled: store.getState().orderBookOneClickEnabled,
  }
  try {
    return run()
  } finally {
    store.setState(snap)
  }
}

export function runTgxOrderBookChecks(store?: StoreApi): SelfTestCheckResult[] {
  return [
    runCheck('tgx-orderbook-render', 'TGX order book render contract', () => {
      if (typeof TgxOrderBookPanel !== 'function' || typeof TgxOrderBookRow !== 'function') {
        return { status: 'fail', message: 'TGX panel/row not exported' }
      }
      if (typeof OrderBookHost !== 'function') {
        return { status: 'fail', message: 'OrderBookHost not exported' }
      }
      if (!SPEED_ORDER_FEATURE_FLAGS.enableTgxOrderBook) {
        return { status: 'warn', message: 'enableTgxOrderBook=false (legacy only)' }
      }
      const diag = getOrderBookDiagnostics({
        orderBookStyle: 'tgx_style',
        orderBookRowDensity: 'dense',
      })
      return {
        status: 'pass',
        message: `style=${diag.orderBookStyle} · rows=${diag.displayRowCount} · density=${diag.orderBookRowDensity}`,
      }
    }),

    runCheck('tgx-orderbook-click-intent', 'TGX click → limit/trigger intent', () => {
      const spec = getSymbolSpec('BTCUSDT')
      let limit: number | null = null
      let trigger: number | null = null
      let bookSide: 'bid' | 'ask' | null = null
      let highlight: number | null = null
      const p = applyOrderBookPriceIntent(
        {
          setOrderBookPendingLimitPrice: (v) => {
            limit = v
          },
          setOrderBookPendingTriggerPrice: (v) => {
            trigger = v
          },
          setOrderBookPendingTriggerBookSide: (v) => {
            bookSide = v
          },
          setOrderBookHighlightPrice: (v) => {
            highlight = v
          },
        },
        spec,
        42_150.5,
        'ask',
      )
      if (limit !== p || trigger !== p || highlight !== p || bookSide !== 'ask') {
        return {
          status: 'fail',
          message: `intent mismatch limit=${limit} trigger=${trigger} side=${bookSide}`,
        }
      }
      return { status: 'pass', message: `intent @ ${p} (no immediate order path)` }
    }),

    runCheck('tgx-orderbook-stopmit-lock', 'TGX pending trigger → Stop/MIT lock', () => {
      if (!store) {
        return { status: 'warn', message: 'No store runner (static intent only)' }
      }
      return withStoreRestore(store, () => {
        const s = store.getState()
        s.setOrderBookPendingTriggerPrice(41_500)
        s.setOrderBookPendingTriggerBookSide('bid')
        const ok = s.consumeOrderBookPendingTrigger()
        if (!ok) return { status: 'fail', message: 'consume failed' }
        const d = store.getState().stopMitDraft
        if (!d.priceLock.locked || d.triggerPrice !== 41_500) {
          return { status: 'fail', message: `lock not applied: ${d.triggerPrice}` }
        }
        const tickLp = (d.triggerPrice ?? 0) + 500
        s.applyLastPrice(tickLp)
        if (store.getState().stopMitDraft.triggerPrice !== 41_500) {
          return {
            status: 'fail',
            message: 'trigger auto-followed lastPrice (must not)',
          }
        }
        return { status: 'pass', message: 'lock holds · no tick follow' }
      })
    }),

    runCheck('tgx-orderbook-mock-only', 'TGX order book mockOnly', () => {
      if (ORDER_EXECUTION_POLICY.mode !== 'mock_demo') {
        return { status: 'fail', message: 'execution policy not mock_demo' }
      }
      if (SPEED_ORDER_FEATURE_FLAGS.liveTrading) {
        return { status: 'fail', message: 'liveTrading must be false' }
      }
      return { status: 'pass', message: 'mock_demo · store-driven book' }
    }),

    runCheck('tgx-orderbook-no-api-no-websocket', 'TGX order book no API/WS', () => {
      if (ORDER_EXECUTION_POLICY.liveOrderApiEnabled || ORDER_EXECUTION_POLICY.liveExecutionEnabled) {
        return { status: 'fail', message: 'live flags must be false' }
      }
      if (SPEED_ORDER_FEATURE_FLAGS.liveWebSocketRequired) {
        return { status: 'fail', message: 'liveWebSocketRequired must be false' }
      }
      return { status: 'pass', message: 'UI-only · shared store book snapshot' }
    }),
  ]
}
