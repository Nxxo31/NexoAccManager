// Infrastructure: IPCAdapter — UN SOLO ARCHIVO con todos los handlers
// Cada handler: valida input → llama servicio/use-case → retorna IpcResult

import { ipcMain, BrowserWindow } from 'electron';
import { v4 as uuid } from 'uuid';
import { AccountRepositoryImpl } from '../database/AccountRepositoryImpl';
import { SettingsRepositoryImpl } from '../database/SettingsRepositoryImpl';
import { encrypt, decrypt, hashCookie } from '../database/CryptoService';
import { getDb } from '../database/DatabaseManager';
import { loginBrowser, loginUserPass, verifyCookie } from '../external/RobloxAuthService';
import { searchGames, getGameServers, getServerUsers, getServerRegion } from '../external/RobloxGamesService';
import { getPresence, getFriends, getFriendRequests, respondFriendRequest, getBlockedUsers, blockUser, unblockUser, followUser, unfollowUser, getRobuxBalance, getRecentGames, sendFriendRequest } from '../external/RobloxPresenceService';
import { getProfile, updateProfile, get2FAStatus, toggle2FA, getActiveSessions, logoutSession, logoutAllSessions, changePassword, getPrivacySettings, updatePrivacySetting, getNotificationSettings, updateNotificationSetting } from '../external/RobloxSettingsService';
import { getCookieExpiry, refreshCookie } from '../external/RobloxCookieService';
import { killAllRoblox, launchRobloxDirect, startBotting, stopBotting, getBottingStatus, joinGroup as joinGroupBot } from '../external/RobloxBottingService';
import type { Account } from '../../domain/entities/Account';
import { createAccount } from '../../domain/entities/Account';

