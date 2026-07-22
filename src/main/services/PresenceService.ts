/**
 * PresenceService — Polling de presence.roblox.com + Robux balance
 * Cache LRU 60s, polling cada 30s, notifica a listeners registrados
 */
import axios from 'axios';
import { DatabaseManager } from '../storage/DatabaseManager';
import { CryptoService } from '../core/CryptoService';

// ─── Types ──────────────────────────────────────────────────────────────────

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

export interface RobloxGameInfo {
  name: string;
  thumbnailUrl: string;
  universeId?: number;
  rootPlaceId?: number;
}

interface AccountLite {
  id: string;
  roblox_user_id: string;
  encrypted_cookie?: string;
}

interface CacheEntry {
  presence: PresenceData;
  robux: RobloxRobuxBalance;
  gameInfo?: RobloxGameInfo;
  ts: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESENCE_URL = 'https://presence.roblox.com/v1/presence/users';
const GAMES_URL = 'https://games.roblox.com/v1/games';
const ROBUX_URL = 'https://economy.roblox.com/v1/users/{userId}/currency';
const RECENT_GAMES_URL = 'https://games.roblox.com/v2/users/{userId}/games/recently-played';
const TIMEOUT = 10_000;
const POLL_INTERVAL = 30_000;
const SECONDS = 1000;

function mapPresenceType(type: number): 'online' | 'in-game' | 'offline' {
  return type === 1 ? 'online' : type === 2 ? 'in-game' : type === 3 ? 'online' : 'offline';
}

export function formatDuration(totalSeconds: number | undefined): string {
  if (!totalSeconds || totalSeconds <= 0) return '';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── LRU Cache ──────────────────────────────────────────────────────────────

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttl: number;

  constructor(ttlMs = 60_000) { this.ttl = ttlMs; }

  get(id: string): CacheEntry | null {
    const e = this.cache.get(id);
    if (!e) return null;
    if (Date.now() - e.ts > this.ttl) { this.cache.delete(id); return null; }
    return e;
  }

  set(id: string, presence: PresenceData, robux: RobloxRobuxBalance, gameInfo?: RobloxGameInfo) {
    this.cache.set(id, { presence, robux, gameInfo, ts: Date.now() });
  }

  invalidateAll() { this.cache.clear(); }
}

// ─── PresenceService ─────────────────────────────────────────────────────────

export class PresenceService {
  private cache = new LRUCache();
  private pollingInterval: NodeJS.Timeout | null = null;
  private accountIds: string[] = [];
  private intervalMs = POLL_INTERVAL;
  private listeners = new Set<(data: Record<string, PresenceData>) => void>();
  private isPolling = false;

  constructor(private db: DatabaseManager, private crypto: CryptoService) {}

  async getPresence(accountIds: string[]): Promise<PresenceData[]> {
    if (!accountIds.length) return [];
    const all = this.db.getAllAccounts() as AccountLite[];
    const accounts = all.filter(a => accountIds.includes(a.id));
    if (!accounts.length) return [];

    const results: PresenceData[] = [];
    for (const acc of accounts) {
      const cached = this.cache.get(acc.id);
      results.push(cached?.presence || await this.fetchForAccount(acc));
    }
    return results;
  }

  startPolling(accountIds: string[], intervalMs = POLL_INTERVAL): void {
    this.stopPolling();
    this.accountIds = [...accountIds];
    this.intervalMs = intervalMs;
    this.poll().catch(e => console.error('[Presence] poll inicial:', e));
    this.pollingInterval = setInterval(() =>
      this.poll().catch(e => console.error('[Presence] poll:', e)), intervalMs);
    this.isPolling = true;
  }

  stopPolling(): void {
    if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
    this.isPolling = false;
  }

  isPollingActive() { return this.isPolling; }

  getPollingState() {
    return { isPolling: this.isPolling, accountCount: this.accountIds.length, intervalMs: this.intervalMs };
  }

  async getRecentGames(accountId: string): Promise<RecentGame[]> {
    const acc = this.resolveAccount(accountId);
    if (!acc) return [];
    const cookie = this.resolveCookie(acc);
    if (!cookie) return [];

    try {
      const r = await axios.get<any>(RECENT_GAMES_URL.replace('{userId}', acc.roblox_user_id.toString()),
        { headers: { Cookie: `.ROBLOSECURITY=${cookie}` }, timeout: TIMEOUT });
      return (r.data.data || []).slice(0, 5).map((g: any) => ({
        name: g.name || 'Desconocido',
        thumbnailUrl: g.imageUrl || g.thumbnailUrl || '',
        placeId: g.placeId,
        universeId: g.universeId,
      }));
    } catch { return []; }
  }

  async getRobuxBalance(accountId: string): Promise<RobloxRobuxBalance> {
    const acc = this.resolveAccount(accountId);
    if (!acc) return { balance: 0, premium: false, updatedAt: new Date() };
    const cookie = this.resolveCookie(acc);
    if (!cookie) return { balance: 0, premium: false, updatedAt: new Date() };

    try {
      const r = await axios.get<any>(ROBUX_URL.replace('{userId}', acc.roblox_user_id.toString()),
        { headers: { Cookie: `.ROBLOSECURITY=${cookie}` }, timeout: TIMEOUT });
      return { balance: r.data.robux, premium: r.data.premium, updatedAt: new Date() };
    } catch { return { balance: 0, premium: false, updatedAt: new Date() }; }
  }

