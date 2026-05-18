import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getSelfTestAuditTrail } from '../../selftest/auditTrail'
import {
  SPEED_ORDER_FEATURE_FLAGS,
  validateSpeedOrderFeatureFlags,
} from '../../selftest/featureFlags'
import { useSelfTestStore } from '../../selftest/selfTestStore'
import {
  readActiveWorkspaceVendorSnapshot,
  readAllWorkspaceVendorSnapshots,
} from '../../vendor/readWorkspaceVendorSnapshot'
import { useTradingStore } from '../../store/tradingStore'
import {
  getActiveWorkspaceStoreApi,
  getWorkspaceStoreCount,
  getWorkspaceStoreRegistrySnapshot,
  listWorkspaceStoreIds,
} from '../../store/workspaceStoreRegistry'
import { useWorkspaceShellStore } from '../../store/workspaceShellStore'
import {
  getTradingWorkspaceSlot,
  listTradingWorkspaceSlots,
  validateTradingWorkspaceCatalog,
} from '../../domain/tradingWorkspaceCatalog'
import { getResearchFeedDiagnostics } from '../../research/researchFeedDiagnostics'
import { getOrderBookDiagnostics } from '../orderbook/orderBookDiagnostics'
import { getOrderFormDiagnostics } from '../orderform/orderFormDiagnostics'
import { getPositionCloseDiagnostics } from '../position/positionCloseDiagnostics'
import { getWorkspaceSyncDiagnostics } from '../../workspace/workspaceSyncDiagnostics'
import { getRightColumnLoopDiagnostics } from '../ordercolumn/rightColumnLoopDiagnostics'
import type { SelfTestCheckResult, SelfTestStatus, SelfTestSummary } from '../../selftest/types'

type TabId = 'checks' | 'audit' | 'flags' | 'stopmit' | 'workspace'

function statusLabel(s: SelfTestStatus): string {
  return s === 'pass' ? 'PASS' : s === 'warn' ? 'WARN' : 'FAIL'
}

function statusClass(s: SelfTestStatus): string {
  if (s === 'pass') return 'text-so-bid'
  if (s === 'warn') return 'text-amber-400'
  return 'text-so-ask'
}

