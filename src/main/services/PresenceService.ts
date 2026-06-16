/**
 * ======================================================
 * PresenceService — API para Presence Dashboard y Robux balance
 * ======================================================
 * Rutinas:
 * - Polling de presence.roblox.com cada 30s
 * - Robux balance periódicamente
 * - Cache LRU de 60s para todas las llamadas a presence.roblox.com
 */

import axios from 'axios';
import { Account } from '../../types/Account';
import { DatabaseManager } from '../storage/DatabaseManager';
import { CryptoService } from '../core/CryptoService';

// =============================================================================
// Tipos
// =============================================================================

interface RobloxPresenceRaw {
  userPresenceType: number;
  lastLocation?: string;
  placeId?: number;
  rootPlaceId?: number;
  gameId?: string;
  universeId?: number;
  lastOnline?: string;
  invis?: boolean;
  gameInstanceId?: string;
  userId?: number;
}

interface PresenceApiResponse {
  userPresences: RobloxPresenceRaw[];
}

export interface RobloxGameInfo {
  name: string;
  thumbnailUrl: string;
  universeId?: number;
  rootPlaceId?: number;
}

export interface PresenceData {
  accountId: string;
  status: 'online' | 'in-game' | 'offline';
  gameId?: string;
  gameName?: string;
  thumbnail?: string;
  timeInGame?: number;
  robuxBalance?: number;
  robuxPremium?: boolean;
  lastOnline?: Date;
}

export interface RobloxRobuxBalance {
  balance: number;
  premium: boolean;
  updatedAt: Date;
}

export interface RecentGame {
  name: string;
  thumbnailUrl: string;
  placeId?: number;
  universeId?: number;
}

interface PresenceCacheEntry {
  presence: PresenceData;
  robux: RobloxRobuxBalance;
  gameInfo?: RobloxGameInfo;
  timestamp: number;
}

interface AccountLite {
  id: string;
  roblox_user_id: string;
  encrypted_cookie?: string;
  last_used?: string;
  username?: string;
  display_name?: string;
  thumbnail?: string;
}

// =============================================================================
// Constantes
// =============================================================================

const PRESENCE_URL = 'https://presence.roblox.com/v1/presence/users';
const GAMES_URL = 'https://games.roblox.com/v1/games';
const ROBUX_BALANCE_URL = 'https://economy.roblox.com/v1/users/{userId}/currency';
const RECENT_GAMES_URL = 'https://games.roblox.com/v2/users/{userId}/games/recently-played';
const GAME_THUMBNAILS_BATCH_URL = 'https://thumbnails.roblox.com/v1/games/multiget';

const DEFAULT_TIMEOUT = 10_000;
const POLLING_INTERVAL_DEFAULT = 30_000;
const SECONDS = 1000;

// =============================================================================
// Cache LRU
// =============================================================================

class PresenceLRUCache {
  private cache = new Map<string, PresenceCacheEntry>();
  private readonly ttl: number;

  constructor(ttlMs = 60_000) {
    this.ttl = ttlMs;
  }

  get(accountId: string): PresenceCacheEntry | null {
    const entry = this.cache.get(accountId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(accountId);
      return null;
    }
    return entry;
  }

  set(accountId: string, presence: PresenceData, robux: RobloxRobuxBalance, gameInfo?: RobloxGameInfo): void {
    this.cache.set(accountId, {
      presence,
      robux,
      gameInfo,
      timestamp: Date.now(),
    });
  }

