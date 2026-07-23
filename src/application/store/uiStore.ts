// Application: Zustand UI Store — activeView, activeModal, notifications

import { create } from 'zustand';
import type { PageKey } from '../../config/constants';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismiss?: number;
}

interface UIState {
  activeView: PageKey;
  activeModal: string | null;
  notifications: Notification[];
  setView: (view: PageKey) => void;
  setModal: (modal: string | null) => void;
  notify: (type: Notification['type'], message: string) => void;
  dismiss: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'accounts',
  activeModal: null,
  notifications: [],
  setView: (view) => set({ activeView: view }),
  setModal: (activeModal) => set({ activeModal }),
  notify: (type, message) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ notifications: [...state.notifications, { id, type, message, autoDismiss: 5000 }] }));
    if (type !== 'error') {
      setTimeout(() => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })), 5000);
    }
  },
  dismiss: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
