import type { StateCreator } from 'zustand'
import type { TradingStore } from '../tradingStoreTypes'

const DEFAULT_BOOK_QTY = 0.05

export const createOrderBookUiSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'orderBookOrderQty'
    | 'orderBookOneClickEnabled'
    | 'orderBookDoubleClickEnabled'
    | 'orderBookPendingLimitPrice'
    | 'setOrderBookOrderQty'
    | 'setOrderBookOneClickEnabled'
    | 'setOrderBookDoubleClickEnabled'
    | 'setOrderBookPendingLimitPrice'
    | 'clearOrderBookPendingLimitPrice'
  >
> = (set) => ({
  orderBookOrderQty: DEFAULT_BOOK_QTY,
  orderBookOneClickEnabled: false,
  orderBookDoubleClickEnabled: false,
  orderBookPendingLimitPrice: null as number | null,

  setOrderBookOrderQty: (orderBookOrderQty) =>
    set(() => ({
      orderBookOrderQty: Number.isFinite(orderBookOrderQty) && orderBookOrderQty > 0 ? orderBookOrderQty : DEFAULT_BOOK_QTY,
    })),

  setOrderBookOneClickEnabled: (orderBookOneClickEnabled) => set({ orderBookOneClickEnabled }),

  setOrderBookDoubleClickEnabled: (orderBookDoubleClickEnabled) => set({ orderBookDoubleClickEnabled }),

  setOrderBookPendingLimitPrice: (orderBookPendingLimitPrice) => set({ orderBookPendingLimitPrice }),

  clearOrderBookPendingLimitPrice: () => set({ orderBookPendingLimitPrice: null }),
})
