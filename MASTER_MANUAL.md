# 05-SpeedOrder — Master Manual

Single entry point for operators and host integrators (TGX-CEX, UTE, MockInvest). Detailed behavior lives in `docs/*.md` and `ARCHITECTURE.md`.

## Non-negotiables

- **No feature removal** without explicit product approval.
- **Mock / demo only** in this repository: no live trading API, no real order execution.
- **Build, lint, and smoke** must stay green before merge (`npm run smoke`).
- **Architecture or export changes** require updates to this file and `docs/*.md` (`AGENTS.md`).

## Recommended import surfaces (vendor-safe)

| Purpose | Path | Notes |
|---------|------|--------|
| Vendor policy + UTE-readable snapshot | `src/vendor` | `ORDER_EXECUTION_POLICY`, `readSpeedOrderVendorSerializableSnapshot`, `getSpeedOrderVendorBundle`, `speedOrderSymbolRegistry`, `MARKET_SYNC_ACTIONS` |
| Order engine barrel | `src/engine` | Re-exports `mockExecutionEngine`, `submitMockSpeedOrder`, `immediateMarketFill`, `conditionalOrderRunner` |
| Symbol registry barrel | `src/symbols` | `SYMBOL_REGISTRY`, `STANDARD_SYMBOLS`, `getSymbolSpec`, `isListedSymbol` |
| Composed store + submit | `src/store/tradingStore` | `useTradingStore`, `submitMockSpeedOrder`, re-exports of selected vendor helpers |
| Domain types + risk helpers | `src/domain` | Shared DTOs; see `domain/index.ts` |

**Do not** import other monorepo apps via relative paths (for example `../02-TGX-CEX/...`). Consume **05-SpeedOrder** as a package or workspace dependency only.

## UTE integration (read-only contract)

UTE can read static and dynamic facts without executing trades:

1. **`ORDER_EXECUTION_POLICY`** — always `mock_demo`; `liveOrderApiEnabled` and `liveExecutionEnabled` are `false`.
2. **`SPEED_ORDER_ENGINE_STATUS`** — engine kind `mock` and capability tokens for feature gating.
3. **`speedOrderSymbolRegistry`** — `getSpec`, `isListed`, `standardSymbols`, `listedSymbolKeys`.
4. **`MARKET_SYNC_ACTIONS`** — catalog of store actions that move market state; flags which paths run conditional orders.
5. **`readSpeedOrderVendorSerializableSnapshot(useTradingStore.getState())`** — JSON-friendly view: active symbol, last price, book depth counts, in-flight mock order id, position/conditional counts, trimmed `SymbolSpec` fields, embedded catalog copy.

For interactive API (includes function handles): **`getSpeedOrderVendorBundle(state)`**.

## TGX-CEX integration (summary)

1. Wire router → `setSymbol(normalizedKey)`.
2. Feed: `applyMockTick` (demo) or split actions for live preview.
3. Orders: `submitMockSpeedOrder` (demo) or host adapter writing `upsertOrder` / `pushFill`; use **`executeSpeedOrderFill`** from `src/engine` for reconciliation parity.

See [docs/TGX_INTEGRATION.md](docs/TGX_INTEGRATION.md).

## Document index

| Document | Content |
|----------|---------|
| [docs/ORDER_ENGINE.md](docs/ORDER_ENGINE.md) | Engine modules, pipelines, extension points |
| [docs/MARKET_SYNC.md](docs/MARKET_SYNC.md) | Store sync rules, conditional triggers, vendor action catalog |
| [docs/SYMBOL_RULES.md](docs/SYMBOL_RULES.md) | `SymbolSpec`, registry, rounding |
| [docs/VENDOR_SYNC.md](docs/VENDOR_SYNC.md) | Vendor boundaries, TGX alignment, `src/vendor` |
| [docs/TGX_INTEGRATION.md](docs/TGX_INTEGRATION.md) | Embedding steps and import discipline |
| [docs/HTS_ENGINE_STRUCTURE.md](docs/HTS_ENGINE_STRUCTURE.md) | HTS UX vs engine separation |
| [docs/SELF_TEST.md](docs/SELF_TEST.md) | Self-Test Center, diagnostics, audit trail, smoke |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Full stack and folder map |

## Changelog (vendor reuse prep)

- Added **`src/vendor/`** — execution policy, engine status, market sync catalog, symbol registry API, serializable snapshot reader.
- Added **`src/engine/index.ts`** — single barrel for engine exports.
- Added **`src/symbols/index.ts`** — registry barrel.
- Extended **`src/store/mockExecution.ts`** — re-exports `executeHedgeSpeedFill`, `executeSpeedOrderFill`, `positionRowIdHedge`, `SpeedFillPositionMode` (legacy path preserved).
- Re-exported selected vendor symbols from **`src/store/tradingStore.ts`** for discoverability.
- **Lint**: `OrderBookPanel` pending confirm id uses a ref-based sequence instead of `Date.now()` during interaction (react-hooks purity).
