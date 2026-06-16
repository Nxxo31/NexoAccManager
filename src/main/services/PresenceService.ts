/**
 * =====================================================
 * PresenceService — API para Presence Dashboard y Robux balance
 * =====================================================
 * Rutinas:
 * - Polling de presence.roblox.com cada 30s
 * - Robux balance periódicamente
 * - Cache LRU de 60s para todas las llamadas a presence.roblox.com
 * - Reset de presencia cuando una cuenta se lanza
 */

import axios from 'axios';
import { Account } from '../../types/Account';
import { DatabaseManager } from '../storage/DatabaseManager';

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

export interface RobloxRobuxBalance {
  balance: number;
  premium: boolean;
  updatedAt: Date;
}

interface PresenceCacheEntry {
  presence: RobloxPresence;
  robux: RobloxRobuxBalance;
  timestamp: number;
}

// =============================================================================
// Constantes
// =============================================================================

const PRESENCE_URL = 'https://presence.roblox.com/v1/presence/users';
const ROBUX_BALANCE_URL = 'https://economy.roblox.com/v1/user/currency';

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

  set(accountId: string, presence: RobloxPresence, robux: RobloxRobuxBalance): void {
    this.cache.set(accountId, {
      presence,
      robux,
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
  private pollingInterval: NodeJS.Timeout | null = null;
  private registeredListeners = new Set<(presence: Record<string, PresenceCacheEntry>) => void>();

  constructor(db: DatabaseManager) {
    this.db = db;
    this.cache = new PresenceLRUCache();
    // Comenzar polling si hay al menos una cuenta guardada
    this.pollingInterval = setInterval(() => this.pollAll(), 30_000);
    // Poll inmediato al iniciar
    this.pollAll().catch(console.error);
  }

  cleanup(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  onPresenceUpdate(callback: (presence: Record<string, PresenceCacheEntry>) => void): void {
    this.registeredListeners.add(callback);
  }

  offPresenceUpdate(callback: (presence: Record<string, PresenceCacheEntry>) => void): void {
    this.registeredListeners.delete(callback);
  }

  resetAccountPresence(accountId: string): void {
    this.cache.invalidate(accountId);
    // Forzar poll inmediato
    setTimeout(() => this.pollSingleAccount(accountId).catch(console.error), 500);
  }

  private async pollAll(): Promise<void> {
    try {
      const dbAccounts = await this.db.getAllAccounts();
      if (!dbAccounts.length) return;

      const userIds = dbAccounts
        .map((acc) => acc.robloxUserId)
        .filter((uid): uid is number => uid !== undefined);

      if (!userIds.length) return;

      const presenceRes = await axios.post<{ userPresences: RobloxPresence[] }>(
        PRESENCE_URL,
        { userIds },
        { timeout: 10_000 }
      );

      const robuxPromises = userIds.map(async (userId) => {
        try {
          const res = await axios.get(ROBUX_BALANCE_URL, {
            params: { userId },
            timeout: 10_000,
          });
          return { balance: res.data.robux, premium: false, updatedAt: new Date() };
        } catch {
          return { balance: 0, premium: false, updatedAt: new Date() };
        }
      });
      const robuxBalances = await Promise.allSettled(robuxPromises);

      const newCacheRecord: Record<string, PresenceCacheEntry> = {};
      const presenceMap = new Map<number, RobloxPresence>();
      for (const p of presenceRes.data.userPresences) {
        if (p.userPresenceType !== 0 && p.rootPlaceId) {
          presenceMap.set(p.rootPlaceId, p);
        }
      }

      for (const acc of dbAccounts) {
        if (!acc.robloxUserId) {
          this.cache.invalidate(acc.id);
          continue;
        }
        const presence: RobloxPresence = presenceMap.get(acc.robloxUserId) || {
          userPresenceType: 0,
          lastOnline: acc.lastUsed,
        };
        
        let robux: RobloxRobuxBalance = { balance: 0, premium: false, updatedAt: new Date() };
        const robuxResult = robuxBalances.find(result =>
          result.status === 'fulfilled' && 
          (result as PromiseFulfilledResult<any>).value.updatedFor === acc.robloxUserId
        );
        if (robuxResult?.status === 'fulfilled') {
          robux = (robuxResult as PromiseFulfilledResult<RobloxRobuxBalance>).value;
        }

        this.cache.set(acc.id, presence, robux);
        newCacheRecord[acc.id] = { presence, robux, timestamp: Date.now() };
      }

      this.registeredListeners.forEach(cb => cb(newCacheRecord));

    } catch (error) {
      console.error('[PresenceService] Poll error:', error);
    }
  }

  private async pollSingleAccount(accountId: string): Promise<void> {
    const account = await this.db.getAccount(accountId);
    if (!account || account.robloxUserId === undefined) {
      this.cache.invalidate(accountId);
      return;
    }

    try {
      // Presence
      const presenceRes = await axios.post(`${PRESENCE_URL}`, {
        userIds: [account.robloxUserId]
      }, { timeout: 10_000 });
      const presence: RobloxPresence = presenceRes.data.userPresences[0] || {
        userPresenceType: 0,
        lastOnline: account.lastUsed,
      };
      
      // Robux
      const robuxRes = await axios.get(`${ROBUX_BALANCE_URL}?userId=${account.robloxUserId}`, {
        timeout: 10_000
      });
      const robux: RobloxRobuxBalance = {
        balance: robuxRes.data.robux,
        premium: false,
        updatedAt: new Date()
      };
      
      this.cache.set(accountId, presence, robux);
      const update = { [accountId]: { presence, robux, timestamp: Date.now() } };
      this.registeredListeners.forEach(cb => cb(update));

    } catch (error) {
      console.error(`[PresenceService] Error fetching presence for account ${accountId}:`, error);
      this.cache.invalidate(accountId);
    }
  }

  getPresence(): Record<string, RobloxPresence> {
    const accounts = this.db.getAllSync();
    const result: Record<string, RobloxPresence> = {};

    accounts.forEach(acc => {
      const cached = this.cache.get(acc.id);
      result[acc.id] = cached ? cached.presence : {
        userPresenceType: 0,
        lastOnline: acc.lastUsed,
      };
    });
    
    return result;
  }

  getRobux(): Record<string, RobloxRobuxBalance> {
    const accounts = this.db.getAllSync();
    const result: Record<string, RobloxRobuxBalance> = {};

    accounts.forEach(acc => {
      const cached = this.cache.get(acc.id);
      result[acc.id] = cached ? cached.robux : {
        balance: 0,
        premium: false,
        updatedAt: new Date(acc.lastUsed),
      };
    });
    
    return result;
  }
}
