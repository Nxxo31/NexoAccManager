/**
 * RobloxContext — Facade (GoF) para orquestar servicios backend
 *
 * Patrón Facade: interfaz única que delega a servicios especializados.
 * Elimina los imports dinámicos en main.ts proporcionando un punto de
 * entrada único para toda la lógica de Roblox.
 *
 * Sub-APIs (namespaces):
 *   auth    — login, verifyCookie, quickLogin
 *   games   — searchGame, getPingAndRegion
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

  constructor(
    db: DatabaseManager,
    crypto: CryptoService,
    accountManager: AccountManager,
    presenceService: PresenceService,
    bottingService: BottingService,
    cookieExpiryService: CookieExpiryService,
    gamesService: GamesService,
    serversService: ServersService
  ) {
    this.db = db;
    this.crypto = crypto;
    this.accountManager = accountManager;
    this.presenceService = presenceService;
    this.bottingService = bottingService;
    this.cookieExpiryService = cookieExpiryService;
    this.gamesService = gamesService;
    this.serversService = serversService;
  }

  // Sub-APIs como propiedades inicializadas con arrow functions para capturar `this`
  public auth!: {
    verifyCookie: (cookie: string) => Promise<{ authenticated: boolean; userId: number }>;
    quickLogin: (accountId: string) => Promise<{ url: string; code: string }>;
    getUsernameFromId: (userId: number) => Promise<string>;
  };

  public games!: {
    searchGame: (placeId: string, cookie: string) => Promise<any>;
    getPingAndRegion: (placeId: string) => Promise<{ region: string; ping: number }>;
  };

  public servers!: {
    getGameServers: (placeId: string, cookie: string) => Promise<any[]>;
    getServerUsers: (placeId: string, jobId: string, cookie: string) => Promise<RobloxServerUser[]>;
    joinServer: (placeId: string, jobId: string, accountId: string) => Promise<boolean>;
    distributeAccounts: (placeId: string, accountIds: string[], cookie: string) => Promise<Record<string, boolean>>;
    getServerRegion: (placeId: string) => Promise<{ region: string; ping: number }>;
  };

  public presence!: {
    getPresence: (accountIds: string[]) => Promise<any[]>;
    startPolling: (accountIds: string[], intervalMs: number) => void;
    stopPolling: () => void;
    getRecentGames: (accountId: string) => Promise<any[]>;
    getRobuxBalance: (accountId: string) => Promise<number>;
  };

  public botting!: {
    start: (accountIds: string[], intervalMinutes: number, placeId?: string, jobId?: string) => void;
    stop: () => void;
    getStatus: () => BottingStatus;
    setInterval: (intervalMinutes: number) => void;
  };

  public cookies!: {
    verifyCookie: (cookie: string) => Promise<{ authenticated: boolean; userId: number }>;
    getExpiry: (accountId: string) => Date | null;
    startMonitoring: () => void;
    stopMonitoring: () => void;
    checkExpiry: (accountId: string) => Promise<{ isExpired: boolean; expiresInHours: number; isValid: boolean }>;
  };

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
      username: account.username
    });
    return {
      isExpired: result.isExpired,
      expiresInHours: result.expiresInHours,
      isValid: result.isValid
    };
  }
}