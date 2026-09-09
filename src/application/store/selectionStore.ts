// Application: Zustand Selection Store — multi-select for bulk account operations
// Tracks which accounts are selected for bulk configuration (same cookie, email, etc.)

import { create } from 'zustand';

interface SelectionState {
  selectedIds: Set<string>;
  isMultiSelectMode: boolean;
  toggleMultiSelect: () => void;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selectedIds: new Set<string>(),
  isMultiSelectMode: false,

  toggleMultiSelect: () =>
    set((state) => ({
      isMultiSelectMode: !state.isMultiSelectMode,
      selectedIds: !state.isMultiSelectMode ? state.selectedIds : new Set<string>(),
    })),

  toggle: (id: string) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    }),

  selectAll: (ids: string[]) => set({ selectedIds: new Set(ids) }),

  clearAll: () => set({ selectedIds: new Set<string>() }),

  isSelected: (id: string) => get().selectedIds.has(id),
}));
