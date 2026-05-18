import { useMemo, useState } from 'react'
import { getSelfTestAuditTrail } from '../../selftest/auditTrail'
import {
  SPEED_ORDER_FEATURE_FLAGS,
  validateSpeedOrderFeatureFlags,
} from '../../selftest/featureFlags'
import { useSelfTestStore } from '../../selftest/selfTestStore'
import { useTradingStore } from '../../store/tradingStore'
import type { SelfTestCheckResult, SelfTestStatus, SelfTestSummary } from '../../selftest/types'

type TabId = 'checks' | 'audit' | 'flags' | 'stopmit'

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
  const stopMitDraft = useTradingStore((s) => s.stopMitDraft)
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