function StatusBadge({ status }: { status: SelfTestStatus }) {
  const bg =
    status === 'pass'
      ? 'bg-so-bid/15 text-so-bid'
      : status === 'warn'
        ? 'bg-amber-500/15 text-amber-400'
        : 'bg-so-ask/15 text-so-ask'
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${bg}`}>
      {statusLabel(status)}
    </span>
  )
}

function CheckRow({ row }: { row: SelfTestCheckResult }) {
  return (
    <li className="rounded border border-so-border bg-so-bg/60 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-zinc-200">{row.label}</span>
        <StatusBadge status={row.status} />
      </div>
      <p className="mt-0.5 text-[10px] text-so-muted">{row.message}</p>
      <p className="text-[9px] text-so-muted/70">
        {row.id} · {row.durationMs}ms
      </p>
    </li>
  )
}

function SummaryHeader({ summary }: { summary: SelfTestSummary | null }) {
  if (!summary) {
    return (
      <p className="text-[10px] text-so-muted">
        Run self-test to populate PASS / WARN / FAIL results.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <span className={statusClass(summary.status)}>
        Overall: <strong className="uppercase">{statusLabel(summary.status)}</strong>
      </span>
      <span className="text-so-muted">
        {summary.passCount} pass · {summary.warnCount} warn · {summary.failCount} fail
      </span>
      <span className="text-so-muted">issues: {summary.issueCount}</span>
    </div>
  )
}

export function DiagnosticsPanel() {
  const [tab, setTab] = useState<TabId>('checks')
  const [auditTick, setAuditTick] = useState(0)
  const running = useSelfTestStore((s) => s.running)
  const summary = useSelfTestStore((s) => s.summary)
  const runAll = useSelfTestStore((s) => s.runAll)
  const runCritical = useSelfTestStore((s) => s.runCritical)

  const flagValidation = useMemo(() => validateSpeedOrderFeatureFlags(), [])
  const workspaceValidation = useMemo(() => validateTradingWorkspaceCatalog(), [])
  const workspaceSlots = useMemo(() => listTradingWorkspaceSlots(), [])
  const activeWorkspaceId = useWorkspaceShellStore((s) => s.activeWorkspaceId)
  const activeWorkspaceCategoryId = useWorkspaceShellStore((s) => s.activeWorkspaceCategoryId)
  const workspaceStoreCount = getWorkspaceStoreCount()
  const workspaceStoreIds = listWorkspaceStoreIds()
  const workspaceRegistry = getWorkspaceStoreRegistrySnapshot()
  const activeStoreSymbol = getActiveWorkspaceStoreApi().getState().symbol
  const activeSlot = useMemo(
    () => getTradingWorkspaceSlot(activeWorkspaceId),
    [activeWorkspaceId],
  )
  const allVendorSnapshots = readAllWorkspaceVendorSnapshots()
  const activeVendorSnapshot = readActiveWorkspaceVendorSnapshot()
  const stopMitDraft = useTradingStore((s) => s.stopMitDraft)
  const researchFeedDiagnostics = useMemo(
    () => getResearchFeedDiagnostics(activeStoreSymbol),
    [activeStoreSymbol],
  )
  const orderBookStyle = useTradingStore((s) => s.orderBookStyle)
  const orderBookRowDensity = useTradingStore((s) => s.orderBookRowDensity)
  const orderBookDiagnostics = useMemo(
    () => getOrderBookDiagnostics({ orderBookStyle, orderBookRowDensity }),
    [orderBookStyle, orderBookRowDensity],
  )
  const orderFormDiagState = useTradingStore(
    useShallow((s) => ({
      orderBookPendingLimitPrice: s.orderBookPendingLimitPrice,
      orderBookPendingTriggerPrice: s.orderBookPendingTriggerPrice,
      orderBookPendingTriggerBookSide: s.orderBookPendingTriggerBookSide,
      orderBookHighlightPrice: s.orderBookHighlightPrice,
      stopMitDraft: s.stopMitDraft,
      orderBookOneClickEnabled: s.orderBookOneClickEnabled,
      orderBookStyle: s.orderBookStyle,
      orderBookRowDensity: s.orderBookRowDensity,
      workspaceOrderFormTab: s.workspaceOrderFormTab,
    })),
  )
  const orderFormDiagnostics = useMemo(
    () => getOrderFormDiagnostics(orderFormDiagState),
    [orderFormDiagState],
  )
  const positionCloseDiagState = useTradingStore(
    useShallow((s) => ({
      positionCloseIntent: s.positionCloseIntent,
      positionCloseSelectedIds: s.positionCloseSelectedIds,
    })),
  )
  const positionCloseDiagnostics = useMemo(
    () => getPositionCloseDiagnostics(positionCloseDiagState),
    [positionCloseDiagState],
  )
  const workspaceSyncDiagnostics = getWorkspaceSyncDiagnostics()
  const rightColumnLoopDiagnostics = getRightColumnLoopDiagnostics()
  const audit = useMemo(() => {
    void auditTick
    return [...getSelfTestAuditTrail()].reverse()
  }, [auditTick])

  const lastChecked = summary?.checkedAt
    ? new Date(summary.checkedAt).toLocaleString()
    : '—'

  const handleRunAll = () => {
    runAll()
    setAuditTick((n) => n + 1)
  }

  const handleRunCritical = () => {
    runCritical()
    setAuditTick((n) => n + 1)
  }

  return (
    <div className="flex min-h-0 flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-so-accent/40 bg-so-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-so-accent">
          Mock only
        </span>
        <span className="text-[10px] text-so-muted">
          issues: <strong className="text-zinc-200">{summary?.issueCount ?? 0}</strong>
        </span>
        <span className="text-[10px] text-so-muted">last checked: {lastChecked}</span>
      </div>

      <SummaryHeader summary={summary} />

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          disabled={running}
          className="rounded bg-so-accent px-2 py-1 text-[10px] font-medium text-white disabled:opacity-50"
          onClick={handleRunAll}
        >
          {running ? 'Running…' : 'Run all checks'}
        </button>
        <button
          type="button"
          disabled={running}
          className="rounded border border-so-border px-2 py-1 text-[10px] text-so-muted hover:text-white disabled:opacity-50"
          onClick={handleRunCritical}
        >
          Critical only
        </button>
      </div>

      <div className="flex gap-1 border-b border-so-border pb-1">
        {(
          [
            ['checks', 'Checks'],
            ['audit', 'Audit trail'],
            ['flags', 'Feature flags'],
            ['stopmit', 'Stop/MIT lock'],
            ['workspace', 'Workspace'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded px-2 py-0.5 text-[10px] ${
              tab === id ? 'bg-so-border text-white' : 'text-so-muted hover:text-white'
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'checks' && (
          <ul className="flex flex-col gap-1.5">
            {(summary?.results ?? []).map((row) => (
              <CheckRow key={row.id} row={row} />
            ))}
            {!summary?.results.length ? (
              <li className="text-[10px] text-so-muted">No results yet.</li>
            ) : null}
          </ul>
        )}

        {tab === 'audit' && (
          <ul className="flex flex-col gap-1">
            {audit.length === 0 ? (
              <li className="text-[10px] text-so-muted">Append-only trail is empty.</li>
            ) : (
              audit.map((e) => (
                <li
                  key={e.id}
                  className="rounded border border-so-border bg-so-bg/40 px-2 py-1 text-[10px]"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-so-muted">{new Date(e.at).toLocaleTimeString()}</span>
                    <span className="rounded bg-so-border/80 px-1 text-[9px] uppercase">{e.category}</span>
                    {e.status ? <StatusBadge status={e.status} /> : null}
                  </div>
                  <p className="text-zinc-300">{e.message}</p>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === 'stopmit' && (
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center gap-2">
              <StatusBadge
                status={SPEED_ORDER_FEATURE_FLAGS.stopMitPriceLockEnabled ? 'pass' : 'fail'}
              />
              <span>
                stopMitPriceLockEnabled: {String(SPEED_ORDER_FEATURE_FLAGS.stopMitPriceLockEnabled)}
              </span>
            </div>
            <ul className="divide-y divide-so-border rounded border border-so-border font-mono">
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">symbol</span>
                <span>{stopMitDraft.symbol}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">triggerPrice</span>
                <span>{stopMitDraft.triggerPrice ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">locked</span>
                <span>{String(stopMitDraft.priceLock.locked)}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">source</span>
                <span>{stopMitDraft.priceLock.source}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">bookSide</span>
                <span>{stopMitDraft.priceLock.bookSide ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">lockedAt</span>
                <span>
                  {stopMitDraft.priceLock.lockedAt
                    ? new Date(stopMitDraft.priceLock.lockedAt).toLocaleTimeString()
                    : '—'}
                </span>
              </li>
            </ul>
          </div>
        )}

        {tab === 'workspace' && (
          <div className="space-y-2 text-[10px]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={workspaceValidation.ok ? 'pass' : 'fail'} />
              <span>
                categories {workspaceValidation.categoryCount} · slots {workspaceValidation.slotCount}
                · invalid {workspaceValidation.invalidCount}
              </span>
            </div>
            <ul className="mb-2 divide-y divide-so-border rounded border border-so-border font-mono">
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">activeWorkspaceId</span>
                <span>{activeWorkspaceId}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">lastWorkspaceSyncSource</span>
                <span>{workspaceSyncDiagnostics.lastWorkspaceSyncSource ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">skippedSyncCount</span>
                <span>{workspaceSyncDiagnostics.skippedSyncCount}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">workspaceLoopGuardTriggered</span>
                <span className="text-so-bid">
                  {String(workspaceSyncDiagnostics.workspaceLoopGuardTriggered)}
                </span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">categoryId</span>
                <span>{activeWorkspaceCategoryId}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">slotIndex</span>
                <span>{activeSlot?.slotIndex ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">activeSymbol</span>
                <span>{activeStoreSymbol}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">vendor snapshot count</span>
                <span>{allVendorSnapshots.length}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">workspace store count</span>
                <span>{workspaceStoreCount}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">mockOnly</span>
                <span className="text-so-bid">
                  {activeVendorSnapshot?.mockOnly === true ? 'true' : '—'}
                </span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">researchFeedPanelEnabled</span>
                <span>{String(researchFeedDiagnostics.researchFeedPanelEnabled)}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">researchFeedItemCount</span>
                <span>{researchFeedDiagnostics.researchFeedItemCount}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">researchFeedMockOnly</span>
                <span className="text-so-bid">
                  {String(researchFeedDiagnostics.researchFeedMockOnly)}
                </span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">orderBookStyle</span>
                <span>{orderBookDiagnostics.orderBookStyle}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">tgxOrderBookEnabled</span>
                <span>{String(orderBookDiagnostics.tgxOrderBookEnabled)}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">orderBookRowDensity</span>
                <span>
                  {orderBookDiagnostics.orderBookRowDensity} ({orderBookDiagnostics.displayRowCount}{' '}
                  rows)
                </span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">orderFormIntentVisible</span>
                <span>{String(orderFormDiagnostics.orderFormIntentVisible)}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">stopMitLockVisible</span>
                <span>{String(orderFormDiagnostics.stopMitLockVisible)}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">oneClickPolicy</span>
                <span className="font-mono text-[9px]">{orderFormDiagnostics.oneClickPolicy}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">tgxFormRhythm</span>
                <span>{orderFormDiagnostics.tgxFormRhythm}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">closeIntentActive</span>
                <span>{String(positionCloseDiagnostics.closeIntentActive)}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">closeIntentRatio</span>
                <span>{positionCloseDiagnostics.closeIntentRatio ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">closeIntentOrderType</span>
                <span>{positionCloseDiagnostics.closeIntentOrderType ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">selectedPositionCount</span>
                <span>{positionCloseDiagnostics.selectedPositionCount}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">mockCloseOnly</span>
                <span className="text-so-bid">{String(positionCloseDiagnostics.mockCloseOnly)}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">rightColumnLoopSource</span>
                <span>{rightColumnLoopDiagnostics.rightColumnLoopSource ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">renderLoopCandidate</span>
                <span>{rightColumnLoopDiagnostics.renderLoopCandidate ?? '—'}</span>
              </li>
              <li className="flex justify-between px-2 py-1">
                <span className="text-so-muted">isolatedPanelName</span>
                <span>{rightColumnLoopDiagnostics.isolatedPanelName ?? '—'}</span>
              </li>
            </ul>
            {activeVendorSnapshot && (
              <div className="mb-2 rounded border border-so-border bg-so-bg/60 p-2 font-mono">
                <p className="mb-1 text-[10px] font-medium text-zinc-200">Active vendor snapshot</p>
                <p className="text-so-muted">
                  mockOnly={String(activeVendorSnapshot.mockOnly)} ·{' '}
                  {activeVendorSnapshot.workspaceId} · {activeVendorSnapshot.activeSymbol}
                </p>
                <p className="text-so-muted">
                  {activeVendorSnapshot.assetClass} · book={activeVendorSnapshot.orderBookPreset} ·
                  form={activeVendorSnapshot.orderFormPreset}
                </p>
                <p className="text-so-muted">
                  layout={activeVendorSnapshot.layoutPreset} · stopMit=
                  {String(activeVendorSnapshot.stopMitLockEnabled)} · close=
                  {String(activeVendorSnapshot.positionCloseEnabled)}
                </p>
              </div>
            )}
            <p className="text-so-muted">
              catalog mockOnly: {workspaceSlots.every((s) => s.mockOnly) ? 'true (all)' : 'mixed'}
            </p>
            <p className="text-so-muted">
              registry: {workspaceStoreIds.length > 0 ? workspaceStoreIds.join(', ') : '—'}
            </p>
            {workspaceStoreIds.length > 0 && (
              <ul className="mb-2 max-h-[80px] divide-y divide-so-border overflow-auto rounded border border-so-border font-mono">
                {Object.entries(workspaceRegistry).map(([id, row]) => (
                  <li key={id} className="flex justify-between px-2 py-0.5">
                    <span className="text-zinc-200">{id}</span>
                    <span className="text-so-muted">
                      {row.symbol} · mockOnly={String(row.mockOnly)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <ul className="max-h-[160px] divide-y divide-so-border overflow-auto rounded border border-so-border font-mono">
              {workspaceSlots.map((s) => (
                <li key={s.workspaceId} className="px-2 py-1">
                  <span className="text-zinc-200">{s.workspaceId}</span>
                  <span className="text-so-muted"> — {s.displayName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'flags' && (
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center gap-2">
              <StatusBadge status={flagValidation.ok ? 'pass' : 'fail'} />
              <span className={flagValidation.ok ? 'text-so-bid' : 'text-so-ask'}>
                {flagValidation.ok ? 'Feature flag guards OK' : flagValidation.issues.join('; ')}
              </span>
            </div>
            <ul className="divide-y divide-so-border rounded border border-so-border">
              {Object.entries(SPEED_ORDER_FEATURE_FLAGS).map(([key, value]) => (
                <li key={key} className="flex justify-between px-2 py-1">
                  <span className="text-so-muted">{key}</span>
                  <span
                    className={
                      value === false && key.startsWith('live') ? 'text-so-bid' : 'text-zinc-200'
                    }
                  >
                    {String(value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
