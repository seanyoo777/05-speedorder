/** TGX 등 호스트가 `registerSpeedOrderToast`로 연결하면 mock 체결·조건주 등에서 우측 하단 토스트로 표시 */

export type SpeedOrderToastHandler = (message: string) => void

let handler: SpeedOrderToastHandler | null = null

export function registerSpeedOrderToast(h: SpeedOrderToastHandler | null): void {
  handler = h
}

export function speedOrderToast(message: string): void {
  try {
    handler?.(message)
  } catch {
    /* ignore */
  }
}
