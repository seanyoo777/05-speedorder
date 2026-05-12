import { Suspense, lazy } from 'react'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { TradeHistoryPanel } from '../components/history/TradeHistoryPanel'
import { RightOrderColumn } from '../components/ordercolumn/RightOrderColumn'
import { PositionPanel } from '../components/position/PositionPanel'
import { TopTickerBar } from '../components/ticker/TopTickerBar'
import { useMockRealtime } from '../hooks/useMockRealtime'
import { TradingLayout } from '../layouts/TradingLayout'

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
    <TradingLayout
      ticker={
        <ErrorBoundary>
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
  )
}
