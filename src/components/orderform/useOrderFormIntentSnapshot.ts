import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTradingStore } from '../../store/tradingStore'
import type { WorkspaceOrderFormTab } from '../../workspace/applyWorkspaceSlot'
import {
  buildOrderFormIntentSnapshot,
  resolveOneClickPolicyLabel,
  selectOrderFormIntentInputs,
  type OrderFormIntentSnapshot,
} from './orderFormIntentModel'

export function useOrderFormIntentSnapshot(tab: WorkspaceOrderFormTab): {
  snapshot: OrderFormIntentSnapshot
  oneClickPolicy: ReturnType<typeof resolveOneClickPolicyLabel>
} {
  const inputs = useTradingStore(useShallow(selectOrderFormIntentInputs))
  const oneClickPolicy = useTradingStore(
    useShallow((s) => resolveOneClickPolicyLabel(s.orderBookOneClickEnabled, s.orderBookStyle)),
  )

  const snapshot = useMemo(
    () => buildOrderFormIntentSnapshot(inputs, tab),
    [inputs, tab],
  )

  return { snapshot, oneClickPolicy }
}
