import { OrderBookHost } from '../orderbook/OrderBookHost'
import { OrderFormIntentStrip } from '../orderform/OrderFormIntentStrip'
import { OrderFormTabs } from '../orderform/OrderFormTabs'
import { SpeedOrderPanel } from '../speedorder/SpeedOrderPanel'
import { StopMitOrderPanel } from '../stopmit/StopMitOrderPanel'
import { ResearchFeedPanel } from '../research/ResearchFeedPanel'
import { useTradingStore } from '../../store/tradingStore'

export function RightOrderColumn() {
  const tab = useTradingStore((s) => s.workspaceOrderFormTab)

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <OrderBookHost />
      <OrderFormTabs />
      <OrderFormIntentStrip tab={tab} />
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'standard' ? <SpeedOrderPanel /> : <StopMitOrderPanel />}
      </div>
      <ResearchFeedPanel />
    </div>
  )
}
