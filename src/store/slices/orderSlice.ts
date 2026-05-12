import type { StateCreator } from 'zustand'
import { safeArray } from '../../utils/safe'
import { initialFills, initialOrders } from '../boot'
import type { TradingStore } from '../tradingStoreTypes'

export const createOrderSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'fills'
    | 'orders'
    | 'mockOrderInFlightId'
    | 'pushFill'
    | 'upsertOrder'
    | 'cancelOrder'
    | 'setMockOrderInFlight'
  >
> = (set) => ({
  fills: initialFills,
  orders: initialOrders,
  mockOrderInFlightId: null,

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

  setMockOrderInFlight: (mockOrderInFlightId) => set({ mockOrderInFlightId }),
})
