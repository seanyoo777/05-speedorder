import { Suspense, lazy, useEffect } from 'react'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { TradeHistoryPanel } from '../components/history/TradeHistoryPanel'
import { RightOrderColumn } from '../components/ordercolumn/RightOrderColumn'
import { PositionPanel } from '../components/position/PositionPanel'
import { TopTickerBar } from '../components/ticker/TopTickerBar'
import { WorkspaceLauncher } from '../components/workspace/WorkspaceLauncher'
import { SelfTestCenter } from '../components/selftest/SelfTestCenter'
import { useMockRealtime } from '../hooks/useMockRealtime'
import { useWorkspaceUrlSync } from '../hooks/useWorkspaceUrlSync'
import { TradingLayout } from '../layouts/TradingLayout'
import { useTradingStore } from '../store/tradingStore'

const HeavyDemoChart = lazy(() => import('../components/chart/ChartArea'))

function ChartFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-so-border bg-so-surface text-xs text-so-muted">
      차트 영역 로딩…
    </div>
  )
}

export default function TradingPage() {
  useMockRealtime(true)
  useWorkspaceUrlSync()
  const layoutPreset = useTradingStore((s) => s.workspaceLayoutPreset)

  useEffect(() => {
    useTradingStore.getState().initWorkspaceFromUrl()
  }, [])

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
    <>
    <TradingLayout
      layoutPreset={layoutPreset}
      ticker={
        <ErrorBoundary>
          <WorkspaceLauncher />
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
    <SelfTestCenter />
    </>
  )
}
