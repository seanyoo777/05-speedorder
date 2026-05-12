import { revaluePositions } from '../engine/mockExecutionEngine'
import {
  buildOrderBook,
  getInitialLastPrice,
  initialFills,
  initialOrders,
  initialPositions,
  initialTickers,
  MOCK_SYMBOL,
} from '../mock/mockData'
import { getSymbolSpec } from '../symbols/registry'

export const bootSpec = getSymbolSpec(MOCK_SYMBOL)
export const bootLast = getInitialLastPrice()
export const bootOrderBook = buildOrderBook(bootLast, bootSpec)
export const bootPositions = revaluePositions(initialPositions, initialTickers, MOCK_SYMBOL, bootLast)

export { initialFills, initialOrders, initialTickers }
