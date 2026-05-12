import type { OrderSide } from '../types/trading'

/** UI/엔진 라우팅용 주문 모드 (확장 슬롯) */
export type OrderMode = 'standard' | 'speed' | 'hts' | 'conditional'

/**
 * 조건·복합 주문 타입 (실행은 mock 단계에서 미구현, 타입만 확보)
 * LIMIT/MARKET은 기존 UI와 동일 계열
 */
export type ConditionalOrderType =
  | 'LIMIT'
  | 'MARKET'
  | 'STOP'
  | 'STOP_LIMIT'
  | 'MIT'
  | 'OCO'
  | 'TP_SL'

/** 엔진 입력용 주문 요청 (실거래 금지 — mock 파이프라인만) */
export type OrderRequest = {
  symbol: string
  side: OrderSide
  mode: OrderMode
  /** LIMIT | MARKET 계열 (고급 타입은 conditionalType으로 확장) */
  orderType: 'market' | 'limit'
  quantity: number
  limitPrice?: number
  conditionalType?: ConditionalOrderType
}

/** UI/스토어 주문 상태 (기존 Persisted와 동일 계열) */
export type OrderStatus =
  | 'submitting'
  | 'accepted'
  | 'filled'
  | 'canceled'
  | 'rejected'
