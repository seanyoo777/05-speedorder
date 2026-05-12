import type { OrderBookSnapshot, TickerRow } from '../types/trading'
import { buildOrderBook } from './mockData'
import { getSymbolSpec } from '../symbols/registry'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function jitter(price: number, maxPct: number): number {
  const delta = (Math.random() - 0.5) * 2 * maxPct * price
  return price + delta
}

export function simulateTick(
  activeSymbol: string,
  lastPrice: number,
  tickers: TickerRow[],
): { lastPrice: number; orderBook: OrderBookSnapshot; tickers: TickerRow[] } {
  const spec = getSymbolSpec(activeSymbol)
  const nextLast = clamp(jitter(lastPrice, 0.00015), lastPrice * 0.985, lastPrice * 1.015)
  const nextTickers = tickers.map((t) => {
    if (t.symbol === activeSymbol) {
      const p = nextLast
      const prev = t.price || p
      const inst = ((p - prev) / prev) * 100
      const changePct = clamp(t.changePct * 0.85 + inst * 0.15 + (Math.random() - 0.5) * 0.02, -2, 2)
      return { ...t, price: p, changePct }
    }
    const p = clamp(jitter(t.price, 0.0002), t.price * 0.998, t.price * 1.002)
    const prev = t.price || p
    const inst = ((p - prev) / prev) * 100
    const changePct = clamp(t.changePct * 0.9 + inst * 0.1 + (Math.random() - 0.5) * 0.03, -1.5, 1.5)
    return { ...t, price: p, changePct }
  })

  return {
    lastPrice: nextLast,
    orderBook: buildOrderBook(nextLast, spec),
    tickers: nextTickers,
  }
}
