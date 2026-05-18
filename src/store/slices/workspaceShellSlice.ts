import type { StateCreator } from 'zustand'
import { getTradingWorkspaceSlot } from '../../domain/tradingWorkspaceCatalog'
import {
  getActiveWorkspaceId,
  getOrCreateWorkspaceStore,
  switchActiveWorkspaceStore,
} from '../workspaceStoreRegistry'
import {
  isWorkspaceUrlInSync,
  readWorkspaceIdFromUrl,
  resolveWorkspaceId,
  writeWorkspaceIdToUrl,
} from '../../workspace/tradingWorkspaceUrl'
import {
  recordWorkspaceSyncSkipped,
  recordWorkspaceSyncSource,
} from '../../workspace/workspaceSyncDiagnostics'
import { isSameWorkspaceShellMeta } from '../../workspace/workspaceSyncGuards'
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

    const urlRaw = options?.urlRaw !== undefined ? options.urlRaw : readWorkspaceIdFromUrl()
    const urlInSync = isWorkspaceUrlInSync(resolved.workspaceId)
    const shellMeta = isSameWorkspaceShellMeta(get(), {
      workspaceId: resolved.workspaceId,
      categoryId: slot.categoryId,
      urlRaw,
      usedFallback: resolved.usedFallback,
      urlInSync,
    })
    if (shellMeta && getActiveWorkspaceId() === resolved.workspaceId) {
      recordWorkspaceSyncSkipped('activateWorkspace')
      return
    }

    recordWorkspaceSyncSource('activateWorkspace')
    getOrCreateWorkspaceStore(resolved.workspaceId)
    switchActiveWorkspaceStore(resolved.workspaceId)

    const syncUrl = options?.syncUrl !== false
    if (syncUrl && typeof window !== 'undefined') {
      writeWorkspaceIdToUrl(resolved.workspaceId, options?.historyMode ?? 'replace')
    }

    set({
      activeWorkspaceId: resolved.workspaceId,
      activeWorkspaceCategoryId: slot.categoryId,
      workspaceUrlQueryRaw: urlRaw,
      workspaceUrlFallbackUsed: resolved.usedFallback,
      workspaceUrlInSync: urlInSync,
    })
  },

  initWorkspaceFromUrl: (search) => {
    const urlRaw = readWorkspaceIdFromUrl(search)
    const resolved = resolveWorkspaceId(urlRaw)
    const slot = getTradingWorkspaceSlot(resolved.workspaceId)
    if (!slot) return

    const urlInSync = isWorkspaceUrlInSync(resolved.workspaceId)
    if (
      isSameWorkspaceShellMeta(get(), {
        workspaceId: resolved.workspaceId,
        categoryId: slot.categoryId,
        urlRaw,
        usedFallback: resolved.usedFallback,
        urlInSync,
      }) &&
      getActiveWorkspaceId() === resolved.workspaceId
    ) {
      recordWorkspaceSyncSkipped('initWorkspaceFromUrl')
      return
    }

    recordWorkspaceSyncSource('initWorkspaceFromUrl')
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