  async getRobuxBulk(accountIds: string[]): Promise<Record<string, RobloxRobuxBalance>> {
    const result: Record<string, RobloxRobuxBalance> = {};
    await Promise.all(accountIds.map(async (id) => {
      try { result[id] = await this.getRobuxBalance(id); }
      catch { result[id] = { balance: 0, premium: false, updatedAt: new Date() }; }
    }));
    return result;
  }

  onPresenceUpdate(cb: (data: Record<string, PresenceData>) => void) { this.listeners.add(cb); }
  offPresenceUpdate(cb: (data: Record<string, PresenceData>) => void) { this.listeners.delete(cb); }

  cleanup() { this.stopPolling(); this.cache.invalidateAll(); this.listeners.clear(); }

  // ─── Private ─────────────────────────────────────────────────────────

  private resolveAccount(accountId: string): AccountLite | null {
    return (this.db.getAllAccounts() as AccountLite[]).find(a => a.id === accountId) || null;
  }

  private resolveCookie(acc: AccountLite): string | null {
    if (!acc.encrypted_cookie) return null;
    try { return this.crypto.decrypt(acc.encrypted_cookie); } catch { return null; }
  }

  private async fetchForAccount(acc: AccountLite): Promise<PresenceData> {
    const cookie = this.resolveCookie(acc);
    if (!cookie) return this.build(acc.id, 'offline');

    try {
      const presence = await this.fetchPresence(acc, cookie);
      let robux: RobloxRobuxBalance | undefined;
      let gameInfo: RobloxGameInfo | undefined;

      try { robux = await this.fetchRobux(acc, cookie); }
      catch (e) { console.warn(`[Presence] Robux para ${acc.id}:`, e); }

      if (presence.status === 'in-game' && presence.gameId) {
        try { gameInfo = await this.fetchGameInfo(presence.gameId, cookie); }
        catch (e) { console.warn(`[Presence] GameInfo para ${acc.id}:`, e); }
      }

      const data = this.build(acc.id, presence.status, presence.gameId, gameInfo, robux, presence.lastOnline);
      this.cache.set(acc.id, data, robux || { balance: 0, premium: false, updatedAt: new Date() }, gameInfo);
      return data;
    } catch (e) {
      console.error(`[Presence] Error para ${acc.id}:`, e);
      return this.build(acc.id, 'offline');
    }
  }

  private async fetchPresence(acc: AccountLite, cookie: string) {
    const r = await axios.post<any>(PRESENCE_URL, { userIds: [Number(acc.roblox_user_id)] },
      { headers: { Cookie: `.ROBLOSECURITY=${cookie}` }, timeout: TIMEOUT });
    const p = r.data.userPresences[0];
    if (!p) return { status: 'offline' as const };
    return {
      status: mapPresenceType(p.userPresenceType),
      gameId: p.userPresenceType === 2 ? p.gameId : undefined,
      lastOnline: p.lastOnline ? new Date(p.lastOnline) : undefined,
    };
  }

  private async fetchRobux(acc: AccountLite, cookie: string): Promise<RobloxRobuxBalance> {
    const r = await axios.get<any>(ROBUX_URL.replace('{userId}', acc.roblox_user_id.toString()),
      { headers: { Cookie: `.ROBLOSECURITY=${cookie}` }, timeout: TIMEOUT });
    return { balance: r.data.robux, premium: r.data.premium, updatedAt: new Date() };
  }

  private async fetchGameInfo(gameId: string, cookie: string): Promise<RobloxGameInfo | undefined> {
    const match = gameId.match(/universeId=(\d+)/);
    if (!match) return undefined;
    const r = await axios.get<any>(`${GAMES_URL}?universeIds=${match[1]}`,
      { headers: { Cookie: `.ROBLOSECURITY=${cookie}` }, timeout: TIMEOUT });
    const game = r.data.data[0];
    return game ? { name: game.name, thumbnailUrl: game.thumbnailUrl, universeId: game.universeId, rootPlaceId: game.rootPlaceId } : undefined;
  }

  private build(
    accountId: string, status: 'online' | 'in-game' | 'offline',
    gameId?: string, gameInfo?: RobloxGameInfo,
    robux?: RobloxRobuxBalance, lastOnline?: Date
  ): PresenceData {
    return {
      accountId, status, gameId,
      gameName: gameInfo?.name,
      thumbnail: gameInfo?.thumbnailUrl,
      timeInGame: status === 'in-game' && lastOnline ? Math.floor((Date.now() - lastOnline.getTime()) / SECONDS) : undefined,
      robuxBalance: robux?.balance,
      robuxPremium: robux?.premium,
      lastOnline,
    };
  }

  private async poll(): Promise<void> {
    if (!this.accountIds.length) return;
    try {
      const data = await this.getPresence(this.accountIds);
      const record: Record<string, PresenceData> = {};
      for (const item of data) record[item.accountId] = item;
      this.listeners.forEach(cb => cb(record));
    } catch (e) { console.error('[Presence] poll:', e); }
  }
}

export default PresenceService;
