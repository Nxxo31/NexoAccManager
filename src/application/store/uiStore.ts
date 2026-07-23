// Application: Zustand UI Store — activeView, activeModal, notifications, theme

import { create } from 'zustand';
import type { PageKey } from '../../config/constants';

export type Theme = 'light' | 'dark';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismiss?: number;
}

interface UIState {
  activeView: PageKey;
  activeModal: string | null;
  theme: Theme;
  notifications: Notification[];
  setView: (view: PageKey) => void;
  setModal: (modal: string | null) => void;
  toggleTheme: () => void;
  notify: (type: Notification['type'], message: string) => void;
  dismiss: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeView: 'accounts',
  activeModal: null,
  theme: 'dark',
  notifications: [],
  setView: (view) => set({ activeView: view }),
  setModal: (activeModal) => set({ activeModal }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  notify: (type, message) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, message, autoDismiss: 5000 };
    set((state) => ({ notifications: [...state.notifications, notification] }));
    
    // Auto-dismiss for non-errors
    if (type !== 'error') {
      setTimeout(() => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })), 5000);
    }
  },
  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }))
}));