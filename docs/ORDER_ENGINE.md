# Order Engine (Mock / Demo)

This document describes the **reusable mock order engine** in `05-SpeedOrder`. The engine is **deterministic, side-effect free at the domain layer**, and designed so a host application (vendor shell, TGX-CEX, UTE) can later swap mock ticks and mock submission for real feeds and broker APIs **without rewriting position math**.

## Scope and guarantees

- **Mock and demo only**: no REST/WebSocket order placement, no live trading API.
- **No real order execution**: fills are computed in-process from store state and `SymbolSpec` rules.
- **Stability**: keep public entry points and `TradingStore` field names stable; extend rather than replace (`AGENTS.md`).

## Module map (`src/engine/`)

| Module | Role |
|--------|------|
| `index.ts` | **Barrel** — re-exports the public engine surface for hosts that prefer one import path (`src/engine`). |
| `mockExecutionEngine.ts` | Pure fill and position math: fees (mock bps), net one-way and hedge fills, `revaluePositions`, PnL helpers. |
| `submitMockSpeedOrder.ts` | `createSubmitMockSpeedOrder(store)` — async mock lifecycle (`submitting` → `accepted` → `filled`), rounding, `executeSpeedOrderFill`, risk merge. |
| `immediateMarketFill.ts` | Order-book one-click / double-click path: immediate market fill, no `mockOrderInFlight` queue. |
| `conditionalOrderRunner.ts` | MIT/STOP trigger evaluation on last-price transitions; FIFO pending orders for **active symbol** only. |

UI code should prefer **`submitMockSpeedOrder`** (from the composed store) or the injected factory for alternate `StoreApi` instances — not duplicate fill logic.

### Legacy re-export path

`src/store/mockExecution.ts` remains for older imports; it now mirrors the full speed-fill surface (`executeSpeedOrderFill`, `executeHedgeSpeedFill`, `positionRowIdHedge`, `SpeedFillPositionMode`). New code should import from **`src/engine`** or **`src/engine/mockExecutionEngine`**.

### Mock execution types (trading layer)

Order rows, fills, and mock lifecycle enums live in **`src/types/trading.ts`** (`OrderRecordRow`, `TradeFillRow`, `MockOrderStatus`, `ConditionalOrderRow`, …). The engine consumes these shapes but does not redefine them — keeps a single source of truth for TGX/UTE type sharing.

## Execution pipeline (conceptual)

1. **Validation**: quantity and price from `TradingStore` + `getSymbolSpec`; `roundQtyBySpec` / `roundPriceBySpec`.
2. **Fill**: `executeSpeedOrderFill` (delegates to `executeNetSpeedFill` or `executeHedgeSpeedFill` for crypto + hedge mode).
3. **Mark-to-market**: `revaluePositions(positions, tickers, activeSymbol, activeLastPrice)`.
4. **Bookkeeping**: append `TradeFillRow`, update `OrderRecordRow`, merge `riskSnapshot` via `mergeRiskSnapshotWithPositions`.

## Position modes

- **`one_way`**: single net position per symbol (long XOR short); reduce-only semantics on opposite-side orders; flip when size crosses zero.
- **`hedge`**: crypto-only simplified hedge (long and short legs per symbol); see `executeHedgeSpeedFill` in `mockExecutionEngine.ts`.

Asset routing uses `tradingAssetCategory` (`src/domain/assetCategory.ts`) derived from `SymbolSpec.marketType`.

## Extension points (future live stack)

- Replace **submission** (`createSubmitMockSpeedOrder`) with a host adapter that maps exchange acks to `upsertOrder` / `pushFill`.
- Keep **`executeSpeedOrderFill`** as the local reconciliation primitive when the host needs position consistency without simulating the wire protocol.
- Conditional orders: today `runConditionalOrdersOnTick` triggers on mock last price; a live host would call the same runner after updating `lastPrice` from the feed.

## Related documents

- [../MASTER_MANUAL.md](../MASTER_MANUAL.md) — integrator index and export map.
- [MARKET_SYNC.md](./MARKET_SYNC.md) — how prices and books stay aligned with the active symbol.
- [SYMBOL_RULES.md](./SYMBOL_RULES.md) — rounding, PnL formulas, registry.
- [VENDOR_SYNC.md](./VENDOR_SYNC.md) — boundaries for embeddable hosts.
- [TGX_INTEGRATION.md](./TGX_INTEGRATION.md) — TGX-CEX and UTE-oriented wiring notes.
- [HTS_ENGINE_STRUCTURE.md](./HTS_ENGINE_STRUCTURE.md) — HTS-shaped UI vs engine separation.
