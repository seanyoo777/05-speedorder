import { useState } from 'react'
import { OrderBookPanel } from '../orderbook/OrderBookPanel'
import { SpeedOrderPanel } from '../speedorder/SpeedOrderPanel'
import { StopMitOrderPanel } from '../stopmit/StopMitOrderPanel'

type TabId = 'standard' | 'stopMit'

export function RightOrderColumn() {
  const [tab, setTab] = useState<TabId>('standard')

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <OrderBookPanel />
      <div className="flex shrink-0 gap-1 rounded-md border border-so-border bg-so-surface p-0.5">
        <button
          type="button"
          className={`flex-1 rounded px-2 py-1.5 text-[11px] ${
            tab === 'standard' ? 'bg-so-border text-white' : 'text-so-muted hover:text-white'
          }`}
          onClick={() => setTab('standard')}
        >
          일반 주문
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-2 py-1.5 text-[11px] ${
            tab === 'stopMit' ? 'bg-so-border text-white' : 'text-so-muted hover:text-white'
          }`}
          onClick={() => setTab('stopMit')}
        >
          스탑로스 + MIT
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'standard' ? <SpeedOrderPanel /> : <StopMitOrderPanel />}
      </div>
    </div>
  )
}
