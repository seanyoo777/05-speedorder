import { ORDER_EXECUTION_POLICY } from '../vendor/orderExecutionPolicy'
import {
  clearWorkspaceStoreRegistry,
  evictWorkspaceStore,
  getOrCreateWorkspaceStore,
  getWorkspaceStoreCount,
  listWorkspaceStoreIds,
} from '../store/workspaceStoreRegistry'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'
import type { SelfTestCheckResult, SelfTestStatus } from './types'
import type { SelfTestStoreRunner } from './runSpeedOrderSelfTest'

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

function resetRegistryForW3(): void {
  clearWorkspaceStoreRegistry()
  useWorkspaceShellStore.getState().activateWorkspace('domestic_futures:1', { syncUrl: false })
}

export function runTradingWorkspaceW3Checks(store: SelfTestStoreRunner): SelfTestCheckResult[] {
  return [
    runCheck('workspace-store-created', 'Workspace store created', () => {
      resetRegistryForW3()
      const before = getWorkspaceStoreCount()
      getOrCreateWorkspaceStore('crypto:2')
      const after = getWorkspaceStoreCount()
      if (after !== before + 1) {
        return { status: 'fail', message: `count ${before} → ${after}` }
      }
      const ids = listWorkspaceStoreIds()
      if (!ids.includes('crypto:2')) {
        return { status: 'fail', message: `registry missing crypto:2 (${ids.join(', ')})` }
      }
      return { status: 'pass', message: `registry count=${after}` }
    }),

    runCheck('workspace-store-isolated-symbol', 'Workspace symbol isolated', () => {
      resetRegistryForW3()
      store.getState().activateWorkspace('domestic_futures:1', { syncUrl: false })
      store.getState().setSymbol('NASDAQ')
      store.getState().activateWorkspace('crypto:1', { syncUrl: false })
      if (store.getState().symbol !== 'BTCUSDT') {
        return {
          status: 'fail',
          message: `crypto:1 expected BTCUSDT got ${store.getState().symbol}`,
        }
      }
      store.getState().activateWorkspace('domestic_futures:1', { syncUrl: false })
      if (store.getState().symbol !== 'NASDAQ') {
        return {
          status: 'fail',
          message: `domestic:1 expected NASDAQ got ${store.getState().symbol}`,
        }
      }
      return { status: 'pass', message: 'NASDAQ ↔ BTCUSDT per workspace' }
    }),

    runCheck('workspace-store-isolated-stopmit', 'Workspace Stop/MIT isolated', () => {
      resetRegistryForW3()
      evictWorkspaceStore('crypto:1')
      store.getState().activateWorkspace('crypto:1', { syncUrl: false })
      store.getState().patchStopMitDraft({ op: 'lockFromBook', price: 50_000, bookSide: 'ask' })
      store.getState().activateWorkspace('domestic_futures:1', { syncUrl: false })
      if (store.getState().stopMitDraft.priceLock.locked) {
        return { status: 'fail', message: 'domestic inherited crypto lock' }
      }
      store.getState().activateWorkspace('crypto:1', { syncUrl: false })
      if (!store.getState().stopMitDraft.priceLock.locked) {
        return { status: 'fail', message: 'crypto lock not preserved after switch' }
      }
      return { status: 'pass', message: 'priceLock isolated per workspace' }
    }),

    runCheck('workspace-store-switch-preserves-state', 'Workspace switch preserves state', () => {
      resetRegistryForW3()
      store.getState().activateWorkspace('overseas_futures:2', { syncUrl: false })
      store.getState().setSymbol('GOLD')
      store.getState().setOrderBookDesignPreset('global_crypto')
      store.getState().activateWorkspace('us_stock:1', { syncUrl: false })
      store.getState().activateWorkspace('overseas_futures:2', { syncUrl: false })
      if (store.getState().symbol !== 'GOLD') {
        return { status: 'fail', message: `symbol reset to ${store.getState().symbol}` }
      }
      if (store.getState().orderBookDesignPreset !== 'global_crypto') {
        return { status: 'fail', message: 'orderBook preset not preserved' }
      }
      return { status: 'pass', message: 'symbol + orderBook preset preserved' }
    }),

    runCheck('workspace-store-no-api-no-websocket', 'Workspace stores mock-only', () => {
      const p = ORDER_EXECUTION_POLICY
      if (p.liveOrderApiEnabled || p.liveExecutionEnabled) {
        return { status: 'fail', message: 'live flags must be false' }
      }
      return { status: 'pass', message: 'isolated stores · no API/WS wiring' }
    }),
  ]
}
