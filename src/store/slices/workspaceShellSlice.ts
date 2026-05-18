import type { StateCreator } from 'zustand'
import { getTradingWorkspaceSlot } from '../../domain/tradingWorkspaceCatalog'
import {
  getOrCreateWorkspaceStore,
  switchActiveWorkspaceStore,
} from '../workspaceStoreRegistry'
import {
  isWorkspaceUrlInSync,
  readWorkspaceIdFromUrl,
  resolveWorkspaceId,
  writeWorkspaceIdToUrl,
} from '../../workspace/tradingWorkspaceUrl'
import type { WorkspaceShellStore } from '../workspaceShellTypes'

export const createWorkspaceShellSlice: StateCreator<
  WorkspaceShellStore,
  [],
  [],
  Pick<
    WorkspaceShellStore,
    | 'activeWorkspaceId'
    | 'activeWorkspaceCategoryId'
    | 'workspaceUrlQueryRaw'
    | 'workspaceUrlFallbackUsed'
    | 'workspaceUrlInSync'
    | 'activateWorkspace'
    | 'initWorkspaceFromUrl'
  >
> = (set, get) => ({
  activeWorkspaceId: 'domestic_futures:1',
  activeWorkspaceCategoryId: 'domestic_futures',
  workspaceUrlQueryRaw: null as string | null,
  workspaceUrlFallbackUsed: false,
  workspaceUrlInSync: true,

  activateWorkspace: (workspaceId, options) => {
    const resolved = resolveWorkspaceId(workspaceId)
    const slot = getTradingWorkspaceSlot(resolved.workspaceId)
    if (!slot) return

    getOrCreateWorkspaceStore(resolved.workspaceId)
    switchActiveWorkspaceStore(resolved.workspaceId)

    const syncUrl = options?.syncUrl !== false
    if (syncUrl && typeof window !== 'undefined') {
      writeWorkspaceIdToUrl(resolved.workspaceId, options?.historyMode ?? 'replace')
    }

    const urlRaw = options?.urlRaw !== undefined ? options.urlRaw : readWorkspaceIdFromUrl()
    set({
      activeWorkspaceId: resolved.workspaceId,
      activeWorkspaceCategoryId: slot.categoryId,
      workspaceUrlQueryRaw: urlRaw,
      workspaceUrlFallbackUsed: resolved.usedFallback,
      workspaceUrlInSync: isWorkspaceUrlInSync(resolved.workspaceId),
    })
  },

  initWorkspaceFromUrl: (search) => {
    const urlRaw = readWorkspaceIdFromUrl(search)
    const resolved = resolveWorkspaceId(urlRaw)
    get().activateWorkspace(resolved.workspaceId, {
      syncUrl: true,
      urlRaw,
      historyMode: 'replace',
    })
    if (resolved.usedFallback && typeof window !== 'undefined') {
      writeWorkspaceIdToUrl(resolved.workspaceId, 'replace')
    }
  },
})
