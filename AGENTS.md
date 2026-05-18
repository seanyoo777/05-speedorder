# AGENTS.md

## PROJECT OVERVIEW

Project Number:
05 = SpeedOrder

Current Role:
- Core order engine
- HTS order structure
- Market/order synchronization
- Vendor source for TGX-CEX
- Reusable trading engine core

---

## CORE RULES

- Do NOT remove existing features
- Keep build/lint/test/smoke passing
- mock/demo mode only
- No real trading API
- No live order execution
- Preserve engine stability
- UI/UX compatible structure
- Vendor-safe architecture required

---

## REQUIRED DOCUMENT RULE

Whenever:
- order engine changes
- market sync changes
- symbol structure changes
- architecture changes
- new systems/folders are added

You MUST also update:
- MASTER_MANUAL.md
- docs/*.md

---

## CURRENT PRIORITIES

1. Stable order engine
2. Unified selectedSymbol structure
3. HTS-compatible architecture
4. Market synchronization
5. Reusable vendor structure
6. TGX-CEX sync compatibility
7. Future UTE integration

---

## SELF-TEST & VALIDATION (GLOBAL)

Additive only. Every feature change should remain verifiable without websocket/live execution.

| Surface | Path |
|---------|------|
| Self-test runner | `src/selftest/runSpeedOrderSelfTest.ts` |
| Feature flags | `src/selftest/featureFlags.ts` |
| Audit trail (append-only mock) | `src/selftest/auditTrail.ts` |
| UI: Self-Test Center + Diagnostics | `src/components/selftest/` |
| Headless smoke | `npm run smoke` → `scripts/smoke.ts` |

UI must show **PASS / WARN / FAIL**, **issue count**, **last checked**, and **Mock only** badge.  
Admin/state changes: call `useSelfTestStore.getState().validateAfterAction(label)` for critical re-check + audit.

Forbidden: live trading, real settlement, on-chain execution, production destructive actions, uncontrolled realtime loops.

## IMPORTANT

Update documentation together with architecture changes.