  invalidate(accountId: string): void {
    this.cache.delete(accountId);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

// =============================================================================
// Helpers
// =============================================================================

function mapPresenceType(type: number): 'online' | 'in-game' | 'offline' {
  switch (type) {
    case 1: return 'online';
    case 2: return 'in-game';
    case 3: return 'online'; // studio
    default: return 'offline';
  }
}

function formatTimeInGame(startDate?: Date): number | undefined {
  if (!startDate) return undefined;
  return Math.floor((Date.now() - startDate.getTime()) / SECONDS);
}

function formatDuration(totalSeconds: number | undefined): string {
  if (totalSeconds === undefined || totalSeconds <= 0) return '';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export { formatDuration };

// =============================================================================
// Servicio
// =============================================================================

export class PresenceService {
  private cache: PresenceLRUCache;
  private db: DatabaseManager;
  private crypto: CryptoService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private accountIds: string[] = [];
  private intervalMs: number = POLLING_INTERVAL_DEFAULT;
  private registeredListeners = new Set<(data: Record<string, PresenceData>) => void>();
  private isPolling = false;

  constructor(db: DatabaseManager, crypto: CryptoService) {
    this.db = db;
    this.crypto = crypto;
    this.cache = new PresenceLRUCache();
  }

  // ==========================================================================
  // getPresence
  // ==========================================================================

  async getPresence(accountIds: string[]): Promise<PresenceData[]> {
    if (!accountIds.length) return [];

    const allAccounts = this.db.getAllAccounts() as AccountLite[];
    const accounts = allAccounts.filter(acc => accountIds.includes(acc.id));
    if (!accounts.length) return [];

    const results: PresenceData[] = [];

    for (const account of accounts) {
      let data = this.getCachedPresence(account.id);
      if (!data) {
        data = await this.fetchPresenceForAccount(account);
      }
      results.push(data);
    }

    return results;
  }

  // ==========================================================================
  // startPolling / stopPolling
  // ==========================================================================

  startPolling(accountIds: string[], intervalMs: number = POLLING_INTERVAL_DEFAULT): void {
    this.stopPolling();
    this.accountIds = [...accountIds];
    this.intervalMs = intervalMs;

    console.log(`[PresenceService] Polling iniciado para ${accountIds.length} cuentas cada ${intervalMs}ms`);

    this.pollAccounts().catch(err => console.error('[PresenceService] Error en poll inicial:', err));
    this.pollingInterval = setInterval(() => {
      this.pollAccounts().catch(err => console.error('[PresenceService] Error en poll:', err));
    }, intervalMs);

    this.isPolling = true;
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('[PresenceService] Polling detenido');
  }

  isPollingActive(): boolean {
    return this.isPolling;
  }

  getPollingState(): { isPolling: boolean; accountCount: number; intervalMs: number } {
    return {
      isPolling: this.isPolling,
      accountCount: this.accountIds.length,
      intervalMs: this.intervalMs,
    };
  }

  // ==========================================================================
  // getRecentGames
  // ==========================================================================

  async getRecentGames(accountId: string): Promise<RecentGame[]> {
    const account = this.resolveAccount(accountId);
    if (!account) return [];

    const cookie = this.resolveCookie(account);
    if (!cookie) return [];

    try {
      const res = await axios.get<{
        data: Array<{
          name?: string;
          imageUrl?: string;
          thumbnailUrl?: string;
          placeId?: number;
          universeId?: number;
        }>;
      }>(RECENT_GAMES_URL.replace('{userId}', account.roblox_user_id.toString()), {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        timeout: DEFAULT_TIMEOUT,
      });

      return (res.data.data || []).slice(0, 5).map(g => ({
        name: g.name || 'Desconocido',
        thumbnailUrl: g.imageUrl || g.thumbnailUrl || '',
        placeId: g.placeId,
        universeId: g.universeId,
      }));
    } catch (error) {
      console.error(`[PresenceService] Error obteniendo juegos recientes para cuenta ${accountId}:`, error);
      return [];
    }
  }

  // ==========================================================================
  // getRobuxBalance
  // ==========================================================================

  async getRobuxBalance(accountId: string): Promise<RobloxRobuxBalance> {
    const account = this.resolveAccount(accountId);
    if (!account) {
      return { balance: 0, premium: false, updatedAt: new Date() };
    }

    const cookie = this.resolveCookie(account);
    if (!cookie) {
      return { balance: 0, premium: false, updatedAt: new Date() };
    }

    try {
      const res = await axios.get<{ robux: number; premium: boolean }>(
        ROBUX_BALANCE_URL.replace('{userId}', account.roblox_user_id.toString()),
        {
          headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
          timeout: DEFAULT_TIMEOUT,
        }
      );
      return {
        balance: res.data.robux,
        premium: res.data.premium,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`[PresenceService] Error obteniendo balance de Robux para cuenta ${accountId}:`, error);
      return { balance: 0, premium: false, updatedAt: new Date() };
    }
  }

  // ==========================================================================
  // getRobuxBulk — balance de Robux para múltiples cuentas
  // ==========================================================================

  async getRobuxBulk(accountIds: string[]): Promise<Record<string, RobloxRobuxBalance>> {
    const result: Record<string, RobloxRobuxBalance> = {};
    await Promise.all(
      accountIds.map(async (id) => {
        try {
          result[id] = await this.getRobuxBalance(id);
        } catch {
          result[id] = { balance: 0, premium: false, updatedAt: new Date() };
        }
      })
    );
    return result;
  }

  // ==========================================================================
  // Event listeners
  // ==========================================================================

  onPresenceUpdate(callback: (data: Record<string, PresenceData>) => void): void {
    this.registeredListeners.add(callback);
  }

  offPresenceUpdate(callback: (data: Record<string, PresenceData>) => void): void {
    this.registeredListeners.delete(callback);
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  cleanup(): void {
    this.stopPolling();
    this.cache.invalidateAll();
    this.registeredListeners.clear();
  }

  // ==========================================================================
  // Privados
  // ==========================================================================

  private resolveAccount(accountId: string): AccountLite | null {
    const allAccounts = this.db.getAllAccounts() as AccountLite[];
    return allAccounts.find(acc => acc.id === accountId) || null;
  }

  private resolveCookie(account: AccountLite): string | null {
    if (!account.encrypted_cookie) return null;
    try {
      return this.crypto.decrypt(account.encrypted_cookie);
    } catch {
      return null;
    }
  }

  private getCachedPresence(accountId: string): PresenceData | null {
    const cached = this.cache.get(accountId);
    return cached ? cached.presence : null;
  }

  private async fetchPresenceForAccount(account: AccountLite): Promise<PresenceData> {
    const cookie = this.resolveCookie(account);
    if (!cookie) {
      return this.buildPresenceData(account.id, 'offline', undefined, undefined, undefined, undefined);
    }

    let robux: RobloxRobuxBalance | undefined;
    let gameInfo: RobloxGameInfo | undefined;

    try {
      // Obtener presencia de Roblox
      const presenceData = await this.fetchPresence(account, cookie);

      // Obtener balance de Robux en paralelo
      try {
        robux = await this.fetchRobuxBalance(account, cookie);
      } catch (e) {
        console.warn(`[PresenceService] Error obteniendo Robux para cuenta ${account.id}:`, e);
      }

      // Obtener info del juego si está en juego
      if (presenceData.status === 'in-game' && presenceData.gameId) {
        try {
          gameInfo = await this.fetchGameInfo(account, presenceData.gameId, cookie);
        } catch (e) {
          console.warn(`[PresenceService] Error obteniendo info del juego para cuenta ${account.id}:`, e);
        }
      }

      const data = this.buildPresenceData(
        account.id,
        presenceData.status,
        presenceData.gameId,
        gameInfo,
        robux,
        presenceData.lastOnline
      );

      this.cache.set(account.id, data, robux || { balance: 0, premium: false, updatedAt: new Date() }, gameInfo);
      return data;
    } catch (error) {
      console.error(`[PresenceService] Error obteniendo presencia para cuenta ${account.id}:`, error);
      return this.buildPresenceData(account.id, 'offline', undefined, undefined, undefined, undefined);
    }
  }

  private async fetchPresence(account: AccountLite, cookie: string): Promise<{ status: 'online' | 'in-game' | 'offline'; gameId?: string; lastOnline?: Date }> {
    const res = await axios.post<PresenceApiResponse>(
      PRESENCE_URL,
      { userIds: [Number(account.roblox_user_id)] },
      {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        timeout: DEFAULT_TIMEOUT,
      }
    );

    const presence = res.data.userPresences[0];
    if (!presence) {
      return { status: 'offline' };
    }

    const status = mapPresenceType(presence.userPresenceType);
    const gameId = status === 'in-game' && presence.gameId ? presence.gameId : undefined;
    const lastOnline = presence.lastOnline ? new Date(presence.lastOnline) : undefined;

    return { status, gameId, lastOnline };
  }

  private async fetchRobuxBalance(account: AccountLite, cookie: string): Promise<RobloxRobuxBalance> {
    const res = await axios.get<{ robux: number; premium: boolean }>(
      ROBUX_BALANCE_URL.replace('{userId}', account.roblox_user_id.toString()),
      {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        timeout: DEFAULT_TIMEOUT,
      }
    );
    return {
      balance: res.data.robux,
      premium: res.data.premium,
      updatedAt: new Date(),
    };
  }

  private async fetchGameInfo(account: AccountLite, gameId: string, cookie: string): Promise<RobloxGameInfo | undefined> {
    const universeId = this.extractUniverseId(gameId, account);
    if (!universeId) return undefined;

    const res = await axios.get<{
      data: Array<{ name: string; thumbnailUrl: string; universeId?: number; rootPlaceId?: number }>;
    }>(`${GAMES_URL}?universeIds=${universeId}`, {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
      timeout: DEFAULT_TIMEOUT,
    });

    const game = res.data.data[0];
    if (!game) return undefined;

    return {
      name: game.name,
      thumbnailUrl: game.thumbnailUrl,
      universeId: game.universeId,
      rootPlaceId: game.rootPlaceId,
    };
  }

  private extractUniverseId(gameId: string, account: AccountLite): string | undefined {
    if (gameId && gameId.includes('universeId=')) {
      const match = gameId.match(/universeId=(\d+)/);
      if (match && match[1]) return match[1];
    }
    // Fallback: intentar extraer del userId si es necesario
    if (account.roblox_user_id) {
      return undefined; // No se puede inferir sin más contexto
    }
    return undefined;
  }

  private buildPresenceData(
    accountId: string,
    status: 'online' | 'in-game' | 'offline',
    gameId?: string,
    gameInfo?: RobloxGameInfo,
    robux?: RobloxRobuxBalance,
    lastOnline?: Date
  ): PresenceData {
    return {
      accountId,
      status,
      gameId,
      gameName: gameInfo?.name,
      thumbnail: gameInfo?.thumbnailUrl,
      timeInGame: status === 'in-game' ? formatTimeInGame(lastOnline || undefined) : undefined,
      robuxBalance: robux?.balance,
      robuxPremium: robux?.premium,
      lastOnline,
    };
  }

  private async pollAccounts(): Promise<void> {
    if (!this.accountIds.length) return;

    try {
      const data = await this.getPresence(this.accountIds);
      const record: Record<string, PresenceData> = {};
      for (const item of data) {
        record[item.accountId] = item;
      }
      this.registeredListeners.forEach(cb => cb(record));
    } catch (error) {
      console.error('[PresenceService] Error en pollAccounts:', error);
    }
  }
}

export default PresenceService;
