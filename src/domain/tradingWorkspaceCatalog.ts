import { ORDER_BOOK_PRESET_ORDER } from '../config/orderBookDesignPresets'
import type {
  OrderFormPresetId,
  TradingWorkspaceCatalogValidation,
  TradingWorkspaceCategory,
  TradingWorkspaceCategoryId,
  TradingWorkspaceSlot,
  TradingWorkspaceSlotIndex,
  WorkspaceLayoutPresetId,
} from './tradingWorkspace'
import {
  buildWorkspaceId,
  parseWorkspaceId,
  type OrderBookPresetId,
  type PositionPanelPresetId,
} from './tradingWorkspace'

const SLOT_INDICES: readonly TradingWorkspaceSlotIndex[] = [1, 2, 3]

export const TRADING_WORKSPACE_CATEGORIES: readonly TradingWorkspaceCategory[] = [
  {
    id: 'domestic_futures',
    labelKo: '국내선물',
    defaultSlotCount: 3,
    marketTypes: ['futures', 'index'],
    defaultQuoteCurrencies: ['KRW'],
  },
  {
    id: 'overseas_futures',
    labelKo: '해외선물',
    defaultSlotCount: 3,
    marketTypes: ['futures', 'commodity', 'forex', 'index'],
    defaultQuoteCurrencies: ['USD'],
  },
  {
    id: 'crypto',
    labelKo: '코인',
    defaultSlotCount: 3,
    marketTypes: ['crypto'],
    defaultQuoteCurrencies: ['USDT'],
  },
  {
    id: 'domestic_stock',
    labelKo: '국내주식',
    defaultSlotCount: 3,
    marketTypes: ['stock'],
    defaultQuoteCurrencies: ['KRW'],
  },
  {
    id: 'us_stock',
    labelKo: '미국주식',
    defaultSlotCount: 3,
    marketTypes: ['stock'],
    defaultQuoteCurrencies: ['USD'],
  },
] as const

type CategoryPresetBundle = {
  layoutPreset: WorkspaceLayoutPresetId
  orderBookPreset: OrderBookPresetId
  orderFormPreset: OrderFormPresetId
  positionPanelPreset: PositionPanelPresetId
  stopMitLockEnabled: boolean
  positionCloseEnabled: boolean
  initialSymbol?: string
}

const CATEGORY_PRESETS: Record<TradingWorkspaceCategoryId, CategoryPresetBundle> = {
  domestic_futures: {
    layoutPreset: 'hts_standard',
    orderBookPreset: 'korean_hts_pro',
    orderFormPreset: 'stop_mit_tab',
    positionPanelPreset: 'category_filtered',
    stopMitLockEnabled: true,
    positionCloseEnabled: true,
    initialSymbol: 'NASDAQ',
  },
  overseas_futures: {
    layoutPreset: 'hts_standard',
    orderBookPreset: 'korean_hts_pro',
    orderFormPreset: 'stop_mit_tab',
    positionPanelPreset: 'category_filtered',
    stopMitLockEnabled: true,
    positionCloseEnabled: true,
    initialSymbol: 'GOLD',
  },
  crypto: {
    layoutPreset: 'hts_standard',
    orderBookPreset: 'global_crypto',
    orderFormPreset: 'stop_mit_tab',
    positionPanelPreset: 'single_symbol',
    stopMitLockEnabled: true,
    positionCloseEnabled: true,
    initialSymbol: 'BTCUSDT',
  },
  domestic_stock: {
    layoutPreset: 'hts_standard',
    orderBookPreset: 'korean_hts',
    orderFormPreset: 'speed_confirm',
    positionPanelPreset: 'single_symbol',
    stopMitLockEnabled: true,
    positionCloseEnabled: true,
  },
  us_stock: {
    layoutPreset: 'hts_standard',
    orderBookPreset: 'korean_hts',
    orderFormPreset: 'speed_confirm',
    positionPanelPreset: 'single_symbol',
    stopMitLockEnabled: true,
    positionCloseEnabled: true,
    initialSymbol: 'AAPL',
  },
}

function buildSlot(
  category: TradingWorkspaceCategory,
  slotIndex: TradingWorkspaceSlotIndex,
): TradingWorkspaceSlot {
  const preset = CATEGORY_PRESETS[category.id]
  return {
    workspaceId: buildWorkspaceId(category.id, slotIndex),
    categoryId: category.id,
    slotIndex,
    displayName: `${category.labelKo} ${slotIndex}번 거래창`,
    assetClass: category.id,
    layoutPreset: preset.layoutPreset,
    orderBookPreset: preset.orderBookPreset,
    orderFormPreset: preset.orderFormPreset,
    positionPanelPreset: preset.positionPanelPreset,
    stopMitLockEnabled: preset.stopMitLockEnabled,
    positionCloseEnabled: preset.positionCloseEnabled,
    mockOnly: true,
    initialSymbol: preset.initialSymbol,
  }
}

