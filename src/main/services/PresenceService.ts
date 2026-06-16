/**
 * ======================================================
 * PresenceService — API para Presence Dashboard y Robux balance
 * ======================================================
 * Rutinas:
 * - Polling de presence.roblox.com cada 30s
 * - Robux balance periódicamente
 * - Cache LRU de 60s para todas las llamadas a presence.roblox.com
 * - Reset de presencia cuando una cuenta se lanza
 */

import axios from 'axios';
import { Account } from '../../types/Account';
import { DatabaseManager } from '../storage/DatabaseManager';
import { CryptoService } from '../core/CryptoService';

// =============================================================================
// Tipos
// =============================================================================

export interface RobloxPresence {
  userPresenceType: 0 | 1 | 2 | 3; // 0=offline, 1=online-web, 2=in-game, 3=studio
  universeId?: number;
  rootPlaceId?: number;
  gameId?: string;
  placeId?: number;
  universeName?: string;
  lastLocation?: string;
  lastOnline: Date;
}

export interface RobloxGameInfo {
  name: string;
  thumbnailUrl: string;
}

export interface PresenceData {
  accountId: string;
  status: 'online' | 'in-game' | 'offline';
  gameId?: string;
  gameName?: string;
  thumbnail?: string;
  timeInGame?: number; // in seconds
}

export interface RobloxRobuxBalance {
  balance: number;
  premium: boolean;
  updatedAt: Date;
}

interface PresenceCacheEntry {
  presence: RobloxPresence;
  robux: RobloxRobuxBalance;
  gameInfo?: RobloxGameInfo;
  timestamp: number;
}

// =============================================================================
// Constantes
// =============================================================================

const PRESENCE_URL = 'https://presence.roblox.com/v1/presence/users';
const GAMES_URL = 'https://games.roblox.com/v2/games';
const ROBUX_BALANCE_URL = 'https://economy.roblox.com/v1/users/{userId}/currency';
const RECENT_GAMES_URL = 'https://games.roblox.com/v2/users/{userId}/games/recently-played';

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

  set(accountId: string, presence: RobloxPresence, robux: RobloxRobuxBalance, gameInfo?: RobloxGameInfo): void {
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
}

// =============================================================================
// Servicio
// =============================================================================

export class PresenceService {
  private cache: PresenceLRUCache;
  private db: DatabaseManager;
  private crypto: CryptoService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private accountIds: string[] = [];
  private intervalMs: number = 30_000;
  private registeredListeners = new Set<(presence: Record<string, PresenceData>) => void>();

  constructor(db: DatabaseManager, crypto: CryptoService) {
    this.db = db;
    this.crypto = crypto;
    this.cache = new PresenceLRUCache();
  }

  /**
   * Obtiene la presencia de múltiples cuentas mediante sus cookies
   * @param accountIds Lista de IDs de cuentas (UUID local)
   * @returns Promesa que resuelve a un array de PresenceData
   */
  async getPresence(accountIds: string[]): Promise<PresenceData[]> {
    if (!accountIds.length) return [];

    // Obtener todas las cuentas y filtrar por los IDs solicitados
    const allAccounts = this.db.getAllAccounts();
    const accounts = allAccounts.filter((acc: any) => accountIds.includes(acc.id));
    if (!accounts.length) return [];

    // Preparar las solicitudes de presencia y robux
    const presencePromises = accounts.map(async (account) => {
      try {
        if (!account.encrypted_cookie) {
          throw new Error('Cuenta sin cookie cifrada');
        }
        const cookie = this.crypto.decrypt(account.encrypted_cookie);
        // Obtener presencia
        const presenceRes = await axios.post<{ userPresences: RobloxPresence[] }>(
          PRESENCE_URL,
          { userIds: [account.roblox_user_id] },
          {
            headers: {
              Cookie: `.ROBLOSECURITY=${cookie}`,
            },
            timeout: 10_000,
          }
        );
        const presence = presenceRes.data.userPresences[0] || {
          userPresenceType: 0,
          lastOnline: new Date(account.last_used),
        };

        // Obtener Robux
        const robuxRes = await axios.get<{ robux: number; premium: boolean }>(
          ROBUX_BALANCE_URL.replace('{userId}', account.roblox_user_id.toString()),
          {
            headers: {
              Cookie: `.ROBLOSECURITY=${cookie}`,
            },
            timeout: 10_000,
          }
        );
        const robux: RobloxRobuxBalance = {
          balance: robuxRes.data.robux,
          premium: robuxRes.data.premium,
          updatedAt: new Date(),
        };

        // Obtener información del juego si está en juego
        let gameInfo: RobloxGameInfo | undefined;
        if (presence.userPresenceType === 2 && presence.universeId) {
          try {
            const gamesRes = await axios.get<{ data: Array<{ name: string; thumbnailUrl: string }> }>(
              `${GAMES_URL}?universeIds=${presence.universeId}`,
              {
                headers: {
                  Cookie: `.ROBLOSECURITY=${cookie}`,
                },
                timeout: 10_000,
              }
            );
            if (gamesRes.data.data.length > 0) {
              gameInfo = {
                name: gamesRes.data.data[0].name,
                thumbnailUrl: gamesRes.data.data[0].thumbnailUrl,
              };
            }
          } catch (e) {
            console.warn(`[PresenceService] No se pudo obtener info del juego para cuenta ${account.id}:`, e);
          }
        }

        // Calcular tiempo en juego (aproximado)
        let timeInGame: number | undefined;
        if (presence.userPresenceType === 2) {
          // No tenemos un campo directo para el tiempo en juego, así que lo dejamos undefined
          // En el futuro podríamos usar lastLocation o intentar calcularlo desde lastOnline?
          timeInGame = undefined;
        }

        // Mapear estado
        let status: 'online' | 'in-game' | 'offline' = 'offline';
        if (presence.userPresenceType === 1) status = 'online';
        else if (presence.userPresenceType === 2) status = 'in-game';
        else if (presence.userPresenceType === 3) status = 'online'; // studio considerado online

        return {
          accountId: account.id,
          status,
          gameId: presence.gameId,
          gameName: gameInfo?.name,
          thumbnail: gameInfo?.thumbnailUrl,
          timeInGame,
        };
      } catch (error) {
        console.error(`[PresenceService] Error obteniendo presencia para cuenta ${account.id}:`, error);
        // En caso de error, devolvemos estado offline
        return {
          accountId: account.id,
          status: 'offline',
        };
      }
    });

    return Promise.all(presencePromises);
  }

