import type { PositionRow, PositionSide } from '../types/trading'

export type CloseRatio = 25 | 50 | 80 | 100

export type CloseOrderType = 'market' | 'limit'

export type PositionCloseBatchMode =
  | 'single'
  | 'selected'
  | 'all'
  | 'long_only'
  | 'short_only'

export type PositionCloseIntent = {
  id: string
  positionId: string | null
  symbol: string
  side: PositionSide
  qty: number
  ratio: CloseRatio
  orderType: CloseOrderType
  referencePrice: number
  mockOnly: true
  batchMode: PositionCloseBatchMode
  positionIds: readonly string[]
  createdAt: number
}

export const CLOSE_RATIOS: readonly CloseRatio[] = [25, 50, 80, 100] as const

export function qtyForCloseRatio(size: number, ratio: CloseRatio, lotSize: number): number {
  const raw = (size * ratio) / 100
  if (!Number.isFinite(raw) || raw <= 0) return 0
  const steps = Math.max(1, Math.round(raw / lotSize))
  const q = steps * lotSize
  return Math.min(size, q)
}

export function resolveCloseReferencePrice(
  symbol: string,
  ctx: {
    symbol: string
    lastPrice: number
    tickers: { symbol: string; price: number }[]
    orderBookPendingLimitPrice: number | null
    orderType: CloseOrderType
  },
): number {
  if (ctx.orderType === 'limit' && ctx.orderBookPendingLimitPrice != null) {
    return ctx.orderBookPendingLimitPrice
  }
  const tk = ctx.tickers.find((t) => t.symbol === symbol)
  if (tk && Number.isFinite(tk.price) && tk.price > 0) return tk.price
  if (symbol === ctx.symbol && Number.isFinite(ctx.lastPrice) && ctx.lastPrice > 0) {
    return ctx.lastPrice
  }
  return 0
}

export function buildPositionCloseIntent(input: {
  position: PositionRow
  ratio: CloseRatio
  orderType: CloseOrderType
  referencePrice: number
  lotSize: number
  batchMode?: PositionCloseBatchMode
  positionIds?: readonly string[]
}): PositionCloseIntent {
  const qty = qtyForCloseRatio(input.position.size, input.ratio, input.lotSize)
  return {
    id: `close-intent-${input.position.id}-${Date.now()}`,
    positionId: input.position.id,
    symbol: input.position.symbol,
    side: input.position.side,
    qty,
    ratio: input.ratio,
    orderType: input.orderType,
    referencePrice: input.referencePrice,
    mockOnly: true,
    batchMode: input.batchMode ?? 'single',
    positionIds: input.positionIds ?? [input.position.id],
    createdAt: Date.now(),
  }
}

export function buildBatchPositionCloseIntent(input: {
  positions: readonly PositionRow[]
  ratio: CloseRatio
  orderType: CloseOrderType
  referencePrices: Record<string, number>
  lotSizes: Record<string, number>
  batchMode: Exclude<PositionCloseBatchMode, 'single'>
}): PositionCloseIntent | null {
  const ids = input.positions.map((p) => p.id)
  if (ids.length === 0) return null
  const primary = input.positions[0]!
  const ref =
    input.referencePrices[primary.symbol] ??
    primary.avgPrice
  const lot = input.lotSizes[primary.symbol] ?? 0.01
  const totalQty = input.positions.reduce(
    (sum, p) => sum + qtyForCloseRatio(p.size, input.ratio, input.lotSizes[p.symbol] ?? lot),
    0,
  )
  return {
    id: `close-batch-${input.batchMode}-${Date.now()}`,
    positionId: null,
    symbol: primary.symbol,
    side: primary.side,
    qty: totalQty,
    ratio: input.ratio,
    orderType: input.orderType,
    referencePrice: ref,
    mockOnly: true,
    batchMode: input.batchMode,
    positionIds: ids,
    createdAt: Date.now(),
  }
}

export function formatCloseIntentSummary(intent: PositionCloseIntent): string {
  const target =
    intent.batchMode === 'single'
      ? intent.symbol
      : `${intent.batchMode} · ${intent.positionIds.length} pos`
  return `${target} · ${intent.side} · ${intent.ratio}% · ${intent.orderType} @ ${intent.referencePrice} · qty ${intent.qty}`
}
