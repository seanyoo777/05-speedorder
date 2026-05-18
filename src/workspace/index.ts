/**
 * Trading workspace host export — embed surface for 02-CEX / 04-MockInvest / 07-UTE.
 */
export { TradingWorkspaceHost } from './TradingWorkspaceHost'
export { TradingWorkspaceHostProvider } from './TradingWorkspaceHostProvider'
export { useTradingWorkspaceHost } from './tradingWorkspaceHostContext'
export { TradingWorkspaceHostView } from './TradingWorkspaceHostView'
export type {
  TradingWorkspaceHostProps,
  TradingWorkspaceHostHeaderContext,
  TradingWorkspaceHostContextValue,
} from './tradingWorkspaceHostTypes'
export {
  applyTradingWorkspaceHostBootstrap,
  assertTradingWorkspaceHostMockOnly,
  notifyTradingWorkspaceHostChange,
  TRADING_WORKSPACE_HOST_EXPORT_SYMBOLS,
} from './tradingWorkspaceHostRuntime'
export { applyWorkspaceSlotToStore, orderFormPresetToTab } from './applyWorkspaceSlot'
export type { WorkspaceOrderFormTab } from './applyWorkspaceSlot'
export {
  readWorkspaceVendorSnapshot,
  readAllWorkspaceVendorSnapshots,
  readActiveWorkspaceVendorSnapshot,
  validateWorkspaceVendorSnapshot,
  countInvalidWorkspaceVendorSnapshots,
  workspaceVendorSnapshotContractKeys,
} from '../vendor/readWorkspaceVendorSnapshot'
export type { TradingWorkspaceVendorSnapshot } from '../vendor/readWorkspaceVendorSnapshot'
export {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_URL_PARAM,
  readWorkspaceIdFromUrl,
  resolveWorkspaceId,
  buildUrlSearchWithWorkspaceId,
  writeWorkspaceIdToUrl,
  isWorkspaceUrlInSync,
} from './tradingWorkspaceUrl'
