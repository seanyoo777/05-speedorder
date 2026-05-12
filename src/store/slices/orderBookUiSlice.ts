import type { StateCreator } from 'zustand'
import {
  ORDER_BOOK_INVERT_LS_KEY,
  ORDER_BOOK_PRESET_LS_KEY,
  readOrderBookInvertFromLs,
  readOrderBookPresetFromLs,
} from '../../config/orderBookDesignPresets'
import type { OrderBookDesignPresetId } from '../../config/orderBookDesignPresets'
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
    | 'orderBookHighlightPrice'
    | 'orderBookDesignPreset'
    | 'orderBookColorInvert'
    | 'setOrderBookOrderQty'
    | 'setOrderBookOneClickEnabled'
    | 'setOrderBookDoubleClickEnabled'
    | 'setOrderBookPendingLimitPrice'
    | 'clearOrderBookPendingLimitPrice'
    | 'setOrderBookHighlightPrice'
    | 'setOrderBookDesignPreset'
    | 'setOrderBookColorInvert'
  >
> = (set) => ({
  orderBookOrderQty: DEFAULT_BOOK_QTY,
  orderBookOneClickEnabled: false,
  orderBookDoubleClickEnabled: false,
  orderBookPendingLimitPrice: null as number | null,
  orderBookHighlightPrice: null as number | null,
  orderBookDesignPreset: readOrderBookPresetFromLs(),
  orderBookColorInvert: readOrderBookInvertFromLs(),

  setOrderBookOrderQty: (orderBookOrderQty) =>
    set(() => ({
      orderBookOrderQty: Number.isFinite(orderBookOrderQty) && orderBookOrderQty > 0 ? orderBookOrderQty : DEFAULT_BOOK_QTY,
    })),

  setOrderBookOneClickEnabled: (orderBookOneClickEnabled) => set({ orderBookOneClickEnabled }),

  setOrderBookDoubleClickEnabled: (orderBookDoubleClickEnabled) => set({ orderBookDoubleClickEnabled }),

  setOrderBookPendingLimitPrice: (orderBookPendingLimitPrice) => set({ orderBookPendingLimitPrice }),

  clearOrderBookPendingLimitPrice: () => set({ orderBookPendingLimitPrice: null }),

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
})
