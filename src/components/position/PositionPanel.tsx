import { formatPct, formatPrice, formatQty, formatSignedUsd } from '../../utils/format'
import { safeArray } from '../../utils/safe'
import { useTradingStore } from '../../store/tradingStore'
import { PanelShell } from '../common/PanelShell'

export function PositionPanel() {
  const positions = useTradingStore((s) => s.positions)
  const closePositionDemo = useTradingStore((s) => s.closePositionDemo)
  const rows = safeArray(positions)

  return (
    <PanelShell title="포지션">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
          <thead className="sticky top-0 bg-so-surface text-so-muted">
            <tr className="border-b border-so-border">
              <th className="px-2 py-2 font-medium">심볼</th>
              <th className="px-2 py-2 font-medium">방향</th>
              <th className="px-2 py-2 font-medium">수량</th>
              <th className="px-2 py-2 font-medium">평단</th>
              <th className="px-2 py-2 font-medium">수익률</th>
              <th className="px-2 py-2 font-medium">실현</th>
              <th className="px-2 py-2 font-medium">미실현</th>
              <th className="px-2 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-2 py-6 text-center text-so-muted" colSpan={8}>
                  열린 포지션이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-b border-so-border/70 font-mono">
                  <td className="px-2 py-2 text-white">{p.symbol}</td>
                  <td className="px-2 py-2">
                    <span
                      className={
                        p.side === 'long'
                          ? 'rounded bg-emerald-500/15 px-1.5 py-0.5 text-so-bid'
                          : 'rounded bg-red-500/15 px-1.5 py-0.5 text-so-ask'
                      }
                    >
                      {p.side === 'long' ? 'LONG' : 'SHORT'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-so-muted">{formatQty(p.size)}</td>
                  <td className="px-2 py-2 text-so-muted">{formatPrice(p.avgPrice)}</td>
                  <td
                    className={`px-2 py-2 ${
                      p.returnPct >= 0 ? 'text-so-bid' : 'text-so-ask'
                    }`}
                  >
                    {formatPct(p.returnPct)}
                  </td>
                  <td className="px-2 py-2 text-so-muted">{formatSignedUsd(p.realizedPnl)}</td>
                  <td
                    className={`px-2 py-2 ${
                      p.unrealizedPnl >= 0 ? 'text-so-bid' : 'text-so-ask'
                    }`}
                  >
                    {formatSignedUsd(p.unrealizedPnl)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      className="rounded border border-so-border px-2 py-1 text-[10px] text-so-muted hover:border-so-ask hover:text-so-ask"
                      onClick={() => {
                        if (window.confirm('모의 청산 — 실거래 아님')) closePositionDemo(p.id)
                      }}
                    >
                      청산
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelShell>
  )
}