  /**
   * Inicia el polling de presencia para las cuentas especificadas
   * @param accountIds Lista de IDs de cuentas (UUID local)
   * @param intervalMs Intervalo en milisegundos (por defecto 30000)
   */
  startPolling(accountIds: string[], intervalMs: number = 30_000): void {
    this.accountIds = accountIds;
    this.intervalMs = intervalMs;

    // Limpiar cualquier intervalo existente
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Hacer un poll inicial
    this.pollAccounts().catch(console.error);

    // Establecer el intervalo
    this.pollingInterval = setInterval(() => this.pollAccounts().catch(console.error), intervalMs);
  }

  /**
   * Detiene el polling de presencia
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Obtiene los juegos recientes de una cuenta
   * @param accountId ID de la cuenta (UUID local)
   * @returns Promesa que resuelve a un array de juegos recientes (nombre y thumbnail)
   */
  async getRecentGames(accountId: string): Promise<Array<{ name: string; thumbnailUrl: string }>> {
    const account = this.db.getAccount(accountId);
    if (!account) return [];

    try {
      if (!account.encrypted_cookie) {
        throw new Error('Cuenta sin cookie cifrada');
      }
      const cookie = this.crypto.decrypt(account.encrypted_cookie);
      const res = await axios.get<{ data: Array<{ name: string; thumbnailUrl: string }> }>(
        RECENT_GAMES_URL.replace('{userId}', account.roblox_user_id.toString()),
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`,
          },
          timeout: 10_000,
        }
      );
      return res.data.data.slice(0, 5); // últimos 5
    } catch (error) {
      console.error(`[PresenceService] Error obteniendo juegos recientes para cuenta ${accountId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene el balance de Robux de una cuenta
   * @param accountId ID de la cuenta (UUID local)
   * @returns Promesa que resuelve a el balance de Robux
   */
  async getRobuxBalance(accountId: string): Promise<RobloxRobuxBalance> {
    const account = this.db.getAccount(accountId);
    if (!account) {
      return { balance: 0, premium: false, updatedAt: new Date() };
    }

    try {
      if (!account.encrypted_cookie) {
        throw new Error('Cuenta sin cookie cifrada');
      }
      const cookie = this.crypto.decrypt(account.encrypted_cookie);
      const res = await axios.get<{ robux: number; premium: boolean }>(
        ROBUX_BALANCE_URL.replace('{userId}', account.roblox_user_id.toString()),
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${cookie}`,
          },
          timeout: 10_000,
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

  /**
   * Encarga de hacer el polling de todas las cuentas y notificar a los listeners
   */
  private async pollAccounts(): Promise<void> {
    if (!this.accountIds.length) return;

    try {
      const presenceData = await this.getPresence(this.accountIds);
      // Convertir a registro para compatibilidad con listeners existentes
      const record: Record<string, PresenceData> = {};
      presenceData.forEach((data) => {
        record[data.accountId] = data;
      });
      this.registeredListeners.forEach((cb) => cb(record));
    } catch (error) {
      console.error('[PresenceService] Error en pollAccounts:', error);
    }
  }

  /**
   * Suscribe a actualizaciones de presencia
   * @param callback Función que se llama con el registro de presencia de todas las cuentas
   */
  onPresenceUpdate(callback: (presence: Record<string, PresenceData>) => void): void {
    this.registeredListeners.add(callback);
  }

  /**
   * Desuscribe de actualizaciones de presencia
   * @param callback Función previamente suscrita
   */
  offPresenceUpdate(callback: (presence: Record<string, PresenceData>) => void): void {
    this.registeredListeners.delete(callback);
  }

  /**
   * Limpia recursos (llamar al cerrar la aplicación)
   */
  cleanup(): void {
    this.stopPolling();
  }
}