import type { TradingStore } from '../store/tradingStoreTypes'
import type { SelfTestCheckResult, SelfTestStatus } from './types'

function runCheck(
  id: string,
  label: string,
  fn: () => { status: SelfTestStatus; message: string },
): SelfTestCheckResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  try {
    const { status, message } = fn()
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    return { id, label, status, message, durationMs: Math.round(t1 - t0) }
  } catch (e) {
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const msg = e instanceof Error ? e.message : String(e)
    return { id, label, status: 'fail', message: `Exception: ${msg}`, durationMs: Math.round(t1 - t0) }
  }
}

type StoreApi = {
  getState: () => TradingStore
  setState: (partial: Partial<TradingStore> | ((s: TradingStore) => Partial<TradingStore>)) => void
}

function withStoreRestore<T>(store: StoreApi, run: () => T): T {
  const snap = {
    stopMitDraft: store.getState().stopMitDraft,
    lastPrice: store.getState().lastPrice,
    symbol: store.getState().symbol,
    orderBookPendingTriggerPrice: store.getState().orderBookPendingTriggerPrice,
    orderBookPendingTriggerBookSide: store.getState().orderBookPendingTriggerBookSide,
  }
  try {
    return run()
  } finally {
    store.setState({
      stopMitDraft: snap.stopMitDraft,
      lastPrice: snap.lastPrice,
      symbol: snap.symbol,
      orderBookPendingTriggerPrice: snap.orderBookPendingTriggerPrice,
      orderBookPendingTriggerBookSide: snap.orderBookPendingTriggerBookSide,
    })
  }
}

export function runStopMitDraftChecks(store: StoreApi): SelfTestCheckResult[] {
  return [
    runCheck('stop-mit-lock-holds-on-tick', 'Stop/MIT lock holds on tick', () => {
      return withStoreRestore(store, () => {
        const s = store.getState()
        s.patchStopMitDraft({ op: 'lockFromBook', price: 50_000, bookSide: 'bid' })
        const locked = store.getState().stopMitDraft.triggerPrice
        if (locked == null) return { status: 'fail', message: 'Lock did not set triggerPrice' }
        const nextLp = locked + 1_000
        s.applyLastPrice(nextLp)
        const after = store.getState().stopMitDraft.triggerPrice
        if (after !== locked) {
          return { status: 'fail', message: `triggerPrice changed ${locked} → ${after} after lastPrice tick` }
        }
        if (store.getState().lastPrice !== nextLp) {
          return { status: 'warn', message: 'lastPrice did not update (tick path skipped)' }
        }
        return { status: 'pass', message: `Locked ${locked} unchanged after lastPrice=${nextLp}` }
      })
    }),

    runCheck('stop-mit-book-reclick-updates', 'Stop/MIT book reclick updates lock', () => {
      return withStoreRestore(store, () => {
        const s = store.getState()
        s.patchStopMitDraft({ op: 'lockFromBook', price: 100, bookSide: 'bid' })
        s.patchStopMitDraft({ op: 'lockFromBook', price: 200, bookSide: 'ask' })
        const d = store.getState().stopMitDraft
        if (d.triggerPrice !== 200) {
          return { status: 'fail', message: `Expected 200, got ${d.triggerPrice}` }
        }
        if (d.priceLock.source !== 'orderbook' || d.priceLock.bookSide !== 'ask') {
          return { status: 'fail', message: 'Reclick did not update orderbook lock metadata' }
        }
        return { status: 'pass', message: 'Reclick updated trigger to 200 (ask)' }
      })
    }),

    runCheck('stop-mit-symbol-reset', 'Stop/MIT symbol reset clears lock', () => {
      return withStoreRestore(store, () => {
        const s = store.getState()
        const origSym = s.symbol
        const alt = origSym === 'BTCUSDT' ? 'ETHUSDT' : 'BTCUSDT'
        s.patchStopMitDraft({ op: 'lockFromBook', price: 100, bookSide: 'bid' })
        s.setSymbol(alt)
        const d = store.getState().stopMitDraft
        if (d.priceLock.locked || d.triggerPrice != null) {
          return { status: 'fail', message: 'Lock not cleared after setSymbol' }
        }
        if (d.symbol !== alt) {
          return { status: 'fail', message: `Draft symbol ${d.symbol} !== ${alt}` }
        }
        s.setSymbol(origSym)
        return { status: 'pass', message: `Lock cleared on symbol → ${alt}` }
      })
    }),

    runCheck('stop-mit-manual-overrides', 'Stop/MIT manual price override', () => {
      return withStoreRestore(store, () => {
        const s = store.getState()
        s.patchStopMitDraft({ op: 'lockFromBook', price: 100, bookSide: 'bid' })
        s.patchStopMitDraft({ op: 'setManualPrice', price: 150 })
        const d = store.getState().stopMitDraft
        if (d.priceLock.source !== 'manual') {
          return { status: 'fail', message: `Expected manual source, got ${d.priceLock.source}` }
        }
        if (!d.priceLock.locked || d.triggerPrice !== 150) {
          return { status: 'fail', message: 'Manual lock price not applied' }
        }
        return { status: 'pass', message: 'Manual source=manual, price=150' }
      })
    }),

    runCheck('stop-mit-consume-pending-trigger', 'Order book pending → lock consume', () => {
      return withStoreRestore(store, () => {
        const s = store.getState()
        s.setOrderBookPendingTriggerPrice(42_000)
        s.setOrderBookPendingTriggerBookSide('ask')
        const ok = s.consumeOrderBookPendingTrigger()
        if (!ok) return { status: 'fail', message: 'consumeOrderBookPendingTrigger returned false' }
        const d = store.getState().stopMitDraft
        if (store.getState().orderBookPendingTriggerPrice != null) {
          return { status: 'fail', message: 'Pending trigger not cleared' }
        }
        if (!d.priceLock.locked || d.priceLock.source !== 'orderbook') {
          return { status: 'fail', message: 'Draft not locked from book after consume' }
        }
        return {
          status: 'pass',
          message: `Consumed pending → trigger ${d.triggerPrice} (${d.priceLock.bookSide})`,
        }
      })
    }),
  ]
}
