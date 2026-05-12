import type { StateCreator } from 'zustand'
import { speedOrderToast } from '../../feedback/speedOrderToast'
import type { ConditionalOrderKind, ConditionalOrderRow, OrderSide } from '../../types/trading'
import { getSymbolSpec } from '../../symbols/registry'
import { roundPriceBySpec, roundQtyBySpec } from '../../utils/specInstrument'
import { safeArray } from '../../utils/safe'
import type { TradingStore } from '../tradingStoreTypes'

export const createConditionalOrderSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    'conditionalOrders' | 'registerConditionalOrder' | 'cancelConditionalOrder'
  >
> = (set, get) => ({
  conditionalOrders: [],

  registerConditionalOrder: (input: {
    kind: ConditionalOrderKind
    side: OrderSide
    triggerPrice: number
    quantity: number
  }) => {
    const sym = get().symbol
    const spec = getSymbolSpec(sym)
    const tp = roundPriceBySpec(spec, Number(input.triggerPrice))
    const qty = roundQtyBySpec(spec, Number(input.quantity))
    if (!Number.isFinite(tp) || tp <= 0 || !Number.isFinite(qty) || qty <= 0) return

    const ts = Date.now()
    const time = new Date(ts).toLocaleTimeString('ko-KR', { hour12: false })
    const row: ConditionalOrderRow = {
      id: `co-${ts}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: sym,
      kind: input.kind,
      side: input.side,
      triggerPrice: tp,
      quantity: qty,
      status: 'pending',
      time,
      createdAt: ts,
    }

    set((s) => ({
      conditionalOrders: [row, ...safeArray(s.conditionalOrders)].slice(0, 100),
    }))

    if (input.kind === 'MIT') {
      speedOrderToast(`MIT ${input.side === 'buy' ? 'BUY' : 'SELL'} 등록`)
    } else {
      speedOrderToast('STOP LOSS 등록')
    }
  },

  cancelConditionalOrder: (id) =>
    set((s) => ({
      conditionalOrders: safeArray(s.conditionalOrders).map((c) =>
        c.id === id && c.status === 'pending' ? { ...c, status: 'canceled' as const } : c,
      ),
    })),
})
