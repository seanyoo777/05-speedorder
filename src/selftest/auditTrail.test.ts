import { describe, expect, it, beforeEach } from 'vitest'
import { filterAuditEntries, trimAuditEntries } from '@tetherget/mock-audit-core'
import {
  appendSelfTestAudit,
  buildSelfTestAuditExportPayload,
  filterSelfTestAuditEntries,
  getSelfTestAuditTrail,
  resetSelfTestAuditTrailForTests,
  tryDeleteSelfTestAuditEntry,
} from './auditTrail'
import type { SelfTestAuditEntry } from './types'

function legacyToCoreMirror(e: SelfTestAuditEntry) {
  const m = /^audit-(\d+)-/.exec(e.id)
  const n = m ? Number(m[1]) : 0
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

describe('auditTrail + @tetherget/mock-audit-core', () => {
  beforeEach(() => {
    resetSelfTestAuditTrailForTests()
  })

  it('append-only: monotonic audit ids', () => {
    const a = appendSelfTestAudit({ category: 'smoke', message: 'a', status: 'pass' })
    const b = appendSelfTestAudit({ category: 'smoke', message: 'b', status: 'pass' })
    expect(parseInt(a.id.split('-')[1]!, 10)).toBeLessThan(parseInt(b.id.split('-')[1]!, 10))
  })

  it('ring buffer keeps newest 500 (oldest evicted)', () => {
    for (let i = 0; i < 501; i++) {
      appendSelfTestAudit({
        category: 'admin',
        message: `e${i}`,
        status: 'pass',
      })
    }
    const rows = getSelfTestAuditTrail()
    expect(rows).toHaveLength(500)
    const firstSeq = parseInt(rows[0]!.id.split('-')[1]!, 10)
    expect(firstSeq).toBe(2)
    expect(rows[0]!.message).toBe('e1')
    expect(rows[499]!.message).toBe('e500')
  })

  it('trimAuditEntries matches tail semantics (core helper)', () => {
    const long: SelfTestAuditEntry[] = []
    for (let i = 0; i < 5; i++) {
      long.push({
        id: `audit-${i + 1}-0`,
        at: new Date(2026, 0, i + 1).toISOString(),
        category: 'smoke',
        message: `m${i}`,
        status: 'pass',
      })
    }
    const core = long.map(legacyToCoreMirror)
    const trimmed = trimAuditEntries(core, 3)
    expect(trimmed).toHaveLength(3)
    expect(trimmed.map((e) => e.kind)).toEqual(['smoke', 'smoke', 'smoke'])
    expect(trimmed[0]!.payload.message).toBe('m2')
  })

  it('tryDelete is no-op', () => {
    appendSelfTestAudit({ category: 'smoke', message: 'x', status: 'pass' })
    const id = getSelfTestAuditTrail()[0]!.id
    expect(tryDeleteSelfTestAuditEntry(id)).toBe(false)
    expect(getSelfTestAuditTrail()).toHaveLength(1)
  })

  it('filterSelfTestAuditEntries matches filterAuditEntries on mapped core', () => {
    appendSelfTestAudit({ category: 'smoke', message: 's', status: 'pass' })
    appendSelfTestAudit({ category: 'admin', message: 'a', status: 'warn' })
    appendSelfTestAudit({ category: 'smoke', message: 's2', status: 'pass' })
    const legacy = [...getSelfTestAuditTrail()]
    const filters = { kindFilter: 'smoke', correlationQuery: 'speedorder:' }

    const viaAdapter = filterSelfTestAuditEntries(legacy, filters)
    const viaCore = filterAuditEntries(
      legacy.map(legacyToCoreMirror),
      filters,
    ).map((e) => ({
      id: e.id,
      at: typeof e.payload.at === 'string' ? e.payload.at : new Date(e.server_ms).toISOString(),
      category: e.kind as SelfTestAuditEntry['category'],
      message: String(e.payload.message ?? ''),
      status: e.payload.status as SelfTestAuditEntry['status'] | undefined,
      meta: e.payload.meta as SelfTestAuditEntry['meta'],
    }))

    expect(viaAdapter.map((r) => r.id).sort()).toEqual(viaCore.map((r) => r.id).sort())
  })

  it('buildSelfTestAuditExportPayload matches envelope + filtered counts', () => {
    appendSelfTestAudit({ category: 'smoke', message: 'keep', status: 'pass' })
    appendSelfTestAudit({ category: 'admin', message: 'drop', status: 'pass' })
    const payload = buildSelfTestAuditExportPayload({ kindFilter: 'smoke' })
    expect(payload).toMatchObject({
      schema_version: '1.0',
      platform: 'speedorder',
      mock_only: true,
      client_only: true,
      entry_count: 1,
      filters: { kind: 'smoke', correlation_id: '' },
    })
    expect(payload.entries).toHaveLength(1)
    expect(payload.entries[0]!.kind).toBe('smoke')
  })
})
