import type { OrderBookRowDensityId } from '../../config/orderBookStyle'

export type TgxOrderBookTokens = {
  askPriceClass: string
  bidPriceClass: string
  askDepthRgb: string
  bidDepthRgb: string
  rowHeightClass: string
  rowFontClass: string
  headerFontClass: string
  qtyBarRgb: string
}

const TGX_BASE: TgxOrderBookTokens = {
  askPriceClass: 'text-rose-300 font-semibold',
  bidPriceClass: 'text-emerald-300 font-semibold',
  askDepthRgb: '251, 113, 133',
  bidDepthRgb: '74, 222, 128',
  rowHeightClass: 'h-[17px] min-h-[16px]',
  rowFontClass: 'text-[10px] leading-none tabular-nums tracking-tight',
  headerFontClass: 'text-[9px] font-semibold uppercase tracking-wide text-zinc-500',
  qtyBarRgb: '139, 92, 246',
}

export function tgxOrderBookTokens(density: OrderBookRowDensityId): TgxOrderBookTokens {
  if (density === 'dense') {
    return {
      ...TGX_BASE,
      rowHeightClass: 'h-[15px] min-h-[14px]',
      rowFontClass: 'text-[9px] leading-none tabular-nums tracking-tight',
      headerFontClass: 'text-[8px] font-semibold uppercase tracking-wide text-zinc-500',
    }
  }
  return TGX_BASE
}
