import { create } from 'zustand'
import { createSubmitMockSpeedOrder } from '../engine/submitMockSpeedOrder'
import { createConditionalOrderSlice } from './slices/conditionalOrderSlice'
import { createOrderBookUiSlice } from './slices/orderBookUiSlice'
import { createOrderSlice } from './slices/orderSlice'
import { createPositionSlice } from './slices/positionSlice'
import { createSymbolMarketSlice } from './slices/symbolMarketSlice'
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
  ...createConditionalOrderSlice(...args),
  ...createOrderBookUiSlice(...args),
  ...createUiPrefsSlice(...args),
}))

export const submitMockSpeedOrder = createSubmitMockSpeedOrder(useTradingStore)

export { createSubmitMockSpeedOrder } from '../engine/submitMockSpeedOrder'
export type { SubmitMockSpeedOrderInput } from '../engine/submitMockSpeedOrder'
export { executeImmediateMockMarketOrder } from '../engine/immediateMarketFill'
