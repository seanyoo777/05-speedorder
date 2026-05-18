/**
 * Order engine public surface — TGX / UTE / standalone 앱에서 동일 import 경로로 사용.
 * 실거래 API는 포함하지 않으며 mock 체결·조건주 시뮬레이션만 제공합니다.
 */
export {
  MOCK_FEE_BPS,
  estimateTradeFee,
  marginNotional,
  calculateAveragePrice,
  calculateUnrealizedPnlLong,
  calculateUnrealizedPnlForPosition,
  calculateUnrealizedPnlForPositionWithSpec,
  calculateRealizedPnlLongClose,
  calculateRealizedPnlShortClose,
  positionRowId,
  positionRowIdHedge,
  partialClosePosition,
  reversePosition,
  revaluePositions,
  executeNetSpeedFill,
  executeHedgeSpeedFill,
  executeSpeedOrderFill,
  applyFillToPosition,
} from './mockExecutionEngine'
export type { SpeedFillPositionMode } from './mockExecutionEngine'

export { createSubmitMockSpeedOrder } from './submitMockSpeedOrder'
export type { SubmitMockSpeedOrderInput } from './submitMockSpeedOrder'

export { executeImmediateMockMarketOrder } from './immediateMarketFill'

export {
  mitStopTriggerCrossed,
  classifyConditionalOutcome,
  runConditionalOrdersOnTick,
} from './conditionalOrderRunner'
export type { ConditionalTickSlice } from './conditionalOrderRunner'
