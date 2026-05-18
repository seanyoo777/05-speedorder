import type { StoreApi } from 'zustand'
import type { OrderBookDesignPresetId } from '../config/orderBookDesignPresets'
import type { RiskSnapshot } from '../domain/risk'
import type { StopMitDraft, StopMitDraftPatch } from '../domain/stopMitDraft'
import type {
  PositionPanelPresetId,
  WorkspaceLayoutPresetId,
} from '../domain/tradingWorkspace'
import type { TradingWorkspaceSlot } from '../domain/tradingWorkspace'
import type { WorkspaceOrderFormTab } from '../workspace/applyWorkspaceSlot'
import type {
  ConditionalOrderKind,
  ConditionalOrderRow,
  OrderBookSnapshot,
  OrderRecordRow,
  OrderSide,
  PositionRow,
  SpeedOrderActionKind,
  SpeedOrderActionLogEntry,
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
  /** MIT·스탑 트리거에 1회 주입(호가 클릭 시 고정, 실시간 시세와 무관) */
  orderBookPendingTriggerPrice: number | null
  /** pending 트리거와 함께 설정되는 호가 측 (bid/ask) */
  orderBookPendingTriggerBookSide: 'bid' | 'ask' | null
  /** Stop/MIT 가격 락 초안 (틱·lastPrice와 분리) */
  stopMitDraft: StopMitDraft
  /** 호가 행 선택 강조 (가격) */
  orderBookHighlightPrice: number | null
  /** 호가 디자인 프리셋 (localStorage 동기) */
  orderBookDesignPreset: OrderBookDesignPresetId
  /** 매수/매도 색역 수동 반전 (프리셋 위에 추가 적용) */
  orderBookColorInvert: boolean
  /** 스피드 주문 패널 등 기본 글자 배율 (localStorage) */
  uiFontScale: number
  /** 호가창 숫자·행 글자 배율 (localStorage) */
  uiOrderBookFontScale: number
  /** 컴팩트 모드 (localStorage) */
  uiCompactMode: boolean
  /** DOM 열 최소 너비(px), null이면 기본 min-w (localStorage) */
  uiDomWidthPx: number | null
  /** 최근 주문·스킵 UX 로그 (최대 5) */
  orderActionLog: SpeedOrderActionLogEntry[]
  /** 코인 포지션 모드 (mock, 향후 사용자/관리자 설정 확장) */
  cryptoPositionMode: 'one_way' | 'hedge'
  /** 호가 더블클릭 → HTS 확인 모달용 (mock) */
  pendingBookOrderConfirm: null | {
    id: string
    side: OrderSide
    rowPrice: number
    quantity: number
  }
  /** W3 — per-workspace runtime (isolated registry store) */
  workspaceOrderFormTab: WorkspaceOrderFormTab
  workspacePositionPanelPreset: PositionPanelPresetId
  workspaceLayoutPreset: WorkspaceLayoutPresetId
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
  setOrderBookPendingTriggerPrice: (price: number | null) => void
  setOrderBookPendingTriggerBookSide: (side: 'bid' | 'ask' | null) => void
  clearOrderBookPendingTriggerPrice: () => void
  patchStopMitDraft: (patch: StopMitDraftPatch) => void
  consumeOrderBookPendingTrigger: () => boolean
  resetStopMitDraftForSymbol: (symbol: string) => void
  setOrderBookHighlightPrice: (price: number | null) => void
  setOrderBookDesignPreset: (id: OrderBookDesignPresetId) => void
  setOrderBookColorInvert: (v: boolean) => void
  setUiFontScale: (v: number) => void
  setUiOrderBookFontScale: (v: number) => void
  setUiCompactMode: (v: boolean) => void
  setUiDomWidthPx: (v: number | null) => void
  pushOrderActionLog: (e: { kind: SpeedOrderActionKind; text: string; id?: string }) => void
  setCryptoPositionMode: (m: 'one_way' | 'hedge') => void
  setPendingBookOrderConfirm: (
    v: null | { id: string; side: OrderSide; rowPrice: number; quantity: number },
  ) => void
  setWorkspaceOrderFormTab: (tab: WorkspaceOrderFormTab) => void
  setWorkspaceRuntimeFromSlot: (slot: TradingWorkspaceSlot) => void
}

export type TradingStore = TradingStoreState & TradingStoreActions

export type TradingStoreApi = StoreApi<TradingStore>
