import { create } from 'zustand'

interface DashboardState {
  contingencySheetOpen: boolean
  setContingencySheetOpen: (open: boolean) => void

  /** Command ids optimistically marked complete/skipped, for instant visual
   *  feedback before the underlying mutation round-trips through Dexie. */
  optimisticCommandIds: Set<string>
  markOptimistic: (commandId: string) => void
  clearOptimistic: (commandId: string) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  contingencySheetOpen: false,
  setContingencySheetOpen: (open) => set({ contingencySheetOpen: open }),

  optimisticCommandIds: new Set(),
  markOptimistic: (commandId) =>
    set((state) => ({ optimisticCommandIds: new Set(state.optimisticCommandIds).add(commandId) })),
  clearOptimistic: (commandId) =>
    set((state) => {
      const next = new Set(state.optimisticCommandIds)
      next.delete(commandId)
      return { optimisticCommandIds: next }
    }),
}))
