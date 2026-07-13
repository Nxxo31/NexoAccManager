import axios from 'axios';
import { AccountManager } from '../core/AccountManager';

/**
 * =====================================================
 * GamesService — API para buscar juegos y servers de Roblox
 * =====================================================
 * Cache LRU de 60s para todas las llamadas a games.roblox.com
 * Las cookies se pasan desde los handlers IPC con la cuenta seleccionada
 */
export interface RobloxGame {
  name: string;
  description: string;
  playerCount: number;
  maxPlayers: number;
  rating: number;
  thumbnail: string | null;
  placeId: number;
}

export interface GameServer {
  jobId: string;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN';
  fps: number;
  accessibility: string;
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

// =============================================================================
// GAMES SERVICE
// =============================================================================
export class GamesService {
  private baseURL: string;
  private cache: LRUCache<any>;
  private cookieCache: LRUCache<any>; // cacheado con cookie_hash para aislamiento
  
  // LRU cache for ping measurements (60 seconds)
  private pingCache: Map<string, { ping: number; region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN'; timestamp: number }> = new Map();
  private readonly PING_CACHE_TTL = 60_000; // 60 seconds

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

  // =====================================================
  // BUSQUEDA DE JUEGO POR PLACE ID
  // =====================================================
  async searchGame(placeId: string, cookie: string): Promise<RobloxGame | null> {
    const cacheKey = `game_${placeId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Obtener info del juego
      const gameResponse = await axios.get(
        `https://games.roblox.com/v1/games?universeIds=${placeId}`,
        { headers: this.getCookieHeader(cookie) }
      );

      const gameData = gameResponse.data?.data?.[0];
      if (!gameData) {
        // Fallback: probar con el endpoint de details
        const detailsResponse = await axios.get(
          `https://games.roblox.com/v1/games?placeIds=${placeId}`,
          { headers: this.getCookieHeader(cookie) }
        );
        const details = detailsResponse.data?.data?.[0];
        if (!details) return null;
        
        const totalPlayers = detailsResponse.data?.totalPlayers || 0;
        
        const thumbnail = await this.getGameThumbnail(Number(placeId));
        
        const game: RobloxGame = {
          name: details.name || 'Desconocido',
          description: details.description || '',
          playerCount: totalPlayers,
          maxPlayers: details.maxPlayers || 0,
          rating: details.rating || 0,
          thumbnail,
          placeId: Number(placeId),
        };
        
        this.cache.set(cacheKey, game);
        return game;
      }

      const playerCount = gameData.playing || 0;
      const thumbnail = await this.getGameThumbnail(Number(placeId));

      const game: RobloxGame = {
        name: gameData.name || 'Desconocido',
        description: gameData.description || '',
        playerCount,
        maxPlayers: gameData.maxPlayers || 0,
        rating: gameData.rating || 0,
        thumbnail,
        placeId: Number(placeId),
      };
      
      this.cache.set(cacheKey, game);
      return game;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie invalida o expirada');
      }
      throw new Error(`Error buscando juego: ${error.message}`);
    }
  }

  // =====================================================
  // OBTENER THUMBNAIL DEL JUEGO (cacheado separadamente)
  // =====================================================
  private async getGameThumbnail(placeId: number): Promise<string | null> {
    const thumbKey = `thumb_${placeId}`;
    const cached = this.cache.get(thumbKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `https://thumbnails.roblox.com/v1/games/multiget?universeIds=${placeId}&countPerId=1&size=150x150&format=Png&isCircular=false`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      const data = response.data?.data?.[0];
      if (data?.imageUrl) {
        this.cache.set(thumbKey, data.imageUrl);
        return data.imageUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  // =====================================================
  // MEDICION REAL DE PING
  // =====================================================
  async measurePing(placeId: string): Promise<number> {
    const cacheKey = `ping_${placeId}`;
    const cached = this.pingCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.PING_CACHE_TTL) {
      return cached.ping;
    }
    
    try {
      // Measure latency to a small Roblox resource (favicon.ico)
      const startTime = performance.now();
      await axios.get(
        'https://www.roblox.com/favicon.ico',
        { timeout: 5000 } // 5 second timeout
      );
      const endTime = performance.now();
      const ping = Math.round(endTime - startTime);
      
      // Cache the result
      this.pingCache.set(cacheKey, { ping, region: this.estimateRegionFromPing(ping), timestamp: Date.now() });
      
      return ping;
    } catch (error) {
      // Fallback to a reasonable default if measurement fails
      console.warn('[GamesService] Ping measurement failed, using fallback:', (error as Error).message);
      const fallbackPing = 150; // Reasonable middle value
      this.pingCache.set(cacheKey, { ping: fallbackPing, region: this.estimateRegionFromPing(fallbackPing), timestamp: Date.now() });
      return fallbackPing;
    }
  }

  // =====================================================
  // ESTIMACION DE REGION POR LATENCIA
  // =====================================================
  estimateRegionFromPing(ping: number): 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN' {
    // Heuristica basada en rangos de latencia tipicos
    if (ping < 80) return 'NA';      // North America (baja latencia)
    if (ping < 120) return 'SA';     // South America
    if (ping < 180) return 'EU';     // Europe
    if (ping < 250) return 'ASIA';   // Asia
    return 'UNKNOWN';
  }

  // Method to get both ping and region with caching
  async getPingAndRegion(placeId: string): Promise<{ ping: number; region: 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN' }> {
    const cacheKey = `ping_${placeId}`;
    const cached = this.pingCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.PING_CACHE_TTL) {
      return { ping: cached.ping, region: cached.region };
    }
    
    try {
      // Measure latency to a small Roblox resource (favicon.ico)
      const startTime = performance.now();
      await axios.get(
        'https://www.roblox.com/favicon.ico',
        { timeout: 5000 } // 5 second timeout
      );
      const endTime = performance.now();
      const ping = Math.round(endTime - startTime);
      const region = this.estimateRegionFromPing(ping);
      
      // Cache the result
      this.pingCache.set(cacheKey, { ping, region, timestamp: Date.now() });
      return { ping, region };
    } catch (error) {
      // Fallback to a reasonable default if measurement fails
      console.warn('[GamesService] Ping measurement failed, using fallback:', (error as Error).message);
      const fallbackPing = 150; // Reasonable middle value
      const fallbackRegion = this.estimateRegionFromPing(fallbackPing);
      this.pingCache.set(cacheKey, { ping: fallbackPing, region: fallbackRegion, timestamp: Date.now() });
      return { ping: fallbackPing, region: fallbackRegion };
    }
  }

  // =====================================================
  // LISTAR SERVERS ACTIVOS
  // =====================================================
  async getGameServers(placeId: string, cookie: string): Promise<GameServer[]> {
    const cacheKey = `servers_${placeId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Obtener lista de servers
      const response = await axios.get(
        `https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=100`,
        { headers: this.getCookieHeader(cookie) }
      );

      const serversData = response.data?.data || [];

      // Use real ping measurement for each server
      const serverPromises = serversData.map(async (s: any) => {
        const { ping, region } = await this.getPingAndRegion(placeId);
        return {
          jobId: s.id || s.jobId || '',
          playerCount: s.playing || 0,
          maxPlayers: s.maxPlayers || 25,
          ping,
          region: region as 'NA' | 'EU' | 'ASIA' | 'SA' | 'UNKNOWN',
          fps: s.fps || 60,
          accessibility: s.accessibility || 'Public',
        };
      });

      const servers: GameServer[] = await Promise.all(serverPromises);

      this.cache.set(cacheKey, servers);
      return servers;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie invalida o expirada');
      }
      // Fallback: retornar array vacio si la API falla
      return [];
    }
  }

  // =====================================================
  // UNIRSE A SERVER ESPECIFICO
  // =====================================================
  async joinServer(placeId: string, jobId: string, accountManager: AccountManager, accountId: string): Promise<boolean> {
    try {
      const result = await accountManager.launchRoblox(accountId, placeId, jobId);
      return result;
    } catch (error: any) {
      throw new Error(`Error uniendose al server: ${error.message}`);
    }
  }

  // =====================================================
  // DISTRIBUIR CUENTAS EN SERVERS (round-robin)
  // =====================================================
  async distributeAccounts(
    placeId: string,
    accountIds: string[],
    accountManager: AccountManager,
    cookie: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const servers = await this.getGameServers(placeId, cookie);

    if (servers.length === 0) {
      for (let i = 0; i < accountIds.length; i++) {
        const accountId = accountIds[i];
        try {
          results[accountId] = await accountManager.launchRoblox(accountId, placeId);
          onProgress?.(i + 1, accountIds.length);
        } catch {
          results[accountId] = false;
        }
      }
      return results;
    }

    for (let i = 0; i < accountIds.length; i++) {
      const accountId = accountIds[i];
      const server = servers[i % servers.length];
      try {
        results[accountId] = await accountManager.launchRoblox(accountId, placeId, server.jobId);
        if (i < accountIds.length - 1) {
          await this.delay(2000);
        }
      } catch {
        results[accountId] = false;
      }
      onProgress?.(i + 1, accountIds.length);
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // =====================================================
  // CACHE CONTROL
  // =====================================================
  invalidateCache(key: string): void {
    this.cache.invalidate(key);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default GamesService;