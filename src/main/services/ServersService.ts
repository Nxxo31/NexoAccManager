import axios from 'axios';
import { AccountManager } from '../core/AccountManager';

/**
 * =======================================================
 * ServersService — API para obtener servidores y usuarios en un place
 * =======================================================
 * Cache LRU de 60s para llamadas a games.roblox.com
 * Las cookies se pasan desde los handlers IPC con la cuenta seleccionada
 */
export interface RobloxServer {
  jobId: string; // Roblox lo llama "id" pero es el jobId
  id: string; // alias de jobId para compatibilidad
  name: string | null;
  playerCount: number;
  maxPlayers: number;
  playing: number;
  fps: number;
  ping: number;
  region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN';
  accessCode: string | null;
}

export interface RobloxServerUser {
  userId: number;
  username: string;
  displayName: string | null;
  isOnline: boolean;
  isFriend: boolean;
  isFollower: boolean;
  isFollowing: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;

  constructor(ttlMs = 60_000) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// =======================================================
// SERVERS SERVICE
// =======================================================
export class ServersService {
  private baseURL: string;
  private cache: LRUCache<any>;
  private cookieCache: LRUCache<any>;

  constructor() {
    this.baseURL = 'https://games.roblox.com';
    this.cache = new LRUCache(60_000);
    this.cookieCache = new LRUCache(60_000);
  }

  private getCookieHeader(cookie: string): { Cookie: string } {
    return { Cookie: `.ROBLOSECURITY=${cookie.trim()}` };
  }

  private async getCsrfToken(cookie: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://auth.roblox.com/v2/logout',
        {},
        { headers: this.getCookieHeader(cookie), validateStatus: () => true }
      );
      return response.headers['x-csrf-token'] || '';
    } catch {
      return '';
    }
  }

  private getPostHeaders(cookie: string, csrfToken: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://www.roblox.com/',
      ...this.getCookieHeader(cookie),
    };
  }

  // =======================================================
  // OBTENER LISTA DE SERVIDORES DE UN PLACE
  // =======================================================
  async getGameServers(placeId: string, cookie: string, serverType: 'Public' | 'Private' = 'Public'): Promise<RobloxServer[]> {
    const cacheKey = `servers_${placeId}_${serverType}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseURL}/v1/games/${placeId}/servers/${serverType === 'Public' ? '0' : '1'}`,
        {
          headers: this.getCookieHeader(cookie),
          params: {
            sortOrder: 'Asc', // Ascending by player count? Actually Asc is by player count? We'll use default.
            limit: 100, // Max per page
          },
        }
      );

      const data = response.data?.data || [];
      const servers: RobloxServer[] = data.map((server: any) => ({
        jobId: server.id,
        id: server.id,
        name: server.name || null,
        playerCount: server.playing || 0,
        maxPlayers: server.maxPlayers || 0,
        playing: server.playing || 0,
        fps: server.fps || 0,
        ping: server.ping || 0,
        region: this.mapRegion(server.region),
        accessCode: server.accessCode || null,
      }));

      this.cache.set(cacheKey, servers);
      return servers;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie invalida o expirada');
      }
      throw new Error(`Error obteniendo servidores: ${error.message || error}`);
    }
  }

  // =======================================================
  // OBTENER USUARIOS EN UN SERVIDOR ESPECIFICO
  // =======================================================
  async getServerUsers(serverId: string, cookie: string): Promise<RobloxServerUser[]> {
    // Note: There is no direct public API to get users in a server.
    // We can use the presence API to get users playing a place, but not specific server.
    // For now, we return empty array and note that this feature may require alternative methods.
    // However, we can get friends who are in the game via presence.
    return [];
  }

  // =======================================================
  // MAPEAR REGION DE ROBLOX A NUESTRO ENUM
  // =======================================================
  private mapRegion(region: string | null): 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN' {
    if (!region) return 'UNKNOWN';
    const lower = region.toLowerCase();
    if (includes(['us-east', 'us-west', 'us-central'], lower)) return 'NA';
    if (includes(['eu-west', 'eu-central'], lower)) return 'EU';
    if (includes(['asia', 'asia-east', 'asia-southeast', 'asia-northeast'], lower)) return 'ASIA';
    if (includes(['sa', 'sa-east', 'sa-south', 'sa-west', 'sa-north'], lower)) return 'SA';
    return 'UNKNOWN';
  }

  // =======================================================
  // CACHE CONTROL
  // =======================================================
  invalidateCache(key: string): void {
    this.cache.invalidate(key);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Helper function to check if any substring matches
function includes(arr: string[], str: string): boolean {
  return arr.some((s) => str.includes(s));
}

export default ServersService;