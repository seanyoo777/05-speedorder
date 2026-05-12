export type MarketType = 'crypto' | 'futures' | 'index' | 'commodity'

/** 표준 심볼 메타 (UI·호가 간격·포맷·모의 증거금) */
export type SymbolSpec = {
  symbol: string
  displayName: string
  marketType: MarketType
  tickSize: number
  lotSize: number
  priceDecimals: number
  qtyDecimals: number
  /** 모의 증거금 = |가격×수량| / defaultLeverage */
  defaultLeverage: number
  /** 티커 부재 시 시드 가격 */
  referencePrice: number
}
