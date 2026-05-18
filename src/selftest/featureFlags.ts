/**
 * SpeedOrder feature flags — mock/demo defaults. Live trading flags must stay false.
 * Host apps may read this for fallback validation without opening the store.
 */
export type SpeedOrderFeatureFlags = {
  readonly mockRealtime: boolean
  readonly orderConfirmModal: boolean
  readonly conditionalOrders: boolean
  readonly vendorSnapshotExport: boolean
  readonly hedgePositionMode: boolean
  /** Must remain false in this repository */
  readonly liveTrading: boolean
  readonly liveWebSocketRequired: boolean
  /** Phase 1 — Stop/MIT trigger price lock from order book */
  readonly stopMitPriceLockEnabled: boolean
  /**
   * Lightweight 03-OneAI Signal Research Feed panel (mock adapter).
   * Host config alias: `speedorder.enableResearchFeedPanel`
   */
  readonly enableResearchFeedPanel: boolean
  /**
   * TGX-style order book panel (02-TGX-CEX reference).
   * Host alias: `speedorder.enableTgxOrderBook`
   */
  readonly enableTgxOrderBook: boolean
}

export const SPEED_ORDER_FEATURE_FLAGS: SpeedOrderFeatureFlags = {
  mockRealtime: true,
  orderConfirmModal: true,
  conditionalOrders: true,
  vendorSnapshotExport: true,
  hedgePositionMode: true,
  liveTrading: false,
  liveWebSocketRequired: false,
  stopMitPriceLockEnabled: true,
  enableResearchFeedPanel: true,
  enableTgxOrderBook: true,
} as const

export type FeatureFlagValidation = {
  ok: boolean
  issues: string[]
}

export function validateSpeedOrderFeatureFlags(
  flags: SpeedOrderFeatureFlags = SPEED_ORDER_FEATURE_FLAGS,
): FeatureFlagValidation {
  const issues: string[] = []
  if (flags.liveTrading) issues.push('liveTrading must be false in 05-SpeedOrder')
  if (flags.liveWebSocketRequired) {
    issues.push('liveWebSocketRequired must be false for offline self-test')
  }
  if (!flags.mockRealtime && !flags.liveTrading) {
    issues.push('mockRealtime off without liveTrading is an unsupported fallback')
  }
  return { ok: issues.length === 0, issues }
}
