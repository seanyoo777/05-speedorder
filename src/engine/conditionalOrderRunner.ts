import { mergeRiskSnapshotWithPositions } from '../domain/risk'
import type { RiskSnapshot } from '../domain/risk'
import type {
  ConditionalOrderRow,
  ConditionalOutcomeLabel,
  OrderRecordRow,
  OrderSide,
  PositionRow,
  TickerRow,
  TradeFillRow,
} from '../types/trading'
import { safeArray } from '../utils/safe'
import { getSymbolSpec } from '../symbols/registry'
import { categoryLabel, tradingAssetCategory } from '../domain/assetCategory'
import { executeSpeedOrderFill, revaluePositions } from './mockExecutionEngine'

/** MIT/STOP: 매수는 아래→위로 트리거 터치, 매도는 위→아래로 터치 */
export function mitStopTriggerCrossed(
  side: OrderSide,
  trigger: number,
  prevLast: number,
  currLast: number,
): boolean {
  if (!Number.isFinite(trigger) || trigger <= 0) return false
  if (!Number.isFinite(prevLast) || !Number.isFinite(currLast)) return false
  if (side === 'buy') return prevLast < trigger && currLast >= trigger
  return prevLast > trigger && currLast <= trigger
}

export function classifyConditionalOutcome(
  position: PositionRow | undefined,
  orderSide: OrderSide,
  qty: number,
): ConditionalOutcomeLabel {
  const q = Number.isFinite(qty) && qty > 0 ? qty : 0
  if (q <= 0) return '신규진입'
  if (!position || !Number.isFinite(position.size) || position.size <= 0) return '신규진입'
  const opposite =
    (position.side === 'long' && orderSide === 'sell') ||
    (position.side === 'short' && orderSide === 'buy')
  if (!opposite) return '신규진입'
  const eps = 1e-10
  if (q + eps < position.size) return '부분청산'
  if (Math.abs(q - position.size) <= eps * Math.max(1, position.size)) return '완전청산'
  return '반전진입'
}

export type ConditionalTickSlice = {
  symbol: string
  positions: PositionRow[]
  fills: TradeFillRow[]
  orders: OrderRecordRow[]
  conditionalOrders: ConditionalOrderRow[]
  tickers: TickerRow[]
  riskSnapshot: RiskSnapshot
  cryptoPositionMode: 'one_way' | 'hedge'
}

/** mock 틱·가격 갱신 후 호출 — 활성 심볼의 pending MIT/STOP만 FIFO 체결 */
export function runConditionalOrdersOnTick(
  state: ConditionalTickSlice,
  prevLast: number,
  currLast: number,
): Pick<
  ConditionalTickSlice,
  'positions' | 'fills' | 'orders' | 'conditionalOrders' | 'riskSnapshot'
> {
  let positions = [...safeArray(state.positions)]
  let fills = [...safeArray(state.fills)]
  let orders = [...safeArray(state.orders)]
  let conditionalOrders = [...safeArray(state.conditionalOrders)]
  let riskSnapshot = state.riskSnapshot

  const pending = conditionalOrders
    .filter((c) => c.status === 'pending' && c.symbol === state.symbol)
    .sort((a, b) => a.createdAt - b.createdAt)

  for (const c of pending) {
    if (!mitStopTriggerCrossed(c.side, c.triggerPrice, prevLast, currLast)) continue

    const ts = Date.now()
    const time = new Date(ts).toLocaleTimeString('ko-KR', { hour12: false })
    const qty = c.quantity
    const px = currLast
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(px) || px <= 0) continue

    const { positions: traded, fill: fillRaw } = executeSpeedOrderFill({
      positions,
      symbol: c.symbol,
      side: c.side,
      quantity: qty,
      price: px,
      fillId: `f-cond-${c.id}-${ts}`,
      timestamp: ts,
      positionMode: state.cryptoPositionMode,
    })
    const specC = getSymbolSpec(c.symbol)
    const fill: TradeFillRow = {
      ...fillRaw,
      orderKind: c.kind === 'MIT' ? 'mit' : 'stop',
      statusLabel: 'filled',
      segmentLabel: categoryLabel(tradingAssetCategory(specC)),
    }

    positions = revaluePositions(traded, state.tickers, state.symbol, currLast)
    fills = [fill, ...fills].slice(0, 200)
    riskSnapshot = mergeRiskSnapshotWithPositions(positions, riskSnapshot)

    const orderRow: OrderRecordRow = {
      id: `o-cond-${c.id}-${ts}`,
      symbol: c.symbol,
      side: c.side,
      type: 'market',
      price: null,
      quantity: qty,
      status: 'filled',
      time,
    }
    orders = [orderRow, ...orders].slice(0, 200)

    conditionalOrders = conditionalOrders.map((row) =>
      row.id === c.id
        ? {
            ...row,
            status: 'filled' as const,
            triggeredAt: ts,
            filledAt: ts,
          }
        : row,
    )
  }

  return { positions, fills, orders, conditionalOrders, riskSnapshot }
}
