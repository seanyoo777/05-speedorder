# Market Synchronization

Market synchronization keeps **last price**, **order book**, **tickers**, **open positions (mark)**, and **conditional orders** consistent when the active symbol or external mock tick changes. All paths described here are **in-memory mock**; they do not send orders to an exchange.

## Authoritative state (`TradingStore`)

- `symbol` — active trading symbol (normalized via `getSymbolSpec`).
- `lastPrice` — primary reference for speed orders, conditional triggers, and chart/order book mid context.
- `orderBook` — `OrderBookSnapshot` (`bids` / `asks`).
- `tickers` — `TickerRow[]` for the watchlist; includes `symbol`, `marketType`, `price`.

External or simulated feeds should update the store through the **injection actions** listed in `tradingStoreTypes.ts`: `applyLastPrice`, `applyOrderBook`, `applyTickers`, `patchTicker`, or the bundled **`applyMockTick`** (used by `useMockRealtime`).

## Vendor catalog (`MARKET_SYNC_ACTIONS`)

Runtime metadata for UTE/TGX is exported from **`src/vendor/marketSyncCatalog.ts`** as **`MARKET_SYNC_ACTIONS`**: each entry documents an action `id`, human-readable `description`, and whether calling it **`mayRunConditionalOrders`** (true for `applyLastPrice` and `applyMockTick`). Hosts can use this table for documentation, guard rails, or mirrored state machines without reading implementation files.

## Symbol change: `setSymbol`

Implemented in `createSymbolMarketSlice` (`src/store/slices/symbolMarketSlice.ts`).

1. Resolve `SymbolSpec` with `getSymbolSpec(symbol)`; canonical key is `spec.symbol`.
2. **Last price**: ticker row price for that symbol if present and valid; otherwise `referencePrice`.
3. **Order book**: `buildOrderBook(lastPrice, spec)` — mock ladder aligned to tick size.
4. **Positions**: `revaluePositions` so unrealized PnL and return % use the new mark for the new active context.
5. **Risk**: `mergeRiskSnapshotWithPositions` after position revaluation.

This gives **HTS-like** behavior: switching the “종목” immediately refreshes book, mid, and position marks for panels bound to the store.

## Last price updates: `applyLastPrice`

When `lastPrice` moves:

1. `prevLast` and `currLast` capture the transition.
2. Positions are revalued (mark from tickers / active last).
3. **`runConditionalOrdersOnTick`** runs for **pending** conditional orders whose `symbol` equals the **active** `state.symbol` (FIFO by `createdAt`).
4. Any triggered MIT/STOP executes a **mock market fill** at `currLast`, updates fills/orders/conditional rows, then positions and risk are merged again.

Trigger rules (`conditionalOrderRunner.ts`):

- **Buy** MIT/STOP: fires when price crosses **up** through the trigger (`prevLast < trigger && currLast >= trigger`).
- **Sell**: fires when price crosses **down** through the trigger.

## Full tick bundle: `applyMockTick`

Single atomic update for demos:

- Input: `{ lastPrice, orderBook, tickers }`.
- Same conditional-order path as `applyLastPrice` (prev → new last).
- Replaces `orderBook` and `tickers` arrays (with `safeArray` normalization).

Use this when the host has a synchronized snapshot (e.g. one WS message with book + index prices).

## Ticker-only updates

- **`applyTickers`**: replace ticker list; revalue positions against current `lastPrice` and new ticker prices.
- **`patchTicker`**: partial update by ticker `id`; revalue positions.

Conditional orders **do not** run on ticker-only updates unless `lastPrice` also changes through `applyLastPrice` / `applyMockTick`.

## Invariants (for host implementers)

1. **Active symbol** drives conditional evaluation scope (not “all symbols in portfolio”).
2. **Invalid prices** (`NaN`, `<= 0`) are ignored for `applyLastPrice` / `applyMockTick` entry.
3. **Arrays** from outside should be treated as untrusted; slices use `safeArray` for bids/asks/tickers.

## Related documents

- [../MASTER_MANUAL.md](../MASTER_MANUAL.md) — integrator index.
- [ORDER_ENGINE.md](./ORDER_ENGINE.md) — fill execution after triggers.
- [SYMBOL_RULES.md](./SYMBOL_RULES.md) — book generation vs `tickSize`.
