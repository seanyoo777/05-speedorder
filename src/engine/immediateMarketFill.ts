import type { StoreApi } from 'zustand'
import { mergeRiskSnapshotWithPositions } from '../domain/risk'
import { speedOrderToast } from '../feedback/speedOrderToast'
import { getSymbolSpec } from '../symbols/registry'
import type { OrderRecordRow, OrderSide } from '../types/trading'
import type { TradingStore } from '../store/tradingStoreTypes'
import { formatByDecimals } from '../utils/format'
import { roundQtyBySpec } from '../utils/specInstrument'
import { safeArray } from '../utils/safe'
import { executeNetSpeedFill, revaluePositions } from './mockExecutionEngine'

/**
 * 호가 더블클릭/원클릭용 즉시 시장가 체결 (mock, 지연 없음).
 * `submitMockSpeedOrder`와 달리 `mockOrderInFlight`를 설정하지 않습니다.
 */
export function executeImmediateMockMarketOrder(
  store: StoreApi<TradingStore>,
  input: { side: OrderSide; quantity: number },
): boolean {
  const st = store.getState()
  if (st.mockOrderInFlightId != null) return false

  const spec = getSymbolSpec(st.symbol)
  const qty = roundQtyBySpec(spec, Number(input.quantity))
  if (!Number.isFinite(qty) || qty <= 0) return false

  const px = st.lastPrice
  if (!Number.isFinite(px) || px <= 0) return false

  const ts = Date.now()
  const time = new Date(ts).toLocaleTimeString('ko-KR', { hour12: false })
  const oid = `o-book-${ts}`

  const { positions: traded, fill } = executeNetSpeedFill({
    positions: st.positions,
    symbol: st.symbol,
    side: input.side,
    quantity: qty,
    price: px,
    fillId: `f-book-${oid}`,
    timestamp: ts,
  })

  const positions = revaluePositions(traded, st.tickers, st.symbol, px)
  const orderRow: OrderRecordRow = {
    id: oid,
    symbol: st.symbol,
    side: input.side,
    type: 'market',
    price: null,
    quantity: qty,
    status: 'filled',
    time,
  }

  store.setState((s) => ({
    positions,
    fills: [fill, ...safeArray(s.fills)].slice(0, 200),
    orders: [orderRow, ...safeArray(s.orders)].slice(0, 200),
    riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
  }))

  const sideLabel = input.side === 'buy' ? 'BUY' : 'SELL'
  speedOrderToast(`${sideLabel} ${formatByDecimals(qty, spec.qtyDecimals)} ${spec.symbol}`)

  return true
}
