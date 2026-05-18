import { describe, expect, it } from 'vitest'
import {
  aggregateResultsWithCore,
  fromCoreVerdict,
  resolveOverallFromResults,
  toCoreVerdict,
} from './speedOrderSelfTestCoreAdapter'
import type { SelfTestCheckResult } from './types'

function result(id: string, status: SelfTestCheckResult['status']): SelfTestCheckResult {
  return {
    id,
    label: id,
    status,
    message: '',
    durationMs: 0,
  }
}

describe('speedOrderSelfTestCoreAdapter', () => {
  it('maps pass/warn/fail to core verdicts', () => {
    expect(toCoreVerdict('pass')).toBe('PASS')
    expect(toCoreVerdict('warn')).toBe('WARN')
    expect(toCoreVerdict('fail')).toBe('FAIL')
    expect(fromCoreVerdict('WARN')).toBe('warn')
  })

  it('PASS with empty results', () => {
    const agg = aggregateResultsWithCore([], '2026-05-15T00:00:00.000Z')
    expect(agg.status).toBe('pass')
    expect(agg.issueCount).toBe(0)
    expect(agg.failCount).toBe(0)
    expect(agg.warnCount).toBe(0)
  })

  it('fail beats warn and pass', () => {
    const results = [result('a', 'pass'), result('b', 'warn'), result('c', 'fail')]
    expect(resolveOverallFromResults(results)).toBe('fail')
    expect(aggregateResultsWithCore(results, '2026-05-15T00:00:00.000Z')).toMatchObject({
      status: 'fail',
      passCount: 1,
      warnCount: 1,
      failCount: 1,
      issueCount: 2,
    })
  })

  it('warn when no fail', () => {
    const results = [result('a', 'pass'), result('b', 'warn')]
    const agg = aggregateResultsWithCore(results, '2026-05-15T00:00:00.000Z')
    expect(agg.status).toBe('warn')
    expect(agg.issueCount).toBe(agg.warnCount + agg.failCount)
    expect(agg.issueCount).toBe(1)
  })

  it('issueCount equals warnCount + failCount (SpeedOrder convention)', () => {
    const results = [result('w1', 'warn'), result('w2', 'warn'), result('f', 'fail')]
    const agg = aggregateResultsWithCore(results, '2026-05-15T00:00:00.000Z')
    expect(agg.issueCount).toBe(3)
    expect(agg.failCount).toBe(1)
    expect(agg.warnCount).toBe(2)
  })
})
