import { createContext, useContext } from 'react'
import type { TradingWorkspaceHostContextValue } from './tradingWorkspaceHostTypes'

export const TradingWorkspaceHostContext = createContext<TradingWorkspaceHostContextValue | null>(
  null,
)

export function useTradingWorkspaceHost(): TradingWorkspaceHostContextValue {
  const ctx = useContext(TradingWorkspaceHostContext)
  if (!ctx) {
    throw new Error('useTradingWorkspaceHost must be used within TradingWorkspaceHostProvider')
  }
  return ctx
}
