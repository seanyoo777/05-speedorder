import type { StateCreator } from 'zustand'
import { estimateTradeFee, revaluePositions } from '../../engine/mockExecutionEngine'
import type { TradeFillRow } from '../../types/trading'
import { mergeRiskSnapshotWithPositions } from '../../domain/risk'
import { getSymbolSpec } from '../../symbols/registry'
import { calculatePnlBySpec, feeNotionalAbsBySpec } from '../../utils/specInstrument'
import { safeArray } from '../../utils/safe'
import { bootPositions } from '../boot'
import type { TradingStore } from '../tradingStoreTypes'

export const createPositionSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<TradingStore, 'positions' | 'setPositions' | 'closePositionDemo'>
> = (set) => ({
  positions: bootPositions,

  setPositions: (rows) =>
    set((s) => {
      const positions = safeArray(rows)
      return {
        positions,
        riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
      }
    }),

  closePositionDemo: (id) =>
    set((s) => {
      const pos = safeArray(s.positions).find((p) => p.id === id)
      if (!pos) return {}
      const tPrice = s.tickers.find((t) => t.symbol === pos.symbol)?.price
      const markRaw =
        (Number.isFinite(tPrice) ? tPrice : undefined) ??
        (pos.symbol === s.symbol && Number.isFinite(s.lastPrice) ? s.lastPrice : undefined) ??
        pos.avgPrice
      const mark = Number.isFinite(markRaw) && markRaw > 0 ? markRaw : pos.avgPrice
      const spec = getSymbolSpec(pos.symbol)
      const qty = pos.size
      if (!Number.isFinite(qty) || qty <= 0) return {}
      const gross = calculatePnlBySpec(spec, {
        op: 'close_gross',
        positionSide: pos.side,
        avgPrice: pos.avgPrice,
        closePrice: mark,
        closeQty: qty,
      })
      const fee = estimateTradeFee(feeNotionalAbsBySpec(spec, mark, qty))
      const net = Number.isFinite(gross) ? gross - fee : -fee
      const ts = Date.now()
      const fill: TradeFillRow = {
        id: `f-close-${id}-${ts}`,
        symbol: pos.symbol,
        side: pos.side === 'long' ? 'sell' : 'buy',
        price: mark,
        quantity: qty,
        fee,
        realizedPnl: net,
        time: new Date(ts).toLocaleTimeString('ko-KR', { hour12: false }),
        timestamp: ts,
      }
      const next = s.positions.filter((p) => p.id !== id)
      const positions = revaluePositions(next, s.tickers, s.symbol, s.lastPrice)
      return {
        positions,
        fills: [fill, ...safeArray(s.fills)].slice(0, 200),
        riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
      }
    }),
})
