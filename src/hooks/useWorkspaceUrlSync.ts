import { useEffect } from 'react'
import { readWorkspaceIdFromUrl } from '../workspace/tradingWorkspaceUrl'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'

/** Back/forward — re-apply workspace from URL without full reload */
export function useWorkspaceUrlSync() {
  useEffect(() => {
    const onPop = () => {
      const raw = readWorkspaceIdFromUrl()
      const current = useWorkspaceShellStore.getState().activeWorkspaceId
      if (raw && raw !== current) {
        useWorkspaceShellStore.getState().activateWorkspace(raw, { syncUrl: false, urlRaw: raw })
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
}
