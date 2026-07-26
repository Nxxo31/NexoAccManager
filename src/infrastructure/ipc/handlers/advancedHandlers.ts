// Advanced namespace handlers — caches, exports, data, captcha, discord,
// playtime, presets, content mods, fastflags, and logs. Plus the cookie
// refresh / expiry handlers that operate against the account's encrypted cookie.
//
// Channels: advanced:*, cookie:*, captcha:solve, fflags:*, mods:*, logs:*,
// cache:*, discord:*, presets:*, playtime:*.

import { ipcMain } from 'electron';
import { AccountRepositoryImpl } from '../../database/AccountRepositoryImpl';
import { SettingsRepositoryImpl } from '../../database/SettingsRepositoryImpl';
import { encrypt, decrypt, hashCookie } from '../../database/CryptoService';
import { getDb } from '../../database/DatabaseManager';
import { getCookieExpiry, refreshCookie } from '../../external/RobloxCookieService';
import { solveCaptcha } from '../../external/CaptchaService';
import { start as startLocalApi, stop as stopLocalApi } from '../../external/LocalApiService';
import { makeEncryptedString } from '../../../domain/types/EncryptedString';

// FastFlags
import { getAllFastFlags, setFastFlag, deleteFastFlag, importFlagsFromJson, exportFlagsToJson } from '../../external/FastFlagsService';
// Content modding
import { backupContent, restoreContent, listAvailableBackups } from '../../external/ContentModService';
// Roblox logs
import { parseRobloxLogsAsync } from '../../external/RobloxLogService';
// Cache cleaner
import { getRobloxCacheSize, cleanRobloxCache, cleanOldLogs } from '../../external/CacheCleanerService';
// Discord RPC
import { initializeDiscordRPC, updateDiscordPresence, clearDiscordPresence, shutdownDiscordRPC } from '../../external/DiscordRPCService';
// Launch presets
import { getAllPresets, savePreset, deletePreset, launchPreset } from '../../external/LaunchPresetService';
// Playtime tracking
import { startPlaytimeTracking, stopPlaytimeTracking, getTotalPlaytime, getSessionHistory, clearPlaytimeHistory } from '../../external/PlaytimeService';

import type { LaunchPreset } from '../../../domain/entities/LaunchPreset';
import { ok, err, errMsg } from './shared';

