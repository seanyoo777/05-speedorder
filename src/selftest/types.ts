export type SelfTestStatus = 'pass' | 'warn' | 'fail'

export type SelfTestCheckResult = {
  id: string
  label: string
  status: SelfTestStatus
  message: string
  durationMs: number
}

export type SelfTestSummary = {
  status: SelfTestStatus
  passCount: number
  warnCount: number
  failCount: number
  /** warn + fail */
  issueCount: number
  checkedAt: string
  results: SelfTestCheckResult[]
}

export type SelfTestAuditEntry = {
  id: string
  at: string
  category: 'self_test' | 'admin' | 'feature_flag' | 'smoke'
  message: string
  status?: SelfTestStatus
  meta?: Record<string, string | number | boolean | null>
}
