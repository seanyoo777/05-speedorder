import type { ReactNode } from 'react'

type Props = {
  ticker: ReactNode
  chart: ReactNode
  orderColumn: ReactNode
  bottomRow: ReactNode
}

/**
 * 반응형: 큰 화면에서는 HTS/Bitget형 2열, 작은 화면에서는 세로 스택.
 */
export function TradingLayout({ ticker, chart, orderColumn, bottomRow }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-so-bg text-[13px]">
      <div className="shrink-0">{ticker}</div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-3 lg:p-3">
        <div className="flex min-h-0 min-w-0 flex-col gap-2 lg:gap-3">
          <div className="min-h-[220px] min-w-0 flex-1">{chart}</div>
          <div className="min-h-0 shrink-0">{bottomRow}</div>
        </div>
        <div className="flex min-h-0 w-full flex-col gap-2 lg:max-w-[420px] lg:gap-3">
          {orderColumn}
        </div>
      </div>
    </div>
  )
}
