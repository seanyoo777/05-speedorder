import { create } from 'zustand'
import { createSelfTestStoreRunner, getTradingStoreView, useTradingStore } from '../store/tradingStore'
import {
  clearWorkspaceStoreRegistry,
  getOrCreateWorkspaceStore,
} from '../store/workspaceStoreRegistry'
import { useWorkspaceShellStore } from '../store/workspaceShellStore'
import { DEFAULT_WORKSPACE_ID } from '../workspace/tradingWorkspaceUrl'
import { recordSelfTestRunSummary } from './auditTrail'
import { runPostActionSelfTest, runSpeedOrderSelfTest } from './runSpeedOrderSelfTest'
import type { SelfTestSummary } from './types'

type SelfTestUiStore = {
  panelOpen: boolean
  running: boolean
  summary: SelfTestSummary | null
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  runAll: () => void
  runCritical: () => void
  validateAfterAction: (actionLabel: string) => void
}

export const useSelfTestStore = create<SelfTestUiStore>((set) => ({
  panelOpen: false,
  running: false,
  summary: null,

  setPanelOpen: (open) => set({ panelOpen: open }),

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  runAll: () => {
    set({ running: true })
    clearWorkspaceStoreRegistry()
    useWorkspaceShellStore.getState().activateWorkspace(DEFAULT_WORKSPACE_ID, { syncUrl: false })
    getOrCreateWorkspaceStore(DEFAULT_WORKSPACE_ID)
    const runner = createSelfTestStoreRunner()
    const state = getTradingStoreView()
    const summary = runSpeedOrderSelfTest(state, { scope: 'full' }, runner)
    recordSelfTestRunSummary(
      summary.status,
      summary.issueCount,
      summary.passCount,
      summary.warnCount,
      summary.failCount,
    )
    set({ running: false, summary })
  },

  runCritical: () => {
    set({ running: true })
    const state = useTradingStore.getState()
    const summary = runSpeedOrderSelfTest(state, { scope: 'critical' })
    recordSelfTestRunSummary(
      summary.status,
      summary.issueCount,
      summary.passCount,
      summary.warnCount,
      summary.failCount,
    )
    set({ running: false, summary })
  },

  validateAfterAction: (actionLabel) => {
    const state = useTradingStore.getState()
    const summary = runPostActionSelfTest(actionLabel, state)
    set({ summary })
  },
}))
