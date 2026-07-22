// Application: Zustand Account Store — accounts list + selection + loading

import { create } from 'zustand';

interface AccountState {
  accounts: Account[];
  selectedId: string | null;
  loading: boolean;
  setAccounts: (accounts: Account[]) => void;
  select: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  remove: (id: string) => void;
  add: (account: Account) => void;
  update: (id: string, partial: Partial<Account>) => void;
}

interface Account {
  id: string;
  robloxUserId: number;
  username: string;
  displayName: string;
  group: string;
  description: string;
  avatarUrl: string;
  isFavorite: boolean;
  lastUsed: Date;
  cookieExpiresAt: Date | null;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  selectedId: null,
  loading: false,
  setAccounts: (accounts) => set({ accounts }),
  select: (selectedId) => set({ selectedId }),
  setLoading: (loading) => set({ loading }),
  remove: (id) => set((state) => ({
    accounts: state.accounts.filter((a) => a.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
  })),
  add: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
  update: (id, partial) => set((state) => ({
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...partial } : a)),
  })),
}));
