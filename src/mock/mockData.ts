import type { SymbolSpec } from '../types/symbol'
import type {
  OrderBookSnapshot,
  OrderLevel,
  OrderRecordRow,
  PositionRow,
  TickerRow,
  TradeFillRow,
} from '../types/trading'
import { getSymbolSpec } from '../symbols/registry'

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

export function buildOrderBook(lastPrice: number, spec: SymbolSpec): OrderBookSnapshot {
  const base = Math.max(spec.tickSize, Math.abs(lastPrice) * 0.00002)
  const step = Math.round(base / spec.tickSize) * spec.tickSize || spec.tickSize
  return {
    bids: makeLevels(lastPrice, step, 14, 'bid'),
    asks: makeLevels(lastPrice, step, 14, 'ask'),
  }
}

function mkTicker(id: string, label: string, symbol: string, price: number, changePct: number): TickerRow {
  const spec = getSymbolSpec(symbol)
  return {
    id,
    label,
    symbol: spec.symbol,
    marketType: spec.marketType,
    price,
    changePct,
  }
}

export const initialTickers: TickerRow[] = [
  mkTicker('btc', 'BTC', 'BTCUSDT', getSymbolSpec('BTCUSDT').referencePrice, 0.42),
  mkTicker('eth', 'ETH', 'ETHUSDT', getSymbolSpec('ETHUSDT').referencePrice, -0.18),
  mkTicker('sol', 'SOL', 'SOLUSDT', getSymbolSpec('SOLUSDT').referencePrice, 0.11),
  mkTicker('xrp', 'XRP', 'XRPUSDT', getSymbolSpec('XRPUSDT').referencePrice, 0.05),
  mkTicker('doge', 'DOGE', 'DOGEUSDT', getSymbolSpec('DOGEUSDT').referencePrice, -0.12),
  mkTicker('bnb', 'BNB', 'BNBUSDT', getSymbolSpec('BNBUSDT').referencePrice, 0.08),
  mkTicker('ndx', 'NDX', 'NASDAQ', getSymbolSpec('NASDAQ').referencePrice, 0.09),
  mkTicker('gold', 'GOLD', 'GOLD', getSymbolSpec('GOLD').referencePrice, 0.31),
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
    status: 'accepted',
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
    status: 'canceled',
    time: '12:40:19',
  },
  {
    id: 'o4',
    symbol: 'SOLUSDT',
    side: 'buy',
    type: 'limit',
    price: 160,
    quantity: 2,
    status: 'rejected',
    time: '11:02:00',
  },
]

export const MOCK_SYMBOL = 'BTCUSDT'

export function getInitialLastPrice(): number {
  return getSymbolSpec(MOCK_SYMBOL).referencePrice
}
