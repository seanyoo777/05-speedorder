import type { OrderSide, PositionRow, TradeFillRow } from '../types/trading'
import { getSymbolSpec } from '../symbols/registry'
import { safeArray } from '../utils/safe'

/** 모의 테이커 수수료 (bps) */
export const MOCK_FEE_BPS = 4

export function estimateTradeFee(notionalAbs: number): number {
  if (!Number.isFinite(notionalAbs) || notionalAbs <= 0) return 0
  return (notionalAbs * MOCK_FEE_BPS) / 10_000
}

export function marginNotional(avgPrice: number, size: number, leverage: number): number {
  const lev = leverage > 0 && Number.isFinite(leverage) ? leverage : 1
  const a = Number.isFinite(avgPrice) ? avgPrice : 0
  const s = Number.isFinite(size) ? size : 0
  return (Math.abs(a) * Math.abs(s)) / lev
}

/** 가중 평균 단가 (동일 방향 추가) */
export function calculateAveragePrice(
  prevAvg: number,
  prevSize: number,
  addPrice: number,
  addQty: number,
): number {
  const ps = Number.isFinite(prevSize) ? prevSize : 0
  const pa = Number.isFinite(prevAvg) ? prevAvg : 0
  const aq = Number.isFinite(addQty) ? addQty : 0
  const ap = Number.isFinite(addPrice) ? addPrice : 0
  const denom = ps + aq
  if (denom <= 0) return ap
  return (pa * ps + ap * aq) / denom
}

/** 롱 기준 미실현 (숏은 호출부에서 부호 반전) */
export function calculateUnrealizedPnlLong(avgPrice: number, size: number, mark: number): number {
  if (!Number.isFinite(avgPrice) || !Number.isFinite(size) || !Number.isFinite(mark)) return 0
  return (mark - avgPrice) * size
}

export function calculateUnrealizedPnlForPosition(
  side: PositionRow['side'],
  avgPrice: number,
  size: number,
  mark: number,
): number {
  const base = calculateUnrealizedPnlLong(avgPrice, size, mark)
  return side === 'long' ? base : -base
}

export function calculateRealizedPnlLongClose(avgPrice: number, closePrice: number, closeQty: number): number {
  if (!Number.isFinite(avgPrice) || !Number.isFinite(closePrice) || !Number.isFinite(closeQty)) return 0
  return (closePrice - avgPrice) * closeQty
}

export function calculateRealizedPnlShortClose(avgPrice: number, closePrice: number, closeQty: number): number {
  if (!Number.isFinite(avgPrice) || !Number.isFinite(closePrice) || !Number.isFinite(closeQty)) return 0
  return (avgPrice - closePrice) * closeQty
}

export function positionRowId(symbol: string): string {
  return `pos-${symbol}`
}

function replaceBySymbol(list: PositionRow[], symbol: string, next: PositionRow | null): PositionRow[] {
  const rest = list.filter((p) => p.symbol !== symbol)
  if (next == null || !Number.isFinite(next.size) || next.size <= 0) return rest
  return [...rest, next]
}

/** 부분 청산 후 포지션 (평단 유지, 수량만 감소) */
export function partialClosePosition(pos: PositionRow, closeQty: number): PositionRow {
  const q = Math.min(Math.max(0, closeQty), pos.size)
  return { ...pos, size: Math.max(0, pos.size - q) }
}

/** 반전 후 신규 포지션 객체 (누적 실현은 호출부 유지) */
export function reversePosition(params: {
  symbol: string
  newSide: PositionRow['side']
  size: number
  avgPrice: number
  cumulativeRealized: number
}): PositionRow {
  return {
    id: positionRowId(params.symbol),
    symbol: params.symbol,
    side: params.newSide,
    size: Math.max(0, params.size),
    avgPrice: params.avgPrice,
    unrealizedPnl: 0,
    realizedPnl: params.cumulativeRealized,
    returnPct: 0,
  }
}

/** 티커·활성 심볼 last로 미실현·수익률(증거금 대비) 갱신 */
export function revaluePositions(
  positions: PositionRow[],
  tickers: { symbol: string; price: number }[],
  activeSymbol: string,
  activeLastPrice: number,
): PositionRow[] {
  return safeArray(positions).map((p) => {
    const t = tickers.find((x) => x.symbol === p.symbol)
    const tp = t?.price
    const mark =
      (Number.isFinite(tp) ? tp : undefined) ??
      (p.symbol === activeSymbol && Number.isFinite(activeLastPrice) ? activeLastPrice : undefined) ??
      (Number.isFinite(p.avgPrice) ? p.avgPrice : 0)
    const lev = getSymbolSpec(p.symbol).defaultLeverage
    const unreal = calculateUnrealizedPnlForPosition(p.side, p.avgPrice, p.size, mark)
    const margin = marginNotional(p.avgPrice, p.size, lev)
    const returnPct = margin > 0 ? (unreal / margin) * 100 : 0
    return { ...p, unrealizedPnl: unreal, returnPct }
  })
}

