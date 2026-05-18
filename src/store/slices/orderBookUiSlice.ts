import type { StateCreator } from 'zustand'
import {
  ORDER_BOOK_INVERT_LS_KEY,
  ORDER_BOOK_PRESET_LS_KEY,
  readOrderBookInvertFromLs,
  readOrderBookPresetFromLs,
} from '../../config/orderBookDesignPresets'
import {
  ORDER_BOOK_ROW_DENSITY_LS_KEY,
  ORDER_BOOK_STYLE_LS_KEY,
  readOrderBookRowDensityFromLs,
  readOrderBookStyleFromLs,
  type OrderBookRowDensityId,
  type OrderBookStyleId,
} from '../../config/orderBookStyle'
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
    | 'orderBookStyle'
    | 'orderBookRowDensity'
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
    | 'setOrderBookStyle'
    | 'setOrderBookRowDensity'
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
  orderBookStyle: readOrderBookStyleFromLs(),
  orderBookRowDensity: readOrderBookRowDensityFromLs(),
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

  setOrderBookPendingLimitPrice: (orderBookPendingLimitPrice) =>
    set((s) =>
      s.orderBookPendingLimitPrice === orderBookPendingLimitPrice
        ? {}
        : { orderBookPendingLimitPrice },
    ),

  clearOrderBookPendingLimitPrice: () =>
    set((s) => (s.orderBookPendingLimitPrice == null ? {} : { orderBookPendingLimitPrice: null })),

  setOrderBookPendingTriggerPrice: (orderBookPendingTriggerPrice) =>
    set((s) =>
      s.orderBookPendingTriggerPrice === orderBookPendingTriggerPrice
        ? {}
        : { orderBookPendingTriggerPrice },
    ),

  setOrderBookPendingTriggerBookSide: (orderBookPendingTriggerBookSide) =>
    set((s) =>
      s.orderBookPendingTriggerBookSide === orderBookPendingTriggerBookSide
        ? {}
        : { orderBookPendingTriggerBookSide },
    ),

  clearOrderBookPendingTriggerPrice: () =>
    set((s) =>
      s.orderBookPendingTriggerPrice == null && s.orderBookPendingTriggerBookSide == null
        ? {}
        : { orderBookPendingTriggerPrice: null, orderBookPendingTriggerBookSide: null },
    ),

  setOrderBookHighlightPrice: (orderBookHighlightPrice) =>
    set((s) =>
      s.orderBookHighlightPrice === orderBookHighlightPrice ? {} : { orderBookHighlightPrice },
    ),

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

  setOrderBookStyle: (id: OrderBookStyleId) => {
    try {
      localStorage.setItem(ORDER_BOOK_STYLE_LS_KEY, id)
    } catch {
      /* ignore */
    }
    set({ orderBookStyle: id })
  },

  setOrderBookRowDensity: (id: OrderBookRowDensityId) => {
    try {
      localStorage.setItem(ORDER_BOOK_ROW_DENSITY_LS_KEY, id)
    } catch {
      /* ignore */
    }
    set({ orderBookRowDensity: id })
  },

  setPendingBookOrderConfirm: (pendingBookOrderConfirm) => set({ pendingBookOrderConfirm }),
})
