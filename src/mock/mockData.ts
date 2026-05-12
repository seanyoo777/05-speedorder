import type {
  OrderBookSnapshot,
  OrderLevel,
  OrderRecordRow,
  PositionRow,
  TickerRow,
  TradeFillRow,
} from '../types/trading'

const BASE_PRICE = 97_250

function makeLevels(center: number, step: number, count: number, side: 'bid' | 'ask'): OrderLevel[] {
  const out: OrderLevel[] = []
  for (let i = 0; i < count; i += 1) {
    const offset = (i + 1) * step
    const price = side === 'bid' ? center - offset : center + offset
    const quantity = 0.02 + (i % 5) * 0.011 + (i % 3) * 0.007
    out.push({ price, quantity })
  }
  return out
}

export function buildOrderBook(lastPrice: number): OrderBookSnapshot {
  const step = lastPrice > 10_000 ? 25 : 0.05
  return {
    bids: makeLevels(lastPrice, step, 14, 'bid'),
    asks: makeLevels(lastPrice, step, 14, 'ask'),
  }
}

export const initialTickers: TickerRow[] = [
  { id: 'btc', label: 'BTC', symbol: 'BTCUSDT', price: BASE_PRICE, changePct: 0.42 },
  { id: 'eth', label: 'ETH', symbol: 'ETHUSDT', price: 3_542.1, changePct: -0.18 },
  { id: 'ndx', label: 'NASDAQ', symbol: 'NDX', price: 19_820.5, changePct: 0.09 },
  { id: 'gold', label: 'GOLD', symbol: 'XAUUSD', price: 2_345.6, changePct: 0.31 },
]

export const initialPositions: PositionRow[] = [
  {
    id: 'p1',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.12,
    avgPrice: 96_800,
    unrealizedPnl: 54,
    realizedPnl: 120,
    returnPct: 0.46,
  },
  {
    id: 'p2',
    symbol: 'ETHUSDT',
    side: 'short',
    size: 1.5,
    avgPrice: 3_580,
    unrealizedPnl: 56.85,
    realizedPnl: -12,
    returnPct: 1.05,
  },
]

export const initialFills: TradeFillRow[] = [
  {
    id: 'f1',
    symbol: 'BTCUSDT',
    side: 'buy',
    price: 96_820,
    quantity: 0.05,
    time: '14:02:11',
  },
  {
    id: 'f2',
    symbol: 'BTCUSDT',
    side: 'sell',
    price: 97_100,
    quantity: 0.02,
    time: '14:05:44',
  },
]

export const initialOrders: OrderRecordRow[] = [
  {
    id: 'o1',
    symbol: 'BTCUSDT',
    side: 'buy',
    type: 'limit',
    price: 96_500,
    quantity: 0.1,
    status: 'open',
    time: '13:58:02',
  },
  {
    id: 'o2',
    symbol: 'ETHUSDT',
    side: 'sell',
    type: 'market',
    price: null,
    quantity: 0.5,
    status: 'filled',
    time: '13:55:30',
  },
  {
    id: 'o3',
    symbol: 'BTCUSDT',
    side: 'sell',
    type: 'limit',
    price: 98_000,
    quantity: 0.04,
    status: 'cancelled',
    time: '12:40:19',
  },
]

export const MOCK_SYMBOL = 'BTCUSDT'

export function getInitialLastPrice(): number {
  return BASE_PRICE
}
