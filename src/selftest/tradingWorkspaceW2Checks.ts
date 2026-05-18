import { ORDER_BOOK_PRESET_ORDER } from '../config/orderBookDesignPresets'
import { getTradingWorkspaceSlot, listTradingWorkspaceSlots } from '../domain/tradingWorkspaceCatalog'
import { ORDER_EXECUTION_POLICY } from '../vendor/orderExecutionPolicy'
import { applyWorkspaceSlotToStore } from '../workspace/applyWorkspaceSlot'
import {
  DEFAULT_WORKSPACE_ID,
  resolveWorkspaceId,
} from '../workspace/tradingWorkspaceUrl'
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
  setState: (
    partial: Partial<TradingStore> | ((s: TradingStore) => Partial<TradingStore>),
  ) => void
}

function withStoreRestore<T>(store: StoreApi, run: () => T): T {
  const snapId = store.getState().activeWorkspaceId
  try {
    return run()
  } finally {
    store.getState().activateWorkspace(snapId, { syncUrl: false })
  }
}

export function runTradingWorkspaceW2Checks(store: StoreApi): SelfTestCheckResult[] {
  return [
    runCheck('workspace-url-fallback', 'Workspace URL fallback', () => {
      const r = resolveWorkspaceId('not-a-real-workspace')
      if (r.workspaceId !== DEFAULT_WORKSPACE_ID || !r.usedFallback) {
        return { status: 'fail', message: `got ${r.workspaceId} fallback=${r.usedFallback}` }
      }
      const ok = resolveWorkspaceId('crypto:2')
      if (ok.usedFallback || ok.workspaceId !== 'crypto:2') {
        return { status: 'fail', message: 'valid id should not fallback' }
      }
      return { status: 'pass', message: `invalid → ${DEFAULT_WORKSPACE_ID}` }
    }),

    runCheck('workspace-preset-valid', 'Workspace preset valid', () => {
      const bookIds = new Set<string>(ORDER_BOOK_PRESET_ORDER)
      const bad = listTradingWorkspaceSlots().filter((s) => !bookIds.has(s.orderBookPreset))
      if (bad.length > 0) {
        return { status: 'fail', message: bad.map((s) => s.workspaceId).join(', ') }
      }
      return { status: 'pass', message: 'orderBookPreset ∈ ORDER_BOOK_PRESET_ORDER' }
    }),

    runCheck('workspace-no-api-no-websocket', 'Workspace wiring mock-only', () => {
      const p = ORDER_EXECUTION_POLICY
      if (p.liveOrderApiEnabled || p.liveExecutionEnabled) {
        return { status: 'fail', message: 'live flags must be false' }
      }
      return { status: 'pass', message: 'ORDER_EXECUTION_POLICY mock_demo' }
    }),

    runCheck('workspace-active-slot', 'Workspace active slot', () => {
      return withStoreRestore(store, () => {
        store.getState().activateWorkspace('overseas_futures:2', { syncUrl: false })
        const id = store.getState().activeWorkspaceId
        if (id !== 'overseas_futures:2') {
          return { status: 'fail', message: `active=${id}` }
        }
        return { status: 'pass', message: id }
      })
    }),

    runCheck('workspace-symbol-seed', 'Workspace symbol seed', () => {
      return withStoreRestore(store, () => {
        store.getState().activateWorkspace('crypto:1', { syncUrl: false })
        if (store.getState().symbol !== 'BTCUSDT') {
          return {
            status: 'fail',
            message: `expected BTCUSDT got ${store.getState().symbol}`,
          }
        }
        if (store.getState().orderBookDesignPreset !== 'global_crypto') {
          return { status: 'fail', message: 'orderBook preset not wired' }
        }
        return { status: 'pass', message: 'crypto:1 → BTCUSDT + global_crypto' }
      })
    }),

    runCheck('workspace-apply-slot-api', 'applyWorkspaceSlotToStore', () => {
      const slot = getTradingWorkspaceSlot('domestic_stock:1')
      if (!slot) return { status: 'fail', message: 'slot missing' }
      return withStoreRestore(store, () => {
        applyWorkspaceSlotToStore(store.getState(), slot)
        if (store.getState().workspaceOrderFormTab !== 'standard') {
          return { status: 'fail', message: 'domestic_stock tab' }
        }
        if (!store.getState().confirmOrders) {
          return { status: 'fail', message: 'domestic_stock confirmOrders' }
        }
        const mitSlot = getTradingWorkspaceSlot('crypto:1')
        if (mitSlot) {
          applyWorkspaceSlotToStore(store.getState(), mitSlot)
          if (store.getState().workspaceOrderFormTab !== 'stopMit') {
            return { status: 'fail', message: 'crypto stopMit tab' }
          }
        }
        return { status: 'pass', message: 'preset wiring OK' }
      })
    }),
  ]
}
