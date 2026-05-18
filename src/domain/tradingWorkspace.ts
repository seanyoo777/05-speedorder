import type { OrderBookDesignPresetId } from '../config/orderBookDesignPresets'
import type { MarketType } from '../types/symbol'

/** HTS 메뉴 / 호스트 탭 — 5개 고정 */
export type TradingWorkspaceCategoryId =
  | 'domestic_futures'
  | 'overseas_futures'
  | 'crypto'
  | 'domestic_stock'
  | 'us_stock'

export type WorkspaceLayoutPresetId =
  | 'hts_standard'
  | 'hts_compact'
  | 'order_column_only'

export type OrderBookPresetId = OrderBookDesignPresetId

export type OrderFormPresetId = 'speed_standard' | 'speed_confirm' | 'stop_mit_tab'

export type PositionPanelPresetId = 'single_symbol' | 'all_symbols' | 'category_filtered'

export type TradingWorkspaceSlotIndex = 1 | 2 | 3

export type TradingWorkspaceCategory = {
  id: TradingWorkspaceCategoryId
  labelKo: string
  defaultSlotCount: TradingWorkspaceSlotIndex
  marketTypes: readonly MarketType[]
  defaultQuoteCurrencies?: readonly string[]
}

export type TradingWorkspaceSlot = {
  workspaceId: string
  categoryId: TradingWorkspaceCategoryId
  slotIndex: TradingWorkspaceSlotIndex
  displayName: string
  assetClass: TradingWorkspaceCategoryId
  layoutPreset: WorkspaceLayoutPresetId
  orderBookPreset: OrderBookPresetId
  orderFormPreset: OrderFormPresetId
  positionPanelPreset: PositionPanelPresetId
  stopMitLockEnabled: boolean
  positionCloseEnabled: boolean
  mockOnly: true
  initialSymbol?: string
}

export type TradingWorkspaceCatalogValidation = {
  ok: boolean
  issues: string[]
  categoryCount: number
  slotCount: number
  invalidCount: number
}

export function buildWorkspaceId(
  categoryId: TradingWorkspaceCategoryId,
  slotIndex: TradingWorkspaceSlotIndex,
): string {
  return `${categoryId}:${slotIndex}`
}

export function parseWorkspaceId(
  workspaceId: string,
): { categoryId: TradingWorkspaceCategoryId; slotIndex: TradingWorkspaceSlotIndex } | null {
  const m = /^([a-z_]+):([123])$/.exec(workspaceId)
  if (!m) return null
  const categoryId = m[1] as TradingWorkspaceCategoryId
  const slotIndex = Number(m[2]) as TradingWorkspaceSlotIndex
  if (slotIndex !== 1 && slotIndex !== 2 && slotIndex !== 3) return null
  return { categoryId, slotIndex }
}
