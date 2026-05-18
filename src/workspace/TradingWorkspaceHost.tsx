import { TradingWorkspaceHostProvider } from './TradingWorkspaceHostProvider'
import { TradingWorkspaceHostView } from './TradingWorkspaceHostView'
import type { TradingWorkspaceHostProps } from './tradingWorkspaceHostTypes'

/**
 * 02-CEX / 04-MockInvest / 07-UTE embed entry — catalog + registry store + vendor snapshot.
 * Mock/demo only (`mockOnly: true`).
 */
export function TradingWorkspaceHost({
  className,
  ...providerProps
}: TradingWorkspaceHostProps) {
  return (
    <TradingWorkspaceHostProvider {...providerProps}>
      <TradingWorkspaceHostView className={className} />
    </TradingWorkspaceHostProvider>
  )
}
