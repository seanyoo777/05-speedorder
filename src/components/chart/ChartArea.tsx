import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'
import { PanelShell } from '../common/PanelShell'

/**
 * TradingView / 차트 SDK 연결 전용 슬롯.
 * 호스트 앱에서 `children` 또는 ref 기반으로 위젯을 마운트하면 됩니다.
 * `symbol` 변경 시 `key`로 위젯 재마운트하기 좋게 `data-chart-symbol`을 노출합니다.
 */
export function ChartArea() {
  const symbol = useTradingStore((s) => s.symbol)
  const lastPrice = useTradingStore((s) => s.lastPrice)
  const spec = getSymbolSpec(symbol)

  return (
    <PanelShell title={`차트 · ${symbol}`} className="min-h-[220px] flex-1">
      <div
        key={symbol}
        data-chart-symbol={symbol}
        className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-so-muted"
      >
        <div>
          <p className="font-medium text-white">{spec.displayName}</p>
          <p className="mt-1 font-mono text-xs text-so-muted">
            {symbol} · {spec.marketType}
          </p>
          <p className="mt-2 font-mono text-lg text-white">
            {formatByDecimals(lastPrice, spec.priceDecimals)}
          </p>
        </div>
        <p className="max-w-md text-[12px] leading-relaxed">
          TradingView / 차트 API는{' '}
          <span className="font-mono text-so-accent">ChartingLibrary</span> 등으로 이 슬롯에 연결합니다.
          스토어의 <span className="font-mono">symbol</span>·<span className="font-mono">lastPrice</span>와
          동일 소스를 구독하면 심볼 전환 시 차트 심볼이 자동으로 맞춰집니다.
        </p>
      </div>
    </PanelShell>
  )
}

export default ChartArea
