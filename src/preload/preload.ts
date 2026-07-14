import { ipcRenderer, contextBridge } from 'electron';

// =============================================================================
// WHITELIST DE CANALES IPC – ÚNICA FUENTE VERDADERA
// No modificar esta sección sin revisar los handlers correspondientes en main.ts
// =============================================================================

type IpcChannel =
  | 'account:add'
  | 'account:login'
  | 'account:login-browser'
  | 'account:remove'
  | 'account:list'
  | 'account:move'
  | 'account:field:set'
  | 'account:check'
  | 'account:profile:get'
  | 'account:profile:update'
  | 'account:avatar-thumbnail'
  | 'account:friends:list'
  | 'account:friends:requests'
  | 'account:friends:respond'
  | 'account:blocked:list'
  | 'account:block:user'
  | 'account:unblock:user'
  | 'account:follow:user'
  | 'account:unfollow:user'
  | 'roblox:launch'
  | 'roblox:games:search'
  | 'roblox:servers:list'
  | 'roblox:servers:join'
  | 'roblox:servers:distribute'
  | 'settings:get'
  | 'settings:set'
  | 'settings:security:sessions'
  | 'settings:security:logout'
  | 'settings:security:logout-all'
  | 'settings:security:password'
  | 'settings:security:2fa:get'
  | 'settings:security:2fa:set'
  | 'settings:privacy:get'
  | 'settings:privacy:update'
  | 'settings:notifications:get'
  | 'settings:notifications:update'
  | 'presence:get'
  | 'presence:start-polling'
  | 'presence:stop-polling'
  | 'presence:recent-games'
  | 'presence:robux-balance'
  // Theme / Appearance
  | "settings:theme:get"
  | "settings:theme:set"
  | "settings:language:get"
  | "settings:language:set"
  | "theme:get-css"
  // Advanced
  | "advanced:clearCache"
  | "advanced:exportData"
  | "advanced:deleteAllAccounts"
  | "shell:open-external"
  // Cookie events
  | "cookie:expiring"
  | "cookie:expired"
const ALLOWED_CHANNELS: ReadonlySet<string> = new Set<IpcChannel>([
  'account:add',
  'account:login',
  'account:login-browser',
  'account:remove',
  'account:list',
  'account:move',
  'account:field:set',
  'account:check',
  'account:profile:get',
  'account:profile:update',
  'account:avatar-thumbnail',
  'account:friends:list',
  'account:friends:requests',
  'account:friends:respond',
  'account:blocked:list',
  'account:block:user',
  'account:unblock:user',
  'account:follow:user',
  'account:unfollow:user',
  'roblox:launch',
  'roblox:games:search',
  'roblox:servers:list',
  'roblox:servers:join',
  'roblox:servers:distribute',
  'settings:get',
  'settings:set',
  'settings:security:sessions',
  'settings:security:logout',
  'settings:security:logout-all',
  'settings:security:password',
  'settings:security:2fa:get',
  'settings:security:2fa:set',
  'settings:privacy:get',
  'settings:privacy:update',
  'settings:notifications:get',
  'settings:notifications:update',
  'presence:get',
  'presence:start-polling',
  'presence:stop-polling',
  'presence:recent-games',
  'presence:robux-balance',
  // Theme / Appearance
  'settings:theme:get',
  'settings:theme:set',
  'settings:language:get',
  'settings:language:set',
  'theme:get-css',
  'advanced:clearCache',
  'advanced:exportData',
  'advanced:deleteAllAccounts',
  'shell:open-external',
  'cookie:expiring',
  'cookie:expired',
  ]);

// =============================================================================
// VALIDACIÓN PRIVADA – No exponer nunca ipcRenderer al renderer directamente
// =============================================================================

function invoke<T>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
  if (!ALLOWED_CHANNELS.has(channel)) {
    throw new Error(`IPC channel blocked by preload whitelist: ${channel}`);
  }
  return ipcRenderer.invoke(channel, ...args);
}

// =============================================================================
// API EXPUESTA AL RENDERER (via contextBridge)
// =============================================================================

