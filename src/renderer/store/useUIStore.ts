import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ViewKey = 'accounts' | 'servers' | 'games' | 'settings' | 'friends';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  durationMs?: number; // 0 = persistent until dismissed
  createdAt: number;
}

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
  showAccounts: boolean; // true to show account list in sidebar, false to hide it
  themeSettings: any; // We'll keep as any for simplicity, but better to type
  language: string;
  savePasswords: boolean;
  disableAgingAlert: boolean;
  autoRelaunch: boolean;
  connectionWatcher: boolean;
  preventDuplicateInstances: boolean;
  bottingMode: boolean;
  bottingInterval: number; // minutos entre rejoins
  selectedPlaceId: string | null; // when viewing servers for a specific game from GamesView
  notifications: AppNotification[];

  // Actions
  setActiveView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleJobIdShuffle: () => void;
  setHideUsernames: (hide: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleShowAccounts: () => void;
  setShowAccounts: (show: boolean) => void;
  setThemeSettings: (settings: any) => void;
  setLanguage: (lang: string) => void;
  setSavePasswords: (value: boolean) => void;
  setDisableAgingAlert: (value: boolean) => void;
  setAutoRelaunch: (value: boolean) => void;
  setConnectionWatcher: (value: boolean) => void;
  setPreventDuplicateInstances: (value: boolean) => void;
  setBottingMode: (value: boolean) => void;
  setBottingInterval: (value: number) => void;
  setSelectedPlaceId: (placeId: string | null) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt'>) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const defaultThemeSettings: any = {
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
    showAccounts: true,
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
    toggleShowAccounts: () => set((state) => ({ showAccounts: !state.showAccounts })),
    setShowAccounts: (show: boolean) => set({ showAccounts: show }),
    setThemeSettings: (settings: any) => set({ themeSettings: settings }),
    setLanguage: (lang: string) => set({ language: lang }),
    setSavePasswords: (value) => set({ savePasswords: value }),
    setDisableAgingAlert: (value) => set({ disableAgingAlert: value }),
    setAutoRelaunch: (value) => set({ autoRelaunch: value }),
    setConnectionWatcher: (value: boolean) => set({ connectionWatcher: value }),
    setPreventDuplicateInstances: (value: boolean) => set({ preventDuplicateInstances: value }),
    setBottingMode: (value: boolean) => set({ bottingMode: value }),
    setBottingInterval: (value: number) => set({ bottingInterval: value }),
    selectedPlaceId: null,
    setSelectedPlaceId: (placeId: string | null) => set({ selectedPlaceId: placeId }),
    notifications: [],
    addNotification: (n) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const notification: AppNotification = {
        ...n,
        id,
        createdAt: Date.now(),
      };
      set((state) => ({ notifications: [...state.notifications, notification] }));
      return id;
    },
    dismissNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    clearNotifications: () => set({ notifications: [] }),
  }))
);