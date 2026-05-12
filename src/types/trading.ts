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
  time: string
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