contextBridge.exposeInMainWorld('api', {
  account: {
    add: (cookie: string, group?: string) => invoke('account:add', cookie, group),
    login: (username: string, password: string, group?: string) => invoke('account:login', username, password, group),
    loginBrowser: (group?: string) => invoke('account:login-browser', group),
    remove: (id: string) => invoke('account:remove', id),
    list: () => invoke('account:list'),
    moveAccount: (id: string, groupName: string) => invoke('account:move', id, groupName),
    setField: (id: string, key: string, value: string) => invoke('account:field:set', id, key, value),
    getProfile: (accountId: string) => invoke('account:profile:get', accountId),
    updateProfile: (accountId: string, patch: { displayName?: string; description?: string }) =>
      invoke('account:profile:update', accountId, patch),
    getAvatarThumbnail: (userId: number) => invoke('account:avatar-thumbnail', userId),
    getFriends: (accountId: string) => invoke('account:friends:list', accountId),
    getFriendRequests: (accountId: string) => invoke('account:friends:requests', accountId),
    respondFriendRequest: (accountId: string, userId: number, accept: boolean) =>
      invoke('account:friends:respond', accountId, userId, accept),
    getBlocked: (accountId: string) => invoke('account:blocked:list', accountId),
    blockUser: (accountId: string, userId: number) => invoke('account:block:user', accountId, userId),
    unblockUser: (accountId: string, userId: number) => invoke('account:unblock:user', accountId, userId),
    followUser: (accountId: string, userId: number) => invoke('account:follow:user', accountId, userId),
    unfollowUser: (accountId: string, userId: number) => invoke('account:unfollow:user', accountId, userId),
  },
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) =>
      invoke('roblox:launch', accountId, placeId, jobId),
    searchGame: (placeId: string, accountId: string) =>
      invoke('roblox:games:search', placeId, accountId),
    getServers: (placeId: string, accountId: string) =>
      invoke('roblox:servers:list', placeId, accountId),
    joinServer: (placeId: string, jobId: string, accountId: string) =>
      invoke('roblox:servers:join', placeId, jobId, accountId),
    distributeAccounts: (placeId: string, accountIds: string[]) =>
      invoke('roblox:servers:distribute', placeId, accountIds),
  },
  settings: {
    get: (key: string) => invoke('settings:get', key),
    set: (key: string, value: any) => invoke('settings:set', key, value),
    getPrivacy: (accountId: string) => invoke('settings:privacy:get', accountId),
    updatePrivacy: (accountId: string, settingKey: string, value: string) =>
      invoke('settings:privacy:update', accountId, settingKey, value),
    getNotifications: (accountId: string) => invoke('settings:notifications:get', accountId),
    updateNotification: (accountId: string, key: string, value: boolean) =>
      invoke('settings:notifications:update', accountId, key, value),
  },
  security: {
    getSessions: (accountId: string) => invoke('settings:security:sessions', accountId),
    logoutSession: (accountId: string, sessionId: string) =>
      invoke('settings:security:logout', accountId, sessionId),
    logoutAll: (accountId: string) => invoke('settings:security:logout-all', accountId),
    changePassword: (accountId: string, current: string, newPass: string) =>
      invoke('settings:security:password', accountId, current, newPass),
    get2FA: (accountId: string) => invoke('settings:security:2fa:get', accountId),
    set2FA: (accountId: string, enabled: boolean) =>
      invoke('settings:security:2fa:set', accountId, enabled),
  },
  presence: {
    getPresence: (accountIds: string[]) => invoke('presence:get', accountIds),
    startPolling: (accountIds: string[], intervalMs?: number) =>
      invoke('presence:start-polling', accountIds, intervalMs),
    stopPolling: () => invoke('presence:stop-polling'),
    getRecentGames: (accountId: string) => invoke('presence:recent-games', accountId),
    getRobuxBalance: (accountId: string) => invoke('presence:robux-balance', accountId),
  },
  advanced: {
    clearCache: () => invoke('advanced:clearCache'),
    exportData: () => invoke('advanced:exportData'),
    deleteAllAccounts: () => invoke('advanced:deleteAllAccounts'),
  },
  shell: {
    openExternal: (url: string) => invoke('shell:open-external', url),
  },
  // Theme / Appearance
  theme: {
    get: () => invoke('settings:theme:get'),
    set: (settings: any) => invoke('settings:theme:set', settings),
    getCss: () => invoke('theme:get-css'),
  },
  // Language / i18n
  language: {
    get: () => invoke('settings:language:get'),
    set: (lang: string) => invoke('settings:language:set', lang),
  },
  checkAccount: (accountId: string) => invoke('account:check', accountId),
  cookieEvents: {
    onExpiring: (callback: (accountId: string, hoursLeft: number) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, accountId: string, hoursLeft: number) => {
        callback(accountId, hoursLeft);
      };
      ipcRenderer.on('cookie:expiring', listener);
      return () => { ipcRenderer.removeListener('cookie:expiring', listener); };
    },
    onExpired: (callback: (accountId: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, accountId: string) => {
        callback(accountId);
      };
      ipcRenderer.on('cookie:expired', listener);
      return () => { ipcRenderer.removeListener('cookie:expired', listener); };
    },
  },
});

