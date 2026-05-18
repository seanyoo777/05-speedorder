import type { MarketType } from '../../types/symbol'
import { formatByDecimals, formatPrice } from '../../utils/format'

export type OrderConfirmDraft = {
  symbol: string
  displayName: string
  marketType: MarketType
  directionLabel: string
  orderType: 'market' | 'limit'
  priceDisplay: string
  quantity: number
  qtyDecimals: number
  estimatedMargin: number
  /** standard: 일반 주문 / book_dblclick: 호가 더블클릭 / mit_register / stop_register / position_close */
  flow?: 'standard' | 'book_dblclick' | 'mit_register' | 'stop_register' | 'position_close'
  /** 호가 행 가격 등 부가 설명 */
  rowPriceHint?: string
}

type Props = {
  open: boolean
  draft: OrderConfirmDraft | null
  onClose: () => void
  onConfirm: () => void
}

export function OrderConfirmModal({ open, draft, onClose, onConfirm }: Props) {
  if (!open || !draft) return null

  const flow = draft.flow ?? 'standard'
  const title =
    flow === 'book_dblclick'
      ? '호가 주문 확인 (모의)'
      : flow === 'mit_register'
        ? 'MIT 주문 확인 (모의)'
        : flow === 'stop_register'
          ? '스탑로스 확인 (모의)'
          : flow === 'position_close'
            ? '청산 intent 확인 (모의)'
            : '주문 확인 (모의)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-so-border bg-so-surface p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirm-title"
      >
        <h3 id="order-confirm-title" className="text-sm font-semibold text-white">
          {title}
        </h3>
        <p className="mt-1 text-[11px] text-so-muted">실거래 연결 없음 · 데모 전용</p>
        <dl className="mt-4 space-y-2 text-[12px]">
          {draft.rowPriceHint ? (
            <div className="flex justify-between gap-2">
              <dt className="text-so-muted">호가</dt>
              <dd className="font-mono text-white">{draft.rowPriceHint}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt className="text-so-muted">심볼</dt>
            <dd className="font-mono text-white">
              {draft.displayName}{' '}
              <span className="text-so-muted">({draft.symbol})</span>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-so-muted">시장</dt>
            <dd className="text-white">{draft.marketType}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-so-muted">방향</dt>
            <dd className="font-medium text-white">{draft.directionLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-so-muted">주문</dt>
            <dd className="text-white">{draft.orderType === 'market' ? '시장가' : '지정가'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-so-muted">가격</dt>
            <dd className="font-mono text-white">{draft.priceDisplay}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-so-muted">수량</dt>
            <dd className="font-mono text-white">{formatByDecimals(draft.quantity, draft.qtyDecimals)}</dd>
          </div>
          {flow === 'standard' ? (
            <div className="flex justify-between gap-2 border-t border-so-border pt-2">
              <dt className="text-so-muted">예상 증거금</dt>
              <dd className="font-mono text-so-accent">≈ ${formatPrice(draft.estimatedMargin, 2)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg border border-so-border py-2.5 text-sm text-so-muted hover:text-white"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-so-accent py-2.5 text-sm font-semibold text-white"
            onClick={onConfirm}
          >
            {flow === 'position_close' ? '확인 (mock log)' : '확인 주문'}
          </button>
        </div>
      </div>
    </div>
  )
}
