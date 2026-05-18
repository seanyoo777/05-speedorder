import { getTradingWorkspaceSlot } from '../domain/tradingWorkspaceCatalog'
import { applyWorkspaceSlotToStore } from '../workspace/applyWorkspaceSlot'
import { DEFAULT_WORKSPACE_ID } from '../workspace/tradingWorkspaceUrl'
import { createTradingStoreInstance } from './createTradingStoreInstance'
import type { TradingStoreApi } from './tradingStoreTypes'

const registry = new Map<string, TradingStoreApi>()

let activeWorkspaceId = DEFAULT_WORKSPACE_ID

function seedWorkspaceStore(api: TradingStoreApi, workspaceId: string): void {
  const slot = getTradingWorkspaceSlot(workspaceId)
  if (!slot) return
  applyWorkspaceSlotToStore(api.getState(), slot)
}

/**
 * Create (or return existing) isolated store for a workspace slot.
 * Alias required by W3 spec: createTradingStore(workspaceId).
 */
export function createTradingStoreForWorkspace(workspaceId: string): TradingStoreApi {
  const existing = registry.get(workspaceId)
  if (existing) return existing
  const api = createTradingStoreInstance()
  seedWorkspaceStore(api, workspaceId)
  registry.set(workspaceId, api)
  return api
}

export function getOrCreateWorkspaceStore(workspaceId: string): TradingStoreApi {
  return createTradingStoreForWorkspace(workspaceId)
}

/** Non-creating read — `readAllWorkspaceVendorSnapshots` catalog merge용. */
export function peekWorkspaceStore(workspaceId: string): TradingStoreApi | undefined {
  return registry.get(workspaceId)
}

export function switchActiveWorkspaceStore(workspaceId: string): void {
  activeWorkspaceId = workspaceId
}

export function getActiveWorkspaceId(): string {
  return activeWorkspaceId
}

export function getActiveWorkspaceStoreApi(): TradingStoreApi {
  return getOrCreateWorkspaceStore(activeWorkspaceId)
}

export function listWorkspaceStoreIds(): readonly string[] {
  return [...registry.keys()]
}

export function getWorkspaceStoreCount(): number {
  return registry.size
}

/** Drop isolated store so next activate re-seeds from catalog (self-test). */
export function evictWorkspaceStore(workspaceId: string): void {
  registry.delete(workspaceId)
}

export function getWorkspaceStoreRegistrySnapshot(): Readonly<
  Record<string, { symbol: string; mockOnly: true }>
> {
  const out: Record<string, { symbol: string; mockOnly: true }> = {}
  for (const [id, api] of registry) {
    out[id] = { symbol: api.getState().symbol, mockOnly: true }
  }
  return out
}

/** Test-only — clears isolated stores between self-test runs. */
export function clearWorkspaceStoreRegistry(): void {
  registry.clear()
  activeWorkspaceId = DEFAULT_WORKSPACE_ID
}

// Bootstrap default workspace store at module load (mock/demo).
getOrCreateWorkspaceStore(DEFAULT_WORKSPACE_ID)
