import type { ResearchFeedItem, ResearchFeedSnapshot } from './researchFeedTypes'

export type MockResearchFeedContext = {
  symbol: string
}

function hashSymbol(symbol: string): number {
  let h = 0
  for (let i = 0; i < symbol.length; i += 1) {
    h = (h + symbol.charCodeAt(i) * (i + 1)) % 997
  }
  return h
}

function buildItems(symbol: string): ResearchFeedItem[] {
  const h = hashSymbol(symbol)
  const marketType =
    symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH')
      ? 'crypto'
      : symbol === 'NASDAQ' || symbol === 'GOLD'
        ? 'futures'
        : symbol.length <= 5
          ? 'stock'
          : 'futures'

  return [
    {
      id: `${symbol}-rf-1`,
      strategyType: 'momentum_breakout',
      direction: h % 3 === 0 ? 'long' : h % 3 === 1 ? 'short' : 'neutral',
      confidenceMock: 58 + (h % 35),
      marketType,
      tags: ['oneai-mock', 'breakout', symbol],
      reasoningSummary: `${symbol} 단기 모멘텀·거래량 동반 구간 — mock projection only.`,
      marketRegimeRef: h % 2 === 0 ? 'trend_risk_on' : 'range_mean_revert',
      symbolRef: symbol,
      publishedAt: '09:42',
    },
    {
      id: `${symbol}-rf-2`,
      strategyType: 'volatility_regime',
      direction: 'neutral',
      confidenceMock: 42 + (h % 28),
      marketType,
      tags: ['iv-rank', 'regime'],
      reasoningSummary: 'IV percentile 상단·감마 wall 근접 관측 (static mock).',
      marketRegimeRef: 'vol_expansion_watch',
      symbolRef: symbol,
      publishedAt: '09:38',
    },
    {
      id: `${symbol}-rf-3`,
      strategyType: 'flow_skew',
      direction: h % 2 === 0 ? 'long' : 'short',
      confidenceMock: 51 + (h % 40),
      marketType,
      tags: ['aggressor', 'flow'],
      reasoningSummary: 'Aggressor buy skew 단기 우세 — no live API wiring.',
      marketRegimeRef: 'microstructure_flow',
      symbolRef: symbol,
      publishedAt: '09:35',
    },
  ]
}

/** Local mock adapter — future 03-OneAI feed replaces this module only. */
export function readMockResearchFeedSnapshot(ctx: MockResearchFeedContext): ResearchFeedSnapshot {
  return {
    items: buildItems(ctx.symbol),
    mockOnly: true,
    source: 'mock_local_adapter',
  }
}
