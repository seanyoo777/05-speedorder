# Self-Test & Diagnostics (05-SpeedOrder)

Mock-only validation aligned with the global self-test rule. No websocket or live execution required.

## Surfaces

| Component | Role |
|-----------|------|
| **Self-Test Center** | Floating entry (`SelfTestCenter`) on `TradingPage` |
| **Diagnostics Panel** | Checks list, audit trail tab, feature-flag tab |
| **Audit trail** | `appendSelfTestAudit` — in-memory, append-only, max 500 entries; **`@tetherget/mock-audit-core`** (`createMockAuditTrail`, `filterAuditEntries`, `buildAuditExportPayload`, internal `trimAuditEntries`) for shared filter/export/trim. Legacy row shape unchanged (`SelfTestAuditEntry`). |
| **Smoke** | `npm run smoke` — headless run using `useTradingStore.getState()` |

## Status model

- **PASS** — check OK
- **WARN** — non-blocking (e.g. thin book, fallback spec)
- **FAIL** — contract broken (e.g. live flags enabled)

Overall status = worst of all checks. **issue count** = warn + fail.

**Shared aggregation (Phase 2-C):** `@tetherget/self-test-core` via `speedOrderSelfTestCoreAdapter.ts` (lowercase status mapped to core PASS/WARN/FAIL).

## Checks (full run)

### Stop/MIT price lock (Phase 1)

| ID | Validates |
|----|-----------|
| `stop-mit-lock-holds-on-tick` | Locked `triggerPrice` unchanged after `applyLastPrice` |
| `stop-mit-book-reclick-updates` | Second `lockFromBook` updates price and `bookSide` |
| `stop-mit-symbol-reset` | `setSymbol` clears lock via `resetStopMitDraftForSymbol` |
| `stop-mit-manual-overrides` | `setManualPrice` → `source: manual`, lock kept |
| `stop-mit-consume-pending-trigger` | `orderBookPendingTriggerPrice` → draft lock + pending cleared |

### Trading workspace W2

| ID | Validates |
|----|-----------|
| `workspace-url-fallback` | Invalid `workspaceId` → `domestic_futures:1` |
| `workspace-preset-valid` | All `orderBookPreset` in design registry |
| `workspace-active-slot` | `activateWorkspace` sets `activeWorkspaceId` |
| `workspace-symbol-seed` | `crypto:1` → `BTCUSDT` + book preset |
| `workspace-apply-slot-api` | Form tab + confirmOrders wiring |
| `workspace-no-api-no-websocket` | Policy remains mock_demo |

### Trading workspace catalog (W1)

| ID | Validates |
|----|-----------|
| `workspace-catalog-complete` | 5 categories, 15 slots, `validateTradingWorkspaceCatalog().ok` |
| `workspace-id-unique` | No duplicate `workspaceId` |
| `workspace-mock-only` | All slots `mockOnly === true` |
| `workspace-category-slot-count` | 3 slots per category |

### Core

1. Order execution policy (`mock_demo`, live flags false)
2. Engine status (`kind: mock`, capabilities)
3. Feature flags (`liveTrading` / `liveWebSocketRequired` guards)
4. Market sync catalog non-empty
5. Rounding utilities sample
6. WebSocket stub / offline safety
7. Symbol registry vs `STANDARD_SYMBOLS`
8. Store bootstrap (symbol, price, book) — when state provided
9. Vendor serializable snapshot — when state provided

**Critical** scope: execution policy, engine status, store bootstrap, feature flags, vendor snapshot.

## Admin post-action validation

```ts
import { useSelfTestStore } from '../selftest/selfTestStore'

useSelfTestStore.getState().validateAfterAction('setSymbol:ETHUSDT')
```

Appends an **admin** audit entry and refreshes the panel summary.

## Feature flags

`SPEED_ORDER_FEATURE_FLAGS` in `src/selftest/featureFlags.ts`.  
`validateSpeedOrderFeatureFlags()` must pass before merge; smoke and UI flags tab call it.

## Modules (aggregation + audit core)

- `src/selftest/speedOrderSelfTestCoreAdapter.ts` — `buildSelfTestResult`, `buildValidationCounts`, `resolveOverallVerdict`
- `src/selftest/auditTrail.ts` — `@tetherget/mock-audit-core` (Phase **3-D**); also `filterSelfTestAuditEntries`, `buildSelfTestAuditExportPayload`, `trimAuditEntries` (re-export from barrel)
- `src/selftest/runSpeedOrderSelfTest.ts` — check runners (unchanged contracts)
- `src/selftest/types.ts` — local `SelfTestSummary` / `SelfTestAuditEntry` shape (unchanged)

## Commands

```bash
npm run lint
npm run build
npm run test      # vitest unit + smoke
npm run smoke     # exit 1 on any fail
```
