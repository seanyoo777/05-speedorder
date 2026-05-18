import { create } from 'zustand'
import { createWorkspaceShellSlice } from './slices/workspaceShellSlice'
import type { WorkspaceShellStore } from './workspaceShellTypes'

export const useWorkspaceShellStore = create<WorkspaceShellStore>()((...args) => ({
  ...createWorkspaceShellSlice(...args),
}))
