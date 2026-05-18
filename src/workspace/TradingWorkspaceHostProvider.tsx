import { useEffect, useRef, type ReactNode } from 'react'
import { readActiveWorkspaceVendorSnapshot, readAllWorkspaceVendorSnapshots } from '../vendor/readWorkspaceVendorSnapshot'
import { getWorkspaceStoreCount } from '../store/workspaceStoreRegistry'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'
import { TradingWorkspaceHostContext } from './tradingWorkspaceHostContext'
import {
  applyTradingWorkspaceHostBootstrap,
  assertTradingWorkspaceHostMockOnly,
  notifyTradingWorkspaceHostChange,
} from './tradingWorkspaceHostRuntime'
import type {
  TradingWorkspaceHostContextValue,
  TradingWorkspaceHostProps,
} from './tradingWorkspaceHostTypes'

type ProviderProps = TradingWorkspaceHostProps & {
  children: ReactNode
}

export function TradingWorkspaceHostProvider({
  children,
  initialWorkspaceId,
  showLauncher = true,
  compact = false,
  onWorkspaceChange,
  renderHeaderSlot,
  mockOnly,
  showHostDiagnostics = false,
  enableUrlSync = false,
  enableMockRealtime = true,
}: ProviderProps) {
  assertTradingWorkspaceHostMockOnly(mockOnly)

  const activeWorkspaceId = useWorkspaceShellStore((s) => s.activeWorkspaceId)
  const onChangeRef = useRef(onWorkspaceChange)

  useEffect(() => {
    onChangeRef.current = onWorkspaceChange
  }, [onWorkspaceChange])

  useEffect(() => {
    applyTradingWorkspaceHostBootstrap({ initialWorkspaceId, enableUrlSync, mockOnly: true })
    if (onChangeRef.current) {
      notifyTradingWorkspaceHostChange(onChangeRef.current)
    }
  }, [initialWorkspaceId, enableUrlSync])

  useEffect(() => {
    const unsub = useWorkspaceShellStore.subscribe((state, prev) => {
      if (state.activeWorkspaceId === prev.activeWorkspaceId) return
      if (onChangeRef.current) {
        notifyTradingWorkspaceHostChange(onChangeRef.current)
      }
    })
    return unsub
  }, [])

  void activeWorkspaceId
  void getWorkspaceStoreCount()
  const activeSnapshot = readActiveWorkspaceVendorSnapshot()
  const allSnapshots = readAllWorkspaceVendorSnapshots()

  const value: TradingWorkspaceHostContextValue = {
    showLauncher,
    compact,
    showHostDiagnostics,
    enableUrlSync,
    enableMockRealtime,
    activeSnapshot,
    allSnapshots,
    renderHeaderSlot,
  }

  return (
    <TradingWorkspaceHostContext.Provider value={value}>
      {children}
    </TradingWorkspaceHostContext.Provider>
  )
}
