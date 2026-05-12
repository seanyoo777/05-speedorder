/** 모의·확장용 리스크 스냅샷 (TGX/MockInvest가 주입) */
import { getSymbolSpec } from '../symbols/registry'
import type { PositionRow } from '../types/trading'
import { calculateMarginBySpec } from '../utils/specInstrument'
import { safeArray } from '../utils/safe'

export type RiskSnapshot = {
  /** 모의 가용 USDT */
  freeUsdt: number
  /** 모의 사용 증거금 합(대략) */
  usedMarginUsdt: number
  /** 일일 손실 한도 (미사용 시 null) */
  dailyLossLimitUsdt: number | null
}

export const DEFAULT_RISK_SNAPSHOT: RiskSnapshot = {
  freeUsdt: 1_000_000,
  usedMarginUsdt: 0,
  dailyLossLimitUsdt: null,
}

export function deriveRiskSnapshotFromPositions(
  positions: PositionRow[],
  freeUsdt = DEFAULT_RISK_SNAPSHOT.freeUsdt,
): RiskSnapshot {
  let used = 0
  for (const p of safeArray(positions)) {
    if (!Number.isFinite(p.size) || p.size <= 0) continue
    const spec = getSymbolSpec(p.symbol)
    const mark = Number.isFinite(p.avgPrice) && p.avgPrice > 0 ? p.avgPrice : spec.referencePrice
    used += calculateMarginBySpec(spec, mark, p.size)
  }
  return {
    freeUsdt: Number.isFinite(freeUsdt) ? freeUsdt : DEFAULT_RISK_SNAPSHOT.freeUsdt,
    usedMarginUsdt: used,
    dailyLossLimitUsdt: null,
  }
}

/** 포지션 갱신 후 사용 증거금만 다시 계산하고 free·일일한도는 이전 값 유지 */
export function mergeRiskSnapshotWithPositions(
  positions: PositionRow[],
  prev: RiskSnapshot,
): RiskSnapshot {
  const base = deriveRiskSnapshotFromPositions(positions, prev.freeUsdt)
  return {
    ...base,
    dailyLossLimitUsdt: prev.dailyLossLimitUsdt,
  }
}