// NEW IMPORTS FOR THE 14 HANDLERS
import { getOutfits, getUniverses, detectVIPServers, shuffleJobId } from '../external/RobloxGamesService';
import { launchMulti, killInstance, getRunningInstances } from '../external/MultiRobloxService';
import { solveCaptcha } from '../external/CaptchaService';
import { start as startLocalApi, stop as stopLocalApi } from '../external/LocalApiService';
import { getTheme, setTheme, type ThemeId } from '../external/ThemeService';
import * as http from 'node:http';

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
        encryptedCookie: encrypt(cookie), cookieHash: hashCookie(cookie), group,
      });
      await accountRepo.create(account);
      return ok(account.id);
    } catch (e) { return err(errMsg(e)); }
  });

  ipcMain.handle('account:login-browser', async () => {
    try {
      const result = await loginBrowser();
      return ok(result);
    } catch (e) { return err(errMsg(e)); }
  });

  ipcMain.handle('account:login', async (_e, { username, password }: { username: string; password: string }) => {
    try {
      const result = await loginUserPass(username, password);
      return ok(result);
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
        await accountRepo.update(id, { [field]: value } as Partial<Account>);
      }
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:savePassword', async (_e, { id, password }: { id: string; password: string }) => {
    try { await accountRepo.update(id, { password: encrypt(password) }); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:getPassword', async (_e, { id }: { id: string }) => {
    try {
      const acc = await accountRepo.getById(id);
      if (!acc?.password) return ok('');
      return ok(decrypt(acc.password));
    } catch (e) { return err(String(e)); }
  });

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
            const account = createAccount({ id: uuid(), robloxUserId: info.userId, username: info.username, encryptedCookie: encrypt(result.cookie), cookieHash: hashCookie(result.cookie) });
            await accountRepo.create(account);
            added++;
          }
        } catch { /* skip failed */ }
      }
      return ok({ added });
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:friends:list', async (_e, { userId, cookie }: { userId: number; cookie: string }) => {
    try { return ok(await getFriends(userId, cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:friends:requests', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await getFriendRequests(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:friends:respond', async (_e, { requestId, accept, cookie }: { requestId: number; accept: boolean; cookie: string }) => {
    try { await respondFriendRequest(requestId, accept, cookie); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:blocked:list', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await getBlockedUsers(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:block:user', async (_e, { userId, cookie }: { userId: number; cookie: string }) => {
    try { await blockUser(userId, cookie); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:unblock:user', async (_e, { userId, cookie }: { userId: number; cookie: string }) => {
    try { await unblockUser(userId, cookie); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:follow:user', async (_e, { userId, cookie }: { userId: number; cookie: string }) => {
    try { await followUser(userId, cookie); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:unfollow:user', async (_e, { userId, cookie }: { userId: number; cookie: string }) => {
    try { await unfollowUser(userId, cookie); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:profile:get', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await getProfile(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:profile:update', async (_e, { cookie, updates }: { cookie: string; updates: { displayName?: string; description?: string } }) => {
    try { await updateProfile(cookie, updates); return ok(null); } catch (e) { return err(String(e)); }
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
      const response = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
        const req = http.request(url, { method }, (res: http.IncomingMessage) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ statusCode: res.statusCode ?? 0, data: parsed });
            } catch {
              resolve({ statusCode: res.statusCode ?? 0, data });
            }
          });
        });

        req.on('error', (error: Error) => {
          reject(error);
        });

        req.end();
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ok(response.data);
      } else {
        // If the response is a JSON error, we can extract the error message.
        const errorMsg = response.data && (response.data as any).error
          ? (response.data as any).error
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

  ipcMain.handle('roblox:games:search', async (_e, { query, cookie }: { query: string; cookie: string }) => {
    try { return ok(await searchGames(query, cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('roblox:servers:list', async (_e, { placeId, cookie, serverType }: { placeId: string; cookie: string; serverType?: 'Public' | 'Private' }) => {
    try { return ok(await getGameServers(placeId, cookie, serverType ?? 'Public')); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('roblox:servers:users', async (_e, { serverId, cookie }: { serverId: string; cookie: string }) => {
    try { return ok(await getServerUsers(serverId, cookie)); } catch (e) { return err(String(e)); }
  });

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

  ipcMain.handle('roblox:join-group', async (_e, { groupId, cookie }: { groupId: number; cookie: string }) => {
    try { await joinGroupBot(groupId, cookie); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('roblox:server-region', async (_e, { placeId }: { placeId: string }) => {
    try { return ok(await getServerRegion(placeId)); } catch (e) { return err(String(e)); }
  });

  // ============ PRESENCE ============
  ipcMain.handle('presence:get', async (_e, { userIds, cookie }: { userIds: number[]; cookie: string }) => {
    try { return ok(await getPresence(userIds, cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('presence:recent-games', async (_e, { userId, cookie }: { userId: number; cookie: string }) => {
    try { return ok(await getRecentGames(userId, cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('presence:robux-balance', async (_e, { userId, cookie }: { userId: number; cookie: string }) => {
    try { return ok(await getRobuxBalance(userId, cookie)); } catch (e) { return err(String(e)); }
  });

  // ============ SETTINGS ============
  ipcMain.handle('settings:get', async (_e, { key }: { key: string }) => {
    try { return ok(settingsRepo.get(key)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:set', async (_e, { key, value }: { key: string; value: unknown }) => {
    try { settingsRepo.set(key, value); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:security:password', async (_e, { cookie, current, next }: { cookie: string; current: string; next: string }) => {
    try { await changePassword(cookie, current, next); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:security:sessions', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await getActiveSessions(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:security:logout', async (_e, { cookie, sessionId }: { cookie: string; sessionId: string }) => {
    try { await logoutSession(cookie, sessionId); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:security:logout-all', async (_e, { cookie }: { cookie: string }) => {
    try { await logoutAllSessions(cookie); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:security:2fa', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await get2FAStatus(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:security:2fa-toggle', async (_e, { cookie, enable }: { cookie: string; enable: boolean }) => {
    try { await toggle2FA(cookie, enable); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:privacy:get', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await getPrivacySettings(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:privacy:update', async (_e, { cookie, key, value }: { cookie: string; key: string; value: string | boolean }) => {
    try { await updatePrivacySetting(cookie, key, value); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:notifications:get', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await getNotificationSettings(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:notifications:update', async (_e, { cookie, key, value }: { cookie: string; key: string; value: boolean }) => {
    try { await updateNotificationSetting(cookie, key, value); return ok(null); } catch (e) { return err(String(e)); }
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
        await accountRepo.update(accountId, { encryptedCookie: encrypt(newCookie), cookieHash: hashCookie(newCookie) });
      }
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ SHELL ============
  ipcMain.handle('shell:open-external', async (_e, { url }: { url: string }) => {
    try {
      const { shell } = await import('electron');
      await shell.openExternal(url);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // NEW HANDLERS FOR THE 14 IPC
  ipcMain.handle('theme:get', async () => { try { return ok(getTheme()); } catch (e) { return errMsg(e); } });
  ipcMain.handle('theme:set', async (_e, name: string) => { try { setTheme(name as ThemeId); return ok(name); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:multi-launch', async (_e, { accountId, placeId, jobId, cookie }) => { try { const pid = await launchMulti(accountId, placeId, jobId, cookie); return ok(pid); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:kill-instance', async (_e, accountId: string) => { try { await killInstance(accountId); return ok(null); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:running-instances', async () => { try { return ok(getRunningInstances()); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:shuffle-jobid', async (_e, { placeId, cookie }) => { try { const jobId = await shuffleJobId(placeId, cookie); return ok(jobId); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:vip-servers', async (_e, { placeId, cookie }) => { try { const servers = await detectVIPServers(placeId, cookie); return ok(servers); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:outfits', async (_e, { userId, cookie }) => { try { const outfits = await getOutfits(userId, cookie); return ok(outfits); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:universes', async (_e, { gameId, cookie }) => { try { const universes = await getUniverses(gameId, cookie); return ok(universes); } catch (e) { return errMsg(e); } });
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

  async function getCookieForAccount(accountId: string): Promise<string> {
    const acc = await accountRepo.getById(accountId);
    if (!acc) throw new Error('Cuenta no encontrada');
    return decrypt(acc.encryptedCookie);
  }

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
      const cookie = await getCookieForAccount(accountId);
      return ok(await getFriendRequests(cookie));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('friends:respondByAccount', async (_e, { requestId, accept, accountId }: { requestId: number; accept: boolean; accountId: string }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      await respondFriendRequest(requestId, accept, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('follow:byAccount', async (_e, { userId, accountId }: { userId: number; accountId: string }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      await followUser(userId, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('unfollow:byAccount', async (_e, { userId, accountId }: { userId: number; accountId: string }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      await unfollowUser(userId, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('games:searchByAccount', async (_e, { query, accountId }: { query: string; accountId: string }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      return ok(await searchGames(query, cookie));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('servers:listByAccount', async (_e, { placeId, accountId, serverType }: { placeId: string; accountId: string; serverType?: 'Public' | 'Private' }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      return ok(await getGameServers(placeId, cookie, serverType ?? 'Public'));
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('servers:usersByAccount', async (_e, { serverId, accountId }: { serverId: string; accountId: string }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      return ok(await getServerUsers(serverId, cookie));
    } catch (e) { return err(String(e)); }
  });

  // Send friend request by account (cookie resolved internally)
  ipcMain.handle('friends:sendByAccount', async (_e, { userId, accountId }: { userId: number; accountId: string }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      await sendFriendRequest(userId, cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // Get outfits by account (for inventory/appearance view)
  ipcMain.handle('roblox:outfitsByAccount', async (_e, { accountId }: { accountId: string }) => {
    try {
      const cookie = await getCookieForAccount(accountId);
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      return ok(await getOutfits(account.robloxUserId, cookie));
    } catch (e) { return errMsg(e); }
  });

  // Get server region by account
  ipcMain.handle('roblox:serverRegionByAccount', async (_e, { placeId, accountId }: { placeId: string; accountId: string }) => {
    try {
      const _cookie = await getCookieForAccount(accountId);
      return ok(await getServerRegion(placeId));
    } catch (e) { return err(String(e)); }
  });
}