import { create } from 'zustand'
import { useTradingStore } from '../store/tradingStore'
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
    const state = useTradingStore.getState()
    const summary = runSpeedOrderSelfTest(state, { scope: 'full' }, useTradingStore)
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
