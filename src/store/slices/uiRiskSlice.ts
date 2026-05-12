import type { StateCreator } from 'zustand'
import { DEFAULT_RISK_SNAPSHOT } from '../../domain/risk'
import type { TradingStore } from '../tradingStoreTypes'

export const createUiRiskSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'beginnerMode'
    | 'confirmOrders'
    | 'riskSnapshot'
    | 'setBeginnerMode'
    | 'setConfirmOrders'
    | 'setRiskSnapshot'
  >
> = (set) => ({
  beginnerMode: false,
  confirmOrders: true,
  riskSnapshot: DEFAULT_RISK_SNAPSHOT,

  setBeginnerMode: (beginnerMode) => set({ beginnerMode }),

  setConfirmOrders: (confirmOrders) => set({ confirmOrders }),

  setRiskSnapshot: (riskSnapshot) =>
    set((s) => ({
      riskSnapshot: {
        ...riskSnapshot,
        freeUsdt: Number.isFinite(riskSnapshot.freeUsdt)
          ? riskSnapshot.freeUsdt
          : s.riskSnapshot.freeUsdt,
        usedMarginUsdt: Number.isFinite(riskSnapshot.usedMarginUsdt)
          ? riskSnapshot.usedMarginUsdt
          : 0,
      },
    })),
})