export const TRADING_WORKSPACE_SLOTS: readonly TradingWorkspaceSlot[] =
  TRADING_WORKSPACE_CATEGORIES.flatMap((category) =>
    SLOT_INDICES.map((slotIndex) => buildSlot(category, slotIndex)),
  )

const categoryById = new Map(
  TRADING_WORKSPACE_CATEGORIES.map((c) => [c.id, c] as const),
)

const slotByWorkspaceId = new Map(
  TRADING_WORKSPACE_SLOTS.map((s) => [s.workspaceId, s] as const),
)

const slotsByCategoryId = new Map<TradingWorkspaceCategoryId, TradingWorkspaceSlot[]>()
for (const slot of TRADING_WORKSPACE_SLOTS) {
  const list = slotsByCategoryId.get(slot.categoryId) ?? []
  list.push(slot)
  slotsByCategoryId.set(slot.categoryId, list)
}

const VALID_LAYOUT: ReadonlySet<WorkspaceLayoutPresetId> = new Set([
  'hts_standard',
  'hts_compact',
  'order_column_only',
])

const VALID_ORDER_FORM: ReadonlySet<OrderFormPresetId> = new Set([
  'speed_standard',
  'speed_confirm',
  'stop_mit_tab',
])

const VALID_POSITION_PANEL: ReadonlySet<PositionPanelPresetId> = new Set([
  'single_symbol',
  'all_symbols',
  'category_filtered',
])

const VALID_ORDER_BOOK = new Set<string>(ORDER_BOOK_PRESET_ORDER)

export function listTradingWorkspaceCategories(): readonly TradingWorkspaceCategory[] {
  return TRADING_WORKSPACE_CATEGORIES
}

export function listTradingWorkspaceSlots(): readonly TradingWorkspaceSlot[] {
  return TRADING_WORKSPACE_SLOTS
}

export function getTradingWorkspaceSlot(workspaceId: string): TradingWorkspaceSlot | undefined {
  return slotByWorkspaceId.get(workspaceId)
}

export function listSlotsByCategory(
  categoryId: TradingWorkspaceCategoryId,
): readonly TradingWorkspaceSlot[] {
  return slotsByCategoryId.get(categoryId) ?? []
}

export function getTradingWorkspaceCategory(
  categoryId: TradingWorkspaceCategoryId,
): TradingWorkspaceCategory | undefined {
  return categoryById.get(categoryId)
}

export function validateTradingWorkspaceCatalog(): TradingWorkspaceCatalogValidation {
  const issues: string[] = []
  let invalidCount = 0

  const bump = (msg: string) => {
    issues.push(msg)
    invalidCount += 1
  }

  if (TRADING_WORKSPACE_CATEGORIES.length !== 5) {
    bump(`expected 5 categories, got ${TRADING_WORKSPACE_CATEGORIES.length}`)
  }

  if (TRADING_WORKSPACE_SLOTS.length !== 15) {
    bump(`expected 15 slots, got ${TRADING_WORKSPACE_SLOTS.length}`)
  }

  const seenIds = new Set<string>()
  for (const slot of TRADING_WORKSPACE_SLOTS) {
    if (seenIds.has(slot.workspaceId)) bump(`duplicate workspaceId: ${slot.workspaceId}`)
    seenIds.add(slot.workspaceId)

    if (slot.mockOnly !== true) bump(`${slot.workspaceId}: mockOnly must be true`)

    const parsed = parseWorkspaceId(slot.workspaceId)
    if (!parsed) bump(`${slot.workspaceId}: invalid workspaceId format`)
    else if (parsed.categoryId !== slot.categoryId || parsed.slotIndex !== slot.slotIndex) {
      bump(`${slot.workspaceId}: id parts mismatch category/slotIndex`)
    }

    if (slot.assetClass !== slot.categoryId) {
      bump(`${slot.workspaceId}: assetClass must match categoryId`)
    }

    if (!getTradingWorkspaceCategory(slot.categoryId)) {
      bump(`${slot.workspaceId}: unknown categoryId ${slot.categoryId}`)
    }

    if (!VALID_LAYOUT.has(slot.layoutPreset)) bump(`${slot.workspaceId}: invalid layoutPreset`)
    if (!VALID_ORDER_BOOK.has(slot.orderBookPreset)) bump(`${slot.workspaceId}: invalid orderBookPreset`)
    if (!VALID_ORDER_FORM.has(slot.orderFormPreset)) bump(`${slot.workspaceId}: invalid orderFormPreset`)
    if (!VALID_POSITION_PANEL.has(slot.positionPanelPreset)) {
      bump(`${slot.workspaceId}: invalid positionPanelPreset`)
    }
  }

  for (const category of TRADING_WORKSPACE_CATEGORIES) {
    const slots = listSlotsByCategory(category.id)
    if (slots.length !== 3) {
      bump(`category ${category.id}: expected 3 slots, got ${slots.length}`)
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    categoryCount: TRADING_WORKSPACE_CATEGORIES.length,
    slotCount: TRADING_WORKSPACE_SLOTS.length,
    invalidCount,
  }
}
