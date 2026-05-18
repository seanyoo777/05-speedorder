/** 03-OneAI Signal Research Feed 호환 스키마 (05 mock — 외부 import 없음). */

export type ResearchFeedDirection = 'long' | 'short' | 'neutral'

export type ResearchFeedMarketType = 'crypto' | 'futures' | 'stock' | 'index'

export type ResearchFeedItem = {
  id: string
  strategyType: string
  direction: ResearchFeedDirection
  /** 0–100 mock confidence — not live model output */
  confidenceMock: number
  marketType: ResearchFeedMarketType
  tags: readonly string[]
  reasoningSummary: string
  marketRegimeRef: string
  symbolRef?: string
  publishedAt?: string
}

export type ResearchFeedSnapshot = {
  items: readonly ResearchFeedItem[]
  mockOnly: true
  source: 'mock_local_adapter'
}

export const RESEARCH_FEED_ITEM_KEYS: readonly (keyof ResearchFeedItem)[] = [
  'id',
  'strategyType',
  'direction',
  'confidenceMock',
  'marketType',
  'tags',
  'reasoningSummary',
  'marketRegimeRef',
] as const
