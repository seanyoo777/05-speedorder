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

export type OrderStatus = 'open' | 'filled' | 'cancelled'

export type OrderRecordRow = {
  id: string
  symbol: string
  side: OrderSide
  type: 'market' | 'limit'
  price: number | null
  quantity: number
  status: OrderStatus
  time: string
}

export type TickerRow = {
  id: string
  label: string
  symbol: string
  price: number
  changePct: number
}

export type HistoryTab = 'fills' | 'orders' | 'cancelled'
