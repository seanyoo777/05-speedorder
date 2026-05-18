import {
  displayRowCountForDensity,
  resolveEffectiveOrderBookStyle,
  type OrderBookRowDensityId,
  type OrderBookStyleId,
} from '../../config/orderBookStyle'
import { SPEED_ORDER_FEATURE_FLAGS } from '../../selftest/featureFlags'

export type OrderBookDiagnostics = {
  orderBookStyle: OrderBookStyleId
  tgxOrderBookEnabled: boolean
  orderBookRowDensity: OrderBookRowDensityId
  displayRowCount: number
}

export function getOrderBookDiagnostics(input: {
  orderBookStyle: OrderBookStyleId
  orderBookRowDensity: OrderBookRowDensityId
}): OrderBookDiagnostics {
  const tgxOrderBookEnabled = SPEED_ORDER_FEATURE_FLAGS.enableTgxOrderBook
  const orderBookStyle = resolveEffectiveOrderBookStyle(input.orderBookStyle, tgxOrderBookEnabled)
  return {
    orderBookStyle,
    tgxOrderBookEnabled,
    orderBookRowDensity: input.orderBookRowDensity,
    displayRowCount: displayRowCountForDensity(input.orderBookRowDensity),
  }
}
