import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getSymbolSpec } from '../../symbols/registry'
import { useTradingStore } from '../../store/tradingStore'
import { formatByDecimals } from '../../utils/format'
import { OrderConfirmModal, type OrderConfirmDraft } from '../speedorder/OrderConfirmModal'

export function PositionCloseConfirmModal() {
  const { open, intent, confirm, close } = useTradingStore(
    useShallow((s) => ({
      open: s.positionCloseConfirmOpen,
      intent: s.positionCloseIntent,
      confirm: s.confirmPositionCloseIntent,
      close: () => {
        s.setPositionCloseConfirmOpen(false)
        s.clearPositionCloseIntent()
      },
    })),
  )

  const draft = useMemo((): OrderConfirmDraft | null => {
    if (!intent) return null
    const spec = getSymbolSpec(intent.symbol)
    const sideLabel = intent.side === 'long' ? '롱 청산' : '숏 청산'
    const batch =
      intent.batchMode !== 'single'
        ? ` · ${intent.batchMode} (${intent.positionIds.length})`
        : ''
    return {
      symbol: intent.symbol,
      displayName: spec.displayName,
      marketType: spec.marketType,
      directionLabel: `${sideLabel}${batch}`,
      orderType: intent.orderType,
      priceDisplay:
        intent.orderType === 'market'
          ? `시장 (ref ${formatByDecimals(intent.referencePrice, spec.priceDecimals)})`
          : formatByDecimals(intent.referencePrice, spec.priceDecimals),
      quantity: intent.qty,
      qtyDecimals: spec.qtyDecimals,
      estimatedMargin: 0,
      flow: 'position_close',
      rowPriceHint: `${intent.ratio}% · mockOnly`,
    }
  }, [intent])

  return (
    <OrderConfirmModal
      open={open}
      draft={draft}
      onClose={close}
      onConfirm={confirm}
    />
  )
}
