import type { MarketType } from './symbol'

export type OrderSide = 'buy' | 'sell'

export type OrderLevel = {
  price: number
  quantity: number
}

export type OrderBookSnapshot = {
  bids: OrderLevel[]
  asks: OrderLevel[]
}

export type PositionSide = 'long' | 'short'

export type PositionRow = {
  id: string
  symbol: string
  side: PositionSide
  size: number
  avgPrice: number
  unrealizedPnl: number
  realizedPnl: number
  returnPct: number
}

export type TradeFillRow = {
  id: string
  symbol: string
  side: OrderSide
  price: number
  quantity: number
  /** 모의 수수료 (USDT) */
  fee: number
  /** 이번 체결로 반영된 실현 손익 변화 (수수료 포함 차감) */
  realizedPnl: number
  time: string
  timestamp: number
}

/** 모의 주문 라이프사이클 (persisted row에는 idle 미사용) */
export type MockOrderStatus =
  | 'idle'
  | 'submitting'
  | 'accepted'
  | 'filled'
  | 'canceled'
  | 'rejected'

export type PersistedMockOrderStatus = Exclude<MockOrderStatus, 'idle'>

export type OrderRecordRow = {
  id: string
  symbol: string
  side: OrderSide
  type: 'market' | 'limit'
  price: number | null
  quantity: number
  status: PersistedMockOrderStatus
  time: string
}

export type TickerRow = {
  id: string
  label: string
  symbol: string
  marketType: MarketType
  price: number
  changePct: number
}

export type HistoryTab = 'fills' | 'orders' | 'cancelled'

/** MIT / 스탑로스(mock) — 트리거 시 시장가 체결 */
export type ConditionalOrderKind = 'MIT' | 'STOP'

export type ConditionalOrderStatus = 'pending' | 'triggered' | 'filled' | 'canceled'

export type ConditionalOrderRow = {
  id: string
  symbol: string
  kind: ConditionalOrderKind
  side: OrderSide
  triggerPrice: number
  quantity: number
  status: ConditionalOrderStatus
  time: string
  createdAt: number
  triggeredAt?: number
  filledAt?: number
}

/** 조건 체결 시 예상 분류 (UI 표시) */
export type ConditionalOutcomeLabel = '신규진입' | '부분청산' | '완전청산' | '반전진입'
