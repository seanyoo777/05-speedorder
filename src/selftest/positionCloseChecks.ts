import { CLOSE_RATIOS, buildPositionCloseIntent, qtyForCloseRatio } from '../domain/positionCloseIntent'
import { CloseIntentStrip } from '../components/position/CloseIntentStrip'
import { getPositionCloseDiagnostics } from '../components/position/positionCloseDiagnostics'
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
    positionCloseIntent: store.getState().positionCloseIntent,
    positionCloseSelectedIds: store.getState().positionCloseSelectedIds,
    positionCloseConfirmOpen: store.getState().positionCloseConfirmOpen,
    positionCloseOrderType: store.getState().positionCloseOrderType,
    orderActionLog: store.getState().orderActionLog,
  }
  try {
    return run()
  } finally {
    store.setState(snap)
  }
}

const samplePos = {
  id: 'pos-BTCUSDT',
  symbol: 'BTCUSDT',
  side: 'long' as const,
  size: 0.12,
  avgPrice: 96_800,
  unrealizedPnl: 10,
  realizedPnl: 0,
  returnPct: 0.5,
}

export function runPositionCloseChecks(store?: StoreApi): SelfTestCheckResult[] {
  return [
    runCheck('position-close-intent-created', 'Position close intent created', () => {
      const intent = buildPositionCloseIntent({
        position: samplePos,
        ratio: 50,
        orderType: 'market',
        referencePrice: 51_000,
        lotSize: 0.01,
      })
      if (intent.mockOnly !== true) return { status: 'fail', message: 'mockOnly not true' }
      if (intent.qty !== qtyForCloseRatio(0.12, 50, 0.01)) {
        return { status: 'fail', message: `qty=${intent.qty}` }
      }
      return { status: 'pass', message: `${intent.symbol} ${intent.ratio}% qty=${intent.qty}` }
    }),

    runCheck('position-close-ratio-buttons', 'Close ratio presets', () => {
      if (CLOSE_RATIOS.length !== 4) {
        return { status: 'fail', message: `ratios=${CLOSE_RATIOS.join(',')}` }
      }
      const q100 = qtyForCloseRatio(0.12, 100, 0.01)
      if (q100 !== 0.12) return { status: 'fail', message: `100% qty=${q100}` }
      return { status: 'pass', message: CLOSE_RATIOS.join('/') }
    }),

    runCheck('position-close-selected-batch', 'Selected batch close intent', () => {
      if (!store) return { status: 'warn', message: 'No store runner' }
      return withStoreRestore(store, () => {
        const posId = store.getState().positions.find((p) => p.size > 0)?.id ?? samplePos.id
        store.getState().setPositionCloseSelected([posId])
        store.getState().stageBatchPositionCloseIntent('selected', 80)
        const intent = store.getState().positionCloseIntent
        if (!intent || intent.batchMode !== 'selected') {
          return { status: 'fail', message: 'batch intent missing' }
        }
        if (intent.positionIds.length !== 1) {
          return { status: 'fail', message: `ids=${intent.positionIds.length}` }
        }
        const diag = getPositionCloseDiagnostics(store.getState())
        if (!diag.closeIntentActive) return { status: 'fail', message: 'diag inactive' }
        return { status: 'pass', message: `selected · ratio=${intent.ratio}%` }
      })
    }),

    runCheck('position-close-mock-only', 'Position close mockOnly confirm', () => {
      if (!store) return { status: 'warn', message: 'No store runner' }
      return withStoreRestore(store, () => {
        const before = store.getState().positions.length
        const posId = store.getState().positions.find((p) => p.size > 0)?.id ?? samplePos.id
        store.getState().stagePositionCloseIntent(posId, 25)
        const ok = store.getState().confirmPositionCloseIntent()
        if (!ok) return { status: 'fail', message: 'confirm failed' }
        if (store.getState().positionCloseIntent != null) {
          return { status: 'fail', message: 'intent not cleared' }
        }
        if (store.getState().positions.length !== before) {
          return { status: 'fail', message: 'positions mutated on confirm (must be log only)' }
        }
        const log = store.getState().orderActionLog[0]
        if (log?.kind !== 'close_confirm') {
          return { status: 'fail', message: `log kind=${log?.kind}` }
        }
        return { status: 'pass', message: 'confirm → audit/log only' }
      })
    }),

    runCheck('position-close-no-api-no-websocket', 'Position close no API/WS', () => {
      if (typeof CloseIntentStrip !== 'function') {
        return { status: 'fail', message: 'CloseIntentStrip missing' }
      }
      if (ORDER_EXECUTION_POLICY.liveOrderApiEnabled || SPEED_ORDER_FEATURE_FLAGS.liveTrading) {
        return { status: 'fail', message: 'live flags must be false' }
      }
      return { status: 'pass', message: 'intent UI · store-only' }
    }),
  ]
}
