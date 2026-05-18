import type { ReactNode } from 'react'
import type { TradingWorkspaceVendorSnapshot } from '../vendor/readWorkspaceVendorSnapshot'

export type TradingWorkspaceHostHeaderContext = {
  activeSnapshot: TradingWorkspaceVendorSnapshot | null
  allSnapshots: readonly TradingWorkspaceVendorSnapshot[]
}

export type TradingWorkspaceHostProps = {
  /** Shell 초기 workspace — 미지정 시 URL sync 또는 `domestic_futures:1` */
  initialWorkspaceId?: string
  /** WorkspaceLauncher 표시 (기본 true) */
  showLauncher?: boolean
  /** Host embed 컴팩트 chrome */
  compact?: boolean
  /** 활성 workspace 변경 시 vendor snapshot 콜백 */
  onWorkspaceChange?: (snapshot: TradingWorkspaceVendorSnapshot) => void
  /** Launcher 위/아래 호스트 chrome 슬롯 */
  renderHeaderSlot?: (ctx: TradingWorkspaceHostHeaderContext) => ReactNode
  /** 반드시 true — mock/demo only */
  mockOnly?: true
  /** Embed 디버그용 active snapshot strip */
  showHostDiagnostics?: boolean
  /** `?workspaceId=` URL 동기화 (standalone TradingPage용) */
  enableUrlSync?: boolean
  /** mock tick 파이프라인 */
  enableMockRealtime?: boolean
  className?: string
}

export type TradingWorkspaceHostContextValue = {
  showLauncher: boolean
  compact: boolean
  showHostDiagnostics: boolean
  enableUrlSync: boolean
  enableMockRealtime: boolean
  activeSnapshot: TradingWorkspaceVendorSnapshot | null
  allSnapshots: readonly TradingWorkspaceVendorSnapshot[]
  renderHeaderSlot?: TradingWorkspaceHostProps['renderHeaderSlot']
}
