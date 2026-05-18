import { createStore } from 'zustand'
import { createConditionalOrderSlice } from './slices/conditionalOrderSlice'
import { createOrderActionLogSlice } from './slices/orderActionLogSlice'
import { createOrderBookUiSlice } from './slices/orderBookUiSlice'
import { createOrderSlice } from './slices/orderSlice'
import { createPositionSlice } from './slices/positionSlice'
import { createPositionCloseSlice } from './slices/positionCloseSlice'
import { createSymbolMarketSlice } from './slices/symbolMarketSlice'
import { createStopMitDraftSlice } from './slices/stopMitDraftSlice'
import { createWorkspaceRuntimeSlice } from './slices/workspaceRuntimeSlice'
import { createUiPrefsSlice } from './slices/uiPrefsSlice'
import { createUiRiskSlice } from './slices/uiRiskSlice'
import type { TradingStore } from './tradingStoreTypes'

/** One isolated mock trading store per workspaceId (W3). */
export function createTradingStoreInstance(): import('zustand').StoreApi<TradingStore> {
  return createStore<TradingStore>()((...args) => ({
    ...createSymbolMarketSlice(...args),
    ...createOrderSlice(...args),
    ...createPositionSlice(...args),
    ...createPositionCloseSlice(...args),
    ...createUiRiskSlice(...args),
    ...createOrderActionLogSlice(...args),
    ...createConditionalOrderSlice(...args),
    ...createOrderBookUiSlice(...args),
    ...createStopMitDraftSlice(...args),
    ...createWorkspaceRuntimeSlice(...args),
    ...createUiPrefsSlice(...args),
  }))
}
