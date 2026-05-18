import { SPEED_ORDER_FEATURE_FLAGS } from '../../selftest/featureFlags'
import { resolveEffectiveOrderBookStyle } from '../../config/orderBookStyle'
import { useTradingStore } from '../../store/tradingStore'
import { OrderBookPanel } from './OrderBookPanel'
import { TgxOrderBookPanel } from './TgxOrderBookPanel'

export function OrderBookHost() {
  const orderBookStyle = useTradingStore((s) => s.orderBookStyle)
  const setOrderBookStyle = useTradingStore((s) => s.setOrderBookStyle)
  const tgxEnabled = SPEED_ORDER_FEATURE_FLAGS.enableTgxOrderBook
  const effectiveStyle = resolveEffectiveOrderBookStyle(orderBookStyle, tgxEnabled)

  return (
    <div className="flex min-h-0 flex-col gap-1">
      {tgxEnabled ? (
        <div
          className="flex shrink-0 gap-1 rounded-md border border-[#1f2937]/40 bg-[#070b12] p-0.5"
          data-testid="orderbook-style-switcher"
        >
          <button
            type="button"
            className={`flex-1 rounded px-2 py-1 text-[10px] ${
              effectiveStyle === 'legacy'
                ? 'bg-violet-500/20 text-violet-100'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
            onClick={() => setOrderBookStyle('legacy')}
          >
            Legacy
          </button>
          <button
            type="button"
            className={`flex-1 rounded px-2 py-1 text-[10px] ${
              effectiveStyle === 'tgx_style'
                ? 'bg-violet-500/20 text-violet-100'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
            onClick={() => setOrderBookStyle('tgx_style')}
          >
            TGX
          </button>
        </div>
      ) : null}
      {effectiveStyle === 'tgx_style' ? <TgxOrderBookPanel /> : <OrderBookPanel />}
    </div>
  )
}
