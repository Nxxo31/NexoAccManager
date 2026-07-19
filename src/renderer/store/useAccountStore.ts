import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Account } from '@/types/Account';

interface AccountState {
  accounts: Account[];
  selectedAccount: Account | null;
  selectedIds: string[];
  loading: boolean;
  error: string | null;

  // Actions
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  setSelectedAccount: (account: Account | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  selectRange: (fromId: string, toId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setAccountField: (id: string, key: string, value: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAccountStore = create<AccountState>()(
  devtools(
    persist(
      (set) => ({
        accounts: [],
        selectedAccount: null,
        selectedIds: [],
        loading: false,
        error: null,

        setAccounts: (accounts: Account[]) => set({ accounts }),
        addAccount: (account: Account) => set((state) => ({ accounts: [...state.accounts, account] })),
        updateAccount: (id: string, updates: Partial<Account>) => set((state) => ({
          accounts: state.accounts.map(acc =>
            acc.id === id ? { ...acc, ...updates } : acc
          ),
        })),
        removeAccount: (id: string) => set((state) => ({
          accounts: state.accounts.filter(acc => acc.id !== id),
          selectedIds: state.selectedIds.filter(storedId => storedId !== id)
        })),
        setSelectedAccount: (account: Account | null) => set({ selectedAccount: account }),
        setSelectedIds: (ids: string[]) => set({ selectedIds: ids }),
        toggleSelection: (id: string) => set((state) => {
          const hasId = state.selectedIds.includes(id);
          return {
            selectedIds: hasId
              ? state.selectedIds.filter((storedId) => storedId !== id)
              : [...state.selectedIds, id]
          };
        }),
        selectRange: (fromId: string, toId: string) => set((state) => {
          const accounts = state.accounts;
          const fromIndex = accounts.findIndex(acc => acc.id === fromId);
          const toIndex = accounts.findIndex(acc => acc.id === toId);
          if (fromIndex === -1 || toIndex === -1) return state;
          const start = Math.min(fromIndex, toIndex);
          const end = Math.max(fromIndex, toIndex);
          const idsToSelect = accounts.slice(start, end + 1).map(acc => acc.id);
          return { selectedIds: idsToSelect };
        }),
        clearSelection: () => set({ selectedIds: [] }),
        selectAll: () => set((state) => ({
          selectedIds: state.accounts.map(acc => acc.id)
        })),
        setAccountField: (id: string, key: string, value: any) => set((state) => ({
          accounts: state.accounts.map(acc =>
            acc.id === id ? { ...acc, [key]: value } : acc
          ),
        })),
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'account-storage',
        // persist selectedIds as well
        partialize: (state) => ({
          accounts: state.accounts,
          selectedIds: state.selectedIds
        })
      }
    )
  )
);