import {
  resolveEffectiveOrderBookStyle,
  type OrderBookStyleId,
} from '../../config/orderBookStyle'
import type { PriceLockSource } from '../../domain/stopMitDraft'
import { SPEED_ORDER_FEATURE_FLAGS } from '../../selftest/featureFlags'
import type { TradingStoreState } from '../../store/tradingStoreTypes'
import type { WorkspaceOrderFormTab } from '../../workspace/applyWorkspaceSlot'

export type OrderFormIntentEmphasis = 'limit' | 'trigger' | 'neutral'

export type OrderFormIntentInputs = {
  orderBookPendingLimitPrice: number | null
  orderBookPendingTriggerPrice: number | null
  orderBookPendingTriggerBookSide: 'bid' | 'ask' | null
  orderBookHighlightPrice: number | null
  stopMitLocked: boolean
  stopMitTriggerPrice: number | null
  stopMitLockSource: PriceLockSource
  stopMitLockBookSide: 'bid' | 'ask' | undefined
}

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

export function selectOrderFormIntentInputs(
  state: Pick<
    TradingStoreState,
    | 'orderBookPendingLimitPrice'
    | 'orderBookPendingTriggerPrice'
    | 'orderBookPendingTriggerBookSide'
    | 'orderBookHighlightPrice'
    | 'stopMitDraft'
  >,
): OrderFormIntentInputs {
  const d = state.stopMitDraft
  return {
    orderBookPendingLimitPrice: state.orderBookPendingLimitPrice,
    orderBookPendingTriggerPrice: state.orderBookPendingTriggerPrice,
    orderBookPendingTriggerBookSide: state.orderBookPendingTriggerBookSide,
    orderBookHighlightPrice: state.orderBookHighlightPrice,
    stopMitLocked: d.priceLock.locked,
    stopMitTriggerPrice: d.triggerPrice,
    stopMitLockSource: d.priceLock.source,
    stopMitLockBookSide: d.priceLock.bookSide,
  }
}

export function areOrderFormIntentSnapshotsEqual(
  a: OrderFormIntentSnapshot,
  b: OrderFormIntentSnapshot,
): boolean {
  return (
    a.limitIntent === b.limitIntent &&
    a.triggerIntent === b.triggerIntent &&
    a.triggerBookSide === b.triggerBookSide &&
    a.stopMitLocked === b.stopMitLocked &&
    a.stopMitTriggerPrice === b.stopMitTriggerPrice &&
    a.lockSource === b.lockSource &&
    a.lockBookSide === b.lockBookSide &&
    a.emphasis === b.emphasis &&
    a.hasVisibleIntent === b.hasVisibleIntent
  )
}

export function buildOrderFormIntentSnapshot(
  state: OrderFormIntentInputs,
  tab: WorkspaceOrderFormTab,
): OrderFormIntentSnapshot {
  const limitIntent =
    state.orderBookPendingLimitPrice ??
    (tab === 'standard' ? state.orderBookHighlightPrice : null)
  const triggerIntent =
    state.orderBookPendingTriggerPrice ??
    (state.stopMitLocked
      ? state.stopMitTriggerPrice
      : tab === 'stopMit'
        ? state.orderBookHighlightPrice
        : null)

  const stopMitLocked = state.stopMitLocked
  const stopMitTriggerPrice = state.stopMitTriggerPrice
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
    triggerBookSide: state.orderBookPendingTriggerBookSide ?? state.stopMitLockBookSide ?? null,
    stopMitLocked,
    stopMitTriggerPrice,
    lockSource: state.stopMitLockSource,
    lockBookSide: state.stopMitLockBookSide,
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
