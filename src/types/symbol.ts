/** 거래소·상품군 — 티커·주문 UI·손익 공식 라우팅에 사용 */
export type MarketType =
  | 'crypto'
  | 'futures'
  | 'stock'
  | 'index'
  | 'commodity'
  | 'forex'

/** 세션 규칙(표시·추후 장중 틱 게이트용) */
export type SessionType = '24h' | 'regular' | 'futures_session'

/**
 * 미실현·청산 손익 계열
 * - linear: USDT-M 선형(코인) 등 (mark−avg)×수량×계약승수
 * - inverse: 코인 역선형 근사 (1/가격 기반)
 * - stock: 주식·현물 주
 * - futures_contract: 틱가치·틱사이즈 기반 (지수·원자재 선물 등)
 */
export type PnlFormulaType = 'linear' | 'inverse' | 'stock' | 'futures_contract'

/**
 * 종목별 거래·표시 스펙 (mock + TGX/MockInvest 공통 계약)
 * 숫자 필드는 NaN 방지를 위해 registry에서 항상 유한값으로 채움.
 */
export type SymbolSpec = {
  symbol: string
  displayName: string
  marketType: MarketType
  /** 호가·손익 표시 통화 (예: USDT, USD, KRW) */
  quoteCurrency: string
  priceDecimals: number
  qtyDecimals: number
  tickSize: number
  lotSize: number
  /** 계약 1단위가 기초자산에 대응하는 배수(주식 1주=1, 코인 선물 1 등) */
  contractSize: number
  /** 가격이 tickSize만큼 움직일 때 1계약·1lot 기준 손익 통화금액 (futures_contract 필수 권장) */
  tickValue: number
  /** 증거금·한도 표기 통화 (mock은 USD 가정) */
  marginCurrency: string
  defaultLeverage: number
  minQty: number
  maxQty: number
  sessionType: SessionType
  pnlFormulaType: PnlFormulaType
  /** 티커 부재 시 시드 가격 */
  referencePrice: number
}

/** registry fallback·부분 입력 병합용 기본 스펙 */
export const DEFAULT_SYMBOL_SPEC: SymbolSpec = {
  symbol: 'BTCUSDT',
  displayName: 'BTC/USDT',
  marketType: 'crypto',
  quoteCurrency: 'USDT',
  priceDecimals: 2,
  qtyDecimals: 4,
  tickSize: 0.1,
  lotSize: 0.001,
  contractSize: 1,
  tickValue: 0.1,
  marginCurrency: 'USDT',
  defaultLeverage: 10,
  minQty: 0.001,
  maxQty: 1_000_000,
  sessionType: '24h',
  pnlFormulaType: 'linear',
  referencePrice: 97_250,
}

export function mergeSymbolSpec(partial: Partial<SymbolSpec> & Pick<SymbolSpec, 'symbol' | 'displayName'>): SymbolSpec {
  const base = { ...DEFAULT_SYMBOL_SPEC, ...partial }
  const cs = base.contractSize > 0 ? base.contractSize : 1
  const ts = base.tickSize > 0 ? base.tickSize : 0.01
  const tickValue =
    Number.isFinite(base.tickValue) && base.tickValue > 0 ? base.tickValue : ts * cs
  return {
    ...base,
    contractSize: cs,
    tickSize: ts,
    tickValue,
    lotSize: base.lotSize > 0 ? base.lotSize : 0.001,
    minQty: base.minQty > 0 ? base.minQty : base.lotSize,
    maxQty: base.maxQty > 0 ? base.maxQty : DEFAULT_SYMBOL_SPEC.maxQty,
    defaultLeverage: base.defaultLeverage > 0 ? base.defaultLeverage : 1,
  }
}
