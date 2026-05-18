/**
 * Headless smoke — no websocket, no browser. Exits 1 on FAIL.
 * Run: npm run smoke
 */
import { appendSelfTestAudit } from '../src/selftest/auditTrail'
import { runSpeedOrderSelfTest } from '../src/selftest/runSpeedOrderSelfTest'
import { useTradingStore } from '../src/store/tradingStore'

const state = useTradingStore.getState()
const summary = runSpeedOrderSelfTest(state, { scope: 'full' }, useTradingStore)

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
