import { listTradingWorkspaceSlots } from '../domain/tradingWorkspaceCatalog'
import { ORDER_EXECUTION_POLICY } from '../vendor/orderExecutionPolicy'
import {
  readActiveWorkspaceVendorSnapshot,
  readAllWorkspaceVendorSnapshots,
  readWorkspaceVendorSnapshot,
  validateWorkspaceVendorSnapshot,
  workspaceVendorSnapshotContractKeys,
} from '../vendor/readWorkspaceVendorSnapshot'
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

export function runTradingWorkspaceW4Checks(store: SelfTestStoreRunner): SelfTestCheckResult[] {
  return [
    runCheck('workspace-vendor-active-snapshot', 'Active workspace vendor snapshot', () => {
      store.getState().activateWorkspace('crypto:1', { syncUrl: false })
      const snap = readActiveWorkspaceVendorSnapshot()
      if (!snap) return { status: 'fail', message: 'null active snapshot' }
      const v = validateWorkspaceVendorSnapshot(snap)
      if (!v.valid) return { status: 'fail', message: v.issues.join('; ') }
      if (snap.workspaceId !== 'crypto:1' || snap.activeSymbol !== 'BTCUSDT') {
        return {
          status: 'fail',
          message: `got ${snap.workspaceId} symbol=${snap.activeSymbol}`,
        }
      }
      return { status: 'pass', message: `${snap.workspaceId} · ${snap.activeSymbol} · mockOnly` }
    }),

    runCheck('workspace-vendor-all-snapshots', 'All workspace vendor snapshots', () => {
      const all = readAllWorkspaceVendorSnapshots()
      const catalogCount = listTradingWorkspaceSlots().length
      if (all.length !== catalogCount) {
        return { status: 'fail', message: `expected ${catalogCount} got ${all.length}` }
      }
      const invalid = all.filter((s) => !validateWorkspaceVendorSnapshot(s).valid).length
      if (invalid > 0) {
        return { status: 'fail', message: `${invalid} invalid of ${all.length}` }
      }
      return { status: 'pass', message: `${all.length} snapshots · 0 invalid` }
    }),

    runCheck('workspace-vendor-contract-stable', 'Workspace vendor contract stable', () => {
      const keys = workspaceVendorSnapshotContractKeys()
      const snap = readWorkspaceVendorSnapshot('domestic_futures:1')
      if (!snap) return { status: 'fail', message: 'snapshot null' }
      const snapKeys = Object.keys(snap).sort()
      const expected = [...keys].sort()
      if (snapKeys.join(',') !== expected.join(',')) {
        return {
          status: 'fail',
          message: `keys mismatch: ${snapKeys.join('|')} vs ${expected.join('|')}`,
        }
      }
      return { status: 'pass', message: `${keys.length} stable fields` }
    }),

    runCheck('workspace-vendor-mock-only', 'Workspace vendor mockOnly', () => {
      const all = readAllWorkspaceVendorSnapshots()
      const bad = all.filter((s) => s.mockOnly !== true)
      if (bad.length > 0) {
        return { status: 'fail', message: bad.map((s) => s.workspaceId).join(', ') }
      }
      return { status: 'pass', message: `all ${all.length} mockOnly=true` }
    }),

    runCheck('workspace-vendor-no-api-no-websocket', 'Workspace vendor mock-only policy', () => {
      const p = ORDER_EXECUTION_POLICY
      if (p.liveOrderApiEnabled || p.liveExecutionEnabled) {
        return { status: 'fail', message: 'live flags must be false' }
      }
      const snap = readWorkspaceVendorSnapshot('us_stock:1')
      if (!snap?.mockOnly) {
        return { status: 'fail', message: 'snapshot mockOnly not true' }
      }
      return { status: 'pass', message: 'policy mock_demo · no API/WS in snapshot path' }
    }),
  ]
}
