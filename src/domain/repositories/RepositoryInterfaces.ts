// Domain Repository Interfaces (Ports)
// Pure contracts — no implementation, no DB knowledge, no Electron

import type { Account, RecentGame, FavoriteGame } from '../entities/Account';
import type { ServerInfo, ServerUser } from '../entities/ServerInfo';
import type { PresenceData, RobuxBalance, Friend, FriendRequest, BlockedUser } from '../entities/PresenceData';
import type { OutfitData, UniverseData } from '../entities/GameData';

export interface AccountRepository {
  getAll(): Promise<Account[]>;
  getById(id: string): Promise<Account | null>;
  getByGroup(group: string): Promise<Account[]>;
  getFavorites(): Promise<Account[]>;
  create(account: Account): Promise<void>;
  update(id: string, partial: Partial<Account>): Promise<void>;
  delete(id: string): Promise<void>;
  updateLastUsed(id: string): Promise<void>;
  saveRecentGame(accountId: string, game: RecentGame): Promise<void>;
  getRecentGames(accountId: string, limit?: number): Promise<RecentGame[]>;
  saveFavoriteGame(accountId: string, game: FavoriteGame): Promise<void>;
  removeFavoriteGame(accountId: string, gameId: number): Promise<void>;
  getFavoriteGames(accountId: string): Promise<FavoriteGame[]>;
  count(): Promise<number>;
}

export interface SettingsRepository {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  getAll(): Record<string, unknown>;
}

export interface CacheRepository<T> {
  get(key: string): T | undefined;
  set(key: string, data: T, ttlMs?: number): void;
  invalidate(key: string): void;
  clear(): void;
}
