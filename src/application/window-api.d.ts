// Type: window.api declaration for renderer

export {};

declare global {
  interface Window {
    api: {
      account: {
        add: (cookie: string, group?: string) => Promise<IpcResult>;
        loginBrowser: () => Promise<IpcResult<{ cookie: string; userId: number; username: string }>>;
        login: (username: string, password: string) => Promise<IpcResult>;
        list: () => Promise<IpcResult<unknown[]>>;
        remove: (id: string) => Promise<IpcResult>;
        move: (id: string, group: string) => Promise<IpcResult>;
        fieldSet: (id: string, field: string, value: string) => Promise<IpcResult>;
        savePassword: (id: string, password: string) => Promise<IpcResult>;
        getPassword: (id: string) => Promise<IpcResult<string>>;
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
          get: (cookie: string) => Promise<IpcResult>;
          update: (cookie: string, updates: unknown) => Promise<IpcResult>;
        };
      };
      roblox: {
        launch: (accountId: string, placeId?: string, jobId?: string) => Promise<IpcResult>;
        gamesSearch: (query: string, cookie: string) => Promise<IpcResult>;
        serversList: (placeId: string, cookie: string, serverType?: 'Public' | 'Private') => Promise<IpcResult>;
        serversUsers: (serverId: string, cookie: string) => Promise<IpcResult>;
        serversJoin: (accountId: string, placeId: string, jobId: string) => Promise<IpcResult>;
        killAll: () => Promise<IpcResult>;
        joinGroup: (groupId: number, cookie: string) => Promise<IpcResult>;
        serverRegion: (placeId: string) => Promise<IpcResult>;
      };
      presence: {
        get: (userIds: number[], cookie: string) => Promise<IpcResult>;
        recentGames: (userId: number, cookie: string) => Promise<IpcResult>;
        robuxBalance: (userId: number, cookie: string) => Promise<IpcResult>;
      };
      settings: {
        get: (key: string) => Promise<IpcResult>;
        set: (key: string, value: unknown) => Promise<IpcResult>;
        security: {
          password: (cookie: string, current: string, next: string) => Promise<IpcResult>;
          sessions: (cookie: string) => Promise<IpcResult>;
          logout: (cookie: string, sessionId: string) => Promise<IpcResult>;
          logoutAll: (cookie: string) => Promise<IpcResult>;
          twoFA: (cookie: string) => Promise<IpcResult>;
          twoFAToggle: (cookie: string, enable: boolean) => Promise<IpcResult>;
        };
        privacy: {
          get: (cookie: string) => Promise<IpcResult>;
          update: (cookie: string, key: string, value: string | boolean) => Promise<IpcResult>;
        };
        notifications: {
          get: (cookie: string) => Promise<IpcResult>;
          update: (cookie: string, key: string, value: boolean) => Promise<IpcResult>;
        };
      };
      games: {
        addFavorite: (accountId: string, game: unknown) => Promise<IpcResult>;
        removeFavorite: (accountId: string, gameId: number) => Promise<IpcResult>;
        getFavorites: (accountId: string) => Promise<IpcResult>;
      };
      botting: {
        start: (accountId: string, placeId: string, interval: number) => Promise<IpcResult>;
        stop: () => Promise<IpcResult>;
        getStatus: () => Promise<IpcResult>;
      };
      advanced: {
        exportData: () => Promise<IpcResult>;
        deleteAllAccounts: () => Promise<IpcResult>;
        clearCache: () => Promise<IpcResult>;
        devMode: (enable: boolean) => Promise<IpcResult>;
        localApiStart: (port: number) => Promise<IpcResult>;
        localApiStop: () => Promise<IpcResult>;
      };
      cookie: {
        expiry: (accountId: string) => Promise<IpcResult>;
        refresh: (accountId: string) => Promise<IpcResult>;
      };
      shell: {
        openExternal: (url: string) => Promise<IpcResult>;
      };
      byAccount: {
        friendsList: (accountId: string) => Promise<IpcResult>;
        friendsRequests: (accountId: string) => Promise<IpcResult>;
        friendsRespond: (requestId: number, accept: boolean, accountId: string) => Promise<IpcResult>;
        follow: (userId: number, accountId: string) => Promise<IpcResult>;
        unfollow: (userId: number, accountId: string) => Promise<IpcResult>;
        gamesSearch: (query: string, accountId: string) => Promise<IpcResult>;
        serversList: (placeId: string, accountId: string, serverType?: 'Public' | 'Private') => Promise<IpcResult>;
        serversUsers: (serverId: string, accountId: string) => Promise<IpcResult>;
        sendFriendRequest: (userId: number, accountId: string) => Promise<IpcResult>;
        outfits: (accountId: string) => Promise<IpcResult>;
        serverRegion: (placeId: string, accountId: string) => Promise<IpcResult>;
        // NEW: FastFlags
        fflagsGetAll: (accountId: string) => Promise<IpcResult>;
        fflagsSetFlag: (accountId: string, key: string, value: string | number | boolean) => Promise<IpcResult>;
        fflagsDeleteFlag: (accountId: string, key: string) => Promise<IpcResult>;
        fflagsImportFlags: (accountId: string, flags: Record<string, unknown>) => Promise<IpcResult>;
        fflagsExportFlags: (accountId: string) => Promise<IpcResult>;
        // NEW: Content Modding
        modsListAvailable: () => Promise<IpcResult>;
        modsInstallMod: (modName: string) => Promise<IpcResult>;
        modsUninstallMod: (modName: string) => Promise<IpcResult>;
        modsIsModInstalled: (modName: string) => Promise<IpcResult>;
        modsBackupOriginals: () => Promise<IpcResult>;
        modsRestoreOriginals: () => Promise<IpcResult>;
        // NEW: Roblox Logs
        logsGetRecent: (sinceHours?: number, maxEntries?: number) => Promise<IpcResult>;
        logsClearOld: (daysToKeep: number) => Promise<IpcResult>;
        // NEW: Cache Cleaner
        cacheAnalyze: () => Promise<IpcResult>;
        cacheClean: (options?: Record<string, boolean>) => Promise<IpcResult>;
        // NEW: Discord RPC
        discordInitialize: (clientId?: string) => Promise<IpcResult>;
        discordUpdatePresence: (details?: string, state?: string, largeImageKey?: string, smallImageKey?: string, startTimestamp?: number) => Promise<IpcResult>;
        discordClearPresence: () => Promise<IpcResult>;
        discordShutdown: () => Promise<IpcResult>;
        // NEW: Launch Presets
        presetsGetAll: () => Promise<IpcResult>;
        presetsSavePreset: (preset: Omit<LaunchPreset, 'id'>) => Promise<IpcResult>;
        presetsDeletePreset: (presetId: string) => Promise<IpcResult>;
        presetsLaunchPreset: (presetId: string) => Promise<IpcResult>;
        // NEW: Playtime Tracking
        playtimeStartTracking: (accountId: string, placeId: string) => Promise<IpcResult>;
        playtimeStopTracking: (accountId: string) => Promise<IpcResult>;
        playtimeGetTotalPlaytime: (accountId: string) => Promise<IpcResult>;
        playtimeGetSessionHistory: (accountId: string, limit?: number) => Promise<IpcResult>;
        playtimeClearHistory: (accountId: string) => Promise<IpcResult>;
      };
    };
  }
}

interface IpcResult<T = unknown> { success: boolean; data?: T; error: string }
