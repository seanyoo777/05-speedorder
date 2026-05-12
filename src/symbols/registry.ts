import type { SymbolSpec } from '../types/symbol'

const DEFAULT: SymbolSpec = {
  symbol: 'BTCUSDT',
  displayName: 'BTC/USDT',
  marketType: 'crypto',
  tickSize: 0.5,
  lotSize: 0.001,
  priceDecimals: 2,
  qtyDecimals: 4,
  defaultLeverage: 10,
  referencePrice: 97_250,
}

export const SYMBOL_REGISTRY: Record<string, SymbolSpec> = {
  BTCUSDT: {
    symbol: 'BTCUSDT',
    displayName: 'BTC/USDT',
    marketType: 'crypto',
    tickSize: 0.5,
    lotSize: 0.001,
    priceDecimals: 2,
    qtyDecimals: 4,
    defaultLeverage: 10,
    referencePrice: 97_250,
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    displayName: 'ETH/USDT',
    marketType: 'crypto',
    tickSize: 0.05,
    lotSize: 0.001,
    priceDecimals: 2,
    qtyDecimals: 4,
    defaultLeverage: 10,
    referencePrice: 3_542,
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    displayName: 'SOL/USDT',
    marketType: 'futures',
    tickSize: 0.01,
    lotSize: 0.01,
    priceDecimals: 2,
    qtyDecimals: 2,
    defaultLeverage: 15,
    referencePrice: 178.5,
  },
  XRPUSDT: {
    symbol: 'XRPUSDT',
    displayName: 'XRP/USDT',
    marketType: 'crypto',
    tickSize: 0.0001,
    lotSize: 1,
    priceDecimals: 4,
    qtyDecimals: 2,
    defaultLeverage: 10,
    referencePrice: 2.31,
  },
  DOGEUSDT: {
    symbol: 'DOGEUSDT',
    displayName: 'DOGE/USDT',
    marketType: 'crypto',
    tickSize: 0.00001,
    lotSize: 10,
    priceDecimals: 5,
    qtyDecimals: 2,
    defaultLeverage: 10,
    referencePrice: 0.1624,
  },
  BNBUSDT: {
    symbol: 'BNBUSDT',
    displayName: 'BNB/USDT',
    marketType: 'crypto',
    tickSize: 0.05,
    lotSize: 0.001,
    priceDecimals: 2,
    qtyDecimals: 4,
    defaultLeverage: 10,
    referencePrice: 612.9,
  },
  NASDAQ: {
    symbol: 'NASDAQ',
    displayName: 'NASDAQ 100',
    marketType: 'index',
    tickSize: 0.25,
    lotSize: 1,
    priceDecimals: 2,
    qtyDecimals: 0,
    defaultLeverage: 5,
    referencePrice: 19_820,
  },
  GOLD: {
    symbol: 'GOLD',
    displayName: 'Gold',
    marketType: 'commodity',
    tickSize: 0.1,
    lotSize: 0.01,
    priceDecimals: 2,
    qtyDecimals: 3,
    defaultLeverage: 20,
    referencePrice: 2_345.6,
  },
}

export const STANDARD_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'BNBUSDT',
  'NASDAQ',
  'GOLD',
] as const

export function getSymbolSpec(symbol: string | undefined | null): SymbolSpec {
  if (!symbol) return DEFAULT
  const key = symbol.toUpperCase()
  return SYMBOL_REGISTRY[key] ?? { ...DEFAULT, symbol: key, displayName: key }
}

export function isListedSymbol(symbol: string): boolean {
  return symbol.toUpperCase() in SYMBOL_REGISTRY
}
