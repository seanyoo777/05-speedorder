import type { ReactNode } from 'react'

type Props = {
  title: string
  /** 헤더 제목 옆·아래 보조 (예: 심볼) */
  titleExtra?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  /** false면 본문 세로 스크롤 없음(호가 DOM 등 전용) */
  scrollBody?: boolean
  /** TGX-CEX SpeedOrderHtsPanel과 동일한 다크 코인 거래소 카드 */
  variant?: 'default' | 'cexDom'
}

export function PanelShell({
  title,
  titleExtra,
  action,
  children,
  className = '',
  scrollBody = true,
  variant = 'default',
}: Props) {
  const isDom = variant === 'cexDom'
  const shell = isDom
    ? 'rounded-lg border border-[#1f2937] bg-[#080c14] text-[12px] text-zinc-300'
    : 'rounded-lg border border-so-border bg-so-surface'
  const headerDom = 'shrink-0 border-b border-[#1f2937] bg-[#070b12] px-3 py-2'
  const headerDefault = 'flex shrink-0 items-center justify-between border-b border-so-border px-3 py-2'

  return (
    <section className={`flex min-h-0 flex-col ${shell} ${className}`}>
      <header className={isDom ? headerDom : headerDefault}>
        {isDom ? (
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h2>
                {titleExtra ? <div className="min-w-0">{titleExtra}</div> : null}
              </div>
            </div>
            {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
          </div>
        ) : (
          <>
            <h2 className="text-xs font-semibold tracking-wide text-so-muted">{title}</h2>
            {action ? <div className="flex items-center gap-2">{action}</div> : null}
          </>
        )}
      </header>
      {!isDom && titleExtra ? (
        <div className="shrink-0 border-b border-so-border px-3 pb-2 pt-0 text-[10px] text-so-muted">{titleExtra}</div>
      ) : null}
      <div
        className={
          scrollBody
            ? 'min-h-0 flex-1 overflow-auto'
            : 'flex min-h-0 flex-1 flex-col overflow-hidden'
        }
      >
        {children}
      </div>
    </section>
  )
}
