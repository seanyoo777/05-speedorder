import type { ReactNode } from 'react'

type Props = {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function PanelShell({ title, action, children, className = '' }: Props) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-lg border border-so-border bg-so-surface ${className}`}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-so-border px-3 py-2">
        <h2 className="text-xs font-semibold tracking-wide text-so-muted">{title}</h2>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  )
}
