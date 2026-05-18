import { SPEED_ORDER_FEATURE_FLAGS } from '../selftest/featureFlags'
import { readMockResearchFeedSnapshot } from './mockResearchFeedAdapter'

export type ResearchFeedDiagnostics = {
  researchFeedPanelEnabled: boolean
  researchFeedItemCount: number
  researchFeedMockOnly: boolean
}

export function getResearchFeedDiagnostics(symbol: string): ResearchFeedDiagnostics {
  const enabled = SPEED_ORDER_FEATURE_FLAGS.enableResearchFeedPanel
  if (!enabled) {
    return {
      researchFeedPanelEnabled: false,
      researchFeedItemCount: 0,
      researchFeedMockOnly: true,
    }
  }
  const snap = readMockResearchFeedSnapshot({ symbol })
  return {
    researchFeedPanelEnabled: true,
    researchFeedItemCount: snap.items.length,
    researchFeedMockOnly: snap.mockOnly === true,
  }
}
