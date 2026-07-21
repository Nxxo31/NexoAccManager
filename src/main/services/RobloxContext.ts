/**
 * RobloxContext — Facade (GoF) para orquestar servicios backend
 *
 * Patrón Facade: interfaz única que delega a servicios especializados.
 * Elimina los imports dinámicos en main.ts proporcionando un punto de
 * entrada único para toda la lógica de Roblox.
 *
 * Sub-APIs (namespaces):
 *   auth    — login, verifyCookie, quickLogin
 *   games   — searchGame, getOutfits, getUniverses, getPingAndRegion
 *   servers — getGameServers, getServerUsers, joinServer, distributeAccounts
 *   presence — getPresence, startPolling, stopPolling, getRecentGames, getRobuxBalance
 *   botting — start, stop, getStatus, setInterval
 *   cookies — verifyCookie (alias), getExpiry, startMonitoring, stopMonitoring, checkExpiry
 *
 * Los servicios inyectados son instancias singleton creadas en NexoApp.
 */

import { DatabaseManager } from '../storage/DatabaseManager';
import { CryptoService } from '../core/CryptoService';
import { AccountManager } from '../core/AccountManager';
import { PresenceService } from './PresenceService';
import { BottingService } from './BottingService';
import { CookieExpiryService } from './CookieExpiryService';
import { GamesService, GameServer } from './GamesService';
import { ServersService, RobloxServerUser } from './ServersService';
import { ImportService } from './ImportService';
import { BulkImportService } from './BulkImportService';
import { CaptchaService } from './CaptchaService';
import { PlayerFinderService } from './PlayerFinderService';
import { BrowserService } from './BrowserService';
import { RobloxWatcherService } from './RobloxWatcherService';
import { DeveloperModeService } from '../core/DeveloperModeService';
import { LocalAPIService } from '../core/LocalAPIService';

export interface OutfitData {
  id: number;
  name: string;
  imageUrl: string;
  isFavorite?: boolean;
}

export interface UniverseData {
  id: number;
  name: string;
  description: string;
  creator: {
    id: number;
    name: string;
  };
  visits: number;
  favorites: number;
  created: string;
  updated: string;
}

export interface ServerRegionData {
  region: string;
  ping: number;
}

export interface QuickLoginResult {
  url: string;
  code: string;
}

export interface BottingStatus {
  running: boolean;
  intervalMinutes: number;
  accountIds: string[];
  placeId: string | null;
  jobId: string | null;
}

export class RobloxContext {
  // Inyectamos los servicios
  private readonly db: DatabaseManager;
  private readonly crypto: CryptoService;
  private readonly accountManager: AccountManager;
  private readonly presenceService: PresenceService;
  private readonly bottingService: BottingService;
  private readonly cookieExpiryService: CookieExpiryService;
  private readonly gamesService: GamesService;
  private readonly serversService: ServersService;
  private readonly importService: ImportService;
  private readonly bulkImportService: BulkImportService;
  private readonly captchaService: CaptchaService;
  private readonly playerFinderService: PlayerFinderService;
  private readonly browserService: BrowserService;
  private readonly robloxWatcherService: RobloxWatcherService;
  private readonly developerModeService: DeveloperModeService;
  private readonly localAPIService: LocalAPIService;

  // Sub-APIs como propiedades inicializadas con arrow functions para capturar `this`
  public auth: {
    verifyCookie: (cookie: string) => Promise<{ authenticated: boolean; userId: number }>;
    quickLogin: (accountId: string) => Promise<{ url: string; code: string }>;
    getUsernameFromId: (userId: number) => Promise<string>;
    bulkImport: (accounts: { username: string; password: string }[]) => Promise<{ added: number; failed: number }>;
    solveCaptcha: (imageBase64: string, apiKey?: string) => Promise<string>;
  };

  public games: {
    searchGame: (placeId: string, cookie: string) => Promise<any>;
    getOutfits: (userId: number) => Promise<OutfitData[]>;
    getUniverses: (gameId: string) => Promise<UniverseData | null>;
    getPingAndRegion: (placeId: string) => Promise<{ region: string; ping: number }>;
  };

  public servers: {
    getGameServers: (placeId: string, cookie: string) => Promise<any[]>;
    getServerUsers: (placeId: string, jobId: string, cookie: string) => Promise<RobloxServerUser[]>;
    joinServer: (placeId: string, jobId: string, accountId: string) => Promise<boolean>;
    distributeAccounts: (placeId: string, accountIds: string[], cookie: string) => Promise<Record<string, boolean>>;
    getServerRegion: (placeId: string) => Promise<{ region: string; ping: number }>;
    searchPlayer: (username: string, placeId: string, cookie: string) => Promise<RobloxServerUser[]>;
  };

