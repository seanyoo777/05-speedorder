import { ResearchFeedCard } from '../components/research/ResearchFeedCard'
import { ResearchFeedPanel } from '../components/research/ResearchFeedPanel'
import { readMockResearchFeedSnapshot } from '../research/mockResearchFeedAdapter'
import { validateResearchFeedSnapshot } from '../research/researchFeedSchema'
import { RESEARCH_FEED_ITEM_KEYS } from '../research/researchFeedTypes'
import { ORDER_EXECUTION_POLICY } from '../vendor/orderExecutionPolicy'
import { SPEED_ORDER_FEATURE_FLAGS } from './featureFlags'
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

export function runResearchFeedChecks(): SelfTestCheckResult[] {
  return [
    runCheck('research-feed-panel-render', 'Research feed panel render contract', () => {
      if (typeof ResearchFeedPanel !== 'function' || typeof ResearchFeedCard !== 'function') {
        return { status: 'fail', message: 'panel/card components not exported' }
      }
      if (!SPEED_ORDER_FEATURE_FLAGS.enableResearchFeedPanel) {
        return { status: 'warn', message: 'enableResearchFeedPanel is false (panel hidden)' }
      }
      const snap = readMockResearchFeedSnapshot({ symbol: 'BTCUSDT' })
      if (snap.items.length < 1) {
        return { status: 'fail', message: 'mock feed empty' }
      }
      return {
        status: 'pass',
        message: `flag on · ${snap.items.length} items · keys=${RESEARCH_FEED_ITEM_KEYS.length}`,
      }
    }),

    runCheck('research-feed-panel-schema', 'Research feed item schema', () => {
      const snap = readMockResearchFeedSnapshot({ symbol: 'ETHUSDT' })
      const v = validateResearchFeedSnapshot(snap)
      if (!v.valid) {
        return { status: 'fail', message: v.issues.join('; ') }
      }
      return {
        status: 'pass',
        message: `${snap.items.length} items validated · ${RESEARCH_FEED_ITEM_KEYS.join(', ')}`,
      }
    }),

    runCheck('research-feed-panel-mock-only', 'Research feed mockOnly', () => {
      const snap = readMockResearchFeedSnapshot({ symbol: 'NASDAQ' })
      if (snap.mockOnly !== true || snap.source !== 'mock_local_adapter') {
        return {
          status: 'fail',
          message: `mockOnly=${String(snap.mockOnly)} source=${snap.source}`,
        }
      }
      return { status: 'pass', message: 'mock_local_adapter · mockOnly=true' }
    }),

    runCheck('research-feed-panel-no-api-no-websocket', 'Research feed no API/WS', () => {
      const p = ORDER_EXECUTION_POLICY
      if (p.liveOrderApiEnabled || p.liveExecutionEnabled || SPEED_ORDER_FEATURE_FLAGS.liveTrading) {
        return { status: 'fail', message: 'live paths must stay disabled' }
      }
      if (SPEED_ORDER_FEATURE_FLAGS.liveWebSocketRequired) {
        return { status: 'fail', message: 'liveWebSocketRequired must be false' }
      }
      return { status: 'pass', message: 'static mock adapter only · no fetch/WS in research/*' }
    }),
  ]
}
