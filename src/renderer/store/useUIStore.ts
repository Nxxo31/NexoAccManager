import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ViewKey = 'accounts' | 'servers' | 'games' | 'settings' | 'presence';

export interface ThemeSettings {
  theme: string;
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  uiDensity: 'compact' | 'normal' | 'spacious';
  animationsEnabled: boolean;
}

interface UIState {
  activeView: ViewKey;
  sidebarCollapsed: boolean;
  jobIdShuffle: boolean;
  hideUsernames: boolean;
  searchQuery: string;
  themeSettings: ThemeSettings | null;
  language: string;

  // Actions
  setActiveView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleJobIdShuffle: () => void;
  setHideUsernames: (hide: boolean) => void;
  setSearchQuery: (query: string) => void;
  setThemeSettings: (settings: ThemeSettings) => void;
  setLanguage: (lang: string) => void;
}

const defaultThemeSettings: ThemeSettings = {
  theme: 'dark',
  primaryColor: '#DE350D',
  accentColor: '#6347FF',
  fontSize: 'medium',
  uiDensity: 'normal',
  animationsEnabled: true,
};

export const useUIStore = create<UIState>()(
  devtools((set) => ({
    activeView: 'accounts',
    sidebarCollapsed: false,
    jobIdShuffle: false,
    hideUsernames: false,
    searchQuery: '',
    themeSettings: defaultThemeSettings,
    language: 'es',
    
    setActiveView: (view) => set({ activeView: view }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    toggleJobIdShuffle: () => set((state) => ({ jobIdShuffle: !state.jobIdShuffle })),
    setHideUsernames: (hide: boolean) => set({ hideUsernames: hide }),
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setThemeSettings: (settings: ThemeSettings) => set({ themeSettings: settings }),
    setLanguage: (lang: string) => set({ language: lang }),
  }))
);