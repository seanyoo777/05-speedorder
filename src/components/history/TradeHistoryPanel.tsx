import { useMemo, useState } from 'react'
import type { HistoryTab } from '../../types/trading'
import { formatPrice, formatQty, formatSignedUsd } from '../../utils/format'
import { safeArray } from '../../utils/safe'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { PanelShell } from '../common/PanelShell'

const tabs: { id: HistoryTab; label: string }[] = [
  { id: 'fills', label: '체결' },
  { id: 'orders', label: '주문' },
  { id: 'cancelled', label: '취소' },
]

export function TradeHistoryPanel() {
  const fills = useTradingStore((s) => s.fills)
  const orders = useTradingStore((s) => s.orders)
  const [tab, setTab] = useState<HistoryTab>('fills')
  const [filter, setFilter] = useState('')

  const filteredOrders = useMemo(() => {
    const q = filter.trim().toUpperCase()
    const base = safeArray(orders)
    if (!q) return base
    return base.filter((o) => o.symbol.toUpperCase().includes(q))
  }, [orders, filter])

  const filteredFills = useMemo(() => {
    const q = filter.trim().toUpperCase()
    const base = safeArray(fills)
    if (!q) return base
    return base.filter((f) => f.symbol.toUpperCase().includes(q))
  }, [fills, filter])

  const canceledRows = useMemo(
    () => filteredOrders.filter((o) => o.status === 'canceled'),
    [filteredOrders],
  )

  const activeOrderRows = useMemo(
    () => filteredOrders.filter((o) => o.status !== 'canceled'),
    [filteredOrders],
  )

  return (
    <PanelShell
      title="거래 내역"
      action={
        <input
          className="w-28 rounded border border-so-border bg-so-bg px-2 py-1 text-[10px] font-mono text-white placeholder:text-so-muted"
          placeholder="심볼 필터"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      }
    >
      <div className="flex gap-1 border-b border-so-border px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-t px-3 py-1.5 text-[11px] ${
              tab === t.id ? 'bg-so-border text-white' : 'text-so-muted hover:text-white'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="max-h-[min(40vh,280px)] overflow-auto p-2 text-[11px]">
        {tab === 'fills' ? (
          <ul className="space-y-1 font-mono">
            {filteredFills.length === 0 ? (
              <li className="py-6 text-center text-so-muted">내역 없음</li>
            ) : (
              filteredFills.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-col gap-1 rounded border border-so-border/60 bg-so-bg/40 px-2 py-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-so-muted">{f.time}</span>
                    <span className="text-white">
                      {f.symbol}
                      <span className="ml-1 rounded bg-so-border px-1 text-[9px] uppercase text-so-muted">
                        {getSymbolSpec(f.symbol).marketType}
                      </span>
                    </span>
                    <span className={f.side === 'buy' ? 'text-so-bid' : 'text-so-ask'}>
                      {f.side === 'buy' ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-so-muted">{formatQty(f.quantity)}</span>
                    <span className="text-white">{formatPrice(f.price)}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 text-[10px] text-so-muted">
                    <span>수수료 {formatPrice(f.fee ?? 0)}</span>
                    <span className={f.realizedPnl >= 0 ? 'text-so-bid' : 'text-so-ask'}>
                      실현Δ {formatSignedUsd(f.realizedPnl ?? 0)}
                    </span>
                    <span className="font-mono opacity-70">{f.timestamp ?? '—'}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : null}

        {tab === 'orders' ? (
          <ul className="space-y-1 font-mono">
            {activeOrderRows.length === 0 ? (
              <li className="py-6 text-center text-so-muted">내역 없음</li>
            ) : (
              activeOrderRows.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-so-border/60 bg-so-bg/40 px-2 py-1.5"
                >
                  <span className="text-so-muted">{o.time}</span>
                  <span className="text-white">
                    {o.symbol}
                    <span className="ml-1 rounded bg-so-border px-1 text-[9px] uppercase text-so-muted">
                      {getSymbolSpec(o.symbol).marketType}
                    </span>
                  </span>
                  <span className="text-so-muted">{o.type === 'market' ? 'MKT' : 'LMT'}</span>
                  <span className={o.side === 'buy' ? 'text-so-bid' : 'text-so-ask'}>
                    {o.side.toUpperCase()}
                  </span>
                  <span className="text-so-muted">{o.price != null ? formatPrice(o.price) : '—'}</span>
                  <span className="rounded bg-so-border px-1 text-[10px] uppercase text-so-muted">
                    {o.status}
                  </span>
                </li>
              ))
            )}
          </ul>
        ) : null}

        {tab === 'cancelled' ? (
          <ul className="space-y-1 font-mono">
            {canceledRows.length === 0 ? (
              <li className="py-6 text-center text-so-muted">내역 없음</li>
            ) : (
              canceledRows.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-so-border/60 bg-so-bg/40 px-2 py-1.5"
                >
                  <span className="text-so-muted">{o.time}</span>
                  <span className="text-white">
                    {o.symbol}
                    <span className="ml-1 rounded bg-so-border px-1 text-[9px] uppercase text-so-muted">
                      {getSymbolSpec(o.symbol).marketType}
                    </span>
                  </span>
                  <span className="text-so-muted">{o.type === 'market' ? 'MKT' : 'LMT'}</span>
                  <span className={o.side === 'buy' ? 'text-so-bid' : 'text-so-ask'}>
                    {o.side.toUpperCase()}
                  </span>
                  <span className="text-so-muted">{o.price != null ? formatPrice(o.price) : '—'}</span>
                  <span className="text-so-ask">CANCELED</span>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </PanelShell>
  )
}
