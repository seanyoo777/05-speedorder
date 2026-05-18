import { useEffect } from 'react'
import { readWorkspaceIdFromUrl } from '../workspace/tradingWorkspaceUrl'
import { useTradingStore } from '../store/tradingStore'

/** Back/forward — re-apply workspace from URL without full reload */
export function useWorkspaceUrlSync() {
  useEffect(() => {
    const onPop = () => {
      const raw = readWorkspaceIdFromUrl()
      const current = useTradingStore.getState().activeWorkspaceId
      if (raw && raw !== current) {
        useTradingStore.getState().activateWorkspace(raw, { syncUrl: false, urlRaw: raw })
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
}
