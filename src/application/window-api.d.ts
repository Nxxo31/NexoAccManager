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
      };
      cookie: {
        expiry: (accountId: string) => Promise<IpcResult>;
        refresh: (accountId: string) => Promise<IpcResult>;
      };
      shell: {
        openExternal: (url: string) => Promise<IpcResult>;
      };
    };
  }
}

interface IpcResult<T = unknown> { success: boolean; data?: T; error: string }
