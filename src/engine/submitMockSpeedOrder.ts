import type { StoreApi } from 'zustand'
import { mergeRiskSnapshotWithPositions } from '../domain/risk'
import { executeNetSpeedFill, revaluePositions } from './mockExecutionEngine'
import { getSymbolSpec } from '../symbols/registry'
import type { OrderRecordRow, OrderSide } from '../types/trading'
import { roundPriceBySpec, roundQtyBySpec } from '../utils/specInstrument'
import { safeArray } from '../utils/safe'
import type { TradingStore } from '../store/tradingStoreTypes'

const MOCK_DELAY_SUBMIT_MS = 100
const MOCK_DELAY_ACCEPT_MS = 120

export type SubmitMockSpeedOrderInput = {
  side: OrderSide
  orderType: 'market' | 'limit'
  quantity: number
  limitPrice?: number
}

/** StoreApi를 받아 동일 시그니처의 제출 함수 생성 (TGX 등에서 커스텀 스토어에 연결 가능) */
export function createSubmitMockSpeedOrder(store: StoreApi<TradingStore>) {
  return function submitMockSpeedOrder(input: SubmitMockSpeedOrderInput): Promise<void> {
    const state = store.getState()
    if (state.mockOrderInFlightId != null) return Promise.resolve()

    const spec = getSymbolSpec(state.symbol)
    const rawQty = Number(input.quantity)
    const qty = roundQtyBySpec(spec, rawQty)
    if (!Number.isFinite(qty) || qty <= 0) return Promise.resolve()

    const rawExec =
      input.orderType === 'market' || input.limitPrice == null
        ? state.lastPrice
        : input.limitPrice

    if (!Number.isFinite(rawExec) || rawExec <= 0) return Promise.resolve()

    const execPrice = roundPriceBySpec(spec, rawExec)
    const limitStored =
      input.orderType === 'limit'
        ? roundPriceBySpec(spec, Number(input.limitPrice ?? rawExec))
        : null

    const id = `o-${Date.now()}`
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false })

    const baseOrder: OrderRecordRow = {
      id,
      symbol: state.symbol,
      side: input.side,
      type: input.orderType,
      price: input.orderType === 'limit' ? limitStored : null,
      quantity: qty,
      status: 'submitting',
      time,
    }

    state.setMockOrderInFlight(id)
    state.upsertOrder(baseOrder)

    return new Promise((resolve) => {
      window.setTimeout(() => {
        store.getState().upsertOrder({ ...baseOrder, status: 'accepted' })
        window.setTimeout(() => {
          const st = store.getState()
          const ts = Date.now()
          const { positions: traded, fill } = executeNetSpeedFill({
            positions: st.positions,
            symbol: st.symbol,
            side: input.side,
            quantity: qty,
            price: execPrice,
            fillId: `f-${id}`,
            timestamp: ts,
          })
          const positions = revaluePositions(traded, st.tickers, st.symbol, st.lastPrice)
          const orderFilled: OrderRecordRow = {
            ...baseOrder,
            status: 'filled',
            price: input.orderType === 'limit' ? limitStored : null,
          }
          store.setState((s) => {
            const list = safeArray(s.orders)
            const idx = list.findIndex((o) => o.id === id)
            const orders =
              idx === -1
                ? [orderFilled, ...list].slice(0, 200)
                : (() => {
                    const c = [...list]
                    c[idx] = orderFilled
                    return c
                  })()
            return {
              positions,
              fills: [fill, ...safeArray(s.fills)].slice(0, 200),
              orders,
              mockOrderInFlightId: null,
              riskSnapshot: mergeRiskSnapshotWithPositions(positions, s.riskSnapshot),
            }
          })
          resolve()
        }, MOCK_DELAY_ACCEPT_MS)
      }, MOCK_DELAY_SUBMIT_MS)
    })
  }
}
