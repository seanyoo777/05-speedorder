/**
 * Symbol registry — 패키지 내부 `symbols/registry`와 동일 계약을 배럴로 노출.
 * 형제 레포(02-TGX-CEX, 07-UTE)는 이 경로 또는 `vendor` 스냅샷 API만 참조하고
 * 모노레포 밖 소스 경로 직접 침범을 피하는 것을 권장합니다.
 */
export {
  SYMBOL_REGISTRY,
  STANDARD_SYMBOLS,
  getSymbolSpec,
  isListedSymbol,
} from './registry'
