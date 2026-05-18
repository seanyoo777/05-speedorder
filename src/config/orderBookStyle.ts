/** 호가 UI 스타일 — legacy OrderBookPanel vs TGX-style (02-TGX-CEX 참고). */

export type OrderBookStyleId = 'legacy' | 'tgx_style'

export type OrderBookRowDensityId = 'compact' | 'dense'

export const ORDER_BOOK_STYLE_LS_KEY = '05-speedorder:orderbook:style'
export const ORDER_BOOK_ROW_DENSITY_LS_KEY = '05-speedorder:orderbook:row-density'

export function parseOrderBookStyleId(raw: string | null): OrderBookStyleId {
  return raw === 'legacy' || raw === 'tgx_style' ? raw : 'tgx_style'
}

export function parseOrderBookRowDensityId(raw: string | null): OrderBookRowDensityId {
  return raw === 'compact' || raw === 'dense' ? raw : 'dense'
}

export function readOrderBookStyleFromLs(): OrderBookStyleId {
  try {
    return parseOrderBookStyleId(localStorage.getItem(ORDER_BOOK_STYLE_LS_KEY))
  } catch {
    return 'tgx_style'
  }
}

export function readOrderBookRowDensityFromLs(): OrderBookRowDensityId {
  try {
    return parseOrderBookRowDensityId(localStorage.getItem(ORDER_BOOK_ROW_DENSITY_LS_KEY))
  } catch {
    return 'dense'
  }
}

export function resolveEffectiveOrderBookStyle(
  style: OrderBookStyleId,
  tgxOrderBookEnabled: boolean,
): OrderBookStyleId {
  if (!tgxOrderBookEnabled) return 'legacy'
  return style
}

export function displayRowCountForDensity(density: OrderBookRowDensityId): number {
  return density === 'dense' ? 12 : 10
}
