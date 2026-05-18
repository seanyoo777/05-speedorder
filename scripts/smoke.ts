/**
 * Headless smoke — no websocket, no browser. Exits 1 on FAIL.
 * Run: npm run smoke
 */
import { appendSelfTestAudit } from '../src/selftest/auditTrail'
import { runSpeedOrderSelfTest } from '../src/selftest/runSpeedOrderSelfTest'
import { createSelfTestStoreRunner, getTradingStoreView } from '../src/store/tradingStore'
import {
  clearWorkspaceStoreRegistry,
  getOrCreateWorkspaceStore,
} from '../src/store/workspaceStoreRegistry'
import { useWorkspaceShellStore } from '../src/store/workspaceShellStore'
import { DEFAULT_WORKSPACE_ID } from '../src/workspace/tradingWorkspaceUrl'

clearWorkspaceStoreRegistry()
useWorkspaceShellStore.getState().activateWorkspace(DEFAULT_WORKSPACE_ID, { syncUrl: false })
getOrCreateWorkspaceStore(DEFAULT_WORKSPACE_ID)
const runner = createSelfTestStoreRunner()
const state = getTradingStoreView()
const summary = runSpeedOrderSelfTest(state, { scope: 'full' }, runner)

appendSelfTestAudit({
  category: 'smoke',
  message: `Smoke: ${summary.status.toUpperCase()} (${summary.issueCount} issues)`,
  status: summary.status,
  meta: {
    passCount: summary.passCount,
    warnCount: summary.warnCount,
    failCount: summary.failCount,
  },
})

for (const r of summary.results) {
  const tag = r.status.toUpperCase().padEnd(4)
  console.log(`[${tag}] ${r.id}: ${r.message}`)
}

console.log(
  `\n05-SpeedOrder smoke: ${summary.status} · pass=${summary.passCount} warn=${summary.warnCount} fail=${summary.failCount}`,
)

if (summary.failCount > 0) process.exit(1)
process.exit(0)
