/**
 * Tests de delegación para RobloxContext (Facade Pattern)
 *
 * Verifica que cada método del Facade delega correctamente al servicio
 * subyacente. Usa mocks simples (vi.fn) para interceptar llamadas.
 *
 * Cobertura: 27 tests cubriendo las 6 sub-APIs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RobloxContext } from './RobloxContext';
import type { DatabaseManager } from '../storage/DatabaseManager';
import type { CryptoService } from '../core/CryptoService';
import type { AccountManager } from '../core/AccountManager';
import type { PresenceService } from './PresenceService';
import type { BottingService } from './BottingService';
import type { CookieExpiryService } from './CookieExpiryService';
import type { GamesService } from './GamesService';
import type { ServersService } from './ServersService';

// Mocks
const mockDb = {} as DatabaseManager;
const mockCrypto = {} as CryptoService;
const mockAccountManager = {
  verifyCookie: vi.fn(),
  verifyAndGetAuthInfo: vi.fn(),
  getAuthTicket: vi.fn(),
  getAccountById: vi.fn(),
} as unknown as AccountManager;
const mockPresence = {
  getPresence: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
  getRecentGames: vi.fn(),
  getRobuxBalance: vi.fn(),
} as unknown as PresenceService;
const mockBotting = {
  start: vi.fn(),
  stop: vi.fn(),
  getStatus: vi.fn(),
  setInterval: vi.fn(),
} as unknown as BottingService;
const mockCookieExpiry = {
  start: vi.fn(),
  stop: vi.fn(),
  checkAccountCookieExpiry: vi.fn(),
} as unknown as CookieExpiryService;
const mockGames = {
  searchGame: vi.fn(),
  getPingAndRegion: vi.fn(),
  joinServer: vi.fn(),
  distributeAccounts: vi.fn(),
} as unknown as GamesService;
const mockServers = {
  getGameServers: vi.fn(),
  getServerUsers: vi.fn(),
} as unknown as ServersService;

let ctx: RobloxContext;

beforeEach(() => {
  vi.clearAllMocks();
  ctx = new RobloxContext(
    mockDb,
    mockCrypto,
    mockAccountManager,
    mockPresence,
    mockBotting,
    mockCookieExpiry,
    mockGames,
    mockServers
  );
});

describe('RobloxContext — Facade Delegation', () => {
  // ================================================================
  // AUTH SUB-API (3 tests)
  // ================================================================
  describe('auth', () => {
    it('verifyCookie delega a accountManager.verifyCookie + verifyAndGetAuthInfo', async () => {
      vi.mocked(mockAccountManager.verifyCookie).mockResolvedValue(true);
      vi.mocked(mockAccountManager.verifyAndGetAuthInfo).mockResolvedValue({ authenticated: true, userId: 123 });
      const result = await ctx.auth.verifyCookie('cookie123');
      expect(mockAccountManager.verifyCookie).toHaveBeenCalledWith('cookie123');
      expect(mockAccountManager.verifyAndGetAuthInfo).toHaveBeenCalledWith('cookie123');
      expect(result).toEqual({ authenticated: true, userId: 123 });
    });

    it('verifyCookie retorna false si la cookie es inválida', async () => {
      vi.mocked(mockAccountManager.verifyCookie).mockResolvedValue(false);
      const result = await ctx.auth.verifyCookie('bad');
      expect(result).toEqual({ authenticated: false, userId: 0 });
      expect(mockAccountManager.verifyAndGetAuthInfo).not.toHaveBeenCalled();
    });

    it('quickLogin delega a accountManager.getAuthTicket', async () => {
      const mockAccount = { id: 'acc1', cookie: 'ck', username: 'user' };
      vi.mocked(mockAccountManager.getAccountById).mockReturnValue(mockAccount as any);
      vi.mocked(mockAccountManager.getAuthTicket).mockResolvedValue('ticket123');
      const result = await ctx.auth.quickLogin('acc1');
      expect(result).toEqual({ url: 'roblox-player:1+launchmode:play+gameinfo:ticket123', code: 'ticket123' });
    });
  });

  // ================================================================
  // GAMES SUB-API (4 tests)
  // ================================================================
  describe('games', () => {
    it('searchGame delega a gamesService.searchGame', async () => {
      const mockGame = { name: 'Game1', placeId: 123 };
      vi.mocked(mockGames.searchGame).mockResolvedValue(mockGame as any);
      const result = await ctx.games.searchGame('123', 'cookie');
      expect(mockGames.searchGame).toHaveBeenCalledWith('123', 'cookie');
      expect(result).toEqual(mockGame);
    });

    it('getOutfits retorna array vacío (stub)', async () => {
      const result = await ctx.games.getOutfits(123);
      expect(result).toEqual([]);
    });

    it('getUniverses retorna null (stub)', async () => {
      const result = await ctx.games.getUniverses('123');
      expect(result).toBeNull();
    });

    it('getPingAndRegion delega a gamesService.getPingAndRegion', async () => {
      vi.mocked(mockGames.getPingAndRegion).mockResolvedValue({ region: 'NA', ping: 50 } as any);
      const result = await ctx.games.getPingAndRegion('123');
      expect(result).toEqual({ region: 'NA', ping: 50 });
    });
  });

  // ================================================================
  // SERVERS SUB-API (5 tests)
  // ================================================================
  describe('servers', () => {
    it('getGameServers delega a serversService.getGameServers', async () => {
      const mockServerList = [{ jobId: 'job1', playerCount: 10 }];
      vi.mocked(mockServers.getGameServers).mockResolvedValue(mockServerList as any);
      const result = await ctx.servers.getGameServers('123', 'cookie');
      expect(mockServers.getGameServers).toHaveBeenCalledWith('123', 'cookie');
      expect(result).toEqual(mockServerList);
    });

    it('getServerUsers delega a serversService.getServerUsers', async () => {
      const mockUsers = [{ userId: 1, username: 'player1' }];
      vi.mocked(mockServers.getServerUsers).mockResolvedValue(mockUsers as any);
      const result = await ctx.servers.getServerUsers('123', 'job1', 'cookie');
      expect(mockServers.getServerUsers).toHaveBeenCalledWith('job1', 'cookie', '123');
      expect(result).toEqual(mockUsers);
    });

    it('joinServer delega a gamesService.joinServer', async () => {
      const mockAccount = { id: 'acc1', cookie: 'ck', username: 'user' };
      vi.mocked(mockAccountManager.getAccountById).mockReturnValue(mockAccount as any);
      vi.mocked(mockGames.joinServer).mockResolvedValue(true);
      const result = await ctx.servers.joinServer('123', 'job1', 'acc1');
      expect(mockGames.joinServer).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('distributeAccounts delega a gamesService.distributeAccounts', async () => {
      const mockResult = { acc1: true };
      vi.mocked(mockGames.distributeAccounts).mockResolvedValue(mockResult as any);
      const result = await ctx.servers.distributeAccounts('123', ['acc1'], 'cookie');
      expect(mockGames.distributeAccounts).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('getServerRegion delega a gamesService.getPingAndRegion', async () => {
      vi.mocked(mockGames.getPingAndRegion).mockResolvedValue({ region: 'EU', ping: 80 } as any);
      const result = await ctx.servers.getServerRegion('123');
      expect(result).toEqual({ region: 'EU', ping: 80 });
    });
  });

  // ================================================================
  // PRESENCE SUB-API (5 tests)
  // ================================================================
  describe('presence', () => {
    it('getPresence delega a presenceService.getPresence', async () => {
      const mockPresenceList = [{ userId: 123, status: 'online' }];
      vi.mocked(mockPresence.getPresence).mockResolvedValue(mockPresenceList as any);
      const result = await ctx.presence.getPresence(['acc1']);
      expect(mockPresence.getPresence).toHaveBeenCalledWith(['acc1']);
      expect(result).toEqual(mockPresenceList);
    });

    it('startPolling delega a presenceService.startPolling', () => {
      ctx.presence.startPolling(['acc1'], 5000);
      expect(mockPresence.startPolling).toHaveBeenCalledWith(['acc1'], 5000);
    });

    it('stopPolling delega a presenceService.stopPolling', () => {
      ctx.presence.stopPolling();
      expect(mockPresence.stopPolling).toHaveBeenCalled();
    });

    it('getRecentGames delega a presenceService.getRecentGames', async () => {
      const mockRecentGames = [{ placeId: 123, name: 'Game' }];
      vi.mocked(mockPresence.getRecentGames).mockResolvedValue(mockRecentGames as any);
      const result = await ctx.presence.getRecentGames('acc1');
      expect(mockPresence.getRecentGames).toHaveBeenCalledWith('acc1');
      expect(result).toEqual(mockRecentGames);
    });

    it('getRobuxBalance delega a presenceService.getRobuxBalance', async () => {
      vi.mocked(mockPresence.getRobuxBalance).mockResolvedValue({ balance: 500 } as any);
      const result = await ctx.presence.getRobuxBalance('acc1');
      expect(mockPresence.getRobuxBalance).toHaveBeenCalledWith('acc1');
      expect(result).toBe(500);
    });
  });

  // ================================================================
  // BOTTING SUB-API (4 tests)
  // ================================================================
  describe('botting', () => {
    it('start delega a bottingService.start', () => {
      ctx.botting.start(['acc1'], 5, 'place1', 'job1');
      expect(mockBotting.start).toHaveBeenCalledWith(['acc1'], 5, 'place1', 'job1');
    });

    it('stop delega a bottingService.stop', () => {
      ctx.botting.stop();
      expect(mockBotting.stop).toHaveBeenCalled();
    });

    it('getStatus delega a bottingService.getStatus', () => {
      const mockStatus = { running: true, intervalMinutes: 5, accountIds: ['acc1'], placeId: 'p1', jobId: 'j1' };
      vi.mocked(mockBotting.getStatus).mockReturnValue(mockStatus as any);
      const result = ctx.botting.getStatus();
      expect(result).toEqual(mockStatus);
    });

    it('setInterval delega a bottingService.setInterval', () => {
      ctx.botting.setInterval(10);
      expect(mockBotting.setInterval).toHaveBeenCalledWith(10);
    });
  });

  // ================================================================
  // COOKIES SUB-API (5 tests)
  // ================================================================
  describe('cookies', () => {
    it('verifyCookie delega a auth.verifyCookie (alias)', async () => {
      vi.mocked(mockAccountManager.verifyCookie).mockResolvedValue(true);
      vi.mocked(mockAccountManager.verifyAndGetAuthInfo).mockResolvedValue({ authenticated: true, userId: 123 });
      const result = await ctx.cookies.verifyCookie('cookie');
      expect(mockAccountManager.verifyCookie).toHaveBeenCalledWith('cookie');
      expect(result).toEqual({ authenticated: true, userId: 123 });
    });

    it('getExpiry retorna cookieExpiresAt de la cuenta', () => {
      const date = new Date('2025-12-31');
      const mockAccount = { id: 'acc1', cookie: 'ck', cookieExpiresAt: date };
      vi.mocked(mockAccountManager.getAccountById).mockReturnValue(mockAccount as any);
      const result = ctx.cookies.getExpiry('acc1');
      expect(result).toEqual(date);
    });

    it('getExpiry retorna null si la cuenta no existe', () => {
      vi.mocked(mockAccountManager.getAccountById).mockReturnValue(undefined);
      const result = ctx.cookies.getExpiry('acc1');
      expect(result).toBeNull();
    });

    it('startMonitoring delega a cookieExpiryService.start', () => {
      ctx.cookies.startMonitoring();
      expect(mockCookieExpiry.start).toHaveBeenCalled();
    });

    it('stopMonitoring delega a cookieExpiryService.stop', () => {
      ctx.cookies.stopMonitoring();
      expect(mockCookieExpiry.stop).toHaveBeenCalled();
    });
  });

  // ================================================================
  // EDGE CASES (1 test)
  // ================================================================
  describe('edge cases', () => {
    it('checkExpiry retorna expired si la cuenta no existe', async () => {
      vi.mocked(mockAccountManager.getAccountById).mockReturnValue(undefined);
      const result = await ctx.cookies.checkExpiry('nonexistent');
      expect(result).toEqual({ isExpired: true, expiresInHours: 0, isValid: false });
    });
  });
});
