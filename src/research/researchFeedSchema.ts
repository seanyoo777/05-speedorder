import type { ResearchFeedItem, ResearchFeedSnapshot } from './researchFeedTypes'
import { RESEARCH_FEED_ITEM_KEYS } from './researchFeedTypes'

const VALID_DIRECTIONS = new Set(['long', 'short', 'neutral'])
const VALID_MARKET_TYPES = new Set(['crypto', 'futures', 'stock', 'index'])

export function validateResearchFeedItem(item: ResearchFeedItem): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  for (const key of RESEARCH_FEED_ITEM_KEYS) {
    if (!(key in item)) issues.push(`missing ${key}`)
  }
  if (!VALID_DIRECTIONS.has(item.direction)) issues.push(`invalid direction: ${item.direction}`)
  if (!VALID_MARKET_TYPES.has(item.marketType)) issues.push(`invalid marketType: ${item.marketType}`)
  if (!Number.isFinite(item.confidenceMock) || item.confidenceMock < 0 || item.confidenceMock > 100) {
    issues.push('confidenceMock out of range 0–100')
  }
  if (!Array.isArray(item.tags) || item.tags.length === 0) issues.push('tags empty')
  if (!item.reasoningSummary.trim()) issues.push('reasoningSummary empty')
  if (!item.marketRegimeRef.trim()) issues.push('marketRegimeRef empty')
  if (!item.strategyType.trim()) issues.push('strategyType empty')
  return { valid: issues.length === 0, issues }
}

export function validateResearchFeedSnapshot(
  snap: ResearchFeedSnapshot,
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  if (snap.mockOnly !== true) issues.push('mockOnly must be true')
  if (snap.source !== 'mock_local_adapter') issues.push('source must be mock_local_adapter')
  if (snap.items.length === 0) issues.push('items empty')
  for (const item of snap.items) {
    const v = validateResearchFeedItem(item)
    if (!v.valid) issues.push(`${item.id}: ${v.issues.join(', ')}`)
  }
  return { valid: issues.length === 0, issues }
}
