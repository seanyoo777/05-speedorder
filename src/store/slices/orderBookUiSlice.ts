import type { StateCreator } from 'zustand'
import {
  ORDER_BOOK_INVERT_LS_KEY,
  ORDER_BOOK_PRESET_LS_KEY,
  readOrderBookInvertFromLs,
  readOrderBookPresetFromLs,
} from '../../config/orderBookDesignPresets'
import type { OrderBookDesignPresetId } from '../../config/orderBookDesignPresets'
import type { OrderSide } from '../../types/trading'
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
    | 'orderBookPendingTriggerPrice'
    | 'orderBookPendingTriggerBookSide'
    | 'orderBookHighlightPrice'
    | 'orderBookDesignPreset'
    | 'orderBookColorInvert'
    | 'setOrderBookOrderQty'
    | 'setOrderBookOneClickEnabled'
    | 'setOrderBookDoubleClickEnabled'
    | 'setOrderBookPendingLimitPrice'
    | 'clearOrderBookPendingLimitPrice'
    | 'setOrderBookPendingTriggerPrice'
    | 'setOrderBookPendingTriggerBookSide'
    | 'clearOrderBookPendingTriggerPrice'
    | 'setOrderBookHighlightPrice'
    | 'setOrderBookDesignPreset'
    | 'setOrderBookColorInvert'
    | 'pendingBookOrderConfirm'
    | 'setPendingBookOrderConfirm'
  >
> = (set) => ({
  orderBookOrderQty: DEFAULT_BOOK_QTY,
  orderBookOneClickEnabled: false,
  orderBookDoubleClickEnabled: false,
  orderBookPendingLimitPrice: null as number | null,
  orderBookPendingTriggerPrice: null as number | null,
  orderBookPendingTriggerBookSide: null as 'bid' | 'ask' | null,
  orderBookHighlightPrice: null as number | null,
  orderBookDesignPreset: readOrderBookPresetFromLs(),
  orderBookColorInvert: readOrderBookInvertFromLs(),
  pendingBookOrderConfirm: null as null | {
    id: string
    side: OrderSide
    rowPrice: number
    quantity: number
  },

  setOrderBookOrderQty: (orderBookOrderQty) =>
    set(() => ({
      orderBookOrderQty: Number.isFinite(orderBookOrderQty) && orderBookOrderQty > 0 ? orderBookOrderQty : DEFAULT_BOOK_QTY,
    })),

  setOrderBookOneClickEnabled: (orderBookOneClickEnabled) => set({ orderBookOneClickEnabled }),

  setOrderBookDoubleClickEnabled: (orderBookDoubleClickEnabled) => set({ orderBookDoubleClickEnabled }),

  setOrderBookPendingLimitPrice: (orderBookPendingLimitPrice) => set({ orderBookPendingLimitPrice }),

  clearOrderBookPendingLimitPrice: () => set({ orderBookPendingLimitPrice: null }),

  setOrderBookPendingTriggerPrice: (orderBookPendingTriggerPrice) => set({ orderBookPendingTriggerPrice }),

  setOrderBookPendingTriggerBookSide: (orderBookPendingTriggerBookSide) =>
    set({ orderBookPendingTriggerBookSide }),

  clearOrderBookPendingTriggerPrice: () =>
    set({ orderBookPendingTriggerPrice: null, orderBookPendingTriggerBookSide: null }),

  setOrderBookHighlightPrice: (orderBookHighlightPrice) => set({ orderBookHighlightPrice }),

  setOrderBookDesignPreset: (id: OrderBookDesignPresetId) => {
    try {
      localStorage.setItem(ORDER_BOOK_PRESET_LS_KEY, id)
    } catch {
      /* ignore */
    }
    set({ orderBookDesignPreset: id })
  },

  setOrderBookColorInvert: (v: boolean) => {
    try {
      localStorage.setItem(ORDER_BOOK_INVERT_LS_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
    set({ orderBookColorInvert: v })
  },

  setPendingBookOrderConfirm: (pendingBookOrderConfirm) => set({ pendingBookOrderConfirm }),
})
