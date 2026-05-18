import type { ReactNode } from 'react'
import type { WorkspaceLayoutPresetId } from '../domain/tradingWorkspace'

type Props = {
  ticker: ReactNode
  chart: ReactNode
  orderColumn: ReactNode
  bottomRow: ReactNode
  layoutPreset?: WorkspaceLayoutPresetId
}

/**
 * 반응형: 큰 화면에서는 HTS/Bitget형 2열, 작은 화면에서는 세로 스택.
 */
export function TradingLayout({
  ticker,
  chart,
  orderColumn,
  bottomRow,
  layoutPreset = 'hts_standard',
}: Props) {
  const orderColumnOnly = layoutPreset === 'order_column_only'
  const compact = layoutPreset === 'hts_compact'

  return (
    <div className={`flex h-full min-h-0 flex-col bg-so-bg ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
      <div className="shrink-0">{ticker}</div>
      <div
        className={`grid min-h-0 flex-1 grid-cols-1 p-2 lg:p-3 ${
          orderColumnOnly
            ? 'gap-2'
            : `gap-2 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-3 ${compact ? 'lg:gap-2' : ''}`
        }`}
      >
        {!orderColumnOnly ? (
          <div className="flex min-h-0 min-w-0 flex-col gap-2 lg:gap-3">
            <div className={`min-w-0 flex-1 ${compact ? 'min-h-[160px]' : 'min-h-[220px]'}`}>
              {chart}
            </div>
            <div className="min-h-0 shrink-0">{bottomRow}</div>
          </div>
        ) : (
          <div className="min-h-0 shrink-0 lg:hidden">{bottomRow}</div>
        )}
        <div
          className={`flex min-h-0 w-full flex-col gap-2 lg:max-w-[420px] ${compact ? 'lg:gap-2' : 'lg:gap-3'}`}
        >
          {orderColumn}
        </div>
        {orderColumnOnly ? <div className="hidden min-h-0 shrink-0 lg:block">{bottomRow}</div> : null}
      </div>
    </div>
  )
}
