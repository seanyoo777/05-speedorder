import type { StateCreator } from 'zustand'
import {
  applyStopMitDraftPatch,
  createEmptyStopMitDraft,
  type StopMitDraft,
  type StopMitDraftPatch,
} from '../../domain/stopMitDraft'
import { getSymbolSpec } from '../../symbols/registry'
import { roundPriceBySpec } from '../../utils/specInstrument'
import { bootSpec } from '../boot'
import type { TradingStore } from '../tradingStoreTypes'

export const createStopMitDraftSlice: StateCreator<
  TradingStore,
  [],
  [],
  Pick<
    TradingStore,
    | 'stopMitDraft'
    | 'patchStopMitDraft'
    | 'consumeOrderBookPendingTrigger'
    | 'resetStopMitDraftForSymbol'
  >
> = (set, get) => ({
  stopMitDraft: createEmptyStopMitDraft(bootSpec.symbol, 0.05),

  patchStopMitDraft: (patch: StopMitDraftPatch) => {
    const sym = get().symbol
    const spec = getSymbolSpec(sym)
    const roundPrice = (p: number) => roundPriceBySpec(spec, p)
    set((s) => {
      const base = s.stopMitDraft.symbol === sym ? s.stopMitDraft : createEmptyStopMitDraft(sym, s.stopMitDraft.quantity ?? 0.05)
      const next = applyStopMitDraftPatch({ ...base, symbol: sym }, patch, roundPrice)
      return { stopMitDraft: next }
    })
  },

  consumeOrderBookPendingTrigger: () => {
    const price = get().orderBookPendingTriggerPrice
    if (price == null || !Number.isFinite(price) || price <= 0) return false
    const bookSide = get().orderBookPendingTriggerBookSide ?? 'bid'
    get().patchStopMitDraft({ op: 'lockFromBook', price, bookSide })
    set({
      orderBookPendingTriggerPrice: null,
      orderBookPendingTriggerBookSide: null,
    })
    return true
  },

  resetStopMitDraftForSymbol: (symbol: string) => {
    get().patchStopMitDraft({ op: 'resetForSymbol', symbol })
  },
})

export type { StopMitDraft, StopMitDraftPatch }
