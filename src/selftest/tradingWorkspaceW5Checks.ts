import { ORDER_EXECUTION_POLICY } from '../vendor/orderExecutionPolicy'
import {
  readActiveWorkspaceVendorSnapshot,
  validateWorkspaceVendorSnapshot,
} from '../vendor/readWorkspaceVendorSnapshot'
import { clearWorkspaceStoreRegistry } from '../store/workspaceStoreRegistry'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'
import { DEFAULT_WORKSPACE_ID } from '../workspace/tradingWorkspaceUrl'
import {
  applyTradingWorkspaceHostBootstrap,
  assertTradingWorkspaceHostMockOnly,
  notifyTradingWorkspaceHostChange,
  resetTradingWorkspaceHostBootstrapGuard,
  TRADING_WORKSPACE_HOST_EXPORT_SYMBOLS,
} from '../workspace/tradingWorkspaceHostRuntime'
import { resetWorkspaceSyncDiagnostics } from '../workspace/workspaceSyncDiagnostics'
import * as workspaceHostIndex from '../workspace/index'
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

function resetForHostTest(): void {
  resetWorkspaceSyncDiagnostics()
  resetTradingWorkspaceHostBootstrapGuard()
  clearWorkspaceStoreRegistry()
  useWorkspaceShellStore.getState().activateWorkspace(DEFAULT_WORKSPACE_ID, { syncUrl: false })
}

export function runTradingWorkspaceW5Checks(): SelfTestCheckResult[] {
  return [
    runCheck('workspace-host-export', 'TradingWorkspaceHost export', () => {
      const missing = TRADING_WORKSPACE_HOST_EXPORT_SYMBOLS.filter(
        (name) => !(name in workspaceHostIndex),
      )
      if (missing.length > 0) {
        return { status: 'fail', message: `missing: ${missing.join(', ')}` }
      }
      if (typeof workspaceHostIndex.TradingWorkspaceHost !== 'function') {
        return { status: 'fail', message: 'TradingWorkspaceHost not a function' }
      }
      return {
        status: 'pass',
        message: `${TRADING_WORKSPACE_HOST_EXPORT_SYMBOLS.length} exports from src/workspace`,
      }
    }),

    runCheck('workspace-host-initial-workspace', 'Host initial workspace bootstrap', () => {
      resetForHostTest()
      const { activeSnapshot, allSnapshots } = applyTradingWorkspaceHostBootstrap({
        initialWorkspaceId: 'crypto:1',
        mockOnly: true,
      })
      const shellId = useWorkspaceShellStore.getState().activeWorkspaceId
      if (shellId !== 'crypto:1') {
        return { status: 'fail', message: `shell=${shellId}` }
      }
      if (!activeSnapshot || activeSnapshot.workspaceId !== 'crypto:1') {
        return { status: 'fail', message: 'active snapshot missing' }
      }
      if (allSnapshots.length !== 15) {
        return { status: 'fail', message: `allSnapshots=${allSnapshots.length}` }
      }
      return { status: 'pass', message: `crypto:1 · ${activeSnapshot.activeSymbol} · 15 catalog` }
    }),

    runCheck('workspace-host-snapshot-callback', 'Host snapshot callback', () => {
      resetForHostTest()
      const received: string[] = []
      applyTradingWorkspaceHostBootstrap({ initialWorkspaceId: 'domestic_futures:1', mockOnly: true })
      notifyTradingWorkspaceHostChange((s) => received.push(s.workspaceId))
      useWorkspaceShellStore.getState().activateWorkspace('overseas_futures:2', { syncUrl: false })
      notifyTradingWorkspaceHostChange((s) => received.push(s.workspaceId))
      if (received.length !== 2 || received[1] !== 'overseas_futures:2') {
        return { status: 'fail', message: received.join(' → ') }
      }
      const activeSnap = readActiveWorkspaceVendorSnapshot()
      if (!activeSnap || !validateWorkspaceVendorSnapshot(activeSnap).valid) {
        return { status: 'fail', message: 'active snapshot invalid after switch' }
      }
      return { status: 'pass', message: received.join(' → ') }
    }),

    runCheck('workspace-host-mock-only', 'Host mockOnly guard', () => {
      try {
        assertTradingWorkspaceHostMockOnly(false)
        return { status: 'fail', message: 'should throw when mockOnly=false' }
      } catch {
        assertTradingWorkspaceHostMockOnly(true)
        assertTradingWorkspaceHostMockOnly(undefined)
        return { status: 'pass', message: 'mockOnly=false rejected' }
      }
    }),

    runCheck('workspace-host-no-api-no-websocket', 'Host mock-only policy', () => {
      const p = ORDER_EXECUTION_POLICY
      if (p.liveOrderApiEnabled || p.liveExecutionEnabled) {
        return { status: 'fail', message: 'live flags must be false' }
      }
      resetForHostTest()
      const { activeSnapshot } = applyTradingWorkspaceHostBootstrap({ mockOnly: true })
      if (!activeSnapshot?.mockOnly) {
        return { status: 'fail', message: 'snapshot mockOnly not true' }
      }
      return { status: 'pass', message: 'host path · no API/WS wiring' }
    }),
  ]
}
