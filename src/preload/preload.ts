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
  | 'roblox:launch'
  | 'roblox:recent-games'
  | 'roblox:join-server'
  | 'settings:multiroblox'
  | 'settings:get'
  | 'settings:set';

const ALLOWED_CHANNELS: ReadonlySet<string> = new Set<IpcChannel>([
  'account:add',
  'account:remove',
  'account:list',
  'account:move',
  'account:field:set',
  'account:check',
  'roblox:launch',
  'roblox:recent-games',
  'roblox:join-server',
  'settings:multiroblox',
  'settings:get',
  'settings:set',
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
  },
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) =>
      invoke('roblox:launch', accountId, placeId, jobId),
    getRecentGames: () => invoke('roblox:recent-games'),
    joinServer: (placeId: string, accountId: string) => invoke('roblox:join-server', placeId, accountId),
    setMultiRoblox: (enabled: boolean) => invoke('settings:multiroblox', enabled),
  },
  settings: {
    get: (key: string) => invoke('settings:get', key),
    set: (key: string, value: any) => invoke('settings:set', key, value),
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
  checkAccount: (accountId: string) => Promise<any>;
}
