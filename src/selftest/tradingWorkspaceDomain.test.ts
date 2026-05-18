import { describe, expect, it } from 'vitest'
import {
  getTradingWorkspaceSlot,
  listSlotsByCategory,
  listTradingWorkspaceSlots,
  validateTradingWorkspaceCatalog,
} from '../domain/tradingWorkspaceCatalog'
import { buildWorkspaceId } from '../domain/tradingWorkspace'

describe('tradingWorkspace catalog', () => {
  it('validateTradingWorkspaceCatalog passes', () => {
    const v = validateTradingWorkspaceCatalog()
    expect(v.ok).toBe(true)
    expect(v.invalidCount).toBe(0)
    expect(v.categoryCount).toBe(5)
    expect(v.slotCount).toBe(15)
  })

  it('getTradingWorkspaceSlot resolves crypto:1', () => {
    const slot = getTradingWorkspaceSlot('crypto:1')
    expect(slot?.displayName).toBe('코인 1번 거래창')
    expect(slot?.mockOnly).toBe(true)
  })

  it('listSlotsByCategory returns 3', () => {
    expect(listSlotsByCategory('domestic_futures')).toHaveLength(3)
  })

  it('buildWorkspaceId format', () => {
    expect(buildWorkspaceId('us_stock', 2)).toBe('us_stock:2')
    expect(listTradingWorkspaceSlots().map((s) => s.workspaceId)).toContain('us_stock:2')
  })
})
