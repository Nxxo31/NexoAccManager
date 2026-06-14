import { ipcRenderer, contextBridge } from 'electron';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - global puede no estar definido
window.api = window.api || {};

// Definir tipos para el preload (solo estes tipos se exponen al renderer)
interface Api {

  /**
   * GestiÃ³n de cuentas
   */
  account: {
    /** Agrega una cuenta usando cookie */
    add: (cookie: string) => Promise<any>;
    /** Elimina una cuenta */
    remove: (id: string) => Promise<boolean>;
    /** Lista todas las cuentas */
    list: () => Promise<any[]>;
    /** Actualiza grupo de una cuenta */
    moveAccount: (accountId: string, groupName: string) => Promise<void>;
    /** Agrega/Actualiza campo */
    setField: (accountId: string, key: string, value: string) => Promise<void>;
  };

  /**
   * GestiÃ³n de Roblox
   */
  roblox: {
    /** Lanza Roblox con una cuenta especÃ­fica */
    launch: (accountId: string, placeId?: string, jobId?: string) => Promise<boolean>;
    /** Lista de juegos recientes */
    getRecentGames: () => Promise<any[]>;
    /** Obtiene servidores a los que unirse */
    joinServer: (placeId: string, accountId: string) => Promise<boolean>;
    /** Toggle Multi-Roblox */
    setMultiRoblox: (enabled: boolean) => Promise<boolean>;
  };

  /**
   * ConfiguraciÃ³n
   */
  settings: {
    /** Obtiene un setting */
    get: <T = string>(key: string) => Promise<T>;
    /** Guarda un setting */
    set: <T = string>(key: string, value: T) => Promise<void>;
  };

  /**
   * Actualiza la informaciÃ³n de una cuenta */
  checkAccount: (accountId: string) => Promise<any>;
}

contextBridge.exposeInMainWorld('api', {
  account: {
    add: (cookie: string) => ipcRenderer.invoke('account:add', cookie),
    remove: (id: string) => ipcRenderer.invoke('account:remove', id),
    list: () => ipcRenderer.invoke('account:list'),
    moveAccount: (id: string, groupName: string) => ipcRenderer.invoke('account:move', id, groupName),
    setField: (id: string, key: string, value: string) => ipcRenderer.invoke('account:field:set', id, key, value),
  },
  roblox: {
    launch: (accountId: string, placeId?: string, jobId?: string) => ipcRenderer.invoke('roblox:launch', accountId, placeId, jobId),
    getRecentGames: () => ipcRenderer.invoke('roblox:recent-games'),
    joinServer: (placeId: string, accountId: string) => ipcRenderer.invoke('roblox:join-server', placeId, accountId),
    setMultiRoblox: (enabled: boolean) => ipcRenderer.invoke('settings:multiroblox', enabled),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  },
  checkAccount: (accountId: string) => ipcRenderer.invoke('account:check', accountId),
});

// Exportar types para importar en renderer
export type { Api };
