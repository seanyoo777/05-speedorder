import { create } from 'zustand'
import type {
  OrderBookSnapshot,
  OrderRecordRow,
  OrderSide,
  PositionRow,
  TickerRow,
  TradeFillRow,
} from '../types/trading'
import { safeArray } from '../utils/safe'
import {
  buildOrderBook,
  getInitialLastPrice,
  initialFills,
  initialOrders,
  initialPositions,
  initialTickers,
  MOCK_SYMBOL,
} from '../mock/mockData'

export type UiMode = 'beginner' | 'expert'

type TradingStore = {
  symbol: string
  lastPrice: number
  orderBook: OrderBookSnapshot
  tickers: TickerRow[]
  positions: PositionRow[]
  fills: TradeFillRow[]
  orders: OrderRecordRow[]
  beginnerMode: boolean
  confirmOrders: boolean
  /** Injected later from WebSocket / host app */
  setSymbol: (symbol: string) => void
  applyOrderBook: (book: OrderBookSnapshot) => void
  applyLastPrice: (price: number) => void
  applyTickers: (tickers: TickerRow[]) => void
  patchTicker: (id: string, patch: Partial<TickerRow>) => void
  setPositions: (rows: PositionRow[]) => void
  pushFill: (row: TradeFillRow) => void
  upsertOrder: (row: OrderRecordRow) => void
  cancelOrder: (id: string) => void
  setBeginnerMode: (v: boolean) => void
  setConfirmOrders: (v: boolean) => void
  /** Mock tick bundles book + price + tickers */
  applyMockTick: (payload: { lastPrice: number; orderBook: OrderBookSnapshot; tickers: TickerRow[] }) => void
  /** Demo close — no real trading */
  closePositionDemo: (id: string) => void
}

const last = getInitialLastPrice()

export const useTradingStore = create<TradingStore>((set, get) => ({
  symbol: MOCK_SYMBOL,
  lastPrice: last,
  orderBook: buildOrderBook(last),
  tickers: initialTickers,
  positions: initialPositions,
  fills: initialFills,
  orders: initialOrders,
  beginnerMode: false,
  confirmOrders: true,

  setSymbol: (symbol) => set({ symbol }),

  applyOrderBook: (orderBook) =>
    set({
      orderBook: {
        bids: safeArray(orderBook?.bids),
        asks: safeArray(orderBook?.asks),
      },
    }),

  applyLastPrice: (price) => {
    if (!Number.isFinite(price)) return
    set({ lastPrice: price })
  },

  applyTickers: (tickers) => set({ tickers: safeArray(tickers) }),

  patchTicker: (id, patch) =>
    set((s) => ({
      tickers: s.tickers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  setPositions: (positions) => set({ positions: safeArray(positions) }),

  pushFill: (row) =>
    set((s) => ({
      fills: [row, ...safeArray(s.fills)].slice(0, 200),
    })),

  upsertOrder: (row) =>
    set((s) => {
      const list = safeArray(s.orders)
      const idx = list.findIndex((o) => o.id === row.id)
      if (idx === -1) return { orders: [row, ...list].slice(0, 200) }
      const copy = [...list]
      copy[idx] = row
      return { orders: copy }
    }),

  cancelOrder: (id) =>
    set((s) => ({
      orders: safeArray(s.orders).map((o) =>
        o.id === id ? { ...o, status: 'cancelled' as const } : o,
      ),
    })),

  setBeginnerMode: (beginnerMode) => set({ beginnerMode }),

  setConfirmOrders: (confirmOrders) => set({ confirmOrders }),

  applyMockTick: ({ lastPrice, orderBook, tickers }) => {
    if (!Number.isFinite(lastPrice)) return
    set({
      lastPrice,
      orderBook: {
        bids: safeArray(orderBook?.bids),
        asks: safeArray(orderBook?.asks),
      },
      tickers: safeArray(tickers),
    })
    const sym = get().symbol
    const positions = get().positions.map((p) => {
      if (p.symbol !== sym) return p
      const dir = p.side === 'long' ? 1 : -1
      const unreal = (lastPrice - p.avgPrice) * p.size * dir
      const ret = p.avgPrice ? ((lastPrice - p.avgPrice) / p.avgPrice) * 100 * dir : 0
      return { ...p, unrealizedPnl: unreal, returnPct: ret }
    })
    set({ positions })
  },

  closePositionDemo: (id) =>
    set((s) => ({
      positions: safeArray(s.positions).filter((p) => p.id !== id),
    })),
}))

export function placeSpeedOrderDemo(input: {
  side: OrderSide
  orderType: 'market' | 'limit'
  quantity: number
  limitPrice?: number
}): void {
  const state = useTradingStore.getState()
  const qty = Number.isFinite(input.quantity) && input.quantity > 0 ? input.quantity : 0
  if (qty <= 0) return

  const execPrice =
    input.orderType === 'market' || input.limitPrice == null
      ? state.lastPrice
      : input.limitPrice

  if (!Number.isFinite(execPrice) || execPrice <= 0) return

  const idBase = `${Date.now()}`
  const time = new Date().toLocaleTimeString('ko-KR', { hour12: false })

  const fill: TradeFillRow = {
    id: `f-${idBase}`,
    symbol: state.symbol,
    side: input.side,
    price: execPrice,
    quantity: qty,
    time,
  }

  const order: OrderRecordRow = {
    id: `o-${idBase}`,
    symbol: state.symbol,
    side: input.side,
    type: input.orderType,
    price: input.orderType === 'limit' ? input.limitPrice ?? execPrice : null,
    quantity: qty,
    status: 'filled',
    time,
  }

  state.pushFill(fill)
  state.upsertOrder(order)
}
