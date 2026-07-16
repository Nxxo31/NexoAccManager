import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ViewKey = 'accounts' | 'servers' | 'games' | 'settings' | 'presence';

interface UIState {
  activeView: ViewKey;
  sidebarCollapsed: boolean;
  jobIdShuffle: boolean;
  hideUsernames: boolean;

  // Actions
  setActiveView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleJobIdShuffle: () => void;
  setHideUsernames: (hide: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools((set) => ({
    activeView: 'accounts',
    sidebarCollapsed: false,
    jobIdShuffle: false,
    hideUsernames: false,
    
    setActiveView: (view) => set({ activeView: view }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    toggleJobIdShuffle: () => set((state) => ({ jobIdShuffle: !state.jobIdShuffle })),
    setHideUsernames: (hide: boolean) => set({ hideUsernames: hide }),
  }))
);