import { CLOSE_RATIOS } from '../../domain/positionCloseIntent'
import { useTradingStore } from '../../store/tradingStore'
import { useTgxFormRhythm } from '../orderform/useTgxFormRhythm'

type Props = {
  visibleCount: number
}

export function PositionBatchCloseBar({ visibleCount }: Props) {
  const { cx } = useTgxFormRhythm()
  const selectedCount = useTradingStore((s) => s.positionCloseSelectedIds.length)
  const stageBatch = useTradingStore((s) => s.stageBatchPositionCloseIntent)
  const selectAll = useTradingStore((s) => s.setPositionCloseSelected)
  const clearSel = useTradingStore((s) => s.clearPositionCloseSelection)
  const positions = useTradingStore((s) => s.positions)

  const openIds = positions.filter((p) => p.size > 0).map((p) => p.id)

  return (
    <div
      className="mb-2 flex flex-wrap items-center gap-1.5 rounded border border-[#1f2937]/50 bg-[#070b12] px-2 py-1.5"
      data-testid="position-batch-close-bar"
    >
      <span className={`${cx.meta} shrink-0`}>
        선택 {selectedCount} / {visibleCount}
      </span>
      <button
        type="button"
        className={`${cx.chipBtn} border border-[#1f2937]/50 text-zinc-400`}
        onClick={() => selectAll(openIds)}
      >
        전체 선택
      </button>
      <button
        type="button"
        className={`${cx.chipBtn} border border-[#1f2937]/50 text-zinc-500`}
        onClick={clearSel}
      >
        선택 해제
      </button>
      <span className="mx-0.5 h-3 w-px bg-[#1f2937]/60" />
      <button
        type="button"
        className={`${cx.chipBtn} border border-rose-500/35 text-rose-200/90`}
        onClick={() => stageBatch('selected', 100)}
        disabled={selectedCount === 0}
      >
        선택 청산
      </button>
      <button
        type="button"
        className={`${cx.chipBtn} border border-[#1f2937]/50 text-zinc-400`}
        onClick={() => stageBatch('all', 100)}
      >
        전종목
      </button>
      <button
        type="button"
        className={`${cx.chipBtn} border border-emerald-500/30 text-emerald-300/90`}
        onClick={() => stageBatch('long_only', 100)}
      >
        롱만
      </button>
      <button
        type="button"
        className={`${cx.chipBtn} border border-rose-500/30 text-rose-300/90`}
        onClick={() => stageBatch('short_only', 100)}
      >
        숏만
      </button>
      {CLOSE_RATIOS.map((r) => (
        <button
          key={r}
          type="button"
          className={`${cx.chipBtn} border border-[#1f2937]/40 text-zinc-500`}
          onClick={() => stageBatch('selected', r)}
          disabled={selectedCount === 0}
        >
          {r}%
        </button>
      ))}
    </div>
  )
}
