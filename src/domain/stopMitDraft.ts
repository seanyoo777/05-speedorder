import type { ConditionalOrderKind, OrderSide } from '../types/trading'

export type PriceLockSource = 'none' | 'orderbook' | 'manual'

export type PriceLockState = {
  locked: boolean
  price: number | null
  source: PriceLockSource
  lockedAt: number | null
  bookSide?: 'bid' | 'ask'
}

export type StopMitDraft = {
  symbol: string
  kind: ConditionalOrderKind
  side: OrderSide
  triggerPrice: number | null
  quantity: number | null
  priceLock: PriceLockState
}

export type StopMitDraftPatch =
  | { op: 'lockFromBook'; price: number; bookSide: 'bid' | 'ask' }
  | { op: 'unlock' }
  | { op: 'setManualPrice'; price: number }
  | { op: 'setKind'; kind: ConditionalOrderKind }
  | { op: 'setSide'; side: OrderSide }
  | { op: 'setQuantity'; quantity: number }
  | { op: 'resetForSymbol'; symbol: string }

const EMPTY_LOCK: PriceLockState = {
  locked: false,
  price: null,
  source: 'none',
  lockedAt: null,
}

export function createEmptyStopMitDraft(symbol: string, quantity = 0.05): StopMitDraft {
  return {
    symbol,
    kind: 'MIT',
    side: 'buy',
    triggerPrice: null,
    quantity,
    priceLock: { ...EMPTY_LOCK },
  }
}

export function applyStopMitDraftPatch(
  draft: StopMitDraft,
  patch: StopMitDraftPatch,
  roundPrice: (price: number) => number,
): StopMitDraft {
  switch (patch.op) {
    case 'lockFromBook': {
      const rp = roundPrice(patch.price)
      if (!Number.isFinite(rp) || rp <= 0) return draft
      return {
        ...draft,
        triggerPrice: rp,
        priceLock: {
          locked: true,
          price: rp,
          source: 'orderbook',
          lockedAt: Date.now(),
          bookSide: patch.bookSide,
        },
      }
    }
    case 'unlock':
      return {
        ...draft,
        triggerPrice: null,
        priceLock: { ...EMPTY_LOCK },
      }
    case 'setManualPrice': {
      const rp = roundPrice(patch.price)
      if (!Number.isFinite(rp) || rp <= 0) return draft
      return {
        ...draft,
        triggerPrice: rp,
        priceLock: {
          locked: true,
          price: rp,
          source: 'manual',
          lockedAt: draft.priceLock.lockedAt ?? Date.now(),
          bookSide: draft.priceLock.bookSide,
        },
      }
    }
    case 'setKind':
      return { ...draft, kind: patch.kind }
    case 'setSide':
      return { ...draft, side: patch.side }
    case 'setQuantity': {
      const q = patch.quantity
      if (!Number.isFinite(q) || q <= 0) return draft
      return { ...draft, quantity: q }
    }
    case 'resetForSymbol': {
      const next = createEmptyStopMitDraft(patch.symbol, draft.quantity ?? 0.05)
      return { ...next, kind: draft.kind, side: draft.side }
    }
    default:
      return draft
  }
}
