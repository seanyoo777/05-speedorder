import type { WorkspaceOrderFormTab } from '../../workspace/applyWorkspaceSlot'
import {
  buildOrderFormIntentSnapshot,
  resolveOneClickPolicyLabel,
  selectOrderFormIntentInputs,
  type OneClickPolicyLabel,
} from './orderFormIntentModel'
import { resolveTgxFormRhythmId, type TgxFormRhythmId } from './tgxFormRhythm'
import type { TradingStoreState } from '../../store/tradingStoreTypes'

export type OrderFormDiagnostics = {
  orderFormIntentVisible: boolean
  stopMitLockVisible: boolean
  oneClickPolicy: OneClickPolicyLabel
  tgxFormRhythm: TgxFormRhythmId
}

export function getOrderFormDiagnostics(
  state: Pick<
    TradingStoreState,
    | 'orderBookPendingLimitPrice'
    | 'orderBookPendingTriggerPrice'
    | 'orderBookPendingTriggerBookSide'
    | 'orderBookHighlightPrice'
    | 'stopMitDraft'
    | 'orderBookOneClickEnabled'
    | 'orderBookStyle'
    | 'orderBookRowDensity'
    | 'workspaceOrderFormTab'
  >,
): OrderFormDiagnostics {
  const intent = buildOrderFormIntentSnapshot(
    selectOrderFormIntentInputs(state),
    state.workspaceOrderFormTab,
  )
  return {
    orderFormIntentVisible: intent.hasVisibleIntent,
    stopMitLockVisible: state.stopMitDraft.priceLock.locked,
    oneClickPolicy: resolveOneClickPolicyLabel(
      state.orderBookOneClickEnabled,
      state.orderBookStyle,
    ),
    tgxFormRhythm: resolveTgxFormRhythmId(state.orderBookStyle, state.orderBookRowDensity),
  }
}

export function getOrderFormDiagnosticsForTab(
  state: Pick<
    TradingStoreState,
    | 'orderBookPendingLimitPrice'
    | 'orderBookPendingTriggerPrice'
    | 'orderBookPendingTriggerBookSide'
    | 'orderBookHighlightPrice'
    | 'stopMitDraft'
    | 'orderBookOneClickEnabled'
    | 'orderBookStyle'
    | 'orderBookRowDensity'
  >,
  tab: WorkspaceOrderFormTab,
): OrderFormDiagnostics {
  return getOrderFormDiagnostics({ ...state, workspaceOrderFormTab: tab })
}