// =============================================================================
// TIPOS PARA IMPORTAR EN EL RENDERER
// =============================================================================
export interface Api {
  account: {
    add: (cookie: string, group?: string) => Promise<any>;
    login: (username: string, password: string, group?: string) => Promise<any>;
    loginBrowser: (group?: string) => Promise<any>;
    remove: (id: string) => Promise<boolean>;
    list: () => Promise<any[]>;
    moveAccount: (accountId: string, groupName: string) => Promise<void>;
    setField: (accountId: string, key: string, value: string) => Promise<void>;
    getProfile: (accountId: string) => Promise<any>;
    updateProfile: (accountId: string, patch: { displayName?: string; description?: string }) => Promise<any>;
    getAvatarThumbnail: (userId: number) => Promise<string | null>;
    getFriends: (accountId: string) => Promise<any>;
    getFriendRequests: (accountId: string) => Promise<any>;
    respondFriendRequest: (accountId: string, userId: number, accept: boolean) => Promise<boolean>;
    getBlocked: (accountId: string) => Promise<any>;
    blockUser: (accountId: string, userId: number) => Promise<boolean>;
    unblockUser: (accountId: string, userId: number) => Promise<boolean>;
    followUser: (accountId: string, userId: number) => Promise<boolean>;
    unfollowUser: (accountId: string, userId: number) => Promise<boolean>;
  };
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) => Promise<boolean>;
    searchGame: (placeId: string, accountId: string) => Promise<any>;
    getServers: (placeId: string, accountId: string) => Promise<any[]>;
    joinServer: (placeId: string, jobId: string, accountId: string) => Promise<boolean>;
    distributeAccounts: (placeId: string, accountIds: string[]) => Promise<Record<string, boolean>>;
  };
  settings: {
    get: <T = string>(key: string) => Promise<T>;
    set: <T = string>(key: string, value: T) => Promise<void>;
    getPrivacy: (accountId: string) => Promise<any>;
    updatePrivacy: (accountId: string, settingKey: string, value: string) => Promise<boolean>;
    getNotifications: (accountId: string) => Promise<any>;
    updateNotification: (accountId: string, key: string, value: boolean) => Promise<boolean>;
  };
  security: {
    getSessions: (accountId: string) => Promise<any[]>;
    logoutSession: (accountId: string, sessionId: string) => Promise<boolean>;
    logoutAll: (accountId: string) => Promise<boolean>;
    changePassword: (accountId: string, current: string, newPass: string) => Promise<boolean>;
    get2FA: (accountId: string) => Promise<any>;
    set2FA: (accountId: string, enabled: boolean) => Promise<boolean>;
  };
  presence: {
    getPresence: (accountIds: string[]) => Promise<any[]>;
    startPolling: (accountIds: string[], intervalMs?: number) => Promise<any>;
    stopPolling: () => Promise<any>;
    getRecentGames: (accountId: string) => Promise<any[]>;
    getRobuxBalance: (accountId: string) => Promise<any>;
  };
  advanced: {
    clearCache: () => Promise<void>;
    exportData: () => Promise<void>;
    deleteAllAccounts: () => Promise<void>;
  };
  shell: {
    openExternal: (url: string) => Promise<any>;
  };
  theme: {
    get: () => Promise<any>;
    set: (settings: any) => Promise<void>;
    getCss: () => Promise<string>;
  };
  language: {
    get: () => Promise<string>;
    set: (lang: string) => Promise<boolean>;
  };
  checkAccount: (accountId: string) => Promise<any>;
  cookieEvents: {
    onExpiring: (callback: (accountId: string, hoursLeft: number) => void) => () => void;
    onExpired: (callback: (accountId: string) => void) => () => void;
  };
}
