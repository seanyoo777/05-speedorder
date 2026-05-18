import type { TradingStoreState } from '../../store/tradingStoreTypes'

export type PositionCloseDiagnostics = {
  closeIntentActive: boolean
  closeIntentRatio: number | null
  closeIntentOrderType: string | null
  selectedPositionCount: number
  mockCloseOnly: boolean
}

export function getPositionCloseDiagnostics(
  state: Pick<
    TradingStoreState,
    'positionCloseIntent' | 'positionCloseSelectedIds'
  >,
): PositionCloseDiagnostics {
  const intent = state.positionCloseIntent
  return {
    closeIntentActive: intent != null,
    closeIntentRatio: intent?.ratio ?? null,
    closeIntentOrderType: intent?.orderType ?? null,
    selectedPositionCount: state.positionCloseSelectedIds.length,
    mockCloseOnly: intent?.mockOnly === true || intent == null,
  }
}
