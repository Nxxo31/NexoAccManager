// Roblox namespace handlers — platform-side operations that resolve the
// encrypted cookie from accountRepo + decrypt internally. The renderer never
// sees raw cookies.
//
// Channels: roblox:*, games:* (search + servers + favorites), botting:*,
// friends:*ByAccount, follow:byAccount, unfollow:byAccount.

import { ipcMain } from 'electron';
import { AccountRepositoryImpl } from '../../database/AccountRepositoryImpl';
import { decrypt } from '../../database/CryptoService';
import {
  searchGames,
  getGameServers,
  getServerUsers,
  getServerRegion,
  getOutfits,
  detectVIPServers,
  shuffleJobId,
} from '../../external/RobloxGamesService';
import {
  getFriends,
  getFriendRequests,
  respondFriendRequest,
  followUser,
  unfollowUser,
  sendFriendRequest,
} from '../../external/RobloxPresenceService';
import { killAllRoblox, launchRobloxDirect, startBotting, stopBotting, getBottingStatus } from '../../external/RobloxBottingService';
import { killInstance, getRunningInstances } from '../../external/MultiRobloxService';
import { ok, err, errMsg } from './shared';

export function registerRobloxHandlers(): void {
  const accountRepo = new AccountRepositoryImpl();

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

  // ============ NEW ROBLOX MULTI-LAUNCH / OUTFITS ============
  // Roblox multi-launch — ELIMINADO: acepaba cookie desde el renderer.
  // (no hay variante byAccount actualmente; el launcher multi usa accountId internamente
  // y no debería necesitar una cookie pasada por el renderer)
  // roblox:shuffle-jobid / roblox:vip-servers — REMOVIDOS (audit F-002/F-003):
  // aceptaban cookie: string cruda del renderer. Reemplazados por variantes
  // byAccount más abajo que resuelven la cookie internamente (accountRepo + decrypt).
  ipcMain.handle('roblox:kill-instance', async (_e, accountId: string) => { try { await killInstance(accountId); return ok(null); } catch (e) { return errMsg(e); } });
  ipcMain.handle('roblox:running-instances', async () => { try { return ok(getRunningInstances()); } catch (e) { return errMsg(e); } });
  // roblox:outfits, roblox:universes — ELIMINADOS: aceptaban cookie: string del renderer.
  // Usar roblox:outfitsByAccount que resuelve la cookie internamente.

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

  // Shuffle JobID by account (audit F-002): cookie resolved internally — renderer
  // never receives the raw cookie. Replaces the removed `roblox:shuffle-jobid`.
  ipcMain.handle('roblox:shuffleJobIdByAccount', async (_e, { placeId, accountId }: { placeId: string; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await shuffleJobId(placeId, cookie));
    } catch (e) { return err(String(e)); }
  });

  // VIP servers by account (audit F-003): cookie resolved internally — renderer
  // never receives the raw cookie. Replaces the removed `roblox:vip-servers`.
  ipcMain.handle('roblox:vipServersByAccount', async (_e, { placeId, accountId }: { placeId: string; accountId: string }) => {
    try {
      const acc = await accountRepo.getById(accountId);
      if (!acc) return err('Cuenta no encontrada');
      const cookie = decrypt(acc.encryptedCookie);
      return ok(await detectVIPServers(placeId, cookie));
    } catch (e) { return err(String(e)); }
  });
}
