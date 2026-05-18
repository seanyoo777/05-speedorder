import { getTradingWorkspaceSlot } from '../domain/tradingWorkspaceCatalog'

export const DEFAULT_WORKSPACE_ID = 'domestic_futures:1'

export const WORKSPACE_URL_PARAM = 'workspaceId'

export function readWorkspaceIdFromUrl(search?: string): string | null {
  if (typeof window === 'undefined' && search == null) return null
  const q = search ?? (typeof window !== 'undefined' ? window.location.search : '')
  const raw = new URLSearchParams(q).get(WORKSPACE_URL_PARAM)
  return raw && raw.trim() !== '' ? raw.trim() : null
}

export function resolveWorkspaceId(raw: string | null | undefined): {
  workspaceId: string
  usedFallback: boolean
} {
  if (raw && getTradingWorkspaceSlot(raw)) {
    return { workspaceId: raw, usedFallback: false }
  }
  return { workspaceId: DEFAULT_WORKSPACE_ID, usedFallback: true }
}

export function buildUrlSearchWithWorkspaceId(workspaceId: string, baseSearch = ''): string {
  const params = new URLSearchParams(baseSearch.startsWith('?') ? baseSearch.slice(1) : baseSearch)
  params.set(WORKSPACE_URL_PARAM, workspaceId)
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** Browser only — updates address bar without navigation */
export function writeWorkspaceIdToUrl(workspaceId: string, mode: 'replace' | 'push' = 'replace'): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set(WORKSPACE_URL_PARAM, workspaceId)
  if (mode === 'push') {
    window.history.pushState({ workspaceId }, '', url)
  } else {
    window.history.replaceState({ workspaceId }, '', url)
  }
}

export function isWorkspaceUrlInSync(activeWorkspaceId: string, search?: string): boolean {
  const fromUrl = readWorkspaceIdFromUrl(search)
  if (!fromUrl) return activeWorkspaceId === DEFAULT_WORKSPACE_ID
  return fromUrl === activeWorkspaceId
}
