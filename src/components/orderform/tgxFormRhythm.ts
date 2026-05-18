import type { OrderBookRowDensityId } from '../../config/orderBookStyle'
import { resolveEffectiveOrderBookStyle, type OrderBookStyleId } from '../../config/orderBookStyle'
import { SPEED_ORDER_FEATURE_FLAGS } from '../../selftest/featureFlags'

export type TgxFormRhythmId = 'legacy' | 'tgx_compact' | 'tgx_dense'

export function resolveTgxFormRhythmId(
  orderBookStyle: OrderBookStyleId,
  orderBookRowDensity: OrderBookRowDensityId,
): TgxFormRhythmId {
  const effective = resolveEffectiveOrderBookStyle(
    orderBookStyle,
    SPEED_ORDER_FEATURE_FLAGS.enableTgxOrderBook,
  )
  if (effective !== 'tgx_style') return 'legacy'
  return orderBookRowDensity === 'dense' ? 'tgx_dense' : 'tgx_compact'
}

/** TGX order-book row density aligned form tokens (P2). */
export function tgxFormRhythmClasses(rhythmId: TgxFormRhythmId) {
  const dense = rhythmId === 'tgx_dense'
  return {
    panelPad: dense ? 'p-2' : 'p-2.5',
    stack: dense ? 'space-y-2' : 'space-y-2.5',
    label: 'text-[10px] leading-tight text-zinc-500',
    input:
      dense
        ? 'h-[26px] w-full rounded border border-[#1f2937]/55 bg-[#0b1118] px-2 py-0 font-mono text-[10px] text-zinc-100 outline-none focus:border-violet-500/45'
        : 'h-[28px] w-full rounded border border-[#1f2937]/55 bg-[#0b1118] px-2 py-0.5 font-mono text-[10px] text-zinc-100 outline-none focus:border-violet-500/45',
    chipBtn:
      dense
        ? 'rounded border px-1.5 py-0.5 text-[10px] leading-none'
        : 'rounded border px-2 py-1 text-[10px]',
    segmentBtn:
      dense
        ? 'flex-1 rounded py-1 text-[10px] font-medium leading-none'
        : 'flex-1 rounded py-1.5 text-[10px] font-medium',
    primaryBtn:
      dense
        ? 'h-[30px] rounded text-[11px] font-semibold shadow-sm'
        : 'h-[32px] rounded-md text-[11px] font-semibold shadow-sm',
    tabBtn:
      dense
        ? 'flex-1 rounded px-2 py-1 text-[10px] font-medium leading-none'
        : 'flex-1 rounded px-2 py-1.5 text-[10px] font-medium',
    meta: 'text-[9px] leading-tight text-zinc-500',
  }
}
