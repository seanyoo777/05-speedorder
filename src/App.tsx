import { Suspense, lazy } from 'react'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const TradingPage = lazy(() => import('./pages/TradingPage'))

function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-so-bg text-sm text-so-muted">
      거래창 로딩…
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-so-bg p-6 text-red-300">
          앱 수준 오류가 발생했습니다. 콘솔 로그를 확인하세요.
        </div>
      }
    >
      <Suspense fallback={<AppFallback />}>
        <TradingPage />
      </Suspense>
    </ErrorBoundary>
  )
}
