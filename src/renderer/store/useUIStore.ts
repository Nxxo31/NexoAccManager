import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  activeView: 'accounts' | 'servers' | 'settings' | 'presence';
  sidebarCollapsed: boolean;
  jobIdShuffle: boolean;
  
  // Actions
  setActiveView: (view: 'accounts' | 'servers' | 'settings' | 'presence') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleJobIdShuffle: () => void;
}

export const useUIStore = create<UIState>()(
  devtools((set) => ({
    activeView: 'accounts',
    sidebarCollapsed: false,
    jobIdShuffle: false,
    
    setActiveView: (view) => set({ activeView: view }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    toggleJobIdShuffle: () => set((state) => ({ jobIdShuffle: !state.jobIdShuffle })),
  }))
);