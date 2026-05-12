/**
 * 호가창 디자인 프리셋 — UI 전용 (mock)
 * 기본 톤: TGX-CEX `SpeedOrderHtsPanel`과 동일 계열 (#070b12 / #0b1118 / #1f2937 + 보라 포인트).
 * `orderBookColorInvert` 시 매수/매도(비드·애스크) 색을 한국 HTS식으로 스왑.
 *
 * 향후 확장 예정: volume heatmap, 체결 속도, DOM ladder 심화, volume profile
 */

export const ORDER_BOOK_PRESET_LS_KEY = '05-speedorder:orderbook:preset'
export const ORDER_BOOK_INVERT_LS_KEY = '05-speedorder:orderbook:invert-colors'

export type OrderBookDesignPresetId =
  | 'korean_hts'
  | 'korean_hts_pro'
  | 'ultra_compact'
  | 'global_crypto'
  | 'high_contrast'
  | 'minimal_dark'

export type OrderBookPresetTag = 'compact' | 'pro'

/** 코인 거래소 DOM 기본: 매수측(비드) 차분 그린, 매도측(애스크) 차분 레드 */
const DOM_ROW_BORDER = 'border-[#1f2937]/30'
const DOM_CENTER =
  'rounded-[6px] border border-[#1f2937]/30 bg-[#0b1118] px-2 py-2.5 shadow-[inset_0_0_28px_-10px_rgba(139,92,246,0.14),inset_0_1px_0_0_rgba(139,92,246,0.06)] ring-1 ring-inset ring-violet-500/15'

export type OrderBookVisualTokens = {
  bidPriceClass: string
  askPriceClass: string
  bidDepthClass: string
  askDepthClass: string
  bidDepthRgb: string
  askDepthRgb: string
  rowHeightClass: string
  rowFontClass: string
  headerFontClass: string
  rowDivideClass: string
  borderClass: string
  centerBgClass: string
  centerMutedClass: string
  centerShellClass: string
  centerPriceFontClass: string
  centerMetaFontClass: string
  rowCellPaddingClass: string
  priceUpClass: string
  priceDownClass: string
  priceFlatClass: string
  tradeUpFlashClass: string
  tradeDownFlashClass: string
}

const KOREAN: OrderBookVisualTokens = {
  bidPriceClass: 'text-emerald-500/88',
  askPriceClass: 'text-rose-500/85',
  bidDepthClass: 'bg-emerald-600/10',
  askDepthClass: 'bg-rose-600/10',
  bidDepthRgb: '16, 185, 129',
  askDepthRgb: '225, 29, 72',
  rowHeightClass: 'h-[20px] min-h-[19px]',
  rowFontClass: 'text-[10px] sm:text-[11px] leading-none tabular-nums tracking-tight',
  headerFontClass: 'text-[9px] sm:text-[10px] tabular-nums text-zinc-500',
  rowDivideClass: 'divide-y divide-[#1f2937]/25',
  borderClass: DOM_ROW_BORDER,
  centerBgClass: 'bg-[#070b12]',
  centerMutedClass: 'text-zinc-500',
  centerShellClass: DOM_CENTER,
  centerPriceFontClass: 'text-[16px] sm:text-[18px] font-bold tabular-nums tracking-tight',
  centerMetaFontClass: 'text-[8px] sm:text-[9px] tabular-nums text-zinc-500',
  rowCellPaddingClass: 'px-1',
  priceUpClass: 'text-emerald-400/95',
  priceDownClass: 'text-rose-400/95',
  priceFlatClass: 'text-zinc-200',
  tradeUpFlashClass: 'bg-emerald-500/18',
  tradeDownFlashClass: 'bg-rose-500/18',
}

const KOREAN_PRO: OrderBookVisualTokens = {
  ...KOREAN,
  bidPriceClass: 'text-emerald-400/92',
  askPriceClass: 'text-rose-400/90',
  bidDepthRgb: '52, 211, 153',
  askDepthRgb: '244, 63, 94',
  rowHeightClass: 'h-[19px] min-h-[18px]',
  rowFontClass: 'text-[10px] leading-none tabular-nums tracking-tight font-medium',
  centerPriceFontClass: 'text-[17px] sm:text-[19px] font-bold tabular-nums tracking-tight',
  centerMetaFontClass: 'text-[8px] tabular-nums',
}

const ULTRA_COMPACT: OrderBookVisualTokens = {
  ...KOREAN,
  rowHeightClass: 'h-[17px] min-h-[16px]',
  rowFontClass: 'text-[9px] leading-none tabular-nums tracking-tight',
  headerFontClass: 'text-[8px] tabular-nums text-zinc-500',
  rowCellPaddingClass: 'px-0.5',
  centerPriceFontClass: 'text-[14px] sm:text-[15px] font-bold tabular-nums',
  centerMetaFontClass: 'text-[7px] tabular-nums',
  centerShellClass: `${DOM_CENTER} py-2`,
}

const GLOBAL_CRYPTO: OrderBookVisualTokens = {
  ...KOREAN,
  bidPriceClass: 'text-emerald-400/90',
  askPriceClass: 'text-rose-400/88',
  tradeUpFlashClass: 'bg-emerald-500/16',
  tradeDownFlashClass: 'bg-rose-500/16',
}

