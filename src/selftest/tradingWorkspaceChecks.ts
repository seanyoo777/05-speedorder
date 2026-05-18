import {
  listTradingWorkspaceCategories,
  listTradingWorkspaceSlots,
  validateTradingWorkspaceCatalog,
} from '../domain/tradingWorkspaceCatalog'
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

export function runTradingWorkspaceChecks(): SelfTestCheckResult[] {
  return [
    runCheck('workspace-catalog-complete', 'Workspace catalog complete', () => {
      const v = validateTradingWorkspaceCatalog()
      if (v.categoryCount !== 5 || v.slotCount !== 15) {
        return {
          status: 'fail',
          message: `categories=${v.categoryCount} slots=${v.slotCount}`,
        }
      }
      if (!v.ok) return { status: 'fail', message: v.issues.join('; ') }
      return { status: 'pass', message: '5 categories · 15 slots' }
    }),

    runCheck('workspace-id-unique', 'Workspace id unique', () => {
      const ids = listTradingWorkspaceSlots().map((s) => s.workspaceId)
      const unique = new Set(ids)
      if (unique.size !== ids.length) {
        return { status: 'fail', message: `duplicate among ${ids.length} ids` }
      }
      return { status: 'pass', message: `${unique.size} unique workspaceIds` }
    }),

    runCheck('workspace-mock-only', 'Workspace mock only', () => {
      const bad = listTradingWorkspaceSlots().filter((s) => s.mockOnly !== true)
      if (bad.length > 0) {
        return { status: 'fail', message: `${bad.length} slot(s) without mockOnly` }
      }
      return { status: 'pass', message: 'All 15 slots mockOnly=true' }
    }),

    runCheck('workspace-category-slot-count', 'Workspace category slot count', () => {
      const cats = listTradingWorkspaceCategories()
      const bad = cats.filter((c) => {
        const n = listTradingWorkspaceSlots().filter((s) => s.categoryId === c.id).length
        return n !== 3
      })
      if (bad.length > 0) {
        return {
          status: 'fail',
          message: bad.map((c) => c.id).join(', '),
        }
      }
      return { status: 'pass', message: '3 slots per category' }
    }),
  ]
}
