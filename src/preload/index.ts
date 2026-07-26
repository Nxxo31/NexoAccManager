// Preload: Context Bridge
// Expone window.api con tipado fuerte al renderer — usa invoke/handle, nunca send/on

import { contextBridge, ipcRenderer } from 'electron';
import type { LaunchPreset } from '../domain/entities/LaunchPreset';

const api = {
  // Account
  account: {
    add: (cookie: string, group?: string) => ipcRenderer.invoke('account:add', { cookie, group }),
    // R-001: login-browser handler resolves cookie internally, returns only accountId
    loginBrowser: () => ipcRenderer.invoke('account:login-browser'),
    // R-002: login handler takes user/pass, runs server-side auth, returns only accountId
    login: (username: string, password: string) => ipcRenderer.invoke('account:login', { username, password }),
    list: () => ipcRenderer.invoke('account:list'),
    remove: (id: string) => ipcRenderer.invoke('account:remove', { id }),
    move: (id: string, group: string) => ipcRenderer.invoke('account:move', { id, group }),
    fieldSet: (id: string, field: string, value: string) => ipcRenderer.invoke('account:field:set', { id, field, value }),
    savePassword: (id: string, password: string) => ipcRenderer.invoke('account:savePassword', { id, password }),
    // getPassword: ELIMINADO — las contraseñas descifradas nunca cruzan el boundary al renderer
    setFavorite: (id: string, favorite: boolean) => ipcRenderer.invoke('account:setFavorite', { id, favorite }),
    check: (cookie: string) => ipcRenderer.invoke('account:check', { cookie }),
    bulkImport: (accounts: { username: string; password: string }[]) => ipcRenderer.invoke('account:bulk-import', { accounts }),
    // Legacy IPC handlers that expose cookies to renderer — REMOVED for security
    // Use byAccount.* instead, which resolves cookie internally in main process
    // friends.list, friends.requests, friends.respond, blocked.list, block, unblock, follow, unfollow → use byAccount
    profile: {
      get: (accountId: string) => ipcRenderer.invoke('account:profile:get', { accountId }),
      update: (accountId: string, updates: { displayName?: string; description?: string }) => ipcRenderer.invoke('account:profile:update', { accountId, updates }),
    },
  },

  // Roblox
  // Legacy handlers that accept raw cookie from renderer — REMOVED for security.
  // Use byAccount.* instead (cookie resolved internally in main process).
  // Removed: gamesSearch, serversList, serversUsers, multiLaunch, joinGroup, outfits, universes
  // (all accepted cookie: string from the renderer)
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) => ipcRenderer.invoke('roblox:launch', { accountId, placeId, jobId }),
    killInstance: (accountId: string) => ipcRenderer.invoke('roblox:kill-instance', accountId),
    runningInstances: () => ipcRenderer.invoke('roblox:running-instances'),
    serversJoin: (accountId: string, placeId: string, jobId: string) => ipcRenderer.invoke('roblox:servers:join', { accountId, placeId, jobId }),
    killAll: () => ipcRenderer.invoke('roblox:kill-all'),
    serverRegion: (placeId: string) => ipcRenderer.invoke('roblox:server-region', { placeId }),
    // audit F-002: byAccount variants resolve cookie server-side — no raw cookie crosses the bridge
    shuffleJobIdByAccount: (placeId: string, accountId: string) => ipcRenderer.invoke('roblox:shuffleJobIdByAccount', { placeId, accountId }),
    // audit F-003: VIP servers resolved by accountId — cookie never leaves main process
    vipServersByAccount: (placeId: string, accountId: string) => ipcRenderer.invoke('roblox:vipServersByAccount', { placeId, accountId }),
  },

  // Presence
  // Legacy handlers that accept raw cookie from renderer — REMOVED for security.
  // Removed: get, recentGames, robuxBalance (all accepted cookie: string from the renderer)

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', { key }),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', { key, value }),
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

  // Theme
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (name: string) => ipcRenderer.invoke('theme:set', name),
  },

  // Captcha
  captcha: {
    solve: (image: string) => ipcRenderer.invoke('captcha:solve', image),
  },

  // Advanced
  advanced: {
    exportData: () => ipcRenderer.invoke('advanced:exportData'),
    deleteAllAccounts: () => ipcRenderer.invoke('advanced:deleteAllAccounts'),
    clearCache: () => ipcRenderer.invoke('advanced:clearCache'),
    devMode: (enable: boolean) => ipcRenderer.invoke('advanced:devmode', enable),
    localApiStart: (port: number) => ipcRenderer.invoke('advanced:local-api:start', port),
    localApiStop: () => ipcRenderer.invoke('advanced:local-api:stop'),
  },

  // Cookie
  cookie: {
    expiry: (accountId: string) => ipcRenderer.invoke('cookie:expiry', { accountId }),
    refresh: (accountId: string) => ipcRenderer.invoke('cookie:refresh', { accountId }),
    // cookie:refresh-real — REMOVIDO (audit F-001): aceptaba cookie: string cruda del renderer
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', { url }),
  },

  // By-account handlers (resolve cookie internally — renderer never sees it)
  byAccount: {
    friendsList: (accountId: string) => ipcRenderer.invoke('friends:listByAccount', { accountId }),
    friendsRequests: (accountId: string) => ipcRenderer.invoke('friends:requestsByAccount', { accountId }),
    friendsRespond: (requestId: number, accept: boolean, accountId: string) => ipcRenderer.invoke('friends:respondByAccount', { requestId, accept, accountId }),
    sendFriendRequest: (userId: number, accountId: string) => ipcRenderer.invoke('friends:sendByAccount', { userId, accountId }),
    follow: (userId: number, accountId: string) => ipcRenderer.invoke('follow:byAccount', { userId, accountId }),
    unfollow: (userId: number, accountId: string) => ipcRenderer.invoke('unfollow:byAccount', { userId, accountId }),
    gamesSearch: (query: string, accountId: string) => ipcRenderer.invoke('games:searchByAccount', { query, accountId }),
    serversList: (placeId: string, accountId: string, serverType?: 'Public' | 'Private') => ipcRenderer.invoke('servers:listByAccount', { placeId, accountId, serverType }),
    serversUsers: (serverId: string, accountId: string) => ipcRenderer.invoke('servers:usersByAccount', { serverId, accountId }),
    outfits: (accountId: string) => ipcRenderer.invoke('roblox:outfitsByAccount', { accountId }),
    serverRegion: (placeId: string, accountId: string) => ipcRenderer.invoke('roblox:serverRegionByAccount', { placeId, accountId }),
    // FastFlags
    fflagsGetAll: (accountId: string) => ipcRenderer.invoke('fflags:getAll', { accountId }),
    fflagsSetFlag: (accountId: string, key: string, value: string | number | boolean) => ipcRenderer.invoke('fflags:setFlag', { accountId, key, value }),
    fflagsDeleteFlag: (accountId: string, key: string) => ipcRenderer.invoke('fflags:deleteFlag', { accountId, key }),
    fflagsImportFlags: (accountId: string, flags: Record<string, unknown>) => ipcRenderer.invoke('fflags:importFlags', { accountId, flags }),
    fflagsExportFlags: (accountId: string) => ipcRenderer.invoke('fflags:exportFlags', { accountId }),
    // Content Modding
    modsListAvailable: () => ipcRenderer.invoke('mods:listAvailable'),
    modsInstallMod: (modName: string) => ipcRenderer.invoke('mods:installMod', { modName }),
    modsUninstallMod: (modName: string) => ipcRenderer.invoke('mods:uninstallMod', { modName }),
    modsIsModInstalled: (modName: string) => ipcRenderer.invoke('mods:isModInstalled', { modName }),
    modsBackupOriginals: () => ipcRenderer.invoke('mods:backupOriginals'),
    modsRestoreOriginals: () => ipcRenderer.invoke('mods:restoreOriginals'),
    // Roblox Logs
    logsGetRecent: (sinceHours?: number, maxEntries?: number) => ipcRenderer.invoke('logs:getRecent', { sinceHours, maxEntries }),
    logsClearOld: (daysToKeep: number) => ipcRenderer.invoke('logs:clearOld', { daysToKeep }),
    // Cache Cleaner
    cacheAnalyze: () => ipcRenderer.invoke('cache:analyze'),
    cacheClean: (options?: Record<string, boolean>) => ipcRenderer.invoke('cache:clean', { options }),
    // Discord RPC
    discordInitialize: (clientId?: string) => ipcRenderer.invoke('discord:initialize', { clientId }),
    discordUpdatePresence: (details?: string, state?: string, largeImageKey?: string, smallImageKey?: string, startTimestamp?: number) => ipcRenderer.invoke('discord:updatePresence', { details, state, largeImageKey, smallImageKey, startTimestamp }),
    discordClearPresence: () => ipcRenderer.invoke('discord:clearPresence'),
    discordShutdown: () => ipcRenderer.invoke('discord:shutdown'),
    // Launch Presets
    presetsGetAll: () => ipcRenderer.invoke('presets:getAll'),
    presetsSavePreset: (preset: Omit<LaunchPreset, 'id'>) => ipcRenderer.invoke('presets:savePreset', { preset }),
    presetsDeletePreset: (presetId: string) => ipcRenderer.invoke('presets:deletePreset', { presetId }),
    presetsLaunchPreset: (presetId: string) => ipcRenderer.invoke('presets:launchPreset', { presetId }),
    // Playtime Tracking
    playtimeStartTracking: (accountId: string, placeId: string) => ipcRenderer.invoke('playtime:startTracking', { accountId, placeId }),
    playtimeStopTracking: (accountId: string) => ipcRenderer.invoke('playtime:stopTracking', { accountId }),
    playtimeGetTotalPlaytime: (accountId: string) => ipcRenderer.invoke('playtime:getTotalPlaytime', { accountId }),
    playtimeGetSessionHistory: (accountId: string, limit?: number) => ipcRenderer.invoke('playtime:getSessionHistory', { accountId, limit }),
    playtimeClearHistory: (accountId: string) => ipcRenderer.invoke('playtime:clearHistory', { accountId }),
  
    // Security
    twoFA: (accountId: string) => ipcRenderer.invoke('account:security:2fa', { accountId }),
    twoFAToggle: (accountId: string, enable: boolean) => ipcRenderer.invoke('account:security:2fa-toggle', { accountId, enable }),
    sessions: (accountId: string) => ipcRenderer.invoke('account:security:sessions', { accountId }),
    logout: (accountId: string, sessionId: string) => ipcRenderer.invoke('account:security:logout', { accountId, sessionId }),
    logoutAll: (accountId: string) => ipcRenderer.invoke('account:security:logout-all', { accountId }),
    password: (accountId: string, current: string, next: string) => ipcRenderer.invoke('account:security:password', { accountId, current, next }),
    // Privacy
    privacyGet: (accountId: string) => ipcRenderer.invoke('account:privacy:get', { accountId }),
    privacyUpdate: (accountId: string, key: string, value: string | boolean) => ipcRenderer.invoke('account:privacy:update', { accountId, key, value }),
    // Notifications
    notificationsGet: (accountId: string) => ipcRenderer.invoke('account:notifications:get', { accountId }),
    notificationsUpdate: (accountId: string, key: string, value: boolean) => ipcRenderer.invoke('account:notifications:update', { accountId, key, value }),
    // Account Control
    control: (accountId: string, command: string) => ipcRenderer.invoke('account:control', { accountId, command }),
  
      },
};

contextBridge.exposeInMainWorld('api', api);
