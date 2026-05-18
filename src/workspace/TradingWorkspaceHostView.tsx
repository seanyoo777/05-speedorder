import { Suspense, lazy } from 'react'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { TradeHistoryPanel } from '../components/history/TradeHistoryPanel'
import { RightOrderColumn } from '../components/ordercolumn/RightOrderColumn'
import { PositionPanel } from '../components/position/PositionPanel'
import { TopTickerBar } from '../components/ticker/TopTickerBar'
import { WorkspaceLauncher } from '../components/workspace/WorkspaceLauncher'
import { useMockRealtime } from '../hooks/useMockRealtime'
import { useWorkspaceUrlSync } from '../hooks/useWorkspaceUrlSync'
import { TradingLayout } from '../layouts/TradingLayout'
import { useTradingStore } from '../store/tradingStore'
import { useTradingWorkspaceHost } from './tradingWorkspaceHostContext'

const HeavyDemoChart = lazy(() => import('../components/chart/ChartArea'))

function WorkspaceUrlSyncGate() {
  useWorkspaceUrlSync()
  return null
}

function ChartFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-so-border bg-so-surface text-xs text-so-muted">
      차트 영역 로딩…
    </div>
  )
}

function HostDiagnosticsStrip() {
  const { activeSnapshot, allSnapshots } = useTradingWorkspaceHost()
  if (!activeSnapshot) return null
  return (
    <div className="border-b border-so-border bg-so-bg/90 px-2 py-1 font-mono text-[9px] text-so-muted">
      <span className="text-so-bid">mockOnly</span> · {activeSnapshot.workspaceId} ·{' '}
      {activeSnapshot.activeSymbol} · snapshots={allSnapshots.length}
    </div>
  )
}

type ViewProps = {
  className?: string
}

export function TradingWorkspaceHostView({ className }: ViewProps) {
  const {
    showLauncher,
    compact,
    showHostDiagnostics,
    enableUrlSync,
    enableMockRealtime,
    activeSnapshot,
    allSnapshots,
    renderHeaderSlot,
  } = useTradingWorkspaceHost()

  useMockRealtime(enableMockRealtime)

  const layoutPreset = useTradingStore((s) => s.workspaceLayoutPreset)
  const headerCtx = { activeSnapshot, allSnapshots }

  const orderColumn = (
    <ErrorBoundary>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <RightOrderColumn />
      </div>
    </ErrorBoundary>
  )

  const bottomRow = (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2 xl:gap-3">
      <ErrorBoundary>
        <PositionPanel />
      </ErrorBoundary>
      <ErrorBoundary>
        <TradeHistoryPanel />
      </ErrorBoundary>
    </div>
  )

  return (
    <div
      className={`flex h-full min-h-0 flex-col ${compact ? 'text-[12px]' : ''} ${className ?? ''}`.trim()}
    >
      {showHostDiagnostics ? <HostDiagnosticsStrip /> : null}
      {enableUrlSync ? <WorkspaceUrlSyncGate /> : null}
      {renderHeaderSlot?.(headerCtx)}
      <TradingLayout
        layoutPreset={layoutPreset}
        ticker={
          <ErrorBoundary>
            {showLauncher ? <WorkspaceLauncher /> : null}
            <TopTickerBar />
          </ErrorBoundary>
        }
        chart={
          <ErrorBoundary>
            <Suspense fallback={<ChartFallback />}>
              <HeavyDemoChart />
            </Suspense>
          </ErrorBoundary>
        }
        orderColumn={orderColumn}
        bottomRow={bottomRow}
      />
    </div>
  )
}
