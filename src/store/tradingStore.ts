import { create } from 'zustand'
import type {
  OrderBookSnapshot,
  OrderRecordRow,
  OrderSide,
  PositionRow,
  TickerRow,
  TradeFillRow,
} from '../types/trading'
import { getSymbolSpec } from '../symbols/registry'
import { safeArray } from '../utils/safe'
import { roundToLotSize, roundToTickSize } from '../utils/rounding'
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

const MOCK_DELAY_SUBMIT_MS = 100
const MOCK_DELAY_ACCEPT_MS = 120

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
  /** 동시 모의 주문 1건만 (UI 비활성용) */
  mockOrderInFlightId: string | null
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
  setMockOrderInFlight: (id: string | null) => void
  /** Mock tick bundles book + price + tickers */
  applyMockTick: (payload: { lastPrice: number; orderBook: OrderBookSnapshot; tickers: TickerRow[] }) => void
  /** Demo close — no real trading */
  closePositionDemo: (id: string) => void
}

const bootSpec = getSymbolSpec(MOCK_SYMBOL)
const bootLast = getInitialLastPrice()

export const useTradingStore = create<TradingStore>((set, get) => ({
  symbol: bootSpec.symbol,
  lastPrice: bootLast,
  orderBook: buildOrderBook(bootLast, bootSpec),
  tickers: initialTickers,
  positions: initialPositions,
  fills: initialFills,
  orders: initialOrders,
  beginnerMode: false,
  confirmOrders: true,
  mockOrderInFlightId: null,

  setSymbol: (symbol) => {
    const spec = getSymbolSpec(symbol)
    const sym = spec.symbol
    const row = get().tickers.find((t) => t.symbol === sym)
    const lp = row?.price ?? spec.referencePrice
    const lastPrice = Number.isFinite(lp) ? lp : spec.referencePrice
    set({
      symbol: sym,
      lastPrice,
      orderBook: buildOrderBook(lastPrice, spec),
    })
  },

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
        o.id === id ? { ...o, status: 'canceled' as const } : o,
      ),
    })),

  setBeginnerMode: (beginnerMode) => set({ beginnerMode }),

  setConfirmOrders: (confirmOrders) => set({ confirmOrders }),

  setMockOrderInFlight: (mockOrderInFlightId) => set({ mockOrderInFlightId }),

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

export function submitMockSpeedOrder(input: {
  side: OrderSide
  orderType: 'market' | 'limit'
  quantity: number
  limitPrice?: number
}): Promise<void> {
  const state = useTradingStore.getState()
  if (state.mockOrderInFlightId != null) return Promise.resolve()

  const spec = getSymbolSpec(state.symbol)
  const rawQty = Number(input.quantity)
  const qty = roundToLotSize(rawQty, spec.lotSize)
  if (!Number.isFinite(qty) || qty <= 0) return Promise.resolve()

  const rawExec =
    input.orderType === 'market' || input.limitPrice == null
      ? state.lastPrice
      : input.limitPrice

  if (!Number.isFinite(rawExec) || rawExec <= 0) return Promise.resolve()

  const execPrice = roundToTickSize(rawExec, spec.tickSize)
  const limitStored =
    input.orderType === 'limit' ? roundToTickSize(Number(input.limitPrice ?? rawExec), spec.tickSize) : null

  const id = `o-${Date.now()}`
  const time = new Date().toLocaleTimeString('ko-KR', { hour12: false })

  const baseOrder: OrderRecordRow = {
    id,
    symbol: state.symbol,
    side: input.side,
    type: input.orderType,
    price: input.orderType === 'limit' ? limitStored : null,
    quantity: qty,
    status: 'submitting',
    time,
  }

  state.setMockOrderInFlight(id)
  state.upsertOrder(baseOrder)

  return new Promise((resolve) => {
    window.setTimeout(() => {
      useTradingStore.getState().upsertOrder({ ...baseOrder, status: 'accepted' })
      window.setTimeout(() => {
        const st = useTradingStore.getState()
        const fillTime = new Date().toLocaleTimeString('ko-KR', { hour12: false })
        const fill: TradeFillRow = {
          id: `f-${id}`,
          symbol: baseOrder.symbol,
          side: input.side,
          price: execPrice,
          quantity: qty,
          time: fillTime,
        }
        st.upsertOrder({
          ...baseOrder,
          status: 'filled',
          price: input.orderType === 'limit' ? limitStored : null,
        })
        st.pushFill(fill)
        st.setMockOrderInFlight(null)
        resolve()
      }, MOCK_DELAY_ACCEPT_MS)
    }, MOCK_DELAY_SUBMIT_MS)
  })
}
