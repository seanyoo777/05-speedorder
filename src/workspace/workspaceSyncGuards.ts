import type { TradingWorkspaceSlot } from '../domain/tradingWorkspace'
import type { TradingStore } from '../store/tradingStoreTypes'
import type { WorkspaceShellState } from '../store/workspaceShellTypes'

export function isSameWorkspaceShellMeta(
  current: WorkspaceShellState,
  next: {
    workspaceId: string
    categoryId: TradingWorkspaceSlot['categoryId']
    urlRaw: string | null
    usedFallback: boolean
    urlInSync: boolean
  },
): boolean {
  return (
    current.activeWorkspaceId === next.workspaceId &&
    current.activeWorkspaceCategoryId === next.categoryId &&
    current.workspaceUrlQueryRaw === next.urlRaw &&
    current.workspaceUrlFallbackUsed === next.usedFallback &&
    current.workspaceUrlInSync === next.urlInSync
  )
}

export function workspaceRuntimeMatchesSlot(
  state: Pick<
    TradingStore,
    'workspaceOrderFormTab' | 'workspacePositionPanelPreset' | 'workspaceLayoutPreset'
  >,
  slot: TradingWorkspaceSlot,
): boolean {
  const tab = slot.orderFormPreset === 'stop_mit_tab' ? 'stopMit' : 'standard'
  return (
    state.workspaceOrderFormTab === tab &&
    state.workspacePositionPanelPreset === slot.positionPanelPreset &&
    state.workspaceLayoutPreset === slot.layoutPreset
  )
}

export function workspaceSlotPresetMatchesStore(
  state: Pick<
    TradingStore,
    | 'symbol'
    | 'orderBookDesignPreset'
    | 'confirmOrders'
    | 'uiCompactMode'
    | 'workspaceOrderFormTab'
    | 'workspacePositionPanelPreset'
    | 'workspaceLayoutPreset'
  >,
  slot: TradingWorkspaceSlot,
): boolean {
  const confirm = slot.orderFormPreset === 'speed_confirm'
  const compact = slot.layoutPreset === 'hts_compact'
  const symbolOk = !slot.initialSymbol || state.symbol === slot.initialSymbol
  return (
    state.orderBookDesignPreset === slot.orderBookPreset &&
    state.confirmOrders === confirm &&
    state.uiCompactMode === compact &&
    symbolOk &&
    workspaceRuntimeMatchesSlot(state, slot)
  )
}
