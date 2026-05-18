import type { MockAuditEntry, MockAuditExportPayload } from '@tetherget/mock-audit-core'
import {
  buildAuditExportPayload as buildCoreAuditExportPayload,
  createMockAuditTrail,
  filterAuditEntries,
} from '@tetherget/mock-audit-core'
import type { SelfTestAuditEntry, SelfTestStatus } from './types'

const MAX_ENTRIES = 500

/** In-memory trail; ring cap + trim via `@tetherget/mock-audit-core`. */
const trail = createMockAuditTrail({ maxEntries: MAX_ENTRIES, idPrefix: 'speedorder-' })

let seq = 0

function nextId(): string {
  seq += 1
  return `audit-${seq}-${Date.now()}`
}

function parseSeqFromAuditId(id: string): number {
  const m = /^audit-(\d+)-/.exec(id)
  return m ? Number(m[1]) : 0
}

function coreToLegacy(e: MockAuditEntry): SelfTestAuditEntry {
  const p = e.payload && typeof e.payload === 'object' ? e.payload : {}
  const at = typeof p.at === 'string' ? p.at : new Date(e.server_ms).toISOString()
  return {
    id: e.id,
    at,
    category: e.kind as SelfTestAuditEntry['category'],
    message: typeof p.message === 'string' ? p.message : '',
    status: p.status as SelfTestStatus | undefined,
    meta: p.meta as SelfTestAuditEntry['meta'],
  }
}

function legacyToCore(e: SelfTestAuditEntry): MockAuditEntry {
  const n = parseSeqFromAuditId(e.id)
  return {
    id: e.id,
    kind: e.category,
    server_ms: Date.parse(e.at) || Date.now(),
    actor_admin_id: 'speedorder-selftest',
    correlation_id: n > 0 ? `speedorder:${n}` : 'speedorder:0',
    payload: {
      at: e.at,
      message: e.message,
      status: e.status,
      meta: e.meta,
    },
  }
}

/** Append-only mock audit trail (in-memory; no persistence). Max 500 rows (oldest dropped). */
export function appendSelfTestAudit(
  partial: Omit<SelfTestAuditEntry, 'id' | 'at'> & { at?: string },
): SelfTestAuditEntry {
  const id = nextId()
  const at = partial.at ?? new Date().toISOString()
  const server_ms = Date.parse(at) || Date.now()
  const seqPart = parseSeqFromAuditId(id)
  const correlation_id = seqPart > 0 ? `speedorder:${seqPart}` : 'speedorder:0'

  const coreEntry = trail.append({
    id,
    kind: partial.category,
    actor_admin_id: 'speedorder-selftest',
    correlation_id,
    server_ms,
    payload: {
      at,
      message: partial.message,
      status: partial.status,
      meta: partial.meta,
    },
  })
  return coreToLegacy(coreEntry)
}

export function getSelfTestAuditTrail(): readonly SelfTestAuditEntry[] {
  return trail.getEntries().map(coreToLegacy)
}

/**
 * Test-only: clears the trail and resets id sequence (matches empty boot).
 * Not used by production UI paths.
 */
export function resetSelfTestAuditTrailForTests(): void {
  trail.resetForTests()
  seq = 0
}

/** Append-only policy — delete unsupported. */
export function tryDeleteSelfTestAuditEntry(_id: string): boolean {
  return trail.tryDelete(_id)
}

export function filterSelfTestAuditEntries(
  entries: readonly SelfTestAuditEntry[],
  filters: { kindFilter?: string; correlationQuery?: string } = {},
): SelfTestAuditEntry[] {
  const core = entries.map(legacyToCore)
  return filterAuditEntries(core, {
    kindFilter: filters.kindFilter ?? '',
    correlationQuery: filters.correlationQuery ?? '',
  }).map(coreToLegacy)
}

export function buildSelfTestAuditExportPayload(
  filters: { kindFilter?: string; correlationQuery?: string } = {},
  entries?: readonly MockAuditEntry[],
): MockAuditExportPayload {
  const list = entries ?? [...trail.getEntries()]
  return buildCoreAuditExportPayload({
    entries: list,
    platform: 'speedorder',
    filters: {
      kindFilter: filters.kindFilter,
      correlationQuery: filters.correlationQuery,
    },
    schema_version: '1.0',
    exported_at_ms: Date.now(),
  })
}

export function recordSelfTestRunSummary(
  status: SelfTestStatus,
  issueCount: number,
  passCount: number,
  warnCount: number,
  failCount: number,
): void {
  appendSelfTestAudit({
    category: 'self_test',
    message: `Self-test run: ${status.toUpperCase()} (${issueCount} issue(s))`,
    status,
    meta: { issueCount, passCount, warnCount, failCount },
  })
}
