import { PanelShell } from '../common/PanelShell'

/**
 * TradingView / 차트 SDK 연결 전용 슬롯.
 * 호스트 앱에서 `children` 또는 ref 기반으로 위젯을 마운트하면 됩니다.
 */
export function ChartArea() {
  return (
    <PanelShell title="차트 (Chart Slot)" className="min-h-[220px] flex-1">
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-so-muted">
        <p className="font-medium text-white">TradingView / 차트 API 자리</p>
        <p className="max-w-md text-[12px] leading-relaxed">
          이 영역은 추후 <span className="font-mono text-so-accent">ChartingLibrary</span> 또는
          내부 캔들 API를 감싸는 어댑터 컴포넌트만 교체하면 됩니다. 지금은 레이아웃/성능 구조만
          확보합니다.
        </p>
      </div>
    </PanelShell>
  )
}

export default ChartArea
