import type { StateCreator } from 'zustand'
import {
  buildBatchPositionCloseIntent,
  buildPositionCloseIntent,
  formatCloseIntentSummary,
  resolveCloseReferencePrice,
  type CloseOrderType,
  type PositionCloseIntent,
} from '../../domain/positionCloseIntent'
import { appendSelfTestAudit } from '../../selftest/auditTrail'
import { getSymbolSpec } from '../../symbols/registry'
import type { PositionRow } from '../../types/trading'
import type { TradingStore } from '../tradingStoreTypes'

export const createPositionCloseSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'positionCloseIntent'
    | 'positionCloseSelectedIds'
    | 'positionCloseConfirmOpen'
    | 'positionCloseOrderType'
    | 'setPositionCloseOrderType'
    | 'togglePositionCloseSelected'
    | 'setPositionCloseSelected'
    | 'clearPositionCloseSelection'
    | 'stagePositionCloseIntent'
    | 'stageBatchPositionCloseIntent'
    | 'setPositionCloseIntentQty'
    | 'clearPositionCloseIntent'
    | 'setPositionCloseConfirmOpen'
    | 'confirmPositionCloseIntent'
  >
> = (set, get) => ({
  positionCloseIntent: null as PositionCloseIntent | null,
  positionCloseSelectedIds: [] as string[],
  positionCloseConfirmOpen: false,
  positionCloseOrderType: 'market' as CloseOrderType,

  setPositionCloseOrderType: (positionCloseOrderType) => set({ positionCloseOrderType }),

  togglePositionCloseSelected: (id) =>
    set((s) => {
      const has = s.positionCloseSelectedIds.includes(id)
      return {
        positionCloseSelectedIds: has
          ? s.positionCloseSelectedIds.filter((x) => x !== id)
          : [...s.positionCloseSelectedIds, id],
      }
    }),

  setPositionCloseSelected: (ids) => set({ positionCloseSelectedIds: [...ids] }),

  clearPositionCloseSelection: () => set({ positionCloseSelectedIds: [] }),

  stagePositionCloseIntent: (positionId, ratio) => {
    const s = get()
    const pos = s.positions.find((p) => p.id === positionId && p.size > 0)
    if (!pos) return
    const spec = getSymbolSpec(pos.symbol)
    const orderType = s.positionCloseOrderType
    const referencePrice = resolveCloseReferencePrice(pos.symbol, {
      symbol: s.symbol,
      lastPrice: s.lastPrice,
      tickers: s.tickers,
      orderBookPendingLimitPrice: s.orderBookPendingLimitPrice,
      orderType,
    })
    const ref = referencePrice > 0 ? referencePrice : pos.avgPrice
    const intent = buildPositionCloseIntent({
      position: pos,
      ratio,
      orderType,
      referencePrice: ref,
      lotSize: spec.lotSize,
    })
    get().pushOrderActionLog({
      kind: 'close_intent',
      text: formatCloseIntentSummary(intent),
    })
    set({ positionCloseIntent: intent, positionCloseConfirmOpen: true })
  },

  stageBatchPositionCloseIntent: (mode, ratio) => {
    const s = get()
    const open = s.positions.filter((p) => p.size > 0)
    let subset: PositionRow[] = open
    if (mode === 'selected') {
      subset = open.filter((p) => s.positionCloseSelectedIds.includes(p.id))
    } else if (mode === 'long_only') {
      subset = open.filter((p) => p.side === 'long')
    } else if (mode === 'short_only') {
      subset = open.filter((p) => p.side === 'short')
    }
    const referencePrices: Record<string, number> = {}
    const lotSizes: Record<string, number> = {}
    for (const p of subset) {
      const spec = getSymbolSpec(p.symbol)
      lotSizes[p.symbol] = spec.lotSize
      const ref = resolveCloseReferencePrice(p.symbol, {
        symbol: s.symbol,
        lastPrice: s.lastPrice,
        tickers: s.tickers,
        orderBookPendingLimitPrice: s.orderBookPendingLimitPrice,
        orderType: s.positionCloseOrderType,
      })
      referencePrices[p.symbol] = ref > 0 ? ref : p.avgPrice
    }
    const intent = buildBatchPositionCloseIntent({
      positions: subset,
      ratio,
      orderType: s.positionCloseOrderType,
      referencePrices,
      lotSizes,
      batchMode: mode,
    })
    if (!intent) return
    get().pushOrderActionLog({
      kind: 'close_intent',
      text: formatCloseIntentSummary(intent),
    })
    set({ positionCloseIntent: intent, positionCloseConfirmOpen: true })
  },

  setPositionCloseIntentQty: (qty) =>
    set((s) => {
      const intent = s.positionCloseIntent
      if (!intent || !Number.isFinite(qty) || qty <= 0) return {}
      return { positionCloseIntent: { ...intent, qty } }
    }),

  clearPositionCloseIntent: () =>
    set({ positionCloseIntent: null, positionCloseConfirmOpen: false }),

  setPositionCloseConfirmOpen: (positionCloseConfirmOpen) => set({ positionCloseConfirmOpen }),

  confirmPositionCloseIntent: () => {
    const intent = get().positionCloseIntent
    if (!intent || intent.mockOnly !== true) return false
    const summary = formatCloseIntentSummary(intent)
    get().pushOrderActionLog({
      kind: 'close_confirm',
      text: `Mock close logged: ${summary}`,
    })
    appendSelfTestAudit({
      category: 'admin',
      message: summary,
      status: 'pass',
      meta: {
        mockOnly: true,
        ratio: intent.ratio,
        orderType: intent.orderType,
        positionCount: intent.positionIds.length,
      },
    })
    set({
      positionCloseIntent: null,
      positionCloseConfirmOpen: false,
      positionCloseSelectedIds: [],
    })
    return true
  },
})