/**
 * 선물형 단일 넷 포지션(심볼당 long XOR short) 스피드 주문 체결.
 * fill.realizedPnl = 이번 주문으로 누적 실현에 더해진 값(청산 손익 − 수수료, 신규만 수수료).
 */
export function executeNetSpeedFill(input: {
  positions: PositionRow[]
  symbol: string
  side: OrderSide
  quantity: number
  price: number
  fillId: string
  timestamp: number
}): { positions: PositionRow[]; fill: TradeFillRow } {
  const { symbol, side, quantity, price, fillId, timestamp } = input
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0
  const px = Number.isFinite(price) && price > 0 ? price : 0
  if (qty <= 0 || px <= 0) {
    const emptyFill: TradeFillRow = {
      id: fillId,
      symbol,
      side,
      price: px,
      quantity: 0,
      fee: 0,
      realizedPnl: 0,
      time: new Date(timestamp).toLocaleTimeString('ko-KR', { hour12: false }),
      timestamp,
    }
    return { positions: safeArray(input.positions), fill: emptyFill }
  }

  const notional = Math.abs(px * qty)
  const feeTotal = estimateTradeFee(notional)
  const time = new Date(timestamp).toLocaleTimeString('ko-KR', { hour12: false })

  const makeFill = (realizedDelta: number): TradeFillRow => ({
    id: fillId,
    symbol,
    side,
    price: px,
    quantity: qty,
    fee: feeTotal,
    realizedPnl: realizedDelta,
    time,
    timestamp,
  })

  const list = [...safeArray(input.positions)]
  const existing = list.find((p) => p.symbol === symbol)
  const prevCumRealized = Number.isFinite(existing?.realizedPnl) ? (existing?.realizedPnl ?? 0) : 0

  if (!existing || !Number.isFinite(existing.size) || existing.size <= 0) {
    const base: PositionRow =
      side === 'buy'
        ? {
            id: positionRowId(symbol),
            symbol,
            side: 'long',
            size: qty,
            avgPrice: px,
            unrealizedPnl: 0,
            realizedPnl: prevCumRealized - feeTotal,
            returnPct: 0,
          }
        : {
            id: positionRowId(symbol),
            symbol,
            side: 'short',
            size: qty,
            avgPrice: px,
            unrealizedPnl: 0,
            realizedPnl: prevCumRealized - feeTotal,
            returnPct: 0,
          }
    return {
      positions: replaceBySymbol(list, symbol, base),
      fill: makeFill(-feeTotal),
    }
  }

  const pos: PositionRow = { ...existing }
  let grossClose = 0
  let orderLeft = qty

  const sameDirection =
    (pos.side === 'long' && side === 'buy') || (pos.side === 'short' && side === 'sell')

  if (sameDirection) {
    const newSize = pos.size + orderLeft
    pos.avgPrice = calculateAveragePrice(pos.avgPrice, pos.size, px, orderLeft)
    pos.size = newSize
    pos.realizedPnl = prevCumRealized - feeTotal
    return { positions: replaceBySymbol(list, symbol, pos), fill: makeFill(-feeTotal) }
  }

  while (orderLeft > 0 && pos.size > 0) {
    const dq = Math.min(orderLeft, pos.size)
    if (pos.side === 'long') {
      grossClose += calculateRealizedPnlLongClose(pos.avgPrice, px, dq)
    } else {
      grossClose += calculateRealizedPnlShortClose(pos.avgPrice, px, dq)
    }
    pos.size -= dq
    orderLeft -= dq
  }

  const netDelta = grossClose - feeTotal
  pos.realizedPnl = prevCumRealized + netDelta

  if (pos.size <= 0 && orderLeft > 0) {
    const flipped = reversePosition({
      symbol,
      newSide: pos.side === 'long' ? 'short' : 'long',
      size: orderLeft,
      avgPrice: px,
      cumulativeRealized: pos.realizedPnl,
    })
    return { positions: replaceBySymbol(list, symbol, flipped), fill: makeFill(netDelta) }
  }

  if (pos.size <= 0) {
    return { positions: replaceBySymbol(list, symbol, null), fill: makeFill(netDelta) }
  }

  return { positions: replaceBySymbol(list, symbol, pos), fill: makeFill(netDelta) }
}

/** 체결 1건을 넷 포지션에 반영 — `executeNetSpeedFill`과 동일 (호스트 재사용용 별칭) */
export function applyFillToPosition(
  input: Parameters<typeof executeNetSpeedFill>[0],
): ReturnType<typeof executeNetSpeedFill> {
  return executeNetSpeedFill(input)
}