const HIGH_CONTRAST: OrderBookVisualTokens = {
  bidPriceClass: 'text-emerald-300',
  askPriceClass: 'text-rose-300',
  bidDepthClass: 'bg-emerald-500/14',
  askDepthClass: 'bg-rose-500/14',
  bidDepthRgb: '74, 222, 128',
  askDepthRgb: '251, 113, 133',
  rowHeightClass: 'h-[21px] min-h-[20px]',
  rowFontClass: 'text-[10px] sm:text-[11px] font-semibold leading-none tabular-nums',
  headerFontClass: 'text-[9px] font-semibold tabular-nums text-zinc-400',
  rowDivideClass: 'divide-y divide-[#1f2937]/50',
  borderClass: 'border-[#1f2937]/55',
  centerBgClass: 'bg-[#05080d]',
  centerMutedClass: 'text-zinc-400',
  centerShellClass: `${DOM_CENTER} ring-violet-400/20 border-violet-900/30`,
  centerPriceFontClass: 'text-[17px] sm:text-[19px] font-bold tabular-nums',
  centerMetaFontClass: 'text-[8px] tabular-nums',
  rowCellPaddingClass: 'px-1',
  priceUpClass: 'text-emerald-300',
  priceDownClass: 'text-rose-300',
  priceFlatClass: 'text-white',
  tradeUpFlashClass: 'bg-emerald-400/22',
  tradeDownFlashClass: 'bg-rose-400/22',
}

const MINIMAL_DARK: OrderBookVisualTokens = {
  bidPriceClass: 'text-zinc-300',
  askPriceClass: 'text-zinc-400',
  bidDepthClass: 'bg-zinc-600/8',
  askDepthClass: 'bg-zinc-700/8',
  bidDepthRgb: '82, 82, 91',
  askDepthRgb: '63, 63, 70',
  rowHeightClass: 'h-[18px] min-h-[17px]',
  rowFontClass: 'text-[9px] sm:text-[10px] leading-none tabular-nums',
  headerFontClass: 'text-[8px] sm:text-[9px] tabular-nums text-zinc-500',
  rowDivideClass: 'divide-y divide-[#1f2937]/20',
  borderClass: 'border-[#1f2937]/30',
  centerBgClass: 'bg-[#070b12]',
  centerMutedClass: 'text-zinc-600',
  centerShellClass: 'rounded-sm border border-[#1f2937] bg-[#0b1118] px-1.5 py-2 ring-1 ring-inset ring-violet-500/8',
  centerPriceFontClass: 'text-[14px] sm:text-[16px] font-semibold tabular-nums',
  centerMetaFontClass: 'text-[8px] tabular-nums',
  rowCellPaddingClass: 'px-0.5',
  priceUpClass: 'text-violet-300/95',
  priceDownClass: 'text-zinc-400',
  priceFlatClass: 'text-zinc-300',
  tradeUpFlashClass: 'bg-violet-500/14',
  tradeDownFlashClass: 'bg-zinc-600/18',
}

export const ORDER_BOOK_PRESET_LABEL: Record<OrderBookDesignPresetId, string> = {
  korean_hts: '한국 HTS',
  korean_hts_pro: '한국 HTS Pro',
  ultra_compact: '울트라 컴팩트',
  global_crypto: '글로벌 크립토',
  high_contrast: '고대비',
  minimal_dark: '미니멀 다크',
}

export const ORDER_BOOK_PRESET_ORDER: OrderBookDesignPresetId[] = [
  'korean_hts',
  'korean_hts_pro',
  'ultra_compact',
  'global_crypto',
  'high_contrast',
  'minimal_dark',
]

export const ORDER_BOOK_PRESET_META: Record<OrderBookDesignPresetId, { tags: OrderBookPresetTag[] }> = {
  korean_hts: { tags: [] },
  korean_hts_pro: { tags: ['pro'] },
  ultra_compact: { tags: ['compact'] },
  global_crypto: { tags: [] },
  high_contrast: { tags: ['pro'] },
  minimal_dark: { tags: ['compact'] },
}

export const ORDER_BOOK_PRESET_TOKENS: Record<OrderBookDesignPresetId, OrderBookVisualTokens> = {
  korean_hts: KOREAN,
  korean_hts_pro: KOREAN_PRO,
  ultra_compact: ULTRA_COMPACT,
  global_crypto: GLOBAL_CRYPTO,
  high_contrast: HIGH_CONTRAST,
  minimal_dark: MINIMAL_DARK,
}

export function parseOrderBookPresetId(raw: string | null): OrderBookDesignPresetId {
  const allowed: OrderBookDesignPresetId[] = [
    'korean_hts',
    'korean_hts_pro',
    'ultra_compact',
    'global_crypto',
    'high_contrast',
    'minimal_dark',
  ]
  if (raw && (allowed as string[]).includes(raw)) return raw as OrderBookDesignPresetId
  return 'korean_hts'
}

export function readOrderBookPresetFromLs(): OrderBookDesignPresetId {
  try {
    return parseOrderBookPresetId(localStorage.getItem(ORDER_BOOK_PRESET_LS_KEY))
  } catch {
    return 'korean_hts'
  }
}

export function readOrderBookInvertFromLs(): boolean {
  try {
    return localStorage.getItem(ORDER_BOOK_INVERT_LS_KEY) === '1'
  } catch {
    return false
  }
}

export function applyBidAskInvert(tokens: OrderBookVisualTokens): OrderBookVisualTokens {
  return {
    ...tokens,
    bidPriceClass: tokens.askPriceClass,
    askPriceClass: tokens.bidPriceClass,
    bidDepthClass: tokens.askDepthClass,
    askDepthClass: tokens.bidDepthClass,
    bidDepthRgb: tokens.askDepthRgb,
    askDepthRgb: tokens.bidDepthRgb,
  }
}

export function effectiveOrderBookTokens(
  preset: OrderBookDesignPresetId,
  invert: boolean,
): OrderBookVisualTokens {
  const base = ORDER_BOOK_PRESET_TOKENS[preset] ?? ORDER_BOOK_PRESET_TOKENS.korean_hts
  return invert ? applyBidAskInvert(base) : base
}