  public presence: {
    getPresence: (accountIds: string[]) => Promise<any[]>;
    startPolling: (accountIds: string[], intervalMs: number) => void;
    stopPolling: () => void;
    getRecentGames: (accountId: string) => Promise<any[]>;
    getRobuxBalance: (accountId: string) => Promise<number>;
  };

  public botting: {
    start: (accountIds: string[], intervalMinutes: number, placeId?: string, jobId?: string) => void;
    stop: () => void;
    getStatus: () => BottingStatus;
    setInterval: (intervalMinutes: number) => void;
    openBrowserSession: (accountId: string, cookie: string) => Promise<void>;
    autoRelaunch: (accountIds: string[], placeId: string, maxAttempts: number) => Promise<boolean>;
    closeBeta: () => void;
    fpsUnlock: (fps: 60 | 120 | 240) => void;
  };

  public cookies: {
    verifyCookie: (cookie: string) => Promise<{ authenticated: boolean; userId: number }>;
    getExpiry: (accountId: string) => Date | null;
    startMonitoring: () => void;
    stopMonitoring: () => void;
    checkExpiry: (accountId: string) => Promise<{ isExpired: boolean; expiresInHours: number; isValid: boolean }>;
    importCookies: (cookies: string[]) => Promise<{ added: number }>;
    importFromClipboard: (text: string) => Promise<{ added: number }>;
  };

  constructor(
    db: DatabaseManager,
    crypto: CryptoService,
    accountManager: AccountManager,
    presenceService: PresenceService,
    bottingService: BottingService,
    cookieExpiryService: CookieExpiryService,
    gamesService: GamesService,
    serversService: ServersService,
    importService: ImportService,
    bulkImportService: BulkImportService,
    captchaService: CaptchaService,
    playerFinderService: PlayerFinderService,
    browserService: BrowserService,
    robloxWatcherService: RobloxWatcherService,
    developerModeService: DeveloperModeService,
    localAPIService: LocalAPIService
  ) {
    this.db = db;
    this.crypto = crypto;
    this.accountManager = accountManager;
    this.presenceService = presenceService;
    this.bottingService = bottingService;
    this.cookieExpiryService = cookieExpiryService;
    this.gamesService = gamesService;
    this.serversService = serversService;
    this.importService = importService;
    this.bulkImportService = bulkImportService;
    this.captchaService = captchaService;
    this.playerFinderService = playerFinderService;
    this.browserService = browserService;
    this.robloxWatcherService = robloxWatcherService;
    this.developerModeService = developerModeService;
    this.localAPIService = localAPIService;

    // Inicializamos las sub-APIs con arrow functions que capturan `this`
    this.auth = {
      verifyCookie: (cookie) => this.verifyCookieAuth(cookie),
      quickLogin: (accountId) => this.quickLoginAuth(accountId),
      getUsernameFromId: (userId) => this.getUsernameFromIdAuth(userId),
      bulkImport: (accounts) => this.bulkImportService.bulkImport(accounts),
      solveCaptcha: (img, key) => this.captchaService.solveCaptcha(img, key),
    };

    this.games = {
      searchGame: (placeId, cookie) => this.gamesService.searchGame(placeId, cookie),
      getOutfits: (userId) => this.getOutfitsStub(userId),
      getUniverses: (gameId) => this.getUniversesStub(gameId),
      getPingAndRegion: (placeId) => this.gamesService.getPingAndRegion(placeId),
    };

    this.servers = {
      getGameServers: (placeId, cookie) => this.serversService.getGameServers(placeId, cookie),
      getServerUsers: (placeId, jobId, cookie) => this.serversService.getServerUsers(jobId, cookie, placeId),
      joinServer: (placeId, jobId, accountId) => this.joinServerImpl(placeId, jobId, accountId),
      distributeAccounts: (placeId, accountIds, cookie) => this.gamesService.distributeAccounts(placeId, accountIds, this.accountManager, cookie),
      getServerRegion: (placeId) => this.getServerRegionImpl(placeId),
      searchPlayer: (username, placeId, cookie) => this.playerFinderService.searchPlayer(username, placeId, cookie),
    };

    this.presence = {
      getPresence: (accountIds) => this.presenceService.getPresence(accountIds),
      startPolling: (accountIds, intervalMs) => this.presenceService.startPolling(accountIds, intervalMs),
      stopPolling: () => this.presenceService.stopPolling(),
      getRecentGames: (accountId) => this.presenceService.getRecentGames(accountId),
      getRobuxBalance: (accountId) => this.presenceService.getRobuxBalance(accountId).then(res => res.balance),
    };

    this.botting = {
      start: (accountIds, intervalMinutes, placeId, jobId) => this.bottingService.start(accountIds, intervalMinutes, placeId, jobId),
      stop: () => this.bottingService.stop(),
      getStatus: () => {
        const status = this.bottingService.getStatus();
        return {
          running: status.running,
          intervalMinutes: status.intervalMinutes,
          accountIds: status.accountIds,
          placeId: status.placeId,
          jobId: status.jobId,
        };
      },
      setInterval: (intervalMinutes) => this.bottingService.setInterval(intervalMinutes),
      openBrowserSession: (accountId, cookie) => this.browserService.openBrowserSession(accountId, cookie),
      autoRelaunch: (ids, placeId, max) => this.robloxWatcherService.autoRelaunch(ids, placeId, max),
      closeBeta: () => this.robloxWatcherService.closeBeta(),
      fpsUnlock: (fps) => this.robloxWatcherService.fpsUnlock(fps),
    };

    this.cookies = {
      verifyCookie: (cookie) => this.verifyCookieAuth(cookie),
      getExpiry: (accountId) => this.getCookieExpiry(accountId),
      startMonitoring: () => this.cookieExpiryService.start(),
      stopMonitoring: () => this.cookieExpiryService.stop(),
      checkExpiry: (accountId) => this.checkCookieExpiry(accountId),
      importCookies: (cookies) => this.importService.importCookies(cookies),
      importFromClipboard: (text) => this.importService.importFromClipboard(text),
    };
  }

