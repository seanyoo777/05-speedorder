import type { StateCreator } from 'zustand'
import type { PositionPanelPresetId, WorkspaceLayoutPresetId } from '../../domain/tradingWorkspace'
import type { TradingWorkspaceSlot } from '../../domain/tradingWorkspace'
import type { WorkspaceOrderFormTab } from '../../workspace/applyWorkspaceSlot'
import type { TradingStore } from '../tradingStoreTypes'

/** Per-workspace UI runtime — isolated per registry store (W3). */
export const createWorkspaceRuntimeSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'workspaceOrderFormTab'
    | 'workspacePositionPanelPreset'
    | 'workspaceLayoutPreset'
    | 'setWorkspaceOrderFormTab'
    | 'setWorkspaceRuntimeFromSlot'
  >
> = (set) => ({
  workspaceOrderFormTab: 'standard' as WorkspaceOrderFormTab,
  workspacePositionPanelPreset: 'single_symbol' as PositionPanelPresetId,
  workspaceLayoutPreset: 'hts_standard' as WorkspaceLayoutPresetId,

  setWorkspaceOrderFormTab: (workspaceOrderFormTab) => set({ workspaceOrderFormTab }),

  setWorkspaceRuntimeFromSlot: (slot: TradingWorkspaceSlot) =>
    set({
      workspaceOrderFormTab: slot.orderFormPreset === 'stop_mit_tab' ? 'stopMit' : 'standard',
      workspacePositionPanelPreset: slot.positionPanelPreset,
      workspaceLayoutPreset: slot.layoutPreset,
    }),
})
