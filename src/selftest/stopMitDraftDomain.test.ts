import { describe, expect, it } from 'vitest'
import { applyStopMitDraftPatch, createEmptyStopMitDraft } from '../domain/stopMitDraft'

const round = (p: number) => Math.round(p * 10) / 10

describe('stopMitDraft domain', () => {
  it('lockFromBook fixes triggerPrice', () => {
    let d = createEmptyStopMitDraft('BTCUSDT')
    d = applyStopMitDraftPatch(d, { op: 'lockFromBook', price: 100.07, bookSide: 'ask' }, round)
    expect(d.priceLock.locked).toBe(true)
    expect(d.priceLock.source).toBe('orderbook')
    expect(d.triggerPrice).toBe(100.1)
    expect(d.priceLock.bookSide).toBe('ask')
  })

  it('reclick updates locked price', () => {
    let d = createEmptyStopMitDraft('BTCUSDT')
    d = applyStopMitDraftPatch(d, { op: 'lockFromBook', price: 100, bookSide: 'bid' }, round)
    d = applyStopMitDraftPatch(d, { op: 'lockFromBook', price: 200, bookSide: 'ask' }, round)
    expect(d.triggerPrice).toBe(200)
    expect(d.priceLock.bookSide).toBe('ask')
  })

  it('manual sets source manual while locked', () => {
    let d = createEmptyStopMitDraft('BTCUSDT')
    d = applyStopMitDraftPatch(d, { op: 'setManualPrice', price: 50.5 }, round)
    expect(d.priceLock.source).toBe('manual')
    expect(d.priceLock.locked).toBe(true)
    expect(d.triggerPrice).toBe(50.5)
  })

  it('unlock clears trigger', () => {
    let d = createEmptyStopMitDraft('BTCUSDT')
    d = applyStopMitDraftPatch(d, { op: 'lockFromBook', price: 100, bookSide: 'bid' }, round)
    d = applyStopMitDraftPatch(d, { op: 'unlock' }, round)
    expect(d.priceLock.locked).toBe(false)
    expect(d.triggerPrice).toBeNull()
  })

  it('resetForSymbol clears lock', () => {
    let d = createEmptyStopMitDraft('BTCUSDT')
    d = applyStopMitDraftPatch(d, { op: 'lockFromBook', price: 100, bookSide: 'bid' }, round)
    d = applyStopMitDraftPatch(d, { op: 'resetForSymbol', symbol: 'ETHUSDT' }, round)
    expect(d.symbol).toBe('ETHUSDT')
    expect(d.priceLock.locked).toBe(false)
    expect(d.triggerPrice).toBeNull()
  })
})
