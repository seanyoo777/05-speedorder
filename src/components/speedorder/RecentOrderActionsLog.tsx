import { useTradingStore } from '../../store/tradingStore'

type Variant = 'cexDom' | 'default'

const shell: Record<Variant, string> = {
  cexDom: 'border-t border-[#1f2937]/30 bg-[#070b12]',
  default: 'border-t border-so-border bg-so-bg/80',
}

const title: Record<Variant, string> = {
  cexDom: 'text-zinc-500',
  default: 'text-so-muted',
}

const row: Record<Variant, string> = {
  cexDom: 'text-zinc-400',
  default: 'text-so-muted',
}

const timeCls: Record<Variant, string> = {
  cexDom: 'text-zinc-600',
  default: 'text-zinc-500',
}

export function RecentOrderActionsLog({ variant = 'default' }: { variant?: Variant }) {
  const entries = useTradingStore((s) => s.orderActionLog)
  const empty = (
    <div className={`shrink-0 px-2 py-1.5 text-center font-mono text-[9px] ${shell[variant]} ${title[variant]}`}>
      최근 주문 없음
    </div>
  )
  if (entries.length === 0) return empty

  return (
    <div className={`shrink-0 px-2 py-1.5 ${shell[variant]}`} aria-label="최근 주문 로그">
      <div className={`mb-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide ${title[variant]}`}>
        최근 주문
      </div>
      <ul className="flex max-h-[4.5rem] flex-col gap-0.5 overflow-y-auto overscroll-y-contain">
        {entries.map((e) => (
          <li key={e.id} className={`truncate font-mono text-[9px] leading-tight ${row[variant]}`} title={e.text}>
            <span className={timeCls[variant]}>
              {new Date(e.at).toLocaleTimeString('ko-KR', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>{' '}
            {e.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
