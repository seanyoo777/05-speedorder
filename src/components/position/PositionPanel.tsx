import { useMemo } from 'react'
import { tradingAssetCategory } from '../../domain/assetCategory'
import { getTradingWorkspaceCategory } from '../../domain/tradingWorkspaceCatalog'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { useWorkspaceShellStore } from '../../store/workspaceShellStore'
import { formatPct, formatPrice, formatQty, formatSignedUsd } from '../../utils/format'
import { safeArray } from '../../utils/safe'
import { PanelShell } from '../common/PanelShell'
import { useTgxFormRhythm } from '../orderform/useTgxFormRhythm'
import { tgxOrderBookTokens } from '../orderbook/tgxOrderBookTokens'
import { CloseIntentStrip } from './CloseIntentStrip'
import { PositionBatchCloseBar } from './PositionBatchCloseBar'
import { PositionCloseConfirmModal } from './PositionCloseConfirmModal'
import { PositionRowCloseActions } from './PositionRowCloseActions'

export function PositionPanel() {
  const symbol = useTradingStore((s) => s.symbol)
  const positions = useTradingStore((s) => s.positions)
  const preset = useTradingStore((s) => s.workspacePositionPanelPreset)
  const categoryId = useWorkspaceShellStore((s) => s.activeWorkspaceCategoryId)
  const selectedIds = useTradingStore((s) => s.positionCloseSelectedIds)
  const toggleSelected = useTradingStore((s) => s.togglePositionCloseSelected)
  const stageClose = useTradingStore((s) => s.stagePositionCloseIntent)
  const orderType = useTradingStore((s) => s.positionCloseOrderType)
  const setOrderType = useTradingStore((s) => s.setPositionCloseOrderType)
  const rowDensity = useTradingStore((s) => s.orderBookRowDensity)
  const { cx } = useTgxFormRhythm()
  const rowH = tgxOrderBookTokens(rowDensity).rowHeightClass

  const rows = useMemo(() => {
    const all = safeArray(positions).filter((p) => p.size > 0)
    if (preset === 'all_symbols') return all
    if (preset === 'category_filtered') {
      const cat = getTradingWorkspaceCategory(categoryId)
      const types = cat?.marketTypes ?? []
      return all.filter((p) => types.includes(getSymbolSpec(p.symbol).marketType))
    }
    return all.filter((p) => p.symbol === symbol)
  }, [positions, preset, categoryId, symbol])

  const titleSuffix =
    preset === 'all_symbols'
      ? '전체'
      : preset === 'category_filtered'
        ? `카테고리 · ${getTradingWorkspaceCategory(categoryId)?.labelKo ?? categoryId}`
        : symbol

  return (
    <PanelShell title={`포지션 · ${titleSuffix}`}>
      <CloseIntentStrip />
      <PositionBatchCloseBar visibleCount={rows.length} />
      <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
        <span className={cx.meta}>청산 유형</span>
        <button
          type="button"
          className={`${cx.chipBtn} ${orderType === 'market' ? 'bg-rose-500/15 text-rose-100' : 'text-zinc-500'}`}
          onClick={() => setOrderType('market')}
        >
          시장가
        </button>
        <button
          type="button"
          className={`${cx.chipBtn} ${orderType === 'limit' ? 'bg-rose-500/15 text-rose-100' : 'text-zinc-500'}`}
          onClick={() => setOrderType('limit')}
        >
          지정가
        </button>
        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] text-emerald-200/90">
          one-click close disabled
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-[10px]">
          <thead className="sticky top-0 bg-[#070b12] text-zinc-500">
            <tr className="border-b border-[#1f2937]/50 text-[9px]">
              <th className="w-8 px-1 py-1.5" />
              <th className="px-2 py-1.5 font-medium">심볼</th>
              <th className="px-2 py-1.5 font-medium">방향</th>
              <th className="px-2 py-1.5 font-medium">수량</th>
              <th className="px-2 py-1.5 font-medium">평단</th>
              <th className="px-2 py-1.5 font-medium">수익률</th>
              <th className="px-2 py-1.5 font-medium">미실현</th>
              <th className="px-2 py-1.5 font-medium text-right">청산</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-2 py-6 text-center text-zinc-500" colSpan={8}>
                  표시할 포지션이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const selected = selectedIds.includes(p.id)
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-[#1f2937]/40 font-mono ${rowH} ${
                      selected ? 'bg-rose-500/8' : 'hover:bg-[#0b1118]/80'
                    }`}
                  >
                    <td className="px-1 py-1 text-center">
                      <input
                        type="checkbox"
                        className="accent-rose-500"
                        checked={selected}
                        onChange={() => toggleSelected(p.id)}
                        aria-label={`Select ${p.symbol}`}
                      />
                    </td>
                    <td className="px-2 py-1 text-zinc-100">
                      {p.symbol}
                      <span className="ml-1 text-[8px] text-zinc-600">
                        {tradingAssetCategory(getSymbolSpec(p.symbol))}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span
                        className={
                          p.side === 'long'
                            ? 'rounded bg-emerald-500/15 px-1 py-0.5 text-emerald-300'
                            : 'rounded bg-rose-500/15 px-1 py-0.5 text-rose-300'
                        }
                      >
                        {p.side === 'long' ? 'LONG' : 'SHORT'}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-zinc-400">{formatQty(p.size)}</td>
                    <td className="px-2 py-1 text-zinc-400">{formatPrice(p.avgPrice)}</td>
                    <td className={`px-2 py-1 ${p.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatPct(p.returnPct)}
                    </td>
                    <td
                      className={`px-2 py-1 ${p.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {formatSignedUsd(p.unrealizedPnl)}
                    </td>
                    <td className="px-2 py-1">
                      <PositionRowCloseActions position={p} onStage={stageClose} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <PositionCloseConfirmModal />
    </PanelShell>
  )
}
