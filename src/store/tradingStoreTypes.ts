import type { StoreApi } from 'zustand'
import type { OrderBookDesignPresetId } from '../config/orderBookDesignPresets'
import type { RiskSnapshot } from '../domain/risk'
import type {
  ConditionalOrderKind,
  ConditionalOrderRow,
  OrderBookSnapshot,
  OrderRecordRow,
  OrderSide,
  PositionRow,
  TickerRow,
  TradeFillRow,
} from '../types/trading'

/** Zustand 스토어 공개 형태 — 슬라이스 합성 시 동일 시그니처 유지 */
export type TradingStoreState = {
  symbol: string
  lastPrice: number
  orderBook: OrderBookSnapshot
  tickers: TickerRow[]
  positions: PositionRow[]
  fills: TradeFillRow[]
  orders: OrderRecordRow[]
  beginnerMode: boolean
  confirmOrders: boolean
  mockOrderInFlightId: string | null
  /** 리스크·한도 스냅샷 (mock, 호스트가 WS로 갱신 가능) */
  riskSnapshot: RiskSnapshot
  /** MIT / 스탑로스(mock) 조건 주문 */
  conditionalOrders: ConditionalOrderRow[]
  /** 호가창 기준 주문 수량 (원클릭·더블클릭·조건주 등) */
  orderBookOrderQty: number
  orderBookOneClickEnabled: boolean
  orderBookDoubleClickEnabled: boolean
  /** 일반 주문 지정가 필드에 1회 주입 */
  orderBookPendingLimitPrice: number | null
  /** 호가 행 선택 강조 (가격) */
  orderBookHighlightPrice: number | null
  /** 호가 디자인 프리셋 (localStorage 동기) */
  orderBookDesignPreset: OrderBookDesignPresetId
  /** 매수/매도 색역 수동 반전 (프리셋 위에 추가 적용) */
  orderBookColorInvert: boolean
}

export type TradingStoreActions = {
  setSymbol: (symbol: string) => void
  applyOrderBook: (book: OrderBookSnapshot) => void
  applyLastPrice: (price: number) => void
  applyTickers: (tickers: TickerRow[]) => void
  patchTicker: (id: string, patch: Partial<TickerRow>) => void
  setPositions: (rows: PositionRow[]) => void
  pushFill: (row: TradeFillRow) => void
  upsertOrder: (row: OrderRecordRow) => void
  cancelOrder: (id: string) => void
  setBeginnerMode: (v: boolean) => void
  setConfirmOrders: (v: boolean) => void
  setMockOrderInFlight: (id: string | null) => void
  setRiskSnapshot: (snap: RiskSnapshot) => void
  applyMockTick: (payload: { lastPrice: number; orderBook: OrderBookSnapshot; tickers: TickerRow[] }) => void
  closePositionDemo: (id: string) => void
  registerConditionalOrder: (input: {
    kind: ConditionalOrderKind
    side: OrderSide
    triggerPrice: number
    quantity: number
  }) => void
  cancelConditionalOrder: (id: string) => void
  setOrderBookOrderQty: (qty: number) => void
  setOrderBookOneClickEnabled: (v: boolean) => void
  setOrderBookDoubleClickEnabled: (v: boolean) => void
  setOrderBookPendingLimitPrice: (price: number | null) => void
  clearOrderBookPendingLimitPrice: () => void
  setOrderBookHighlightPrice: (price: number | null) => void
  setOrderBookDesignPreset: (id: OrderBookDesignPresetId) => void
  setOrderBookColorInvert: (v: boolean) => void
}

export type TradingStore = TradingStoreState & TradingStoreActions

export type TradingStoreApi = StoreApi<TradingStore>
