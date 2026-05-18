import { useMemo } from 'react'
import { useTradingStore } from '../../store/tradingStore'
import { resolveTgxFormRhythmId, tgxFormRhythmClasses } from './tgxFormRhythm'

export function useTgxFormRhythm() {
  const orderBookStyle = useTradingStore((s) => s.orderBookStyle)
  const orderBookRowDensity = useTradingStore((s) => s.orderBookRowDensity)
  const rhythmId = resolveTgxFormRhythmId(orderBookStyle, orderBookRowDensity)
  const cx = useMemo(() => tgxFormRhythmClasses(rhythmId), [rhythmId])
  return { rhythmId, cx }
}
