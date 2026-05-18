import type { OrderFormPresetId, TradingWorkspaceSlot } from '../domain/tradingWorkspace'
import type { TradingStore } from '../store/tradingStoreTypes'
import {
  recordWorkspaceSyncSkipped,
  recordWorkspaceSyncSource,
} from './workspaceSyncDiagnostics'
import { workspaceSlotPresetMatchesStore } from './workspaceSyncGuards'

export type WorkspaceOrderFormTab = 'standard' | 'stopMit'

export function orderFormPresetToTab(preset: OrderFormPresetId): WorkspaceOrderFormTab {
  return preset === 'stop_mit_tab' ? 'stopMit' : 'standard'
}

type WorkspaceSlotStoreTarget = Pick<
  TradingStore,
  | 'symbol'
  | 'orderBookDesignPreset'
  | 'confirmOrders'
  | 'uiCompactMode'
  | 'workspaceOrderFormTab'
  | 'workspacePositionPanelPreset'
  | 'workspaceLayoutPreset'
  | 'setOrderBookDesignPreset'
  | 'setConfirmOrders'
  | 'setUiCompactMode'
  | 'setSymbol'
  | 'setWorkspaceRuntimeFromSlot'
>

/** Single-store preset wiring — no API / websocket (W2). */
export function applyWorkspaceSlotToStore(store: WorkspaceSlotStoreTarget, slot: TradingWorkspaceSlot): void {
  if (workspaceSlotPresetMatchesStore(store, slot)) {
    recordWorkspaceSyncSkipped('applyWorkspaceSlot')
    return
  }

  recordWorkspaceSyncSource('applyWorkspaceSlot')
  if (store.orderBookDesignPreset !== slot.orderBookPreset) {
    store.setOrderBookDesignPreset(slot.orderBookPreset)
  }
  const confirm = slot.orderFormPreset === 'speed_confirm'
  if (store.confirmOrders !== confirm) {
    store.setConfirmOrders(confirm)
  }
  const compact = slot.layoutPreset === 'hts_compact'
  if (store.uiCompactMode !== compact) {
    store.setUiCompactMode(compact)
  }
  store.setWorkspaceRuntimeFromSlot(slot)
  if (slot.initialSymbol && store.symbol !== slot.initialSymbol) {
    store.setSymbol(slot.initialSymbol)
  }
}
