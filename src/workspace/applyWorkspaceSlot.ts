import type { OrderFormPresetId, TradingWorkspaceSlot } from '../domain/tradingWorkspace'
import type { TradingStore } from '../store/tradingStoreTypes'

export type WorkspaceOrderFormTab = 'standard' | 'stopMit'

export function orderFormPresetToTab(preset: OrderFormPresetId): WorkspaceOrderFormTab {
  return preset === 'stop_mit_tab' ? 'stopMit' : 'standard'
}

/** Single-store preset wiring — no API / websocket (W2). */
export function applyWorkspaceSlotToStore(
  store: Pick<
    TradingStore,
    | 'setOrderBookDesignPreset'
    | 'setConfirmOrders'
    | 'setUiCompactMode'
    | 'setSymbol'
    | 'setWorkspaceRuntimeFromSlot'
  >,
  slot: TradingWorkspaceSlot,
): void {
  store.setOrderBookDesignPreset(slot.orderBookPreset)
  store.setConfirmOrders(slot.orderFormPreset === 'speed_confirm')
  store.setUiCompactMode(slot.layoutPreset === 'hts_compact')
  store.setWorkspaceRuntimeFromSlot(slot)
  if (slot.initialSymbol) {
    store.setSymbol(slot.initialSymbol)
  }
}
