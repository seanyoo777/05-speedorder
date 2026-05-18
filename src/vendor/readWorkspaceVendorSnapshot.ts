import {
  getTradingWorkspaceSlot,
  listTradingWorkspaceSlots,
} from '../domain/tradingWorkspaceCatalog'
import type {
  OrderFormPresetId,
  OrderBookPresetId,
  PositionPanelPresetId,
  TradingWorkspaceCategoryId,
  TradingWorkspaceSlot,
  TradingWorkspaceSlotIndex,
  WorkspaceLayoutPresetId,
} from '../domain/tradingWorkspace'
import { parseWorkspaceId } from '../domain/tradingWorkspace'
import type { TradingStoreState } from '../store/tradingStoreTypes'
import { bootSpec } from '../store/boot'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'
import {
  getActiveWorkspaceId,
  getOrCreateWorkspaceStore,
  peekWorkspaceStore,
} from '../store/workspaceStoreRegistry'
import { ORDER_EXECUTION_POLICY } from './orderExecutionPolicy'

/** Host(02-CEX / 04-MockInvest / 07-UTE)용 workspace 단위 직렬화 스냅샷 (함수 미포함). */
export type TradingWorkspaceVendorSnapshot = {
  workspaceId: string
  categoryId: TradingWorkspaceCategoryId
  slotIndex: TradingWorkspaceSlotIndex
  displayName: string
  assetClass: TradingWorkspaceCategoryId
  activeSymbol: string
  orderBookPreset: OrderBookPresetId
  orderFormPreset: OrderFormPresetId
  positionPanelPreset: PositionPanelPresetId
  layoutPreset: WorkspaceLayoutPresetId
  stopMitLockEnabled: boolean
  positionCloseEnabled: boolean
  mockOnly: true
}

const WORKSPACE_VENDOR_SNAPSHOT_KEYS: readonly (keyof TradingWorkspaceVendorSnapshot)[] = [
  'workspaceId',
  'categoryId',
  'slotIndex',
  'displayName',
  'assetClass',
  'activeSymbol',
  'orderBookPreset',
  'orderFormPreset',
  'positionPanelPreset',
  'layoutPreset',
  'stopMitLockEnabled',
  'positionCloseEnabled',
  'mockOnly',
] as const

export function workspaceVendorSnapshotContractKeys(): readonly string[] {
  return WORKSPACE_VENDOR_SNAPSHOT_KEYS
}

function buildWorkspaceVendorSnapshot(
  slot: TradingWorkspaceSlot,
  state?: TradingStoreState,
): TradingWorkspaceVendorSnapshot {
  return {
    workspaceId: slot.workspaceId,
    categoryId: slot.categoryId,
    slotIndex: slot.slotIndex,
    displayName: slot.displayName,
    assetClass: slot.assetClass,
    activeSymbol: state?.symbol ?? slot.initialSymbol ?? bootSpec.symbol,
    orderBookPreset: state?.orderBookDesignPreset ?? slot.orderBookPreset,
    orderFormPreset: slot.orderFormPreset,
    positionPanelPreset: state?.workspacePositionPanelPreset ?? slot.positionPanelPreset,
    layoutPreset: state?.workspaceLayoutPreset ?? slot.layoutPreset,
    stopMitLockEnabled: slot.stopMitLockEnabled,
    positionCloseEnabled: slot.positionCloseEnabled,
    mockOnly: true,
  }
}

export function validateWorkspaceVendorSnapshot(
  snap: TradingWorkspaceVendorSnapshot,
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  const parsed = parseWorkspaceId(snap.workspaceId)
  if (!parsed) {
    issues.push('workspaceId parse failed')
  } else if (parsed.categoryId !== snap.categoryId || parsed.slotIndex !== snap.slotIndex) {
    issues.push('workspaceId does not match categoryId/slotIndex')
  }
  const slot = getTradingWorkspaceSlot(snap.workspaceId)
  if (!slot) {
    issues.push('catalog slot missing')
  }
  if (snap.mockOnly !== true) {
    issues.push('mockOnly must be true')
  }
  if (!snap.activeSymbol.trim()) {
    issues.push('activeSymbol empty')
  }
  if (ORDER_EXECUTION_POLICY.liveOrderApiEnabled || ORDER_EXECUTION_POLICY.liveExecutionEnabled) {
    issues.push('live execution policy enabled')
  }
  for (const key of WORKSPACE_VENDOR_SNAPSHOT_KEYS) {
    if (!(key in snap)) {
      issues.push(`missing field: ${key}`)
    }
  }
  return { valid: issues.length === 0, issues }
}

/**
 * 단일 workspace 스냅샷 — registry에 없으면 생성 후 최신 trading state 반영.
 */
export function readWorkspaceVendorSnapshot(
  workspaceId: string,
): TradingWorkspaceVendorSnapshot | null {
  const slot = getTradingWorkspaceSlot(workspaceId)
  if (!slot) return null
  const state = getOrCreateWorkspaceStore(workspaceId).getState()
  return buildWorkspaceVendorSnapshot(slot, state)
}

/** 카탈로그 15슬롯 전체 — 인스턴스화된 store는 runtime preset/symbol 반영. */
export function readAllWorkspaceVendorSnapshots(): readonly TradingWorkspaceVendorSnapshot[] {
  return listTradingWorkspaceSlots().map((slot) => {
    const state = peekWorkspaceStore(slot.workspaceId)?.getState()
    return buildWorkspaceVendorSnapshot(slot, state)
  })
}

function resolveActiveWorkspaceIdForSnapshot(): string {
  try {
    const shellId = useWorkspaceShellStore.getState().activeWorkspaceId
    if (shellId) return shellId
  } catch {
    /* store unavailable during isolated import */
  }
  return getActiveWorkspaceId()
}

/** Shell 활성 workspaceId 기준 스냅샷. */
export function readActiveWorkspaceVendorSnapshot(): TradingWorkspaceVendorSnapshot | null {
  return readWorkspaceVendorSnapshot(resolveActiveWorkspaceIdForSnapshot())
}

export function countInvalidWorkspaceVendorSnapshots(
  snapshots: readonly TradingWorkspaceVendorSnapshot[],
): number {
  return snapshots.filter((s) => !validateWorkspaceVendorSnapshot(s).valid).length
}
