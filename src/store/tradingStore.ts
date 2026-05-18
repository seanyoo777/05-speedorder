import { useStore, type StoreApi } from 'zustand'
import { createSubmitMockSpeedOrder } from '../engine/submitMockSpeedOrder'
import {
  getActiveWorkspaceStoreApi,
  getOrCreateWorkspaceStore,
} from './workspaceStoreRegistry'
import { useWorkspaceShellStore } from './workspaceShellStore'
import type { TradingStore } from './tradingStoreTypes'
import type { WorkspaceShellActions, WorkspaceShellState } from './workspaceShellTypes'

export type UiMode = 'beginner' | 'expert'

export type { TradingStore } from './tradingStoreTypes'
export type { TradingStoreApi } from './tradingStoreTypes'
export type { WorkspaceShellStore } from './workspaceShellTypes'

/** Shell + active workspace trading state (self-test / diagnostics). */
export type TradingStoreView = TradingStore & WorkspaceShellState & WorkspaceShellActions

function useActiveTradingStoreApi(): StoreApi<TradingStore> {
  const activeId = useWorkspaceShellStore((s) => s.activeWorkspaceId)
  return getOrCreateWorkspaceStore(activeId)
}

const tradingStoreIdentity = (s: TradingStore) => s

function useTradingStoreHook(): TradingStore
function useTradingStoreHook<T>(selector: (state: TradingStore) => T): T
function useTradingStoreHook<T>(selector: (state: TradingStore) => T = tradingStoreIdentity as (s: TradingStore) => T) {
  const api = useActiveTradingStoreApi()
  return useStore(api, selector)
}

function subscribeActiveTradingStore(
  listener: (state: TradingStore, prevState: TradingStore) => void,
): () => void {
  let unsubTrading: (() => void) | undefined
  const attach = () => {
    unsubTrading?.()
    unsubTrading = getActiveWorkspaceStoreApi().subscribe(listener)
  }
  attach()
  const unsubShell = useWorkspaceShellStore.subscribe((shell, prev) => {
    if (shell.activeWorkspaceId !== prev.activeWorkspaceId) {
      attach()
    }
  })
  return () => {
    unsubShell()
    unsubTrading?.()
  }
}

type TradingStoreHook = {
  (): TradingStore
  <T>(selector: (state: TradingStore) => T): T
} & StoreApi<TradingStore>

export const useTradingStore = useTradingStoreHook as TradingStoreHook

const activeTradingStoreApi = {
  getState: () => getActiveWorkspaceStoreApi().getState(),
  setState: ((...args: Parameters<StoreApi<TradingStore>['setState']>) => {
    getActiveWorkspaceStoreApi().setState(...args)
  }) as StoreApi<TradingStore>['setState'],
  subscribe: subscribeActiveTradingStore,
  getInitialState: () => getActiveWorkspaceStoreApi().getInitialState(),
} satisfies StoreApi<TradingStore>

useTradingStore.getState = activeTradingStoreApi.getState
useTradingStore.setState = activeTradingStoreApi.setState
useTradingStore.subscribe = activeTradingStoreApi.subscribe
useTradingStore.getInitialState = activeTradingStoreApi.getInitialState

/** Imperative API for engines/feedback (always targets active workspace store). */
export const tradingStoreApi = activeTradingStoreApi

export function getTradingStoreView(): TradingStoreView {
  return {
    ...getActiveWorkspaceStoreApi().getState(),
    ...useWorkspaceShellStore.getState(),
  }
}

/** Self-test / smoke — merged shell + active workspace with `activateWorkspace`. */
export function createSelfTestStoreRunner(): StoreApi<TradingStoreView> {
  return {
    getState: getTradingStoreView,
    setState: (partial) => {
      const next =
        typeof partial === 'function'
          ? partial(getTradingStoreView())
          : partial
      if (!next) return
      const shellKeys = new Set([
        'activeWorkspaceId',
        'activeWorkspaceCategoryId',
        'workspaceUrlQueryRaw',
        'workspaceUrlFallbackUsed',
        'workspaceUrlInSync',
        'activateWorkspace',
        'initWorkspaceFromUrl',
      ])
      const shellPatch: Partial<WorkspaceShellState & WorkspaceShellActions> = {}
      const tradingPatch: Partial<TradingStore> = {}
      for (const [key, value] of Object.entries(next)) {
        if (shellKeys.has(key)) {
          ;(shellPatch as Record<string, unknown>)[key] = value
        } else {
          ;(tradingPatch as Record<string, unknown>)[key] = value
        }
      }
      if (Object.keys(shellPatch).length > 0) {
        useWorkspaceShellStore.setState(shellPatch)
      }
      if (Object.keys(tradingPatch).length > 0) {
        getActiveWorkspaceStoreApi().setState(tradingPatch)
      }
    },
    subscribe: (listener) => {
      const wrap = () => listener(getTradingStoreView(), getTradingStoreView())
      const u1 = useWorkspaceShellStore.subscribe(wrap)
      const u2 = subscribeActiveTradingStore(() => wrap())
      return () => {
        u1()
        u2()
      }
    },
    getInitialState: () => getTradingStoreView(),
  }
}

export function submitMockSpeedOrder(
  ...args: Parameters<ReturnType<typeof createSubmitMockSpeedOrder>>
) {
  return createSubmitMockSpeedOrder(getActiveWorkspaceStoreApi())(...args)
}

export { createSubmitMockSpeedOrder } from '../engine/submitMockSpeedOrder'
export type { SubmitMockSpeedOrderInput } from '../engine/submitMockSpeedOrder'
export { executeImmediateMockMarketOrder } from '../engine/immediateMarketFill'

export {
  createTradingStoreForWorkspace as createTradingStore,
  clearWorkspaceStoreRegistry,
  evictWorkspaceStore,
  getActiveWorkspaceStoreApi,
  getOrCreateWorkspaceStore,
  getWorkspaceStoreCount,
  getWorkspaceStoreRegistrySnapshot,
  listWorkspaceStoreIds,
} from './workspaceStoreRegistry'

export { useWorkspaceShellStore } from './workspaceShellStore'

/** TGX / UTE — vendor 스냅샷·정책·심볼 API (store 경로에서 재export) */
export {
  ORDER_EXECUTION_POLICY,
  SPEED_ORDER_ENGINE_STATUS,
  MARKET_SYNC_ACTIONS,
  speedOrderSymbolRegistry,
  readSpeedOrderVendorSerializableSnapshot,
  getSpeedOrderVendorBundle,
  readWorkspaceVendorSnapshot,
  readAllWorkspaceVendorSnapshots,
  readActiveWorkspaceVendorSnapshot,
  validateWorkspaceVendorSnapshot,
  countInvalidWorkspaceVendorSnapshots,
  workspaceVendorSnapshotContractKeys,
} from '../vendor'
export type {
  OrderExecutionPolicy,
  SpeedOrderEngineStatus,
  MarketSyncActionEntry,
  MarketSyncActionId,
  SpeedOrderSymbolRegistryApi,
  SpeedOrderVendorSerializableSnapshot,
  SpeedOrderVendorBundle,
  TradingWorkspaceVendorSnapshot,
} from '../vendor'
