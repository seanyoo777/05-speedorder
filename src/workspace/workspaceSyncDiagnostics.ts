export type WorkspaceSyncSource =
  | 'activateWorkspace'
  | 'initWorkspaceFromUrl'
  | 'applyWorkspaceSlot'
  | 'setSymbol'
  | 'hostBootstrap'
  | 'hostBootstrapSkipped'

type WorkspaceSyncDiagnostics = {
  lastWorkspaceSyncSource: WorkspaceSyncSource | null
  skippedSyncCount: number
  workspaceLoopGuardTriggered: boolean
}

const diag: WorkspaceSyncDiagnostics = {
  lastWorkspaceSyncSource: null,
  skippedSyncCount: 0,
  workspaceLoopGuardTriggered: false,
}

export function recordWorkspaceSyncSource(source: WorkspaceSyncSource): void {
  diag.lastWorkspaceSyncSource = source
}

export function recordWorkspaceSyncSkipped(source: WorkspaceSyncSource): void {
  diag.skippedSyncCount += 1
  diag.workspaceLoopGuardTriggered = true
  diag.lastWorkspaceSyncSource = source
}

export function getWorkspaceSyncDiagnostics(): Readonly<WorkspaceSyncDiagnostics> {
  return { ...diag }
}

/** Self-test isolation */
export function resetWorkspaceSyncDiagnostics(): void {
  diag.lastWorkspaceSyncSource = null
  diag.skippedSyncCount = 0
  diag.workspaceLoopGuardTriggered = false
}
