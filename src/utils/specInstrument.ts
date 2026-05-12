import type { SymbolSpec } from '../types/symbol'
import { roundToLotSize, roundToTickSize } from './rounding'

export type PnlBySpecOp =
  | {
      op: 'unrealized'
      positionSide: 'long' | 'short'
      avgPrice: number
      size: number
      mark: number
    }
  | {
      op: 'close_gross'
      positionSide: 'long' | 'short'
      avgPrice: number
      closePrice: number
      closeQty: number
    }

function contractSizeOf(spec: SymbolSpec): number {
  return spec.contractSize > 0 && Number.isFinite(spec.contractSize) ? spec.contractSize : 1
}

function tickSizeOf(spec: SymbolSpec): number {
  return spec.tickSize > 0 && Number.isFinite(spec.tickSize) ? spec.tickSize : 1
}

function tickValueOf(spec: SymbolSpec): number {
  const ts = tickSizeOf(spec)
  const cs = contractSizeOf(spec)
  const tv = spec.tickValue
  if (Number.isFinite(tv) && tv > 0) return tv
  return ts * cs
}

/**
 * 상품 스펙 기준 손익 (미실현 또는 청산 구간 gross — 수수료 제외)
 * `close_gross`는 동일 공식으로 mark=청산가, size=청산수량을 적용합니다.
 */
export function calculatePnlBySpec(spec: SymbolSpec, input: PnlBySpecOp): number {
  const cs = contractSizeOf(spec)
  const ts = tickSizeOf(spec)
  const tv = tickValueOf(spec)

  if (input.op === 'close_gross') {
    const { positionSide, avgPrice, closePrice, closeQty } = input
    if (!Number.isFinite(closeQty) || closeQty <= 0) return 0
    return calculatePnlBySpec(spec, {
      op: 'unrealized',
      positionSide,
      avgPrice,
      size: closeQty,
      mark: closePrice,
    })
  }

  const { positionSide, avgPrice, size, mark } = input
  if (!Number.isFinite(avgPrice) || !Number.isFinite(size) || !Number.isFinite(mark) || size <= 0) return 0

  switch (spec.pnlFormulaType) {
    case 'futures_contract': {
      const diff = positionSide === 'long' ? mark - avgPrice : avgPrice - mark
      return (diff / ts) * tv * size
    }
    case 'inverse': {
      if (!avgPrice || !mark) return 0
      return positionSide === 'long'
        ? size * cs * (1 / avgPrice - 1 / mark)
        : size * cs * (1 / mark - 1 / avgPrice)
    }
    case 'linear':
    case 'stock':
    default:
      return positionSide === 'long'
        ? (mark - avgPrice) * size * cs
        : (avgPrice - mark) * size * cs
  }
}

/** 수수료 부과 기준 통화 노셔널 (mock 테이커 bps용) */
export function feeNotionalAbsBySpec(spec: SymbolSpec, price: number, qty: number): number {
  const cs = contractSizeOf(spec)
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return 0
  if (spec.pnlFormulaType === 'futures_contract') {
    const ts = tickSizeOf(spec)
    const tv = tickValueOf(spec)
    if (ts > 0 && tv > 0) return Math.abs(qty * (price / ts) * tv)
  }
  return Math.abs(price * qty * cs)
}

/**
 * 모의 초기·유지 증거금 (단순화: 통화 단위는 marginCurrency와 무관하게 수치만)
 * futures_contract: 계약당 틱 노셔널 / 레버리지
 * 그 외: |가격×수량×계약승수| / 레버리지
 */
export function calculateMarginBySpec(spec: SymbolSpec, markPrice: number, qty: number): number {
  const lev = spec.defaultLeverage > 0 && Number.isFinite(spec.defaultLeverage) ? spec.defaultLeverage : 1
  if (!Number.isFinite(markPrice) || markPrice <= 0 || !Number.isFinite(qty) || qty <= 0) return 0
  const notional =
    spec.pnlFormulaType === 'futures_contract'
      ? Math.abs(qty * (markPrice / tickSizeOf(spec)) * tickValueOf(spec))
      : Math.abs(markPrice * qty * contractSizeOf(spec))
  return notional / lev
}

export function roundPriceBySpec(spec: SymbolSpec, price: number): number {
  return roundToTickSize(price, spec.tickSize)
}

export function roundQtyBySpec(spec: SymbolSpec, qty: number): number {
  let q = roundToLotSize(qty, spec.lotSize)
  const max = spec.maxQty > 0 && Number.isFinite(spec.maxQty) ? spec.maxQty : Number.POSITIVE_INFINITY
  const min = spec.minQty > 0 && Number.isFinite(spec.minQty) ? spec.minQty : spec.lotSize
  if (q > max) q = roundToLotSize(max, spec.lotSize)
  if (q > 0 && q < min) q = min
  if (!Number.isFinite(q) || q <= 0) return 0
  return q
}
