import { useEffect } from 'react'
import { OrderBookHost } from '../orderbook/OrderBookHost'
import { OrderFormIntentStrip } from '../orderform/OrderFormIntentStrip'
import { OrderFormTabs } from '../orderform/OrderFormTabs'
import { SpeedOrderPanel } from '../speedorder/SpeedOrderPanel'
import { StopMitOrderPanel } from '../stopmit/StopMitOrderPanel'
import { ResearchFeedPanel } from '../research/ResearchFeedPanel'
import { SPEED_ORDER_FEATURE_FLAGS } from '../../selftest/featureFlags'
import { useTradingStore } from '../../store/tradingStore'
import { recordRightColumnRender } from './rightColumnLoopDiagnostics'

export function RightOrderColumn() {
  const tab = useTradingStore((s) => s.workspaceOrderFormTab)
  const flags = SPEED_ORDER_FEATURE_FLAGS

  useEffect(() => {
    recordRightColumnRender('orderFormPanel')
  }, [])

  return (
    <div className="flex min-h-0 flex-col gap-2" data-testid="right-order-column">
      {!flags.disableRightColumnTgxOrderBook ? <OrderBookHost /> : null}
      <OrderFormTabs />
      {!flags.disableRightColumnIntentStrip ? <OrderFormIntentStrip tab={tab} /> : null}
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'standard' ? <SpeedOrderPanel /> : <StopMitOrderPanel />}
      </div>
      {!flags.disableRightColumnResearchFeed ? <ResearchFeedPanel /> : null}
    </div>
  )
}
