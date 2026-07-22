// Preload: Context Bridge
// Expone window.api con tipado fuerte al renderer — usa invoke/handle, nunca send/on

import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Account
  account: {
    add: (cookie: string, group?: string) => ipcRenderer.invoke('account:add', { cookie, group }),
    loginBrowser: () => ipcRenderer.invoke('account:login-browser'),
    login: (username: string, password: string) => ipcRenderer.invoke('account:login', { username, password }),
    list: () => ipcRenderer.invoke('account:list'),
    remove: (id: string) => ipcRenderer.invoke('account:remove', { id }),
    move: (id: string, group: string) => ipcRenderer.invoke('account:move', { id, group }),
    fieldSet: (id: string, field: string, value: string) => ipcRenderer.invoke('account:field:set', { id, field, value }),
    savePassword: (id: string, password: string) => ipcRenderer.invoke('account:savePassword', { id, password }),
    getPassword: (id: string) => ipcRenderer.invoke('account:getPassword', { id }),
    setFavorite: (id: string, favorite: boolean) => ipcRenderer.invoke('account:setFavorite', { id, favorite }),
    check: (cookie: string) => ipcRenderer.invoke('account:check', { cookie }),
    bulkImport: (accounts: { username: string; password: string }[]) => ipcRenderer.invoke('account:bulk-import', { accounts }),
    friends: {
      list: (userId: number, cookie: string) => ipcRenderer.invoke('account:friends:list', { userId, cookie }),
      requests: (cookie: string) => ipcRenderer.invoke('account:friends:requests', { cookie }),
      respond: (requestId: number, accept: boolean, cookie: string) => ipcRenderer.invoke('account:friends:respond', { requestId, accept, cookie }),
    },
    blocked: {
      list: (cookie: string) => ipcRenderer.invoke('account:blocked:list', { cookie }),
      block: (userId: number, cookie: string) => ipcRenderer.invoke('account:block:user', { userId, cookie }),
      unblock: (userId: number, cookie: string) => ipcRenderer.invoke('account:unblock:user', { userId, cookie }),
    },
    follow: (userId: number, cookie: string) => ipcRenderer.invoke('account:follow:user', { userId, cookie }),
    unfollow: (userId: number, cookie: string) => ipcRenderer.invoke('account:unfollow:user', { userId, cookie }),
    profile: {
      get: (cookie: string) => ipcRenderer.invoke('account:profile:get', { cookie }),
      update: (cookie: string, updates: { displayName?: string; description?: string }) => ipcRenderer.invoke('account:profile:update', { cookie, updates }),
    },
  },

  // Roblox
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) => ipcRenderer.invoke('roblox:launch', { accountId, placeId, jobId }),
    gamesSearch: (query: string, cookie: string) => ipcRenderer.invoke('roblox:games:search', { query, cookie }),
    serversList: (placeId: string, cookie: string, serverType?: 'Public' | 'Private') => ipcRenderer.invoke('roblox:servers:list', { placeId, cookie, serverType }),
    serversUsers: (serverId: string, cookie: string) => ipcRenderer.invoke('roblox:servers:users', { serverId, cookie }),
    serversJoin: (accountId: string, placeId: string, jobId: string) => ipcRenderer.invoke('roblox:servers:join', { accountId, placeId, jobId }),
    killAll: () => ipcRenderer.invoke('roblox:kill-all'),
    joinGroup: (groupId: number, cookie: string) => ipcRenderer.invoke('roblox:join-group', { groupId, cookie }),
    serverRegion: (placeId: string) => ipcRenderer.invoke('roblox:server-region', { placeId }),
  },

  // Presence
  presence: {
    get: (userIds: number[], cookie: string) => ipcRenderer.invoke('presence:get', { userIds, cookie }),
    recentGames: (userId: number, cookie: string) => ipcRenderer.invoke('presence:recent-games', { userId, cookie }),
    robuxBalance: (userId: number, cookie: string) => ipcRenderer.invoke('presence:robux-balance', { userId, cookie }),
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', { key }),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', { key, value }),
    security: {
      password: (cookie: string, current: string, next: string) => ipcRenderer.invoke('settings:security:password', { cookie, current, next }),
      sessions: (cookie: string) => ipcRenderer.invoke('settings:security:sessions', { cookie }),
      logout: (cookie: string, sessionId: string) => ipcRenderer.invoke('settings:security:logout', { cookie, sessionId }),
      logoutAll: (cookie: string) => ipcRenderer.invoke('settings:security:logout-all', { cookie }),
      twoFA: (cookie: string) => ipcRenderer.invoke('settings:security:2fa', { cookie }),
      twoFAToggle: (cookie: string, enable: boolean) => ipcRenderer.invoke('settings:security:2fa-toggle', { cookie, enable }),
    },
    privacy: {
      get: (cookie: string) => ipcRenderer.invoke('settings:privacy:get', { cookie }),
      update: (cookie: string, key: string, value: string | boolean) => ipcRenderer.invoke('settings:privacy:update', { cookie, key, value }),
    },
    notifications: {
      get: (cookie: string) => ipcRenderer.invoke('settings:notifications:get', { cookie }),
      update: (cookie: string, key: string, value: boolean) => ipcRenderer.invoke('settings:notifications:update', { cookie, key, value }),
    },
  },

  // Games
  games: {
    addFavorite: (accountId: string, game: { id: string; gameId: number; name: string; icon: string }) => ipcRenderer.invoke('games:addFavorite', { accountId, game }),
    removeFavorite: (accountId: string, gameId: number) => ipcRenderer.invoke('games:removeFavorite', { accountId, gameId }),
    getFavorites: (accountId: string) => ipcRenderer.invoke('games:getFavorites', { accountId }),
  },

  // Botting
  botting: {
    start: (accountId: string, placeId: string, interval: number) => ipcRenderer.invoke('botting:start', { accountId, placeId, interval }),
    stop: () => ipcRenderer.invoke('botting:stop'),
    getStatus: () => ipcRenderer.invoke('botting:getStatus'),
  },

  // Advanced
  advanced: {
    exportData: () => ipcRenderer.invoke('advanced:exportData'),
    deleteAllAccounts: () => ipcRenderer.invoke('advanced:deleteAllAccounts'),
    clearCache: () => ipcRenderer.invoke('advanced:clearCache'),
  },

  // Cookie
  cookie: {
    expiry: (accountId: string) => ipcRenderer.invoke('cookie:expiry', { accountId }),
    refresh: (accountId: string) => ipcRenderer.invoke('cookie:refresh', { accountId }),
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', { url }),
  },
};

contextBridge.exposeInMainWorld('api', api);
