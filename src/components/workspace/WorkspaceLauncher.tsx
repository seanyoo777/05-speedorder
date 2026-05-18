import { useState } from 'react'
import {
  getTradingWorkspaceSlot,
  listSlotsByCategory,
  listTradingWorkspaceCategories,
} from '../../domain/tradingWorkspaceCatalog'
import type { TradingWorkspaceCategoryId } from '../../domain/tradingWorkspace'
import { useTradingStore } from '../../store/tradingStore'

type InnerProps = {
  initialCategoryId: TradingWorkspaceCategoryId
}

function WorkspaceLauncherInner({ initialCategoryId }: InnerProps) {
  const activeWorkspaceId = useTradingStore((s) => s.activeWorkspaceId)
  const activateWorkspace = useTradingStore((s) => s.activateWorkspace)
  const [pickerCategoryId, setPickerCategoryId] =
    useState<TradingWorkspaceCategoryId>(initialCategoryId)

  const activeSlot = getTradingWorkspaceSlot(activeWorkspaceId)
  const categories = listTradingWorkspaceCategories()
  const slots = listSlotsByCategory(pickerCategoryId)

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-so-muted">
          Workspace
        </div>
        <div className="text-[11px] text-zinc-200">
          활성:{' '}
          <span className="font-mono text-so-accent">
            {activeSlot?.displayName ?? activeWorkspaceId}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`rounded border px-2 py-1 text-[10px] ${
              pickerCategoryId === c.id
                ? 'border-so-accent bg-so-accent/15 text-white'
                : 'border-so-border text-so-muted hover:text-white'
            }`}
            onClick={() => setPickerCategoryId(c.id)}
          >
            {c.labelKo}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {slots.map((slot) => (
          <button
            key={slot.workspaceId}
            type="button"
            className={`rounded border px-2 py-1 text-[10px] font-mono ${
              activeWorkspaceId === slot.workspaceId
                ? 'border-so-bid bg-so-bid/10 text-so-bid'
                : 'border-so-border text-so-muted hover:border-so-accent hover:text-white'
            }`}
            onClick={() => {
              setPickerCategoryId(slot.categoryId)
              activateWorkspace(slot.workspaceId, { historyMode: 'push' })
            }}
          >
            {slot.slotIndex}번
          </button>
        ))}
      </div>
    </>
  )
}

export function WorkspaceLauncher() {
  const activeCategoryId = useTradingStore((s) => s.activeWorkspaceCategoryId)

  return (
    <div className="shrink-0 border-b border-so-border bg-so-surface/80 px-2 py-2 lg:px-3">
      <WorkspaceLauncherInner
        key={activeCategoryId}
        initialCategoryId={activeCategoryId}
      />
    </div>
  )
}
