import type { StateCreator } from 'zustand'
import type { SpeedOrderActionKind, SpeedOrderActionLogEntry } from '../../types/trading'
import { safeArray } from '../../utils/safe'
import type { TradingStore } from '../tradingStoreTypes'

const MAX = 5

function nextId() {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const createOrderActionLogSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<TradingStore, 'orderActionLog' | 'pushOrderActionLog'>
> = (set) => ({
  orderActionLog: [],

  pushOrderActionLog: (partial: { kind: SpeedOrderActionKind; text: string; id?: string }) =>
    set((s) => {
      const row: SpeedOrderActionLogEntry = {
        id: partial.id ?? nextId(),
        at: Date.now(),
        kind: partial.kind,
        text: partial.text,
      }
      return { orderActionLog: [row, ...safeArray(s.orderActionLog)].slice(0, MAX) }
    }),
})
