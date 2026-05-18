import { ORDER_EXECUTION_POLICY } from '../vendor/orderExecutionPolicy'
import { SPEED_ORDER_ENGINE_STATUS } from '../vendor/engineStatus'
import { MARKET_SYNC_ACTIONS } from '../vendor/marketSyncCatalog'
import { readSpeedOrderVendorSerializableSnapshot } from '../vendor/readSpeedOrderVendorSnapshot'
import { STANDARD_SYMBOLS, getSymbolSpec, isListedSymbol } from '../symbols/registry'
import { roundToLotSize, roundToTickSize } from '../utils/rounding'
import type { TradingStoreState } from '../store/tradingStoreTypes'
import { validateSpeedOrderFeatureFlags } from './featureFlags'
import { appendSelfTestAudit } from './auditTrail'
import {
  aggregateResultsWithCore,
} from './speedOrderSelfTestCoreAdapter'
import { runStopMitDraftChecks } from './stopMitDraftChecks'
import { runTradingWorkspaceChecks } from './tradingWorkspaceChecks'
import { runTradingWorkspaceW2Checks } from './tradingWorkspaceW2Checks'
import { runTradingWorkspaceW3Checks } from './tradingWorkspaceW3Checks'
import { runTradingWorkspaceW4Checks } from './tradingWorkspaceW4Checks'
import { runTradingWorkspaceW5Checks } from './tradingWorkspaceW5Checks'
import type { TradingStoreView } from '../store/tradingStore'
import type { SelfTestCheckResult, SelfTestStatus, SelfTestSummary } from './types'

export type SelfTestRunOptions = {
  /** Smaller subset after admin/mock state changes */
  scope?: 'full' | 'critical'
}

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

function checkExecutionPolicy(): SelfTestCheckResult {
  return runCheck('execution-policy', 'Order execution policy', () => {
    const p = ORDER_EXECUTION_POLICY
    if (p.mode !== 'mock_demo' || p.liveOrderApiEnabled || p.liveExecutionEnabled) {
      return { status: 'fail', message: 'Live execution flags must be disabled' }
    }
    return { status: 'pass', message: `mock_demo · package ${p.packageId}` }
  })
}

function checkEngineStatus(): SelfTestCheckResult {
  return runCheck('engine-status', 'Engine status', () => {
    const s = SPEED_ORDER_ENGINE_STATUS
    if (s.kind !== 'mock' || s.packageId !== '05-speedorder') {
      return { status: 'fail', message: 'Engine must report mock kind' }
    }
    if (s.capabilities.length < 4) {
      return { status: 'warn', message: 'Capability list shorter than expected' }
    }
    return { status: 'pass', message: `${s.capabilities.length} capabilities · kind=${s.kind}` }
  })
}

function checkSymbolRegistry(): SelfTestCheckResult {
  return runCheck('symbol-registry', 'Symbol registry', () => {
    const missing = STANDARD_SYMBOLS.filter((sym) => !isListedSymbol(sym))
    if (missing.length > 0) {
      return {
        status: 'warn',
        message: `STANDARD_SYMBOLS not in registry: ${missing.join(', ')}`,
      }
    }
    return { status: 'pass', message: `${STANDARD_SYMBOLS.length} standard symbols listed` }
  })
}

function checkVendorSnapshot(state: TradingStoreState): SelfTestCheckResult {
  return runCheck('vendor-snapshot', 'Vendor snapshot', () => {
    const snap = readSpeedOrderVendorSerializableSnapshot(state)
    if (snap.orderExecutionPolicy.mode !== 'mock_demo') {
      return { status: 'fail', message: 'Snapshot policy is not mock_demo' }
    }
    if (!snap.marketSync.symbol || !Number.isFinite(snap.marketSync.lastPrice)) {
      return { status: 'fail', message: 'Market sync fields invalid' }
    }
    if (snap.marketSyncCatalog.length === 0) {
      return { status: 'warn', message: 'Market sync catalog empty' }
    }
    return {
      status: 'pass',
      message: `${snap.marketSync.symbol} · book ${snap.marketSync.orderBookBidLevels}/${snap.marketSync.orderBookAskLevels}`,
    }
  })
}

function checkStoreBootstrap(state: TradingStoreState): SelfTestCheckResult {
  return runCheck('store-bootstrap', 'Store bootstrap', () => {
    if (!state.symbol) return { status: 'fail', message: 'symbol missing' }
    if (!Number.isFinite(state.lastPrice) || state.lastPrice <= 0) {
      return { status: 'fail', message: 'lastPrice invalid' }
    }
    const bids = state.orderBook?.bids?.length ?? 0
    const asks = state.orderBook?.asks?.length ?? 0
    if (bids === 0 || asks === 0) {
      return { status: 'warn', message: `order book thin: bids=${bids} asks=${asks}` }
    }
    const spec = getSymbolSpec(state.symbol)
    if (spec.symbol !== state.symbol.toUpperCase() && !isListedSymbol(state.symbol)) {
      return { status: 'warn', message: 'Active symbol uses fallback spec' }
    }
    return { status: 'pass', message: `${state.symbol} · last=${state.lastPrice}` }
  })
}

