# Symbol Rules

Symbols in this project are described by **`SymbolSpec`** (`src/types/symbol.ts`) and resolved through **`getSymbolSpec`** (`src/symbols/registry.ts`). This contract is shared between **mock UI**, **execution math**, and future **TGX / vendor** hosts — keep fields backward compatible when extending.

### Registry barrel

Hosts may import **`src/symbols`** (same exports as `registry.ts`): `SYMBOL_REGISTRY`, `STANDARD_SYMBOLS`, `getSymbolSpec`, `isListedSymbol`. UTE can also use **`speedOrderSymbolRegistry`** from **`src/vendor`** for the same functions plus a stable object shape.

## `SymbolSpec` overview

| Area | Fields | Notes |
|------|--------|--------|
| Identity | `symbol`, `displayName` | `symbol` is the canonical key (uppercased on lookup). |
| Venue / product | `marketType` | `crypto`, `futures`, `stock`, `index`, `commodity`, `forex` — drives UI and engine routing. |
| Quoting | `quoteCurrency`, `marginCurrency` | Display and mock margin labels. |
| Precision | `priceDecimals`, `qtyDecimals` | UI formatting and validation feedback. |
| Grid | `tickSize`, `lotSize` | Order book generation; price/qty rounding. |
| Contract | `contractSize`, `tickValue` | PnL and margin for contract-style instruments. |
| Risk (mock) | `defaultLeverage`, `minQty`, `maxQty` | Bounds and leverage assumptions in UI/domain helpers. |
| Session | `sessionType` | `24h`, `regular`, `futures_session` — display and future session gates. |
| PnL engine | `pnlFormulaType` | `linear`, `inverse`, `stock`, `futures_contract` — used by `utils/specInstrument` (`calculatePnlBySpec`, `calculateMarginBySpec`, `feeNotionalAbsBySpec`). |
| Fallback price | `referencePrice` | Seed when no ticker price exists (e.g. after `setSymbol`). |

## Registry vs fallback

- **Listed symbols**: `SYMBOL_REGISTRY` — curated `mergeSymbolSpec` rows (`STANDARD_SYMBOLS` is the default watch set).
- **Unknown symbol**: `getSymbolSpec` returns **`mergeSymbolSpec`** based on `DEFAULT_SYMBOL_SPEC` with overridden `symbol` / `displayName` so the app never receives incomplete numeric fields (`NaN`-safe defaults).

`isListedSymbol` distinguishes curated vs synthetic specs for UX if needed.

## Rounding rules (orders and fills)

- **Quantity**: `roundQtyBySpec` — aligns to `lotSize` and spec constraints before submission or immediate book trade.
- **Price**: `roundPriceBySpec` — aligns limit/stop/trigger and execution assumptions to `tickSize`.

The mock engine assumes the caller has already rounded; the submit path enforces this.

## Asset category (UI / engine routing)

`tradingAssetCategory(spec)` (`src/domain/assetCategory.ts`) maps `marketType` to:

- `stock` — `marketType === 'stock'`
- `crypto` — `marketType === 'crypto'`
- `futures` — everything else among listed types (futures-style treatment for indices/commodities/forex in the UI engine sense)

`executeSpeedOrderFill` uses this to allow **hedge mode** only for **crypto** when `cryptoPositionMode === 'hedge'`.

## Order book (mock)

`buildOrderBook(lastPrice, spec)` (`src/mock/mockData.ts`) generates depth using **`tickSize`**. Changing `SymbolSpec` for a symbol therefore updates both **display** and **simulated liquidity** spacing.

## Adding a symbol (checklist)

1. Add a `mergeSymbolSpec({ … })` entry to `SYMBOL_REGISTRY`.
2. Optionally append to `STANDARD_SYMBOLS` for the default ticker bar.
3. Ensure `referencePrice` is positive and finite.
4. Run build/lint; update `ARCHITECTURE.md`, **`MASTER_MANUAL.md`**, and this doc if public contract fields change (`AGENTS.md`).

## Related documents

- [MARKET_SYNC.md](./MARKET_SYNC.md) — `setSymbol` and ticker-driven marks.
- [ORDER_ENGINE.md](./ORDER_ENGINE.md) — how specs feed PnL and fees.
