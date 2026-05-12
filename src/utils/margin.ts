import type { SymbolSpec } from '../types/symbol'
import { calculateMarginBySpec } from './specInstrument'

/** 모의 예상 증거금 — `SymbolSpec` 기준 (상품별 노셔널·레버리지) */
export function estimateInitialMarginUsdt(spec: SymbolSpec, price: number, quantity: number): number {
  return calculateMarginBySpec(spec, price, quantity)
}
