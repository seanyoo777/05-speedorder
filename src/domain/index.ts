/**
 * 공개 도메인 타입 — TGX / MockInvest / OneAI에서
 * `import type { … } from '05-SpeedOrder/src/domain'` 형태로 재사용 가능.
 */
export type {
  SymbolSpec,
  MarketType,
  SessionType,
  PnlFormulaType,
} from '../types/symbol'
export {
  DEFAULT_SYMBOL_SPEC,
  mergeSymbolSpec,
} from '../types/symbol'
export {
  calculatePnlBySpec,
  calculateMarginBySpec,
  roundPriceBySpec,
  roundQtyBySpec,
  feeNotionalAbsBySpec,
} from '../utils/specInstrument'
export type {
  OrderMode,
  OrderRequest,
  OrderStatus,
  ConditionalOrderType,
} from './order'
export type { Position, Fill } from './position'
export type { RiskSnapshot } from './risk'
export type {
  ConditionalOrderKind,
  ConditionalOrderRow,
  ConditionalOrderStatus,
  ConditionalOutcomeLabel,
} from '../types/trading'
export type {
  StopMitDraft,
  StopMitDraftPatch,
  PriceLockState,
  PriceLockSource,
} from './stopMitDraft'
export {
  createEmptyStopMitDraft,
  applyStopMitDraftPatch,
} from './stopMitDraft'
export type {
  TradingWorkspaceCategoryId,
  TradingWorkspaceCategory,
  TradingWorkspaceSlot,
  TradingWorkspaceSlotIndex,
  WorkspaceLayoutPresetId,
  OrderBookPresetId,
  OrderFormPresetId,
  PositionPanelPresetId,
  TradingWorkspaceCatalogValidation,
} from './tradingWorkspace'
export { buildWorkspaceId, parseWorkspaceId } from './tradingWorkspace'
export {
  TRADING_WORKSPACE_CATEGORIES,
  TRADING_WORKSPACE_SLOTS,
  listTradingWorkspaceCategories,
  listTradingWorkspaceSlots,
  getTradingWorkspaceSlot,
  getTradingWorkspaceCategory,
  listSlotsByCategory,
  validateTradingWorkspaceCatalog,
} from './tradingWorkspaceCatalog'
export {
  DEFAULT_RISK_SNAPSHOT,
  deriveRiskSnapshotFromPositions,
  mergeRiskSnapshotWithPositions,
} from './risk'
