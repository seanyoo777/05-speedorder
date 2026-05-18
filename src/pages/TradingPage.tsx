import { SelfTestCenter } from '../components/selftest/SelfTestCenter'
import { TradingWorkspaceHost } from '../workspace/TradingWorkspaceHost'

/** Standalone app route — URL sync + Launcher + mock realtime (기존 동작 유지). */
export default function TradingPage() {
  return (
    <>
      <TradingWorkspaceHost
        mockOnly
        showLauncher
        enableUrlSync
        enableMockRealtime
        className="min-h-screen"
      />
      <SelfTestCenter />
    </>
  )
}
