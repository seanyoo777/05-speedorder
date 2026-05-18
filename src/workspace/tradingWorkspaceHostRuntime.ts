import { readActiveWorkspaceVendorSnapshot, readAllWorkspaceVendorSnapshots } from '../vendor/readWorkspaceVendorSnapshot'
import type { TradingWorkspaceVendorSnapshot } from '../vendor/readWorkspaceVendorSnapshot'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'
import {
  recordWorkspaceSyncSkipped,
  recordWorkspaceSyncSource,
} from './workspaceSyncDiagnostics'
import { DEFAULT_WORKSPACE_ID } from './tradingWorkspaceUrl'

export const TRADING_WORKSPACE_HOST_EXPORT_SYMBOLS = [
  'TradingWorkspaceHost',
  'TradingWorkspaceHostProvider',
  'TradingWorkspaceHostView',
  'useTradingWorkspaceHost',
  'applyTradingWorkspaceHostBootstrap',
  'notifyTradingWorkspaceHostChange',
  'assertTradingWorkspaceHostMockOnly',
] as const

export function assertTradingWorkspaceHostMockOnly(mockOnly?: boolean): void {
  if (mockOnly === false) {
    throw new Error('TradingWorkspaceHost requires mockOnly=true (mock/demo only)')
  }
}

export type TradingWorkspaceHostBootstrapOptions = {
  initialWorkspaceId?: string
  enableUrlSync?: boolean
  mockOnly?: boolean
}

export type TradingWorkspaceHostBootstrapResult = {
  activeSnapshot: TradingWorkspaceVendorSnapshot | null
  allSnapshots: readonly TradingWorkspaceVendorSnapshot[]
}

let lastHostBootstrapKey: string | null = null

/** Provider mount / self-test — shell + vendor snapshot 초기화 (React 없음). */
export function applyTradingWorkspaceHostBootstrap(
  options: TradingWorkspaceHostBootstrapOptions = {},
): TradingWorkspaceHostBootstrapResult {
  assertTradingWorkspaceHostMockOnly(options.mockOnly)
  const { initialWorkspaceId, enableUrlSync = false } = options
  const bootstrapKey = `${enableUrlSync ? 'url' : 'static'}:${initialWorkspaceId ?? DEFAULT_WORKSPACE_ID}`
  if (lastHostBootstrapKey === bootstrapKey) {
    recordWorkspaceSyncSkipped('hostBootstrapSkipped')
    return {
      activeSnapshot: readActiveWorkspaceVendorSnapshot(),
      allSnapshots: readAllWorkspaceVendorSnapshots(),
    }
  }
  lastHostBootstrapKey = bootstrapKey

  const shell = useWorkspaceShellStore.getState()
  recordWorkspaceSyncSource('hostBootstrap')

  if (enableUrlSync && typeof window !== 'undefined') {
    shell.initWorkspaceFromUrl()
  } else if (initialWorkspaceId) {
    shell.activateWorkspace(initialWorkspaceId, { syncUrl: false })
  } else {
    shell.activateWorkspace(DEFAULT_WORKSPACE_ID, { syncUrl: false })
  }

  return {
    activeSnapshot: readActiveWorkspaceVendorSnapshot(),
    allSnapshots: readAllWorkspaceVendorSnapshots(),
  }
}

/** Self-test — allow repeated bootstrap scenarios. */
export function resetTradingWorkspaceHostBootstrapGuard(): void {
  lastHostBootstrapKey = null
}

/** `onWorkspaceChange`와 동일한 스냅샷 읽기 (shell subscribe 핸들러용). */
export function notifyTradingWorkspaceHostChange(
  onWorkspaceChange: (snapshot: TradingWorkspaceVendorSnapshot) => void,
): void {
  const snap = readActiveWorkspaceVendorSnapshot()
  if (snap) onWorkspaceChange(snap)
}
