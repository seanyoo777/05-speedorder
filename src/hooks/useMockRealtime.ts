import { useEffect } from 'react'
import { simulateTick } from '../mock/mockSimulate'
import { useTradingStore } from '../store/tradingStore'

/** Mock-only: replace with `WebSocketClient` + store hydrators in host apps. */
export function useMockRealtime(enabled = true, intervalMs = 850): void {
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      const { lastPrice, tickers, applyMockTick } = useTradingStore.getState()
      const next = simulateTick(lastPrice, tickers)
      applyMockTick(next)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs])
}
