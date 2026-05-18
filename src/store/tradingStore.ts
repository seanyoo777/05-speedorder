import { create } from 'zustand'
import { createSubmitMockSpeedOrder } from '../engine/submitMockSpeedOrder'
import { createConditionalOrderSlice } from './slices/conditionalOrderSlice'
import { createOrderActionLogSlice } from './slices/orderActionLogSlice'
import { createOrderBookUiSlice } from './slices/orderBookUiSlice'
import { createOrderSlice } from './slices/orderSlice'
import { createPositionSlice } from './slices/positionSlice'
import { createSymbolMarketSlice } from './slices/symbolMarketSlice'
import { createStopMitDraftSlice } from './slices/stopMitDraftSlice'
import { createUiPrefsSlice } from './slices/uiPrefsSlice'
import { createUiRiskSlice } from './slices/uiRiskSlice'
import type { TradingStore } from './tradingStoreTypes'

export type UiMode = 'beginner' | 'expert'

export type { TradingStore } from './tradingStoreTypes'

export const useTradingStore = create<TradingStore>()((...args) => ({
  ...createSymbolMarketSlice(...args),
  ...createOrderSlice(...args),
  ...createPositionSlice(...args),
  ...createUiRiskSlice(...args),
  ...createOrderActionLogSlice(...args),
  ...createConditionalOrderSlice(...args),
  ...createOrderBookUiSlice(...args),
  ...createStopMitDraftSlice(...args),
  ...createUiPrefsSlice(...args),
}))

export const submitMockSpeedOrder = createSubmitMockSpeedOrder(useTradingStore)

export { createSubmitMockSpeedOrder } from '../engine/submitMockSpeedOrder'
export type { SubmitMockSpeedOrderInput } from '../engine/submitMockSpeedOrder'
export { executeImmediateMockMarketOrder } from '../engine/immediateMarketFill'

/** TGX / UTE — vendor 스냅샷·정책·심볼 API (store 경로에서 재export) */
export {
  ORDER_EXECUTION_POLICY,
  SPEED_ORDER_ENGINE_STATUS,
  MARKET_SYNC_ACTIONS,
  speedOrderSymbolRegistry,
  readSpeedOrderVendorSerializableSnapshot,
  getSpeedOrderVendorBundle,
} from '../vendor'
export type {
  OrderExecutionPolicy,
  SpeedOrderEngineStatus,
  MarketSyncActionEntry,
  MarketSyncActionId,
  SpeedOrderSymbolRegistryApi,
  SpeedOrderVendorSerializableSnapshot,
  SpeedOrderVendorBundle,
} from '../vendor'
