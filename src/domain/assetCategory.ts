import type { MarketType, SymbolSpec } from '../types/symbol'

/** 주문·포지션 UI/엔진 라우팅용 (주식 / 선물·지수 / 코인) */
export type TradingAssetCategory = 'stock' | 'futures' | 'crypto'

export function tradingAssetCategory(spec: SymbolSpec): TradingAssetCategory {
  const m: MarketType = spec.marketType
  if (m === 'stock') return 'stock'
  if (m === 'crypto') return 'crypto'
  return 'futures'
}

export function categoryLabel(cat: TradingAssetCategory): string {
  if (cat === 'stock') return '주식'
  if (cat === 'futures') return '선물'
  return '코인'
}
