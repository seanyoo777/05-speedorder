/**
 * @deprecated 호스트 코드는 `../engine/mockExecutionEngine`을 사용하세요.
 * 하위 호환을 위해 기존 경로에서 재export합니다.
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
  partialClosePosition,
  reversePosition,
  revaluePositions,
  executeNetSpeedFill,
  applyFillToPosition,
} from '../engine/mockExecutionEngine'
