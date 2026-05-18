import type { StateCreator } from 'zustand'
import {
  UI_COMPACT_MODE_LS_KEY,
  UI_CRYPTO_POSITION_MODE_LS_KEY,
  UI_DOM_WIDTH_LS_KEY,
  UI_FONT_SCALE_LS_KEY,
  UI_ORDERBOOK_FONT_SCALE_LS_KEY,
  readCompactModeFromLs,
  readCryptoPositionModeFromLs,
  readDomWidthFromLs,
  readFontScaleFromLs,
  readOrderBookFontScaleFromLs,
} from '../../config/speedOrderUiSettings'
import type { TradingStore } from '../tradingStoreTypes'

export const createUiPrefsSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'uiFontScale'
    | 'uiOrderBookFontScale'
    | 'uiCompactMode'
    | 'uiDomWidthPx'
    | 'setUiFontScale'
    | 'setUiOrderBookFontScale'
    | 'setUiCompactMode'
    | 'setUiDomWidthPx'
    | 'cryptoPositionMode'
    | 'setCryptoPositionMode'
  >
> = (set) => ({
  uiFontScale: readFontScaleFromLs(),
  uiOrderBookFontScale: readOrderBookFontScaleFromLs(),
  uiCompactMode: readCompactModeFromLs(),
  uiDomWidthPx: readDomWidthFromLs(),
  cryptoPositionMode: readCryptoPositionModeFromLs(),

  setUiFontScale: (uiFontScale) => {
    const v = Number(uiFontScale)
    const n = Number.isFinite(v) ? Math.min(1.25, Math.max(0.8, v)) : 1
    try {
      localStorage.setItem(UI_FONT_SCALE_LS_KEY, String(n))
    } catch {
      /* ignore */
    }
    set({ uiFontScale: n })
  },

  setUiOrderBookFontScale: (uiOrderBookFontScale) => {
    const v = Number(uiOrderBookFontScale)
    const n = Number.isFinite(v) ? Math.min(1.25, Math.max(0.8, v)) : 1
    try {
      localStorage.setItem(UI_ORDERBOOK_FONT_SCALE_LS_KEY, String(n))
    } catch {
      /* ignore */
    }
    set({ uiOrderBookFontScale: n })
  },

  setUiCompactMode: (uiCompactMode) => {
    try {
      localStorage.setItem(UI_COMPACT_MODE_LS_KEY, uiCompactMode ? '1' : '0')
    } catch {
      /* ignore */
    }
    set({ uiCompactMode })
  },

  setUiDomWidthPx: (uiDomWidthPx) => {
    try {
      if (uiDomWidthPx == null) localStorage.removeItem(UI_DOM_WIDTH_LS_KEY)
      else localStorage.setItem(UI_DOM_WIDTH_LS_KEY, String(Math.round(uiDomWidthPx)))
    } catch {
      /* ignore */
    }
    set({ uiDomWidthPx: uiDomWidthPx == null ? null : Math.round(uiDomWidthPx) })
  },

  setCryptoPositionMode: (cryptoPositionMode) => {
    const m = cryptoPositionMode === 'hedge' ? 'hedge' : 'one_way'
    try {
      localStorage.setItem(UI_CRYPTO_POSITION_MODE_LS_KEY, m)
    } catch {
      /* ignore */
    }
    set({ cryptoPositionMode: m })
  },
})
