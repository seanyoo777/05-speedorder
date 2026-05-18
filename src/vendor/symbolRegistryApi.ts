import type { SymbolSpec } from '../types/symbol'
import { SYMBOL_REGISTRY, STANDARD_SYMBOLS, getSymbolSpec, isListedSymbol } from '../symbols/registry'

/**
 * 심볼 레지스트리 읽기 API — UTE·TGX가 동일 함수로 스펙을 조회할 때 사용.
 * (직렬화 스냅샷은 `readSpeedOrderVendorSerializableSnapshot` 참고)
 */
export type SpeedOrderSymbolRegistryApi = {
  readonly standardSymbols: typeof STANDARD_SYMBOLS
  /** `SYMBOL_REGISTRY` 키 순서는 구현에 따름; 표시용 정렬은 호스트 책임 */
  readonly listedSymbolKeys: readonly string[]
  getSpec(symbol: string | undefined | null): SymbolSpec
  isListed(symbol: string): boolean
}

function listedKeys(): readonly string[] {
  return Object.freeze(Object.keys(SYMBOL_REGISTRY)) as readonly string[]
}

export const speedOrderSymbolRegistry: SpeedOrderSymbolRegistryApi = {
  get standardSymbols() {
    return STANDARD_SYMBOLS
  },
  get listedSymbolKeys() {
    return listedKeys()
  },
  getSpec: getSymbolSpec,
  isListed: isListedSymbol,
}
