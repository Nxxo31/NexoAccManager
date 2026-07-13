import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Account } from '@/types/Account';

interface AccountState {
  accounts: Account[];
  selectedAccount: Account | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  setSelectedAccount: (account: Account | null) => void;
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
        loading: false,
        error: null,
        
        setAccounts: (accounts: Account[]) => set({ accounts }),
        addAccount: (account: Account) => set((state) => ({ 
          accounts: [...state.accounts, account] 
        })),
        updateAccount: (id: string, updates: Partial<Account>) => set((state) => ({
          accounts: state.accounts.map(acc => 
            acc.id === id ? { ...acc, ...updates } : acc
          )
        })),
        removeAccount: (id: string) => set((state) => ({
          accounts: state.accounts.filter(acc => acc.id !== id)
        })),
        setSelectedAccount: (account: Account | null) => set({ selectedAccount: account }),
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'account-storage',
      }
    )
  )
);