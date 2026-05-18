import type { TradingWorkspaceCategoryId } from '../domain/tradingWorkspace'

export type WorkspaceShellState = {
  activeWorkspaceId: string
  activeWorkspaceCategoryId: TradingWorkspaceCategoryId
  workspaceUrlQueryRaw: string | null
  workspaceUrlFallbackUsed: boolean
  workspaceUrlInSync: boolean
}

export type WorkspaceShellActions = {
  activateWorkspace: (
    workspaceId: string,
    options?: {
      syncUrl?: boolean
      urlRaw?: string | null
      historyMode?: 'replace' | 'push'
    },
  ) => void
  initWorkspaceFromUrl: (search?: string) => void
}

export type WorkspaceShellStore = WorkspaceShellState & WorkspaceShellActions
