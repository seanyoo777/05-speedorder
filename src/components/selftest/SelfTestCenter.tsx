import { useEffect } from 'react'
import { PanelShell } from '../common/PanelShell'
import { DiagnosticsPanel } from './DiagnosticsPanel'
import { useSelfTestStore } from '../../selftest/selfTestStore'
import type { SelfTestStatus } from '../../selftest/types'

function overallStatusClass(s: SelfTestStatus | undefined): string {
  if (s === 'pass') return 'border-so-bid/50 text-so-bid'
  if (s === 'warn') return 'border-amber-500/50 text-amber-400'
  if (s === 'fail') return 'border-so-ask/50 text-so-ask'
  return 'border-so-border text-so-muted'
}

export function SelfTestCenter() {
  const panelOpen = useSelfTestStore((s) => s.panelOpen)
  const togglePanel = useSelfTestStore((s) => s.togglePanel)
  const summary = useSelfTestStore((s) => s.summary)
  const runAll = useSelfTestStore((s) => s.runAll)

  useEffect(() => {
    if (!summary) runAll()
  }, [summary, runAll])

  const issueCount = summary?.issueCount ?? 0
  const status = summary?.status

  return (
    <>
      <button
        type="button"
        className={`fixed bottom-3 left-3 z-50 rounded-lg border px-3 py-2 text-[11px] font-medium shadow-lg backdrop-blur-sm ${overallStatusClass(status)} bg-so-surface/95 hover:bg-so-border/40`}
        onClick={togglePanel}
        aria-expanded={panelOpen}
        aria-label="Open self-test diagnostics"
      >
        Self-Test
        {issueCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-so-ask/20 px-1.5 text-[10px] text-so-ask">
            {issueCount}
          </span>
        ) : null}
      </button>

      {panelOpen ? (
        <div
          className="fixed bottom-14 left-3 z-50 flex h-[min(70vh,520px)] w-[min(92vw,400px)] flex-col shadow-2xl"
          role="dialog"
          aria-label="Self-test center"
        >
          <PanelShell title="Self-Test Center" scrollBody>
            <DiagnosticsPanel />
          </PanelShell>
        </div>
      ) : null}
    </>
  )
}
