/**
 * Market sync — Zustand `TradingStore` 액션 이름과 역할 요약.
 * UTE가 05번 상태를 구독·미러링할 때 어떤 진입점이 안전한지 나열합니다.
 */
export type MarketSyncActionId =
  | 'setSymbol'
  | 'applyOrderBook'
  | 'applyLastPrice'
  | 'applyTickers'
  | 'patchTicker'
  | 'applyMockTick'

export type MarketSyncActionEntry = {
  readonly id: MarketSyncActionId
  readonly description: string
  /** 조건 주문(MIT/STOP) 트리거가 연쇄될 수 있음 */
  readonly mayRunConditionalOrders: boolean
}

export const MARKET_SYNC_ACTIONS: readonly MarketSyncActionEntry[] = [
  {
    id: 'setSymbol',
    description: '활성 심볼·호가·lastPrice·포지션 마크 재동기',
    mayRunConditionalOrders: false,
  },
  {
    id: 'applyOrderBook',
    description: '호가 스냅샷만 갱신',
    mayRunConditionalOrders: false,
  },
  {
    id: 'applyLastPrice',
    description: '체결가/지수 last 갱신; 활성 심볼 대기 조건주 FIFO 평가',
    mayRunConditionalOrders: true,
  },
  {
    id: 'applyTickers',
    description: '티커 목록 전체 교체; 포지션 마크 재계산',
    mayRunConditionalOrders: false,
  },
  {
    id: 'patchTicker',
    description: '단일 티커 부분 갱신; 포지션 마크 재계산',
    mayRunConditionalOrders: false,
  },
  {
    id: 'applyMockTick',
    description: 'last+book+tickers 원자 갱신; 조건주 평가',
    mayRunConditionalOrders: true,
  },
] as const
