import { formatByDecimals } from '../../utils/format'
import { safeArray } from '../../utils/safe'

export type BookRow = { price: number; quantity: number; cum: number }

export function buildAskRows(asks: { price: number; quantity: number }[]): BookRow[] {
  const asc = [...safeArray(asks)].sort((a, b) => a.price - b.price)
  let cum = 0
  const withCum = asc.map((l) => {
    cum += l.quantity
    return { ...l, cum }
  })
  return [...withCum].reverse()
}

export function buildBidRows(bids: { price: number; quantity: number }[]): BookRow[] {
  const desc = [...safeArray(bids)].sort((a, b) => b.price - a.price)
  let cum = 0
  return desc.map((l) => {
    cum += l.quantity
    return { ...l, cum }
  })
}

export function sliceAskRows(rows: BookRow[], rowCount: number): BookRow[] {
  return rows.length > rowCount ? rows.slice(-rowCount) : rows
}

export function sliceBidRows(rows: BookRow[], rowCount: number): BookRow[] {
  return rows.length > rowCount ? rows.slice(0, rowCount) : rows
}

export function formatCumShort(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return '—'
  const ax = Math.abs(n)
  if (ax >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (ax >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return formatByDecimals(n, decimals)
}

export function depthBarMetrics(cum: number, qty: number, maxCum: number, maxQty: number) {
  const cr = Math.min(1, cum / maxCum)
  const qr = Math.min(1, qty / maxQty)
  const strength = Math.min(1, cr * 0.62 + Math.pow(qr, 0.78) * 0.38)
  const widthPct = strength * 100
  const alpha = 0.034 + 0.5 * Math.pow(strength, 0.45)
  return { widthPct, alpha, strength }
}

export function tgxDepthBarMetrics(cum: number, qty: number, maxCum: number, maxQty: number) {
  const base = depthBarMetrics(cum, qty, maxCum, maxQty)
  return {
    ...base,
    alpha: 0.06 + 0.62 * Math.pow(base.strength, 0.42),
  }
}
