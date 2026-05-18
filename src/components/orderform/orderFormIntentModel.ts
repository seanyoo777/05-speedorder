import {
  resolveEffectiveOrderBookStyle,
  type OrderBookStyleId,
} from '../../config/orderBookStyle'
import type { PriceLockSource } from '../../domain/stopMitDraft'
import { SPEED_ORDER_FEATURE_FLAGS } from '../../selftest/featureFlags'
import type { TradingStoreState } from '../../store/tradingStoreTypes'
import type { WorkspaceOrderFormTab } from '../../workspace/applyWorkspaceSlot'

export type OrderFormIntentEmphasis = 'limit' | 'trigger' | 'neutral'

export type OrderFormIntentSnapshot = {
  limitIntent: number | null
  triggerIntent: number | null
  triggerBookSide: 'bid' | 'ask' | null
  stopMitLocked: boolean
  stopMitTriggerPrice: number | null
  lockSource: PriceLockSource
  lockBookSide: 'bid' | 'ask' | undefined
  emphasis: OrderFormIntentEmphasis
  hasVisibleIntent: boolean
}

export type OneClickPolicyLabel = 'disabled_intent_only' | 'enabled_legacy_path'

export function buildOrderFormIntentSnapshot(
  state: Pick<
    TradingStoreState,
    | 'orderBookPendingLimitPrice'
    | 'orderBookPendingTriggerPrice'
    | 'orderBookPendingTriggerBookSide'
    | 'orderBookHighlightPrice'
    | 'stopMitDraft'
  >,
  tab: WorkspaceOrderFormTab,
): OrderFormIntentSnapshot {
  const { stopMitDraft: d } = state
  const limitIntent =
    state.orderBookPendingLimitPrice ??
    (tab === 'standard' ? state.orderBookHighlightPrice : null)
  const triggerIntent =
    state.orderBookPendingTriggerPrice ??
    (d.priceLock.locked
      ? d.triggerPrice
      : tab === 'stopMit'
        ? state.orderBookHighlightPrice
        : null)

  const stopMitLocked = d.priceLock.locked
  const stopMitTriggerPrice = d.triggerPrice
  const hasVisibleIntent =
    limitIntent != null ||
    triggerIntent != null ||
    stopMitLocked ||
    state.orderBookHighlightPrice != null

  let emphasis: OrderFormIntentEmphasis = 'neutral'
  if (!hasVisibleIntent) {
    emphasis = 'neutral'
  } else if (tab === 'stopMit' && (stopMitLocked || triggerIntent != null)) {
    emphasis = 'trigger'
  } else if (tab === 'standard' && limitIntent != null) {
    emphasis = 'limit'
  } else if (limitIntent != null) {
    emphasis = 'limit'
  } else if (triggerIntent != null || stopMitLocked) {
    emphasis = 'trigger'
  }

  return {
    limitIntent,
    triggerIntent,
    triggerBookSide: state.orderBookPendingTriggerBookSide ?? d.priceLock.bookSide ?? null,
    stopMitLocked,
    stopMitTriggerPrice,
    lockSource: d.priceLock.source,
    lockBookSide: d.priceLock.bookSide,
    emphasis,
    hasVisibleIntent,
  }
}

export function resolveOneClickPolicyLabel(
  orderBookOneClickEnabled: boolean,
  orderBookStyle: OrderBookStyleId,
): OneClickPolicyLabel {
  const effective = resolveEffectiveOrderBookStyle(
    orderBookStyle,
    SPEED_ORDER_FEATURE_FLAGS.enableTgxOrderBook,
  )
  if (effective === 'tgx_style') return 'disabled_intent_only'
  return orderBookOneClickEnabled ? 'enabled_legacy_path' : 'disabled_intent_only'
}