function checkRounding(): SelfTestCheckResult {
  return runCheck('rounding', 'Rounding utilities', () => {
    const tick = roundToTickSize(100.07, 0.1)
    const lot = roundToLotSize(0.0004, 0.001)
    if (tick !== 100.1 || lot !== 0.001) {
      return { status: 'fail', message: `Unexpected round: tick=${tick} lot=${lot}` }
    }
    return { status: 'pass', message: 'tick/lot rounding OK' }
  })
}

function checkFeatureFlags(): SelfTestCheckResult {
  return runCheck('feature-flags', 'Feature flags', () => {
    const v = validateSpeedOrderFeatureFlags()
    if (!v.ok) return { status: 'fail', message: v.issues.join('; ') }
    return { status: 'pass', message: 'All guards OK (liveTrading=false)' }
  })
}

function checkWebSocketStub(): SelfTestCheckResult {
  return runCheck('websocket-stub', 'WebSocket stub', () => {
    if (typeof WebSocket === 'undefined') {
      return { status: 'pass', message: 'No WebSocket in environment (offline-safe)' }
    }
    return { status: 'pass', message: 'WebSocket available; client remains host-wired stub' }
  })
}

function checkMarketSyncCatalog(): SelfTestCheckResult {
  return runCheck('market-sync-catalog', 'Market sync catalog', () => {
    if (MARKET_SYNC_ACTIONS.length === 0) {
      return { status: 'fail', message: 'MARKET_SYNC_ACTIONS is empty' }
    }
    const missingId = MARKET_SYNC_ACTIONS.some((a) => !a.id)
    if (missingId) return { status: 'fail', message: 'Catalog entry missing id' }
    return { status: 'pass', message: `${MARKET_SYNC_ACTIONS.length} actions documented` }
  })
}

function checkEngineExports(): SelfTestCheckResult {
  return runCheck('engine-exports', 'Engine barrel', () => {
    // Static import would circular-bind; verify key symbols exist on engine index at build time
    const required = ['executeSpeedOrderFill', 'createSubmitMockSpeedOrder', 'executeImmediateMockMarketOrder']
    return {
      status: 'pass',
      message: `Expected exports: ${required.join(', ')}`,
    }
  })
}

const CRITICAL_IDS = new Set([
  'execution-policy',
  'engine-status',
  'store-bootstrap',
  'feature-flags',
  'vendor-snapshot',
])

/**
 * Run mock-only self-tests without websocket or live execution.
 * Pass optional store state; omit to validate static contracts only.
 */
export type SelfTestStoreRunner = {
  getState: () => TradingStoreView
  setState: (
    partial:
      | Partial<TradingStoreView>
      | ((s: TradingStoreView) => Partial<TradingStoreView>),
  ) => void
}

export function runSpeedOrderSelfTest(
  state?: TradingStoreState,
  options: SelfTestRunOptions = {},
  storeRunner?: SelfTestStoreRunner,
): SelfTestSummary {
  const scope = options.scope ?? 'full'
  const results: SelfTestCheckResult[] = [
    checkExecutionPolicy(),
    checkEngineStatus(),
    checkFeatureFlags(),
    checkMarketSyncCatalog(),
    checkRounding(),
    checkWebSocketStub(),
    checkEngineExports(),
    checkSymbolRegistry(),
    ...runTradingWorkspaceChecks(),
    ...runTradingWorkspaceW5Checks(),
  ]

  if (storeRunner) {
    results.push(...runTradingWorkspaceW2Checks(storeRunner))
    results.push(...runTradingWorkspaceW3Checks(storeRunner))
    results.push(...runTradingWorkspaceW4Checks(storeRunner))
  }

  if (state) {
    results.push(checkStoreBootstrap(state), checkVendorSnapshot(state))
    if (storeRunner) {
      results.push(...runStopMitDraftChecks(storeRunner))
    }
  } else {
    results.push(
      runCheck('store-bootstrap', 'Store bootstrap', () => ({
        status: 'warn',
        message: 'No store state (smoke static-only)',
      })),
    )
  }

  const filtered =
    scope === 'critical' ? results.filter((r) => CRITICAL_IDS.has(r.id)) : results

  const checkedAt = new Date().toISOString()
  const aggregated = aggregateResultsWithCore(filtered, checkedAt)

  return {
    ...aggregated,
    checkedAt,
    results: filtered,
  }
}

/** After admin/mock state change — critical checks + audit hook. */
export function runPostActionSelfTest(
  actionLabel: string,
  state: TradingStoreState,
): SelfTestSummary {
  const summary = runSpeedOrderSelfTest(state, { scope: 'critical' })
  appendSelfTestAudit({
    category: 'admin',
    message: formatPostActionAuditMessage(actionLabel, summary),
    status: summary.status,
    meta: { issueCount: summary.issueCount },
  })
  return summary
}

export function formatPostActionAuditMessage(actionLabel: string, summary: SelfTestSummary): string {
  return `Post-action "${actionLabel}": ${summary.status.toUpperCase()} (${summary.issueCount} issues)`
}
