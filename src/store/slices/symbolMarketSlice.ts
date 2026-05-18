import type { StateCreator } from 'zustand'
import { mergeRiskSnapshotWithPositions } from '../../domain/risk'
import { runConditionalOrdersOnTick } from '../../engine/conditionalOrderRunner'
import { revaluePositions } from '../../engine/mockExecutionEngine'
import { safeArray } from '../../utils/safe'
import { bootLast, bootOrderBook, bootSpec, initialTickers } from '../boot'
import type { TradingStore } from '../tradingStoreTypes'
import { getSymbolSpec } from '../../symbols/registry'
import { buildOrderBook } from '../../mock/mockData'

export const createSymbolMarketSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'symbol'
    | 'lastPrice'
    | 'orderBook'
    | 'tickers'
    | 'setSymbol'
    | 'applyOrderBook'
    | 'applyLastPrice'
    | 'applyTickers'
    | 'patchTicker'
    | 'applyMockTick'
  >
> = (set, get) => ({
  symbol: bootSpec.symbol,
  lastPrice: bootLast,
  orderBook: bootOrderBook,
  tickers: initialTickers,

  setSymbol: (symbol) => {
    const spec = getSymbolSpec(symbol)
    const sym = spec.symbol
    const row = get().tickers.find((t) => t.symbol === sym)
    const lpRaw = row?.price ?? spec.referencePrice
    const lastPrice = Number.isFinite(lpRaw) && lpRaw > 0 ? lpRaw : spec.referencePrice
    set((s) => {
      const positions = revaluePositions(safeArray(s.positions), safeArray(s.tickers), sym, lastPrice)
      return {
        symbol: sym,
        lastPrice,
        orderBook: buildOrderBook(lastPrice, spec),
        positions,
        riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
      }
    })
    get().resetStopMitDraftForSymbol(sym)
  },

  applyOrderBook: (orderBook) =>
    set({
      orderBook: {
        bids: safeArray(orderBook?.bids),
        asks: safeArray(orderBook?.asks),
      },
    }),

  applyLastPrice: (price) => {
    if (!Number.isFinite(price) || price <= 0) return
    set((s) => {
      const prevLp = s.lastPrice
      const tickersArr = safeArray(s.tickers)
      let positions = revaluePositions(safeArray(s.positions), tickersArr, s.symbol, price)
      const out = runConditionalOrdersOnTick(
        {
          symbol: s.symbol,
          positions,
          fills: s.fills,
          orders: s.orders,
          conditionalOrders: s.conditionalOrders,
          tickers: tickersArr,
          riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
          cryptoPositionMode: s.cryptoPositionMode,
        },
        prevLp,
        price,
      )
      positions = revaluePositions(out.positions, tickersArr, s.symbol, price)
      return {
        lastPrice: price,
        positions,
        fills: out.fills,
        orders: out.orders,
        conditionalOrders: out.conditionalOrders,
        riskSnapshot: mergeRiskSnapshotWithPositions(positions, out.riskSnapshot),
      }
    })
  },

  applyTickers: (tickers) =>
    set((s) => {
      const tickersArr = safeArray(tickers)
      const positions = revaluePositions(safeArray(s.positions), tickersArr, s.symbol, s.lastPrice)
      return {
        tickers: tickersArr,
        positions,
        riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
      }
    }),

  patchTicker: (id, patch) =>
    set((s) => {
      const tickers = s.tickers.map((t) => (t.id === id ? { ...t, ...patch } : t))
      const positions = revaluePositions(safeArray(s.positions), tickers, s.symbol, s.lastPrice)
      return {
        tickers,
        positions,
        riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
      }
    }),

  applyMockTick: ({ lastPrice, orderBook, tickers }) => {
    if (!Number.isFinite(lastPrice) || lastPrice <= 0) return
    const tickersArr = safeArray(tickers)
    set((s) => {
      const prevLp = s.lastPrice
      let positions = revaluePositions(safeArray(s.positions), tickersArr, s.symbol, lastPrice)
      const out = runConditionalOrdersOnTick(
        {
          symbol: s.symbol,
          positions,
          fills: s.fills,
          orders: s.orders,
          conditionalOrders: s.conditionalOrders,
          tickers: tickersArr,
          riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
          cryptoPositionMode: s.cryptoPositionMode,
        },
        prevLp,
        lastPrice,
      )
      positions = revaluePositions(out.positions, tickersArr, s.symbol, lastPrice)
      return {
        lastPrice,
        orderBook: {
          bids: safeArray(orderBook?.bids),
          asks: safeArray(orderBook?.asks),
        },
        tickers: tickersArr,
        positions,
        fills: out.fills,
        orders: out.orders,
        conditionalOrders: out.conditionalOrders,
        riskSnapshot: mergeRiskSnapshotWithPositions(positions, out.riskSnapshot),
      }
    })
  },
})
