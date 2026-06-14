import { ipcRenderer, contextBridge } from 'electron';

// =============================================================================
// WHITELIST DE CANALES IPC – ÚNICA FUENTE VERDADERA
// No modificar esta sección sin revisar los handlers correspondientes en main.ts
// =============================================================================

type IpcChannel =
  | 'account:add'
  | 'account:remove'
  | 'account:list'
  | 'account:move'
  | 'account:field:set'
  | 'account:check'
  | 'account:profile:get'
  | 'account:profile:update'
  | 'account:avatar-thumbnail'
  | 'roblox:launch'
  | 'roblox:recent-games'
  | 'roblox:join-server'
  | 'roblox:multiroblox'
  | 'settings:get'
  | 'settings:set'
  | 'settings:security:sessions'
  | 'settings:security:logout'
  | 'settings:security:logout-all'
  | 'settings:security:password'
  | 'settings:security:2fa:get'
  | 'settings:security:2fa:set';

const ALLOWED_CHANNELS: ReadonlySet<string> = new Set<IpcChannel>([
  'account:add',
  'account:remove',
  'account:list',
  'account:move',
  'account:field:set',
  'account:check',
  'account:profile:get',
  'account:profile:update',
  'account:avatar-thumbnail',
  'roblox:launch',
  'roblox:recent-games',
  'roblox:join-server',
  'roblox:multiroblox',
  'settings:get',
  'settings:set',
  'settings:security:sessions',
  'settings:security:logout',
  'settings:security:logout-all',
  'settings:security:password',
  'settings:security:2fa:get',
  'settings:security:2fa:set',
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
    add: (cookie: string) => invoke('account:add', cookie),
    remove: (id: string) => invoke('account:remove', id),
    list: () => invoke('account:list'),
    moveAccount: (id: string, groupName: string) => invoke('account:move', id, groupName),
    setField: (id: string, key: string, value: string) => invoke('account:field:set', id, key, value),
    getProfile: (accountId: string) => invoke('account:profile:get', accountId),
    updateProfile: (accountId: string, patch: { displayName?: string; description?: string }) =>
      invoke('account:profile:update', accountId, patch),
    getAvatarThumbnail: (userId: number) => invoke('account:avatar-thumbnail', userId),
  },
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) =>
      invoke('roblox:launch', accountId, placeId, jobId),
    getRecentGames: () => invoke('roblox:recent-games'),
    joinServer: (placeId: string, accountId: string) => invoke('roblox:join-server', placeId, accountId),
    setMultiRoblox: (enabled: boolean) => invoke('roblox:multiroblox', enabled),
  },
  settings: {
    get: (key: string) => invoke('settings:get', key),
    set: (key: string, value: any) => invoke('settings:set', key, value),
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
  checkAccount: (accountId: string) => invoke('account:check', accountId),
});

// =============================================================================
// TIPOS PARA IMPORTAR EN EL RENDERER
// =============================================================================
export interface Api {
  account: {
    add: (cookie: string) => Promise<any>;
    remove: (id: string) => Promise<boolean>;
    list: () => Promise<any[]>;
    moveAccount: (accountId: string, groupName: string) => Promise<void>;
    setField: (accountId: string, key: string, value: string) => Promise<void>;
    getProfile: (accountId: string) => Promise<any>;
    updateProfile: (accountId: string, patch: { displayName?: string; description?: string }) => Promise<any>;
    getAvatarThumbnail: (userId: number) => Promise<string | null>;
  };
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) => Promise<boolean>;
    getRecentGames: () => Promise<any[]>;
    joinServer: (placeId: string, accountId: string) => Promise<boolean>;
    setMultiRoblox: (enabled: boolean) => Promise<boolean>;
  };
  settings: {
    get: <T = string>(key: string) => Promise<T>;
    set: <T = string>(key: string, value: T) => Promise<void>;
  };
  security: {
    getSessions: (accountId: string) => Promise<any[]>;
    logoutSession: (accountId: string, sessionId: string) => Promise<boolean>;
    logoutAll: (accountId: string) => Promise<boolean>;
    changePassword: (accountId: string, current: string, newPass: string) => Promise<boolean>;
    get2FA: (accountId: string) => Promise<any>;
    set2FA: (accountId: string, enabled: boolean) => Promise<boolean>;
  };
  checkAccount: (accountId: string) => Promise<any>;
}
