import { clearWorkspaceStoreRegistry } from '../store/workspaceStoreRegistry'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'
import { applyWorkspaceSlotToStore } from '../workspace/applyWorkspaceSlot'
import { getTradingWorkspaceSlot } from '../domain/tradingWorkspaceCatalog'
import {
  applyTradingWorkspaceHostBootstrap,
  resetTradingWorkspaceHostBootstrapGuard,
} from '../workspace/tradingWorkspaceHostRuntime'
import {
  getWorkspaceSyncDiagnostics,
  resetWorkspaceSyncDiagnostics,
} from '../workspace/workspaceSyncDiagnostics'
import { DEFAULT_WORKSPACE_ID } from '../workspace/tradingWorkspaceUrl'
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

function resetWorkspaceSyncHarness(): void {
  resetWorkspaceSyncDiagnostics()
  resetTradingWorkspaceHostBootstrapGuard()
  clearWorkspaceStoreRegistry()
  useWorkspaceShellStore.getState().activateWorkspace(DEFAULT_WORKSPACE_ID, { syncUrl: false })
}

export function runWorkspaceSyncLoopChecks(store?: StoreApi): SelfTestCheckResult[] {
  return [
    runCheck('workspace-no-render-loop', 'Workspace activate no redundant loop', () => {
      if (!store) return { status: 'warn', message: 'No store runner' }
      resetWorkspaceSyncHarness()
      const beforeSkipped = getWorkspaceSyncDiagnostics().skippedSyncCount
      store.getState().activateWorkspace('domestic_futures:1', { syncUrl: false })
      store.getState().activateWorkspace('domestic_futures:1', { syncUrl: false })
      store.getState().activateWorkspace('domestic_futures:1', { syncUrl: false })
      const diag = getWorkspaceSyncDiagnostics()
      const added = diag.skippedSyncCount - beforeSkipped
      if (added < 2) {
        return { status: 'fail', message: `skipped+=${added}` }
      }
      if (!diag.workspaceLoopGuardTriggered) {
        return { status: 'fail', message: 'guard not triggered' }
      }
      return { status: 'pass', message: `skipped+=${added} · guard=true` }
    }),

    runCheck('workspace-symbol-sync-guard', 'Symbol sync guard', () => {
      if (!store) return { status: 'warn', message: 'No store runner' }
      resetWorkspaceSyncHarness()
      const sym = store.getState().symbol
      const beforeSkipped = getWorkspaceSyncDiagnostics().skippedSyncCount
      store.getState().setSymbol(sym)
      store.getState().setSymbol(sym)
      const added = getWorkspaceSyncDiagnostics().skippedSyncCount - beforeSkipped
      if (added < 2) {
        return { status: 'fail', message: `setSymbol skipped+=${added}` }
      }
      return { status: 'pass', message: `${sym} · skipped+=${added}` }
    }),

    runCheck('workspace-host-sync-guard', 'Host bootstrap sync guard', () => {
      resetWorkspaceSyncHarness()
      applyTradingWorkspaceHostBootstrap({ initialWorkspaceId: 'crypto:1', mockOnly: true })
      const skippedBefore = getWorkspaceSyncDiagnostics().skippedSyncCount
      applyTradingWorkspaceHostBootstrap({ initialWorkspaceId: 'crypto:1', mockOnly: true })
      const diag = getWorkspaceSyncDiagnostics()
      if (diag.lastWorkspaceSyncSource !== 'hostBootstrapSkipped') {
        return { status: 'fail', message: `last=${diag.lastWorkspaceSyncSource}` }
      }
      if (diag.skippedSyncCount <= skippedBefore) {
        return { status: 'fail', message: 'bootstrap duplicate did not increment skip count' }
      }
      return { status: 'pass', message: 'duplicate bootstrap skipped' }
    }),

    runCheck('workspace-apply-slot-guard', 'applyWorkspaceSlot preset guard', () => {
      if (!store) return { status: 'warn', message: 'No store runner' }
      resetWorkspaceSyncHarness()
      const slot = getTradingWorkspaceSlot('crypto:1')
      if (!slot) return { status: 'fail', message: 'slot missing' }
      store.getState().activateWorkspace('crypto:1', { syncUrl: false })
      const beforeSkipped = getWorkspaceSyncDiagnostics().skippedSyncCount
      applyWorkspaceSlotToStore(store.getState(), slot)
      const added = getWorkspaceSyncDiagnostics().skippedSyncCount - beforeSkipped
      if (added < 1) {
        return { status: 'fail', message: 'applyWorkspaceSlot should skip when matched' }
      }
      return { status: 'pass', message: `crypto:1 preset matched · skipped+=${added}` }
    }),
  ]
}
