import type { ReactNode } from 'react'

type Props = {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
  /** false면 본문 세로 스크롤 없음(호가 HTS 등 전용) */
  scrollBody?: boolean
}

export function PanelShell({ title, action, children, className = '', scrollBody = true }: Props) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-lg border border-so-border bg-so-surface ${className}`}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-so-border px-3 py-2">
        <h2 className="text-xs font-semibold tracking-wide text-so-muted">{title}</h2>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </header>
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
