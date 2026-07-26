// Infrastructure: IPCAdapter — UN SOLO ARCHIVO con todos los handlers
// Cada handler: valida input → llama servicio/use-case → retorna IpcResult

import { ipcMain, BrowserWindow } from 'electron';
import { v4 as uuid } from 'uuid';
import { AccountRepositoryImpl } from '../database/AccountRepositoryImpl';
import { SettingsRepositoryImpl } from '../database/SettingsRepositoryImpl';
import { encrypt, decrypt, hashCookie } from '../database/CryptoService';
import { getDb } from '../database/DatabaseManager';
import { loginUserPass, verifyCookie } from '../external/RobloxAuthService';
import { searchGames, getGameServers, getServerUsers, getServerRegion } from '../external/RobloxGamesService';
import { getFriends, getFriendRequests, respondFriendRequest, followUser, unfollowUser, sendFriendRequest } from '../external/RobloxPresenceService';
import { getProfile, updateProfile, get2FAStatus, toggle2FA, getActiveSessions, logoutSession, logoutAllSessions, changePassword, getPrivacySettings, updatePrivacySetting, getNotificationSettings, updateNotificationSetting } from '../external/RobloxSettingsService';
import { getCookieExpiry, refreshCookie } from '../external/RobloxCookieService';
import { killAllRoblox, launchRobloxDirect, startBotting, stopBotting, getBottingStatus } from '../external/RobloxBottingService';
import type { Account } from '../../domain/entities/Account';
import { createAccount } from '../../domain/entities/Account';
import { makeEncryptedString } from '../../domain/types/EncryptedString';

// NEW IMPORTS FOR THE 14 HANDLERS
import { getOutfits, detectVIPServers, shuffleJobId } from '../external/RobloxGamesService';
import { killInstance, getRunningInstances } from '../external/MultiRobloxService';
import { solveCaptcha } from '../external/CaptchaService';
import { start as startLocalApi, stop as stopLocalApi } from '../external/LocalApiService';
import { getTheme, setTheme, type ThemeId } from '../external/ThemeService';
import * as http from 'node:http';

// NEW: Advanced services
import { getAllFastFlags, setFastFlag, deleteFastFlag, importFlagsFromJson, exportFlagsToJson } from '../external/FastFlagsService';
import { backupContent, restoreContent, listAvailableBackups } from '../external/ContentModService';
import { parseRobloxLogsAsync } from '../external/RobloxLogService';
import { getRobloxCacheSize, cleanRobloxCache, cleanOldLogs } from '../external/CacheCleanerService';
import { initializeDiscordRPC, updateDiscordPresence, clearDiscordPresence, shutdownDiscordRPC } from '../external/DiscordRPCService';
import { getAllPresets, savePreset, deletePreset, launchPreset } from '../external/LaunchPresetService';
import { startPlaytimeTracking, stopPlaytimeTracking, getTotalPlaytime, getSessionHistory, clearPlaytimeHistory } from '../external/PlaytimeService';
import type { LaunchPreset } from '../../domain/entities/LaunchPreset';

type IpcResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

function ok<T>(data: T): IpcResult<T> { return { success: true, data }; }
function err(error: string): IpcResult { return { success: false, error }; }

function errMsg(e: unknown): string { return e instanceof Error ? e.message : String(e); }

const accountRepo = new AccountRepositoryImpl();
const settingsRepo = new SettingsRepositoryImpl();

let mainWindow: BrowserWindow | null = null;

export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win;
}

