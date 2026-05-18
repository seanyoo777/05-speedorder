import type { StateCreator } from 'zustand'
import { getTradingWorkspaceSlot } from '../../domain/tradingWorkspaceCatalog'
import type { PositionPanelPresetId, WorkspaceLayoutPresetId } from '../../domain/tradingWorkspace'
import { applyWorkspaceSlotToStore } from '../../workspace/applyWorkspaceSlot'
import {
  isWorkspaceUrlInSync,
  readWorkspaceIdFromUrl,
  resolveWorkspaceId,
  writeWorkspaceIdToUrl,
} from '../../workspace/tradingWorkspaceUrl'
import type { WorkspaceOrderFormTab } from '../../workspace/applyWorkspaceSlot'
import type { TradingStore } from '../tradingStoreTypes'

export const createWorkspaceUiSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'activeWorkspaceId'
    | 'activeWorkspaceCategoryId'
    | 'workspaceOrderFormTab'
    | 'workspacePositionPanelPreset'
    | 'workspaceLayoutPreset'
    | 'workspaceUrlQueryRaw'
    | 'workspaceUrlFallbackUsed'
    | 'workspaceUrlInSync'
    | 'setWorkspaceOrderFormTab'
    | 'setWorkspaceRuntimeFromSlot'
    | 'activateWorkspace'
    | 'initWorkspaceFromUrl'
  >
> = (set, get) => ({
  activeWorkspaceId: 'domestic_futures:1',
  activeWorkspaceCategoryId: 'domestic_futures',
  workspaceOrderFormTab: 'stopMit' as WorkspaceOrderFormTab,
  workspacePositionPanelPreset: 'category_filtered' as PositionPanelPresetId,
  workspaceLayoutPreset: 'hts_standard' as WorkspaceLayoutPresetId,
  workspaceUrlQueryRaw: null as string | null,
  workspaceUrlFallbackUsed: false,
  workspaceUrlInSync: true,

  setWorkspaceOrderFormTab: (workspaceOrderFormTab) => set({ workspaceOrderFormTab }),

  setWorkspaceRuntimeFromSlot: (slot) =>
    set({
      activeWorkspaceId: slot.workspaceId,
      activeWorkspaceCategoryId: slot.categoryId,
      workspaceOrderFormTab: slot.orderFormPreset === 'stop_mit_tab' ? 'stopMit' : 'standard',
      workspacePositionPanelPreset: slot.positionPanelPreset,
      workspaceLayoutPreset: slot.layoutPreset,
    }),

  activateWorkspace: (workspaceId, options) => {
    const resolved = resolveWorkspaceId(workspaceId)
    const slot = getTradingWorkspaceSlot(resolved.workspaceId)
    if (!slot) return

    applyWorkspaceSlotToStore(get(), slot)

    const syncUrl = options?.syncUrl !== false
    if (syncUrl && typeof window !== 'undefined') {
      writeWorkspaceIdToUrl(resolved.workspaceId, options?.historyMode ?? 'replace')
    }

    const urlRaw = options?.urlRaw !== undefined ? options.urlRaw : readWorkspaceIdFromUrl()
    set({
      workspaceUrlQueryRaw: urlRaw,
      workspaceUrlFallbackUsed: resolved.usedFallback,
      workspaceUrlInSync: isWorkspaceUrlInSync(resolved.workspaceId),
    })
  },

  initWorkspaceFromUrl: (search) => {
    const urlRaw = readWorkspaceIdFromUrl(search)
    const resolved = resolveWorkspaceId(urlRaw)
    get().activateWorkspace(resolved.workspaceId, {
      syncUrl: true,
      urlRaw,
      historyMode: 'replace',
    })
    if (resolved.usedFallback && typeof window !== 'undefined') {
      writeWorkspaceIdToUrl(resolved.workspaceId, 'replace')
    }
  },
})
