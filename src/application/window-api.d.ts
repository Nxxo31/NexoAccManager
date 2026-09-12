// Type: window.api declaration for renderer
// Auto-generated from preload/index.ts — DO NOT EDIT MANUALLY.
// Instead, update preload/index.ts and re-run the generation script.

import type { BackupMetadata, BackupSchedule, BackupFolderConfig } from '../domain/entities/BackupMetadata';
import type { IpcResult } from '../infrastructure/ipc/handlers/shared';

export {};

declare global {
  interface Window {
    api: {
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
        profile: {
            get: (accountId: string) => Promise<IpcResult>;
            update: (accountId: string, updates: { displayName?: string; description?: string }) => Promise<IpcResult>;
        };
    };
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
    settings: {
        get: (key: string) => Promise<IpcResult>;
        set: (key: string, value: unknown) => Promise<IpcResult>;
    };
    games: {
        addFavorite: (accountId: string, game: { id: string; gameId: number; name: string; icon: string }) => Promise<IpcResult>;
        removeFavorite: (accountId: string, gameId: number) => Promise<IpcResult>;
        getFavorites: (accountId: string) => Promise<IpcResult>;
    };
    botting: {
        start: (accountId: string, placeId: string, interval: number) => Promise<IpcResult>;
        stop: () => Promise<IpcResult>;
        getStatus: () => Promise<IpcResult>;
    };
    theme: {
        get: () => Promise<IpcResult>;
        set: (name: string) => Promise<IpcResult>;
    };
    captcha: {
        solve: (image: string) => Promise<IpcResult>;
        setApiKey: (apiKey: string) => Promise<IpcResult>;
        getApiKey: () => Promise<IpcResult<{ configured: boolean }>>;
    };
    advanced: {
        exportData: () => Promise<IpcResult>;
        deleteAllAccounts: () => Promise<IpcResult>;
        clearCache: () => Promise<IpcResult>;
        devMode: (enable: boolean) => Promise<IpcResult>;
        localApiStart: (port: number) => Promise<IpcResult<{ token: string; port: number }>>;
        localApiStop: () => Promise<IpcResult>;
        controlStatus: () => Promise<IpcResult>;
        controlSubscribe: (onStatus: (accountId: string, status: unknown) => void, onConnection: (status: 'connected' | 'disconnected' | 'reconnecting' | 'stopped') => void) => () => void;
    };
    cookie: {
        expiry: (accountId: string) => Promise<IpcResult>;
        refresh: (accountId: string) => Promise<IpcResult>;
    };
    shell: {
        openExternal: (url: string) => Promise<IpcResult>;
    };
    backup: {
        create: (description?: string, includeSecret?: boolean) => Promise<IpcResult<BackupMetadata>>;
        list: () => Promise<IpcResult<BackupMetadata[]>>;
        restore: (backupId: string, confirm: boolean) => Promise<IpcResult<{ success: boolean; restoredTables: string[] }>>;
        delete: (backupId: string) => Promise<IpcResult<boolean>>;
        verify: (backupId: string) => Promise<IpcResult<boolean>>;
        scheduleGet: () => Promise<IpcResult<{ schedule: BackupSchedule | null; nextRun: string | null }>>;
        scheduleSet: (enabled: boolean, frequency: 'daily' | 'weekly' | 'monthly', time: string) => Promise<IpcResult<BackupSchedule>>;
        selectFolder: () => Promise<IpcResult<BackupFolderConfig | null>>;
        folderGet: () => Promise<IpcResult<BackupFolderConfig | null>>;
        stats: () => Promise<IpcResult<{ totalBackups: number; totalSize: number; oldestBackup: string | null; newestBackup: string | null }>>;
    };
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
        fflagsGetAll: () => Promise<IpcResult>;
        fflagsSetFlag: (key: string, value: string | number | boolean) => Promise<IpcResult>;
        fflagsDeleteFlag: (key: string) => Promise<IpcResult>;
        fflagsImportFlags: (flags: Record<string, unknown>) => Promise<IpcResult>;
        fflagsExportFlags: () => Promise<IpcResult>;
        modsListAvailable: () => Promise<IpcResult>;
        modsInstallMod: (modName: string) => Promise<IpcResult>;
        modsUninstallMod: (modName: string) => Promise<IpcResult>;
        modsIsModInstalled: (modName: string) => Promise<IpcResult>;
        modsBackupOriginals: () => Promise<IpcResult>;
        modsRestoreOriginals: () => Promise<IpcResult>;
        logsGetRecent: (sinceHours?: number, maxEntries?: number) => Promise<IpcResult>;
        logsClearOld: (daysToKeep: number) => Promise<IpcResult>;
        cacheAnalyze: () => Promise<IpcResult>;
        cacheClean: (options?: Record<string, boolean>) => Promise<IpcResult>;
        discordInitialize: (clientId?: string) => Promise<IpcResult>;
        discordUpdatePresence: (details?: string, state?: string, largeImageKey?: string, smallImageKey?: string, startTimestamp?: number) => Promise<IpcResult>;
        discordClearPresence: () => Promise<IpcResult>;
        discordShutdown: () => Promise<IpcResult>;
        presetsGetAll: () => Promise<IpcResult>;
        presetsSavePreset: (preset: Omit<LaunchPreset, 'id'>) => Promise<IpcResult>;
        presetsDeletePreset: (presetId: string) => Promise<IpcResult>;
        presetsLaunchPreset: (presetId: string) => Promise<IpcResult>;
        playtimeStartTracking: (accountId: string, placeId: string) => Promise<IpcResult>;
        playtimeStopTracking: (accountId: string) => Promise<IpcResult>;
        playtimeGetTotalPlaytime: (accountId: string) => Promise<IpcResult>;
        playtimeGetSessionHistory: (accountId: string, limit?: number) => Promise<IpcResult>;
        playtimeClearHistory: (accountId: string) => Promise<IpcResult>;
        twoFA: (accountId: string) => Promise<IpcResult>;
        twoFAToggle: (accountId: string, enable: boolean) => Promise<IpcResult>;
        sessions: (accountId: string) => Promise<IpcResult>;
        logout: (accountId: string, sessionId: string) => Promise<IpcResult>;
        logoutAll: (accountId: string) => Promise<IpcResult>;
        password: (accountId: string, current: string, next: string) => Promise<IpcResult>;
        privacyGet: (accountId: string) => Promise<IpcResult>;
        privacyUpdate: (accountId: string, key: string, value: string | boolean) => Promise<IpcResult>;
        notificationsGet: (accountId: string) => Promise<IpcResult>;
        notificationsUpdate: (accountId: string, key: string, value: boolean) => Promise<IpcResult>;
        control: (accountId: string, command: string) => Promise<IpcResult>;
    };
  }
}
}