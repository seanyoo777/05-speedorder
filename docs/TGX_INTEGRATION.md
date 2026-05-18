# TGX Integration (and UTE readiness)

This document summarizes how **05-SpeedOrder** aligns with **TGX-CEX**-style hosts and how the same seams support a future **UTE** (unified trading environment) without forking the engine folder layout.

> **Reminder**: This repository remains **mock/demo only**. Integration notes describe **contracts and call sites**, not production trading keys or live order APIs.

## Product fit

- **Shared UI contract**: `SymbolSpec` is documented as the **mock + TGX / MockInvest common contract** (`src/types/symbol.ts`).
- **Visual parity**: order book presets reference TGX-CEX `SpeedOrderHtsPanel` styling (`orderBookDesignPresets.ts`, `PanelShell.tsx` comments).
- **Toast hook**: `registerSpeedOrderToast` (`speedOrderToast.ts`) lets TGX render fills/skips in the host chrome instead of a standalone toaster.

## Embedding TGX-CEX

High-level steps (aligned with `ARCHITECTURE.md`):

1. **Package / workspace**: consume `05-SpeedOrder` as a workspace package; import **`TradingWorkspaceHost`** from `src/workspace` (recommended) or legacy `TradingPage` / individual panels. **Do not** import across monorepo siblings by relative filesystem paths; depend on the **05** package boundary only so repo layout stays vendor-safe.
2. **Router → symbol**: when the route pair (e.g. `:pair`) changes, call `useTradingStore.getState().setSymbol(normalized)` so book, chart slot, and position filter follow the same pipeline as the standalone app.
3. **Realtime**:
   - **Demo**: keep `useMockRealtime` + `applyMockTick`.
   - **Live preview (no local fills)**: map WS payloads to `applyLastPrice`, `applyOrderBook`, `applyTickers` / `patchTicker` instead of `applyMockTick`.
4. **Orders**:
   - **Demo**: use existing `submitMockSpeedOrder` re-export.
   - **Live**: replace submission with REST/WS in the host; map responses to `upsertOrder` / `pushFill`. For local reconciliation only, reuse **`executeSpeedOrderFill`** so position math matches the mock engine.

## TradingWorkspaceHost embed (W5)

```tsx
import { TradingWorkspaceHost } from '05-SpeedOrder/src/workspace'

export function TgxSpeedOrderSlot() {
  return (
    <TradingWorkspaceHost
      mockOnly
      initialWorkspaceId="crypto:1"
      showLauncher
      compact
      onWorkspaceChange={(snap) => {
        // Host tab title / risk chrome
        console.log(snap.workspaceId, snap.activeSymbol)
      }}
    />
  )
}
```

- **`onWorkspaceChange`** — `TradingWorkspaceVendorSnapshot` on every workspace switch (same shape as `readActiveWorkspaceVendorSnapshot()`).
- **`renderHeaderSlot`** — `{ activeSnapshot, allSnapshots }`; mount exposes all **15** catalog snapshots via `allSnapshots`.
- **`enableUrlSync`** — leave `false` in TGX; drive `initialWorkspaceId` from the host router instead.
- Legacy **`useTradingStore`** / **`readSpeedOrderVendorSerializableSnapshot`** remain available for market-sync panels.

## Multi-store / embedded panels

`createSubmitMockSpeedOrder(store: StoreApi<TradingStore>)` allows TGX to attach the speed-order pipeline to a **store instance** provided by the host (e.g. scoped per sub-account or widget). Per-workspace registry stores are created via `createTradingStore(workspaceId)` (W3).

## UTE compatibility (forward-looking)

UTE-style shells typically require:

- **Instrument ID normalization** — centralize on `getSymbolSpec` / registry keys so equities, futures roots, and crypto pairs map consistently.
- **Segment flags** — `marketType` + `tradingAssetCategory` already separate stock / futures-style / crypto for UI and hedge rules.
- **Risk and limits** — `riskSnapshot` + `mergeRiskSnapshotWithPositions` are the extension point for cross-margin and limits fed by the host.

Avoid baking UTE-specific IDs into engine functions; pass resolved `symbol` strings and `SymbolSpec` via registry only.

### Read-only vendor snapshot (07-UTE)

Import from **`src/vendor`** (also re-exported on **`src/store/tradingStore`** for convenience):

- **`readSpeedOrderVendorSerializableSnapshot(state)`** — pass `useTradingStore.getState()` (or any `TradingStoreState`); returns `orderExecutionPolicy`, `engineStatus`, `symbolRegistry` keys, **`marketSync`** counts, **`activeSymbolSpec`** subset, and **`marketSyncCatalog`**.
- **`getSpeedOrderVendorBundle(state)`** — same snapshot plus **`speedOrderSymbolRegistry`** function handles and the static **`MARKET_SYNC_ACTIONS`** reference.
- **W4 workspace** — `readWorkspaceVendorSnapshot(id)`, `readAllWorkspaceVendorSnapshots()`, `readActiveWorkspaceVendorSnapshot()` for per-slot HTS meta (`workspaceId`, presets, `mockOnly`) without replacing the legacy snapshot API.

Example (conceptual):

```ts
import {
  useTradingStore,
  readSpeedOrderVendorSerializableSnapshot,
} from '05-SpeedOrder/src/store/tradingStore' // adjust to your workspace alias

const snap = readSpeedOrderVendorSerializableSnapshot(useTradingStore.getState())
// snap.orderExecutionPolicy.liveExecutionEnabled === false
```

## WebSocket stub

`src/services/websocket/WebSocketClient.ts` documents the expectation: **host supplies URL, auth, and `onMessage`**. Types live beside the stub so TGX can share message shapes without pulling in a real client from this repo.

## Related documents

- [VENDOR_SYNC.md](./VENDOR_SYNC.md) — vendor boundaries and anti-patterns.
- [MARKET_SYNC.md](./MARKET_SYNC.md) — feed → store mapping.
- [ORDER_ENGINE.md](./ORDER_ENGINE.md) — fill primitives for reconciliation.
