import { safeArray } from '../utils/safe'
import type { SymbolSpec } from '../types/symbol'
import type { TradingStoreState } from '../store/tradingStoreTypes'
import { getSymbolSpec } from '../symbols/registry'
import { ORDER_EXECUTION_POLICY, type OrderExecutionPolicy } from './orderExecutionPolicy'
import { SPEED_ORDER_ENGINE_STATUS, type SpeedOrderEngineStatus } from './engineStatus'
import {
  MARKET_SYNC_ACTIONS,
  type MarketSyncActionEntry,
} from './marketSyncCatalog'
import { speedOrderSymbolRegistry, type SpeedOrderSymbolRegistryApi } from './symbolRegistryApi'

/** 직렬화·로그·UTE 전송에 적합한 얕은 스냅샷(함수 미포함) */
export type SpeedOrderVendorSerializableSnapshot = {
  orderExecutionPolicy: OrderExecutionPolicy
  engineStatus: SpeedOrderEngineStatus
  symbolRegistry: {
    standardSymbols: readonly string[]
    listedSymbolKeys: readonly string[]
  }
  marketSync: {
    symbol: string
    lastPrice: number
    orderBookBidLevels: number
    orderBookAskLevels: number
    tickerCount: number
    mockOrderInFlightId: string | null
    openPositionRows: number
    pendingConditionalOrdersForActiveSymbol: number
  }
  activeSymbolSpec: Pick<
    SymbolSpec,
    'symbol' | 'displayName' | 'marketType' | 'quoteCurrency' | 'sessionType' | 'pnlFormulaType'
  >
  marketSyncCatalog: readonly MarketSyncActionEntry[]
}

/**
 * `TradingStore.getState()`에서 상태만 골라 UTE·모니터용 스냅샷을 생성합니다.
 * 액션 함수는 포함하지 않습니다.
 */
export function readSpeedOrderVendorSerializableSnapshot(
  state: TradingStoreState,
): SpeedOrderVendorSerializableSnapshot {
  const spec = getSymbolSpec(state.symbol)
  const tickers = safeArray(state.tickers)
  const book = state.orderBook
  const bids = safeArray(book?.bids)
  const asks = safeArray(book?.asks)
  const positions = safeArray(state.positions)
  const cond = safeArray(state.conditionalOrders)
  const pendingForActive = cond.filter((c) => c.status === 'pending' && c.symbol === state.symbol)

  return {
    orderExecutionPolicy: ORDER_EXECUTION_POLICY,
    engineStatus: SPEED_ORDER_ENGINE_STATUS,
    symbolRegistry: {
      standardSymbols: [...speedOrderSymbolRegistry.standardSymbols],
      listedSymbolKeys: speedOrderSymbolRegistry.listedSymbolKeys,
    },
    marketSync: {
      symbol: state.symbol,
      lastPrice: state.lastPrice,
      orderBookBidLevels: bids.length,
      orderBookAskLevels: asks.length,
      tickerCount: tickers.length,
      mockOrderInFlightId: state.mockOrderInFlightId,
      openPositionRows: positions.filter((p) => Number.isFinite(p.size) && p.size > 0).length,
      pendingConditionalOrdersForActiveSymbol: pendingForActive.length,
    },
    activeSymbolSpec: {
      symbol: spec.symbol,
      displayName: spec.displayName,
      marketType: spec.marketType,
      quoteCurrency: spec.quoteCurrency,
      sessionType: spec.sessionType,
      pnlFormulaType: spec.pnlFormulaType,
    },
    marketSyncCatalog: MARKET_SYNC_ACTIONS,
  }
}

/** 함수형 API까지 포함한 vendor 뷰(직렬화 불가 구간) */
export type SpeedOrderVendorBundle = {
  orderExecutionPolicy: OrderExecutionPolicy
  engineStatus: SpeedOrderEngineStatus
  symbolRegistry: SpeedOrderSymbolRegistryApi
  marketSyncCatalog: readonly MarketSyncActionEntry[]
  snapshot: SpeedOrderVendorSerializableSnapshot
}

export function getSpeedOrderVendorBundle(state: TradingStoreState): SpeedOrderVendorBundle {
  return {
    orderExecutionPolicy: ORDER_EXECUTION_POLICY,
    engineStatus: SPEED_ORDER_ENGINE_STATUS,
    symbolRegistry: speedOrderSymbolRegistry,
    marketSyncCatalog: MARKET_SYNC_ACTIONS,
    snapshot: readSpeedOrderVendorSerializableSnapshot(state),
  }
}
