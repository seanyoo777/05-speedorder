import { CLOSE_RATIOS } from '../../domain/positionCloseIntent'
import type { PositionRow } from '../../types/trading'
import { useTgxFormRhythm } from '../orderform/useTgxFormRhythm'

type Props = {
  position: PositionRow
  onStage: (positionId: string, ratio: (typeof CLOSE_RATIOS)[number]) => void
}

export function PositionRowCloseActions({ position, onStage }: Props) {
  const { cx } = useTgxFormRhythm()

  return (
    <div className="flex flex-col items-end gap-1" data-testid="position-row-close-actions">
      <div className="flex flex-wrap justify-end gap-0.5">
        {CLOSE_RATIOS.map((r) => (
          <button
            key={r}
            type="button"
            className={`${cx.chipBtn} border border-rose-500/30 bg-rose-500/8 text-[9px] text-rose-200/90 hover:bg-rose-500/15`}
            onClick={() => onStage(position.id, r)}
          >
            {r}%
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`${cx.chipBtn} border border-rose-500/45 bg-rose-500/12 font-medium text-rose-100`}
        onClick={() => onStage(position.id, 100)}
      >
        청산 intent
      </button>
    </div>
  )
}
