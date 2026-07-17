import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ViewKey = 'accounts' | 'servers' | 'games' | 'settings' | 'friends';

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
  savePasswords: boolean;
  disableAgingAlert: boolean;
  autoRelaunch: boolean;
  connectionWatcher: boolean;
  preventDuplicateInstances: boolean;
  bottingMode: boolean;
  bottingInterval: number; // minutos entre rejoins

  // Actions
  setActiveView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleJobIdShuffle: () => void;
  setHideUsernames: (hide: boolean) => void;
  setSearchQuery: (query: string) => void;
  setThemeSettings: (settings: ThemeSettings) => void;
  setLanguage: (lang: string) => void;
  setSavePasswords: (value: boolean) => void;
  setDisableAgingAlert: (value: boolean) => void;
  setAutoRelaunch: (value: boolean) => void;
  setConnectionWatcher: (value: boolean) => void;
  setPreventDuplicateInstances: (value: boolean) => void;
  setBottingMode: (value: boolean) => void;
  setBottingInterval: (value: number) => void;
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
    savePasswords: false,
    disableAgingAlert: false,
    autoRelaunch: false,
    connectionWatcher: false,
    preventDuplicateInstances: false,
    bottingMode: false,
    bottingInterval: 5,

    setActiveView: (view) => set({ activeView: view }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    toggleJobIdShuffle: () => set((state) => ({ jobIdShuffle: !state.jobIdShuffle })),
    setHideUsernames: (hide: boolean) => set({ hideUsernames: hide }),
    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setThemeSettings: (settings: ThemeSettings) => set({ themeSettings: settings }),
    setLanguage: (lang: string) => set({ language: lang }),
    setSavePasswords: (value) => set({ savePasswords: value }),
    setDisableAgingAlert: (value) => set({ disableAgingAlert: value }),
    setAutoRelaunch: (value) => set({ autoRelaunch: value }),
    setConnectionWatcher: (value) => set({ connectionWatcher: value }),
    setPreventDuplicateInstances: (value) => set({ preventDuplicateInstances: value }),
    setBottingMode: (value) => set({ bottingMode: value }),
    setBottingInterval: (value) => set({ bottingInterval: value }),
  }))
);
