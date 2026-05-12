import type { StoreApi } from 'zustand'
import { speedOrderToast } from './speedOrderToast'
import type { SpeedOrderActionKind } from '../types/trading'
import type { TradingStore } from '../store/tradingStoreTypes'

/** 토스트 + 최근 주문 로그(최대 5) 동시 기록 — mock UX 피드백 */
export function speedOrderUxFeedback(
  store: StoreApi<TradingStore>,
  kind: SpeedOrderActionKind,
  text: string,
): void {
  speedOrderToast(text)
  store.getState().pushOrderActionLog({ kind, text })
}