  // ================================================================
  // IMPLEMENTACIONES DE MÉTODOS (para evitar duplicación y asegurar tipado)
  // ================================================================

  private async verifyCookieAuth(cookie: string): Promise<{ authenticated: boolean; userId: number }> {
    const valid = await this.accountManager.verifyCookie(cookie);
    if (!valid) return { authenticated: false, userId: 0 };
    const info = await this.accountManager.verifyAndGetAuthInfo(cookie);
    return { authenticated: info.authenticated, userId: info.userId };
  }

  private async quickLoginAuth(accountId: string): Promise<{ url: string; code: string }> {
    const account = this.accountManager.getAccountById(accountId);
    if (!account || !account.cookie) throw new Error('Cuenta no encontrada o sin cookie');
    const authTicket = await this.accountManager.getAuthTicket(account.cookie);
    const url = `roblox-player:1+launchmode:play+gameinfo:${authTicket}`;
    return { url, code: authTicket };
  }

  private async getUsernameFromIdAuth(userId: number): Promise<string> {
    // Placeholder - no implementado actualmente
    throw new Error('Not implemented');
  }

  private getOutfitsStub(_userId: number): Promise<OutfitData[]> {
    // TODO: Implementar scraping de outfits
    return Promise.resolve([]);
  }

  private getUniversesStub(_gameId: string): Promise<UniverseData | null> {
    // TODO: Implementar llamada a games.roblox.com/v1/games/multiget
    return Promise.resolve(null);
  }

  private joinServerImpl(placeId: string, jobId: string, accountId: string): Promise<boolean> {
    const account = this.accountManager.getAccountById(accountId);
    if (!account || !account.cookie) throw new Error('Cuenta no encontrada o sin cookie');
    return this.gamesService.joinServer(placeId, jobId, this.accountManager, accountId);
  }

  private async getServerRegionImpl(placeId: string): Promise<{ region: string; ping: number }> {
    const result = await this.gamesService.getPingAndRegion(placeId);
    return { region: result.region, ping: result.ping };
  }

  private getCookieExpiry(accountId: string): Date | null {
    const account = this.accountManager.getAccountById(accountId);
    return account?.cookieExpiresAt ?? null;
  }

  private async checkCookieExpiry(accountId: string): Promise<{ isExpired: boolean; expiresInHours: number; isValid: boolean }> {
    const account = this.accountManager.getAccountById(accountId);
    if (!account) return { isExpired: true, expiresInHours: 0, isValid: false };
    const result = await this.cookieExpiryService.checkAccountCookieExpiry({
      id: account.id,
      roblox_user_id: String(account.robloxUserId),
      encrypted_cookie: undefined,
      cookie_expires_at: account.cookieExpiresAt?.toISOString(),
      username: account.username,
    });
    return {
      isExpired: result.isExpired,
      expiresInHours: result.expiresInHours,
      isValid: result.isValid,
    };
  }
}