// Application: Zustand Account Store — accounts list + selection + loading
//
// B-1: además del estado CRUD de cuentas, el store ahora refleja el estado
// en tiempo real del canal de control:
//   - wsConnectionStatus: estado del WebSocket contra el LocalApiService
//     ('stopped' | 'reconnecting' | 'connected' | 'disconnected'). Lo empuja
//     el main process vía 'control:connection' cada vez que cambia.
//   - accountControlStatus:  Map<accountId, status> con la última exterior
//     de cuenta reportada por push (WS o smart-polling). Lo empuja el main
//     process vía 'control:status'.
// Estos campos los alimenta un hook del renderer que se subscripción al IPC
// push y reenvía al store; no se persisten.

import { create } from 'zustand';
import type { Account } from '../../domain/entities/Account';
import type { ControlConnectionStatus } from '../../infrastructure/external/ControlWebSocketService';

interface AccountState {
  accounts: Account[];
  selectedId: string | null;
  loading: boolean;
  // B-1: estado de conexión del WebSocket de control.
  wsConnectionStatus: ControlConnectionStatus;
  // B-1: último status push por accountId (lo emits el main process).
  accountControlStatus: Record<string, unknown>;
  setAccounts: (accounts: Account[]) => void;
  select: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  remove: (id: string) => void;
  add: (account: Account) => void;
  update: (id: string, partial: Partial<Account>) => void;
  // B-1: setter invocado por el IPC push listener del renderer.
  setWsConnectionStatus: (status: ControlConnectionStatus) => void;
  // B-1: merge atómico de un push de status por accountId.
  setAccountControlStatus: (accountId: string, status: unknown) => void;
  // B-1: limpiar el mapa de status (cuando se desconecta/controlWs.stop()).
  clearAccountControlStatus: () => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  selectedId: null,
  loading: false,
  wsConnectionStatus: 'stopped',
  accountControlStatus: {},
  setAccounts: (accounts) => set({ accounts }),
  select: (selectedId) => set({ selectedId }),
  setLoading: (loading) => set({ loading }),
  remove: (id) => set((state) => ({
    accounts: state.accounts.filter((a) => a.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    // Limpieza: si la cuenta se borra, también su status push.
    accountControlStatus: Object.fromEntries(
      Object.entries(state.accountControlStatus).filter(([k]) => k !== id),
    ),
  })),
  add: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
  update: (id, partial) => set((state) => ({
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...partial } : a)),
  })),
  setWsConnectionStatus: (wsConnectionStatus) => set({ wsConnectionStatus }),
  setAccountControlStatus: (accountId, status) => set((state) => ({
    accountControlStatus: { ...state.accountControlStatus, [accountId]: status },
  })),
  clearAccountControlStatus: () => set({ accountControlStatus: {} }),
}));
