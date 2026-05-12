/** 화면 설정 — localStorage (TGX / 스탠드얼론 공통) */

export const UI_FONT_SCALE_LS_KEY = '05-speedorder:font-scale'
export const UI_ORDERBOOK_FONT_SCALE_LS_KEY = '05-speedorder:orderbook-font-scale'
export const UI_COMPACT_MODE_LS_KEY = '05-speedorder:compact-mode'
export const UI_DOM_WIDTH_LS_KEY = '05-speedorder:dom-width'

const DEFAULT_FONT = 1
const DEFAULT_OB_FONT = 1
const MIN_S = 0.8
const MAX_S = 1.25

export function readFontScaleFromLs(): number {
  try {
    const n = Number(localStorage.getItem(UI_FONT_SCALE_LS_KEY))
    if (Number.isFinite(n) && n >= MIN_S && n <= MAX_S) return n
  } catch {
    /* ignore */
  }
  return DEFAULT_FONT
}

export function readOrderBookFontScaleFromLs(): number {
  try {
    const n = Number(localStorage.getItem(UI_ORDERBOOK_FONT_SCALE_LS_KEY))
    if (Number.isFinite(n) && n >= MIN_S && n <= MAX_S) return n
  } catch {
    /* ignore */
  }
  return DEFAULT_OB_FONT
}

export function readCompactModeFromLs(): boolean {
  try {
    return localStorage.getItem(UI_COMPACT_MODE_LS_KEY) === '1'
  } catch {
    return false
  }
}

/** DOM 열 최소 너비(px). 비어 있으면 null → 패널 기본값 사용 */
export function readDomWidthFromLs(): number | null {
  try {
    const raw = localStorage.getItem(UI_DOM_WIDTH_LS_KEY)
    if (raw == null || raw === '') return null
    const n = Math.round(Number(raw))
    if (Number.isFinite(n) && n >= 220 && n <= 560) return n
  } catch {
    /* ignore */
  }
  return null
}
