import type { SymbolSpec } from '../../types/symbol'
import { roundPriceBySpec } from '../../utils/specInstrument'
import type { OrderSide } from '../../types/trading'

export type OrderBookPriceIntentSetters = {
  setOrderBookPendingLimitPrice: (price: number | null) => void
  setOrderBookPendingTriggerPrice: (price: number | null) => void
  setOrderBookPendingTriggerBookSide: (side: 'bid' | 'ask' | null) => void
  setOrderBookHighlightPrice: (price: number | null) => void
}

/** 호가 클릭 → limit/trigger intent (원클릭 주문 없음). */
export function applyOrderBookPriceIntent(
  setters: OrderBookPriceIntentSetters,
  spec: SymbolSpec,
  rawPrice: number,
  side: 'ask' | 'bid',
  current?: {
    orderBookPendingLimitPrice: number | null
    orderBookPendingTriggerPrice: number | null
    orderBookPendingTriggerBookSide: 'bid' | 'ask' | null
    orderBookHighlightPrice: number | null
  },
): number {
  const p = roundPriceBySpec(spec, rawPrice)
  if (current?.orderBookPendingLimitPrice !== p) setters.setOrderBookPendingLimitPrice(p)
  if (current?.orderBookPendingTriggerPrice !== p) setters.setOrderBookPendingTriggerPrice(p)
  if (current?.orderBookPendingTriggerBookSide !== side) {
    setters.setOrderBookPendingTriggerBookSide(side)
  }
  if (current?.orderBookHighlightPrice !== p) setters.setOrderBookHighlightPrice(p)
  return p
}

export function orderBookSideToOrderSide(side: 'ask' | 'bid'): OrderSide {
  return side === 'ask' ? 'buy' : 'sell'
}

export function isPriceNearTick(
  a: number,
  b: number,
  tickSize: number,
): boolean {
  return Math.abs(a - b) < tickSize * 0.51
}
