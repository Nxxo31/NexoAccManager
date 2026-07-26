// Type: window.api declaration for renderer
// Auto-generated from preload/index.ts — DO NOT EDIT MANUALLY.
// Instead, update preload/index.ts and re-run the generation script.

export {};

declare global {
  interface Window {
    api: {
      // Account
      account: {
        add: (cookie: string, group?: string) => Promise<IpcResult<string>>;
        loginBrowser: () => Promise<IpcResult<{ accountId: string }>>;
        login: (username: string, password: string) => Promise<IpcResult<{ accountId: string }>>;
        list: () => Promise<IpcResult<unknown[]>>;
        remove: (id: string) => Promise<IpcResult>;
        move: (id: string, group: string) => Promise<IpcResult>;
        fieldSet: (id: string, field: string, value: string) => Promise<IpcResult>;
        savePassword: (id: string, password: string) => Promise<IpcResult>;
        setFavorite: (id: string, favorite: boolean) => Promise<IpcResult>;
        check: (cookie: string) => Promise<IpcResult>;
        bulkImport: (accounts: { username: string; password: string }[]) => Promise<IpcResult<{ added: number }>>;
        friends: {
          list: (userId: number, cookie: string) => Promise<IpcResult>;
          requests: (cookie: string) => Promise<IpcResult>;
          respond: (requestId: number, accept: boolean, cookie: string) => Promise<IpcResult>;
        };
        blocked: {
          list: (cookie: string) => Promise<IpcResult>;
          block: (userId: number, cookie: string) => Promise<IpcResult>;
          unblock: (userId: number, cookie: string) => Promise<IpcResult>;
        };
        follow: (userId: number, cookie: string) => Promise<IpcResult>;
        unfollow: (userId: number, cookie: string) => Promise<IpcResult>;
        profile: {
          get: (accountId: string) => Promise<IpcResult>;
          update: (accountId: string, updates: { displayName?: string; description?: string }) => Promise<IpcResult>;
        };
      };
      // Roblox
      roblox: {
        launch: (accountId: string, placeId?: string, jobId?: string) => Promise<IpcResult>;
        killInstance: (accountId: string) => Promise<IpcResult>;
        runningInstances: () => Promise<IpcResult>;
        serversJoin: (accountId: string, placeId: string, jobId: string) => Promise<IpcResult>;
        killAll: () => Promise<IpcResult>;
        serverRegion: (placeId: string) => Promise<IpcResult>;
        shuffleJobIdByAccount: (placeId: string, accountId: string) => Promise<IpcResult>;
        vipServersByAccount: (placeId: string, accountId: string) => Promise<IpcResult>;
      };
      // Presence
      presence: {
        get: (userIds: number[], cookie: string) => Promise<IpcResult>;
        recentGames: (userId: number, cookie: string) => Promise<IpcResult>;
        robuxBalance: (userId: number, cookie: string) => Promise<IpcResult>;
      };
      // Settings
      settings: {
        get: (key: string) => Promise<IpcResult>;
        set: (key: string, value: unknown) => Promise<IpcResult>;
      };
      // Games
      games: {
        addFavorite: (accountId: string, game: { id: string; gameId: number; name: string; icon: string }) => Promise<IpcResult>;
        removeFavorite: (accountId: string, gameId: number) => Promise<IpcResult>;
        getFavorites: (accountId: string) => Promise<IpcResult>;
      };
      // Botting
      botting: {
        start: (accountId: string, placeId: string, interval: number) => Promise<IpcResult>;
        stop: () => Promise<IpcResult>;
        getStatus: () => Promise<IpcResult>;
      };
      // Advanced
      advanced: {
        exportData: () => Promise<IpcResult>;
        deleteAllAccounts: () => Promise<IpcResult>;
        clearCache: () => Promise<IpcResult>;
        devMode: (enable: boolean) => Promise<IpcResult>;
        localApiStart: (port: number) => Promise<IpcResult>;
        localApiStop: () => Promise<IpcResult>;
      };
      // Cookie
      cookie: {
        expiry: (accountId: string) => Promise<IpcResult>;
        refresh: (accountId: string) => Promise<IpcResult>;
      };
      // Shell
      shell: {
        openExternal: (url: string) => Promise<IpcResult>;
      };
      // By-account handlers (resolve cookie internally — renderer never sees it)
      byAccount: {
        friendsList: (accountId: string) => Promise<IpcResult>;
        friendsRequests: (accountId: string) => Promise<IpcResult>;
        friendsRespond: (requestId: number, accept: boolean, accountId: string) => Promise<IpcResult>;
        sendFriendRequest: (userId: number, accountId: string) => Promise<IpcResult>;
        follow: (userId: number, accountId: string) => Promise<IpcResult>;
        unfollow: (userId: number, accountId: string) => Promise<IpcResult>;
        gamesSearch: (query: string, accountId: string) => Promise<IpcResult>;
        serversList: (placeId: string, accountId: string, serverType?: 'Public' | 'Private') => Promise<IpcResult>;
        serversUsers: (serverId: string, accountId: string) => Promise<IpcResult>;
        outfits: (accountId: string) => Promise<IpcResult>;
        serverRegion: (placeId: string, accountId: string) => Promise<IpcResult>;
        // FastFlags
        fflagsGetAll: (accountId: string) => Promise<IpcResult>;
        fflagsSetFlag: (accountId: string, key: string, value: string | number | boolean) => Promise<IpcResult>;
        fflagsDeleteFlag: (accountId: string, key: string) => Promise<IpcResult>;
        fflagsImportFlags: (accountId: string, flags: Record<string, unknown>) => Promise<IpcResult>;
        fflagsExportFlags: (accountId: string) => Promise<IpcResult>;
        // Content Modding
        modsListAvailable: () => Promise<IpcResult>;
        modsInstallMod: (modName: string) => Promise<IpcResult>;
        modsUninstallMod: (modName: string) => Promise<IpcResult>;
        modsIsModInstalled: (modName: string) => Promise<IpcResult>;
        modsBackupOriginals: () => Promise<IpcResult>;
        modsRestoreOriginals: () => Promise<IpcResult>;
        // Roblox Logs
        logsGetRecent: (sinceHours?: number, maxEntries?: number) => Promise<IpcResult>;
        logsClearOld: (daysToKeep: number) => Promise<IpcResult>;
        // Cache Cleaner
        cacheAnalyze: () => Promise<IpcResult>;
        cacheClean: (options?: Record<string, boolean>) => Promise<IpcResult>;
        // Discord RPC
        discordInitialize: (clientId?: string) => Promise<IpcResult>;
        discordUpdatePresence: (details?: string, state?: string, largeImageKey?: string, smallImageKey?: string, startTimestamp?: number) => Promise<IpcResult>;
        discordClearPresence: () => Promise<IpcResult>;
        discordShutdown: () => Promise<IpcResult>;
        // Launch Presets
        presetsGetAll: () => Promise<IpcResult>;
        presetsSavePreset: (preset: Omit<LaunchPreset, 'id'>) => Promise<IpcResult>;
        presetsDeletePreset: (presetId: string) => Promise<IpcResult>;
        presetsLaunchPreset: (presetId: string) => Promise<IpcResult>;
        // Playtime Tracking
        playtimeStartTracking: (accountId: string, placeId: string) => Promise<IpcResult>;
        playtimeStopTracking: (accountId: string) => Promise<IpcResult>;
        playtimeGetTotalPlaytime: (accountId: string) => Promise<IpcResult>;
        playtimeGetSessionHistory: (accountId: string, limit?: number) => Promise<IpcResult>;
        playtimeClearHistory: (accountId: string) => Promise<IpcResult>;
        // Security (by-account)
        twoFA: (accountId: string) => Promise<IpcResult>;
        twoFAToggle: (accountId: string, enable: boolean) => Promise<IpcResult>;
        sessions: (accountId: string) => Promise<IpcResult>;
        logout: (accountId: string, sessionId: string) => Promise<IpcResult>;
        logoutAll: (accountId: string) => Promise<IpcResult>;
        password: (accountId: string, current: string, next: string) => Promise<IpcResult>;
        // Privacy (by-account)
        privacyGet: (accountId: string) => Promise<IpcResult>;
        privacyUpdate: (accountId: string, key: string, value: string | boolean) => Promise<IpcResult>;
        // Notifications (by-account)
        notificationsGet: (accountId: string) => Promise<IpcResult>;
        notificationsUpdate: (accountId: string, key: string, value: boolean) => Promise<IpcResult>;
        // Account Control
        control: (accountId: string, command: string) => Promise<IpcResult>;
        // Shuffle JobID by account (audit F-002)
        shuffleJobIdByAccount: (placeId: string, accountId: string) => Promise<IpcResult>;
        // VIP servers by account (audit F-003)
        vipServersByAccount: (placeId: string, accountId: string) => Promise<IpcResult>;
      };
    };
  }
}

interface IpcResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}