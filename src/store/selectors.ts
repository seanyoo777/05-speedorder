import type { TradingStore } from './tradingStoreTypes'

/** 스피드 주문 패널 등 — 객체 셀렉터 + `useShallow`로 리렌더 최소화 */
export function selectSpeedOrderShell(s: TradingStore) {
  return {
    symbol: s.symbol,
    lastPrice: s.lastPrice,
    beginnerMode: s.beginnerMode,
    confirmOrders: s.confirmOrders,
    mockOrderInFlightId: s.mockOrderInFlightId,
    setSymbol: s.setSymbol,
    setBeginnerMode: s.setBeginnerMode,
    setConfirmOrders: s.setConfirmOrders,
  }
}
