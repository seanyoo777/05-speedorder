/**
 * 호가창 HTS/크립토 디자인 프리셋 — UI 전용 (mock)
 * TGX 등 호스트: `ORDER_BOOK_PRESET_LS_KEY`로 동기화하거나 스토어 `setOrderBookDesignPreset` 사용
 */

export const ORDER_BOOK_PRESET_LS_KEY = '05-speedorder:orderbook:preset'
export const ORDER_BOOK_INVERT_LS_KEY = '05-speedorder:orderbook:invert-colors'

export type OrderBookDesignPresetId = 'korean_hts' | 'global_crypto' | 'high_contrast' | 'minimal_dark'

export type OrderBookVisualTokens = {
  bidPriceClass: string
  askPriceClass: string
  bidDepthClass: string
  askDepthClass: string
  rowHeightClass: string
  rowFontClass: string
  headerFontClass: string
  rowDivideClass: string
  borderClass: string
  centerBgClass: string
  centerMutedClass: string
  priceUpClass: string
  priceDownClass: string
  priceFlatClass: string
}

const KOREAN: OrderBookVisualTokens = {
  bidPriceClass: 'text-red-400',
  askPriceClass: 'text-emerald-400',
  bidDepthClass: 'bg-red-500/15',
  askDepthClass: 'bg-emerald-500/15',
  rowHeightClass: 'h-[22px] min-h-[20px]',
  rowFontClass: 'text-[10px] sm:text-[11px] leading-none',
  headerFontClass: 'text-[9px] sm:text-[10px]',
  rowDivideClass: 'divide-y divide-white/[0.06]',
  borderClass: 'border-white/[0.08]',
  centerBgClass: 'bg-zinc-950/95',
  centerMutedClass: 'text-zinc-500',
  priceUpClass: 'text-red-400',
  priceDownClass: 'text-emerald-400',
  priceFlatClass: 'text-zinc-200',
}

const GLOBAL_CRYPTO: OrderBookVisualTokens = {
  bidPriceClass: 'text-emerald-400',
  askPriceClass: 'text-red-400',
  bidDepthClass: 'bg-emerald-500/15',
  askDepthClass: 'bg-red-500/15',
  rowHeightClass: 'h-[22px] min-h-[20px]',
  rowFontClass: 'text-[10px] sm:text-[11px] leading-none',
  headerFontClass: 'text-[9px] sm:text-[10px]',
  rowDivideClass: 'divide-y divide-white/[0.06]',
  borderClass: 'border-white/[0.08]',
  centerBgClass: 'bg-zinc-950/95',
  centerMutedClass: 'text-zinc-500',
  priceUpClass: 'text-emerald-400',
  priceDownClass: 'text-red-400',
  priceFlatClass: 'text-zinc-200',
}

const HIGH_CONTRAST: OrderBookVisualTokens = {
  bidPriceClass: 'text-rose-300',
  askPriceClass: 'text-lime-300',
  bidDepthClass: 'bg-rose-500/22',
  askDepthClass: 'bg-lime-500/22',
  rowHeightClass: 'h-[24px] min-h-[22px]',
  rowFontClass: 'text-[11px] sm:text-[12px] font-semibold leading-none',
  headerFontClass: 'text-[10px] font-semibold',
  rowDivideClass: 'divide-y divide-white/20',
  borderClass: 'border-white/25',
  centerBgClass: 'bg-black',
  centerMutedClass: 'text-zinc-400',
  priceUpClass: 'text-rose-300',
  priceDownClass: 'text-lime-300',
  priceFlatClass: 'text-white',
}

const MINIMAL_DARK: OrderBookVisualTokens = {
  bidPriceClass: 'text-zinc-200',
  askPriceClass: 'text-zinc-300',
  bidDepthClass: 'bg-zinc-500/10',
  askDepthClass: 'bg-zinc-600/10',
  rowHeightClass: 'h-[20px] min-h-[18px]',
  rowFontClass: 'text-[10px] leading-none',
  headerFontClass: 'text-[9px]',
  rowDivideClass: 'divide-y divide-white/[0.04]',
  borderClass: 'border-white/[0.06]',
  centerBgClass: 'bg-so-bg',
  centerMutedClass: 'text-zinc-600',
  priceUpClass: 'text-zinc-100',
  priceDownClass: 'text-zinc-400',
  priceFlatClass: 'text-zinc-300',
}

export const ORDER_BOOK_PRESET_LABEL: Record<OrderBookDesignPresetId, string> = {
  korean_hts: '한국 HTS',
  global_crypto: '글로벌 크립토',
  high_contrast: '고대비',
  minimal_dark: '미니멀 다크',
}

export const ORDER_BOOK_PRESET_TOKENS: Record<OrderBookDesignPresetId, OrderBookVisualTokens> = {
  korean_hts: KOREAN,
  global_crypto: GLOBAL_CRYPTO,
  high_contrast: HIGH_CONTRAST,
  minimal_dark: MINIMAL_DARK,
}

export function parseOrderBookPresetId(raw: string | null): OrderBookDesignPresetId {
  if (raw === 'global_crypto' || raw === 'high_contrast' || raw === 'minimal_dark' || raw === 'korean_hts') {
    return raw
  }
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
  }
}

export function effectiveOrderBookTokens(
  preset: OrderBookDesignPresetId,
  invert: boolean,
): OrderBookVisualTokens {
  const base = ORDER_BOOK_PRESET_TOKENS[preset] ?? ORDER_BOOK_PRESET_TOKENS.korean_hts
  return invert ? applyBidAskInvert(base) : base
}