export function registerHandlers(): void {
  // ============ ACCOUNT ============
  ipcMain.handle('account:add', async (_e, { cookie, group = 'Default' }: { cookie: string; group?: string }) => {
    try {
      const info = await verifyCookie(cookie);
      if (!info.valid) return err('Cookie inválida');
      const count = await accountRepo.count();
      if (count >= 50) return err('Límite de 50 cuentas alcanzado');
      const account = createAccount({
        id: uuid(), robloxUserId: info.userId, username: info.username,
        encryptedCookie: makeEncryptedString(encrypt(cookie)), cookieHash: hashCookie(cookie), group,
      });
      await accountRepo.create(account);
      return ok(account.id);
    } catch (e) { return err(errMsg(e)); }
  });

  ipcMain.handle('account:list', async () => {
    try { return ok(await accountRepo.getAll()); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:remove', async (_e, { id }: { id: string }) => {
    try { await accountRepo.delete(id); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:move', async (_e, { id, group }: { id: string; group: string }) => {
    try { await accountRepo.update(id, { group }); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:field:set', async (_e, { id, field, value }: { id: string; field: string; value: string }) => {
    try {
      if (field === 'savedPlaceId' || field === 'savedJobId' || field === 'description' || field === 'password') {
        // Para campos no cifrados (savedPlaceId/savedJobId/description), value pasa tal cual.
        // Para 'password' el renderer envía la contraseña CIFRADA ya — la encripción ocurre
        // exponiendo el boundary correcto: este handler NO descifra/almacena texto plano,
        // solo marca el branded type para el dominio. Los callers válidos (account:savePassword)
        // envían encrypt(...) hecha. Si un caller del renderer envía texto plano perdido, el
        // branded type no lo detecta en runtime pero la invariante de tipos queda explícita.
        const accountField = field as keyof Account;
        const payload: Partial<Account> = { [accountField]: field === 'password' ? makeEncryptedString(value) : value } as Partial<Account>;
        await accountRepo.update(id, payload);
      }
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:savePassword', async (_e, { id, password }: { id: string; password: string }) => {
    try { await accountRepo.update(id, { password: makeEncryptedString(encrypt(password)) }); return ok(null); } catch (e) { return err(String(e)); }
  });

  // account:getPassword — ELIMINADO: exponía la contraseña descifrada al renderer (violación de boundary)
  // Las contraseñas NUNCA salen descifradas del main process.

  ipcMain.handle('account:setFavorite', async (_e, { id, favorite }: { id: string; favorite: boolean }) => {
    try { await accountRepo.update(id, { isFavorite: favorite }); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:check', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await verifyCookie(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:bulk-import', async (_e, { accounts }: { accounts: { username: string; password: string }[] }) => {
    try {
      let added = 0;
      for (const a of accounts) {
        try {
          const result = await loginUserPass(a.username, a.password);
          const info = await verifyCookie(result.cookie);
          if (info.valid) {
            const count = await accountRepo.count();
            if (count >= 50) break;
            const account = createAccount({ id: uuid(), robloxUserId: info.userId, username: info.username, encryptedCookie: makeEncryptedString(encrypt(result.cookie)), cookieHash: hashCookie(result.cookie) });
            await accountRepo.create(account);
            added++;
          }
        } catch { /* skip failed */ }
      }
      return ok({ added });
    } catch (e) { return err(String(e)); }
  });

  // ============ ACCOUNT CONTROL (via HTTP to LocalApiService) ============
  ipcMain.handle('account:control', async (_e, { accountId, command }: { accountId: string; command: string }) => {
    try {
      // Validate accountId exists (optional, but we can let the service handle it)
      const account = await accountRepo.getById(accountId);
      if (!account) {
        return err('Account not found');
      }

      const baseUrl = 'http://127.0.0.1:31415';
      let endpoint = '';
      let method = 'POST';

      switch (command) {
        case 'launch':
          endpoint = `/accounts/${accountId}/launch`;
          break;
        case 'kill':
          endpoint = `/accounts/${accountId}/kill`;
          break;
        case 'status':
          endpoint = `/accounts/${accountId}/status`;
          method = 'GET';
          break;
        case 'refresh-cookie':
          endpoint = `/accounts/${accountId}/refresh-cookie`;
          break;
        default:
          return err(`Unknown command: ${command}`);
      }

      const url = `${baseUrl}${endpoint}`;

      // Make the HTTP request
      const response = await new Promise<{ statusCode: number; data: Record<string, unknown> | string }>((resolve, reject) => {
        const req = http.request(url, { method }, (res: http.IncomingMessage) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ statusCode: res.statusCode ?? 0, data: parsed as Record<string, unknown> });
            } catch {
              resolve({ statusCode: res.statusCode ?? 0, data });
            }
          });
        });

        // Enforce a 5s timeout to avoid hanging the IPC handler indefinitely
        req.setTimeout(5000, () => {
          req.destroy(new Error('Request timeout'));
        });

        req.on('error', (error: Error) => {
          reject(error);
        });

        req.end();
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ok(response.data);
      } else {
        const errorMsg = typeof response.data === 'object' && response.data !== null && 'error' in response.data
          ? String(response.data.error)
          : `HTTP ${response.statusCode}`;
        return err(errorMsg);
      }
    } catch (caught) {
      return err(errMsg(caught));
    }
  });

  // ============ ROBLOX ============
  ipcMain.handle('roblox:launch', async (_e, { accountId, placeId, jobId }: { accountId: string; placeId?: string; jobId?: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      const placeIdToUse = placeId ?? acc.savedPlaceId;
      const jobIdToUse = jobId ?? acc.savedJobId;
      if (!placeIdToUse || !jobIdToUse) {
        return err('Place ID y Job ID son requeridos');
      }
      await launchRobloxDirect(placeIdToUse, jobIdToUse, cookie);
      await accountRepo.updateLastUsed(accountId);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // roblox:games:search, roblox:servers:list, roblox:servers:users — ELIMINADOS:
  // aceptaban cookie: string del renderer. Usar games:searchByAccount, servers:listByAccount,
  // servers:usersByAccount que resuelven la cookie internamente.

  ipcMain.handle('roblox:servers:join', async (_e, { accountId, placeId, jobId }: { accountId: string; placeId: string; jobId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      await launchRobloxDirect(placeId, jobId, cookie);
      await accountRepo.updateLastUsed(accountId);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('roblox:kill-all', async () => {
    try { await killAllRoblox(); return ok(null); } catch (e) { return err(String(e)); }
  });

  // roblox:join-group — ELIMINADO: aceptaba cookie: string del renderer.
  // (no hay variante byAccount actualmente; GroupService no está portado aún)

  ipcMain.handle('roblox:server-region', async (_e, { placeId }: { placeId: string }) => {
    try { return ok(await getServerRegion(placeId)); } catch (e) { return err(String(e)); }
  });

  // ============ PRESENCE ============
  // Legacy presence handlers — ELIMINADOS: presence:get, presence:recent-games,
  // presence:robux-balance aceptaban cookie: string del renderer.
  // (no hay variantes byAccount actualmente)

  // ============ SETTINGS ============
  ipcMain.handle('settings:get', async (_e, { key }: { key: string }) => {
    try { return ok(settingsRepo.get(key)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:set', async (_e, { key, value }: { key: string; value: unknown }) => {
    try { settingsRepo.set(key, value); return ok(null); } catch (e) { return err(String(e)); }
  });

  // ============ GAMES ============
  ipcMain.handle('games:addFavorite', async (_e, { accountId, game }: { accountId: string; game: { id: string; gameId: number; name: string; icon: string } }) => {
    try {
      await accountRepo.saveFavoriteGame(accountId, { ...game, id: game.id, addedAt: new Date() });
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('games:removeFavorite', async (_e, { accountId, gameId }: { accountId: string; gameId: number }) => {
    try { await accountRepo.removeFavoriteGame(accountId, gameId); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('games:getFavorites', async (_e, { accountId }: { accountId: string }) => {
    try { return ok(await accountRepo.getFavoriteGames(accountId)); } catch (e) { return err(String(e)); }
  });

  // ============ BOTTING ============
  ipcMain.handle('botting:start', async (_e, { accountId, placeId, interval }: { accountId: string; placeId: string; interval: number }) => {
    try { await startBotting(accountId, placeId, interval); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('botting:stop', async () => {
    try { await stopBotting(); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('botting:getStatus', async () => {
    try { return ok(getBottingStatus()); } catch (e) { return err(String(e)); }
  });

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

  // ============ SHELL ============
  ipcMain.handle('shell:open-external', async (_e, { url }: { url: string }) => {
    try {
      // Validate protocol — only HTTPS allowed to mitigate file://, javascript:, smb:// attacks
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return err('Invalid URL');
      }
      if (parsed.protocol !== 'https:') {
        return err('Only https:// URLs are allowed');
      }
      const { shell } = await import('electron');
      await shell.openExternal(url);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // NEW HANDLERS FOR THE 14 IPC
  ipcMain.handle('theme:get', async () => { try { return ok(getTheme()); } catch (e) { return errMsg(e); } });
  ipcMain.handle('theme:set', async (_e, name: string) => { try { setTheme(name as ThemeId); return ok(name); } catch (e) { return errMsg(e); } });
  // Roblox multi-launch — ELIMINADO: acepaba cookie desde el renderer.
  // (no hay variante byAccount actualmente; el launcher multi usa accountId internamente
  // y no debería necesitar una cookie pasada por el renderer)
  ipcMain.handle('roblox:kill-instance', async (_e, accountId: string) => { try { await killInstance(accountId); return ok(null); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:running-instances', async () => { try { return ok(getRunningInstances()); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:shuffle-jobid', async (_e, { placeId, cookie }) => { try { const jobId = await shuffleJobId(placeId, cookie); return ok(jobId); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:vip-servers', async (_e, { placeId, cookie }) => { try { const servers = await detectVIPServers(placeId, cookie); return ok(servers); } catch (e) { return errMsg(e); } });
  // roblox:outfits, roblox:universes — ELIMINADOS: aceptaban cookie: string del renderer.
  // Usar roblox:outfitsByAccount que resuelve la cookie internamente.
  ipcMain.handle('captcha:solve', async (_e, image: string) => { try { const solution = await solveCaptcha(image); return ok(solution); } catch (e) { return errMsg(e); } });
  ipcMain.handle('advanced:devmode', async (_e, enable: boolean) => {
    try {
      await settingsRepo.set('devmode', enable);
      return ok(enable);
    } catch (e) { return errMsg(e); }
  });
  ipcMain.handle('advanced:local-api:start', async (_e, port: number) => { try { await startLocalApi(port); return ok(null); } catch (e) { return errMsg(e); } });
  ipcMain.handle('advanced:local-api:stop', async () => { try { await stopLocalApi(); return ok(null); } catch (e) { return errMsg(e); } });
  ipcMain.handle('cookie:refresh-real', async (_e, cookie: string) => { try { const refreshed = await refreshCookie(cookie); return ok(refreshed); } catch (e) { return errMsg(e); } });

  // === New handlers that accept accountId instead of raw cookie ===
  // These resolve the cookie internally so the renderer never sees it
  // (cookie resolution is done inline in each handler via accountRepo + decrypt)

  ipcMain.handle('friends:listByAccount', async (_e, { accountId }: { accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await getFriends(acc.robloxUserId, cookie));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('friends:requestsByAccount', async (_e, { accountId }: { accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await getFriendRequests(cookie));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('friends:respondByAccount', async (_e, { requestId, accept, accountId }: { requestId: number; accept: boolean; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      await respondFriendRequest(requestId, accept, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('follow:byAccount', async (_e, { userId, accountId }: { userId: number; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      await followUser(userId, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('unfollow:byAccount', async (_e, { userId, accountId }: { userId: number; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      await unfollowUser(userId, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('games:searchByAccount', async (_e, { query, accountId }: { query: string; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await searchGames(query, cookie));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('servers:listByAccount', async (_e, { placeId, accountId, serverType }: { placeId: string; accountId: string; serverType?: 'Public' | 'Private' }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await getGameServers(placeId, cookie, serverType ?? 'Public'));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('servers:usersByAccount', async (_e, { serverId, accountId }: { serverId: string; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await getServerUsers(serverId, cookie));
    } catch (e) { return err(String(e)); }
  });

  // Send friend request by account (cookie resolved internally)
  ipcMain.handle('friends:sendByAccount', async (_e, { userId, accountId }: { userId: number; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      await sendFriendRequest(userId, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // Get outfits by account (for inventory/appearance view)
  ipcMain.handle('roblox:outfitsByAccount', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Cuenta no encontrada');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getOutfits(account.robloxUserId, cookie));
    } catch (e) { return errMsg(e); }
  });

  // Get server region by account (cookie not needed by getServerRegion)
  ipcMain.handle('roblox:serverRegionByAccount', async (_e, { placeId, accountId: _accountId }: { placeId: string; accountId: string }) => {
    try {
      return ok(await getServerRegion(placeId));
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT PROFILE ============
  ipcMain.handle('account:profile:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getProfile(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:profile:update', async (_e, { accountId, updates }: { accountId: string; updates: { displayName?: string; description?: string } }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await updateProfile(cookie, updates);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT SECURITY ============
  ipcMain.handle('account:security:2fa', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      const result = await get2FAStatus(cookie);
      return ok(result);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:2fa-toggle', async (_e, { accountId, enable }: { accountId: string; enable: boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await toggle2FA(cookie, enable);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:sessions', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getActiveSessions(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:logout', async (_e, { accountId, sessionId }: { accountId: string; sessionId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await logoutSession(cookie, sessionId);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:logout-all', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await logoutAllSessions(cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:password', async (_e, { accountId, current, next }: { accountId: string; current: string; next: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await changePassword(cookie, current, next);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT PRIVACY ============
  ipcMain.handle('account:privacy:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getPrivacySettings(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:privacy:update', async (_e, { accountId, key, value }: { accountId: string; key: string; value: string | boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await updatePrivacySetting(cookie, key, value);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT NOTIFICATIONS ============
  ipcMain.handle('account:notifications:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getNotificationSettings(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:notifications:update', async (_e, { accountId, key, value }: { accountId: string; key: string; value: boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await updateNotificationSetting(cookie, key, value);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

// ===== NEW SERVICES IPC HANDLERS =====

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
