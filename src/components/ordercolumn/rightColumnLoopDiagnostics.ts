export type RightColumnPanelName =
  | 'orderBookHost'
  | 'orderFormTabs'
  | 'orderFormIntentStrip'
  | 'orderFormPanel'
  | 'researchFeedPanel'

type RightColumnLoopDiagnostics = {
  rightColumnLoopSource: string | null
  renderLoopCandidate: string | null
  isolatedPanelName: RightColumnPanelName | null
}

const diag: RightColumnLoopDiagnostics = {
  rightColumnLoopSource: null,
  renderLoopCandidate: null,
  isolatedPanelName: null,
}

export function recordRightColumnRender(panel: RightColumnPanelName): void {
  diag.rightColumnLoopSource = panel
}

export function recordRightColumnLoopCandidate(
  candidate: string,
  panel?: RightColumnPanelName,
): void {
  diag.renderLoopCandidate = candidate
  if (panel) diag.isolatedPanelName = panel
}

export function getRightColumnLoopDiagnostics(): Readonly<RightColumnLoopDiagnostics> {
  return { ...diag }
}

export function resetRightColumnLoopDiagnostics(): void {
  diag.rightColumnLoopSource = null
  diag.renderLoopCandidate = null
  diag.isolatedPanelName = null
}