export function registerAdvancedHandlers(): void {
  const accountRepo = new AccountRepositoryImpl();
  const settingsRepo = new SettingsRepositoryImpl();

  // ============ ADVANCED ============
  ipcMain.handle('advanced:exportData', async () => {
    try {
      const accounts = await accountRepo.getAll();
      const settings = settingsRepo.getAll();
      return ok({ accounts, settings, exportedAt: new Date().toISOString() });
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('advanced:deleteAllAccounts', async () => {
    try {
      const all = await accountRepo.getAll();
      for (const a of all) await accountRepo.delete(a.id);
      return ok(all.length);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('advanced:clearCache', async () => {
    try { getDb().exec('VACUUM'); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('advanced:devmode', async (_e, enable: boolean) => {
    try {
      await settingsRepo.set('devmode', enable);
      return ok(enable);
    } catch (e) { return err(errMsg(e)); } // F-009: err(errMsg(e)) no string crudo
  });
  ipcMain.handle('advanced:local-api:start', async (_e, port: number) => { try { await startLocalApi(port); return ok(null); } catch (e) { return err(errMsg(e)); } }); // F-010
  ipcMain.handle('advanced:local-api:stop', async () => { try { await stopLocalApi(); return ok(null); } catch (e) { return err(errMsg(e)); } }); // F-011

  // ============ COOKIE ============
  ipcMain.handle('cookie:expiry', async (_e, { accountId }: { accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await getCookieExpiry(cookie));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('cookie:refresh', async (_e, { accountId }: { accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const oldCookie = decrypt(acc.encryptedCookie);
      const newCookie = await refreshCookie(oldCookie);
      if (newCookie !== oldCookie) {
        await accountRepo.update(accountId, { encryptedCookie: makeEncryptedString(encrypt(newCookie)), cookieHash: hashCookie(newCookie) });
      }
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // cookie:refresh-real — REMOVIDO (audit F-001): aceptaba cookie: string cruda
  // del renderer. La única forma legítima de refrescar una cookie es por accountId,
  // resuelta internamente en `cookie:refresh` (arriba). Si una cookie externa falla,
  // el usuario debe re-añadirla vía `account:add` o `account:login*`.

  // ============ CAPTCHA ============
  ipcMain.handle('captcha:solve', async (_e, image: string) => { try { const solution = await solveCaptcha(image); return ok(solution); } catch (e) { return err(errMsg(e)); } }); // F-012: err(errMsg(e)) no string crudo

  // ===== NEW SERVICES IPC HANDLERS =====

  // FastFlags — no cookie needed, reads/writes local ClientAppSettings.json
  ipcMain.handle('fflags:getAll', async () => {
    try { return ok(getAllFastFlags()); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('fflags:setFlag', async (_e, { key, value }: { key: string; value: string | number | boolean }) => {
    try { setFastFlag(key, value); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('fflags:deleteFlag', async (_e, { key }: { key: string }) => {
    try { deleteFastFlag(key); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('fflags:importFlags', async (_e, { flags }: { flags: Record<string, unknown> }) => {
    try { const count = importFlagsFromJson(flags); return ok({ count }); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('fflags:exportFlags', async () => {
    try { return ok(exportFlagsToJson()); } catch (e) { return err(String(e)); }
  });

  // Content Modding
  ipcMain.handle('mods:listAvailable', async () => {
    try { return ok(listAvailableBackups()); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('mods:installMod', async (_e, { modName }: { modName: string }) => {
    try { backupContent(modName); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('mods:uninstallMod', async (_e, { modName }: { modName: string }) => {
    try { restoreContent(modName); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('mods:isModInstalled', async (_e, { modName }: { modName: string }) => {
    try { const backups = listAvailableBackups(); return ok(backups.includes(modName)); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('mods:backupOriginals', async (_e, { relativePath }: { relativePath: string }) => {
    try { backupContent(relativePath); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('mods:restoreOriginals', async (_e, { relativePath }: { relativePath: string }) => {
    try { restoreContent(relativePath); return ok(null); } catch (e) { return err(String(e)); }
  });

  // Roblox Logs
  ipcMain.handle('logs:getRecent', async (_e, { sinceHours, maxEntries }: { sinceHours?: number; maxEntries?: number }) => {
    try {
      const since = sinceHours ? new Date(Date.now() - (sinceHours * 60 * 60 * 1000)) : undefined;
      const logs = await parseRobloxLogsAsync(since);
      const limited = maxEntries ? logs.slice(0, maxEntries) : logs;
      return ok(limited);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('logs:clearOld', async (_e, { daysToKeep }: { daysToKeep: number }) => {
    try { const freedBytes = cleanOldLogs(); return ok({ freedBytes }); } catch (e) { return err(String(e)); }
  });

  // Cache Cleaner
  ipcMain.handle('cache:analyze', async () => {
    try { return ok(getRobloxCacheSize()); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('cache:clean', async () => {
    try { return ok(cleanRobloxCache()); } catch (e) { return err(String(e)); }
  });

  // Discord RPC
  ipcMain.handle('discord:initialize', async (_e, { clientId }: { clientId?: string }) => {
    try { await initializeDiscordRPC(clientId); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('discord:updatePresence', async (_e, { details, state, largeImageKey, smallImageKey, startTimestamp }: { details?: string; state?: string; largeImageKey?: string; smallImageKey?: string; startTimestamp?: number }) => {
    try { await updateDiscordPresence({ details, state, largeImageKey, smallImageKey, startTimestamp }); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('discord:clearPresence', async () => {
    try { await clearDiscordPresence(); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('discord:shutdown', async () => {
    try { await shutdownDiscordRPC(); return ok(null); } catch (e) { return err(String(e)); }
  });

  // Launch Presets
  ipcMain.handle('presets:getAll', async () => {
    try { return ok(getAllPresets()); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('presets:savePreset', async (_e, { preset }: { preset: Omit<LaunchPreset, 'id'> }) => {
    try { const id = savePreset(preset); return ok(id); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('presets:deletePreset', async (_e, { presetId }: { presetId: string }) => {
    try { deletePreset(presetId); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('presets:launchPreset', async (_e, { presetId }: { presetId: string }) => {
    try { await launchPreset(presetId); return ok(null); } catch (e) { return err(String(e)); }
  });

  // Playtime Tracking
  ipcMain.handle('playtime:startTracking', async (_e, { accountId, placeId }: { accountId: string; placeId: string }) => {
    try { startPlaytimeTracking(accountId, placeId); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('playtime:stopTracking', async (_e, { accountId }: { accountId: string }) => {
    try { stopPlaytimeTracking(accountId); return ok(null); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('playtime:getTotalPlaytime', async (_e, { accountId }: { accountId: string }) => {
    try { return ok(getTotalPlaytime(accountId)); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('playtime:getSessionHistory', async (_e, { accountId, limit }: { accountId: string; limit?: number }) => {
    try { return ok(getSessionHistory(accountId, limit)); } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('playtime:clearHistory', async (_e, { accountId }: { accountId: string }) => {
    try { clearPlaytimeHistory(accountId); return ok(null); } catch (e) { return err(String(e)); }
  });
}
