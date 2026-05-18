import {
  buildSelfTestResult,
  buildValidationCounts,
  resolveOverallVerdict,
  resolveSuiteStatusFromIssues,
  type Verdict,
} from '@tetherget/self-test-core'
import type { SelfTestCheckResult, SelfTestStatus } from './types'

export const SPEED_ORDER_SELF_TEST_SUITE_ID = 'speedorder-mock-selftest'

export function toCoreVerdict(status: SelfTestStatus): Verdict {
  if (status === 'pass') return 'PASS'
  if (status === 'warn') return 'WARN'
  return 'FAIL'
}

export function fromCoreVerdict(verdict: Verdict): SelfTestStatus {
  if (verdict === 'PASS') return 'pass'
  if (verdict === 'WARN') return 'warn'
  return 'fail'
}

/** Worst-of check results (pass / warn / fail). */
export function resolveOverallFromResults(
  results: readonly SelfTestCheckResult[],
): SelfTestStatus {
  return fromCoreVerdict(
    resolveOverallVerdict(results.map((r) => toCoreVerdict(r.status))),
  )
}

/**
 * Aggregate flat check results via @tetherget/self-test-core.
 * SpeedOrder keeps `issueCount` = warn + fail (see types.ts).
 */
export function aggregateResultsWithCore(
  results: readonly SelfTestCheckResult[],
  checkedAt: string,
): {
  status: SelfTestStatus
  passCount: number
  warnCount: number
  failCount: number
  issueCount: number
} {
  const issues = results.map((r) => ({
    id: r.id,
    message: r.message,
    status: toCoreVerdict(r.status),
    suiteId: SPEED_ORDER_SELF_TEST_SUITE_ID,
  }))

  const counts = buildValidationCounts(issues)
  const suiteStatus = resolveSuiteStatusFromIssues(issues)

  const suite = {
    id: SPEED_ORDER_SELF_TEST_SUITE_ID,
    label: 'SpeedOrder mock self-test',
    status: suiteStatus,
    issues,
    passCount: counts.passCount,
    warnCount: counts.warnCount,
    failCount: counts.issueCount,
  }

  const core = buildSelfTestResult({
    suites: [suite],
    mockOnly: true,
    lastCheckedAtMs: Number.isFinite(Date.parse(checkedAt))
      ? Date.parse(checkedAt)
      : Date.now(),
  })

  return {
    status: fromCoreVerdict(core.overall),
    passCount: counts.passCount,
    warnCount: counts.warnCount,
    failCount: counts.issueCount,
    issueCount: counts.warnCount + counts.issueCount,
  }
}
