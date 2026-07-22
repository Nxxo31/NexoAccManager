// Infrastructure: AccountRepositoryImpl
// Implementa AccountRepository usando DatabaseManager (better-sqlite3)

import type { AccountRepository } from '../../domain/repositories/RepositoryInterfaces';
import type { Account, RecentGame, FavoriteGame } from '../../domain/entities/Account';
import { getDb } from './DatabaseManager';
import { createAccount } from '../../domain/entities/Account';

function rowToAccount(row: Record<string, unknown>): Account {
  return createAccount({
    id: row.id as string,
    robloxUserId: row.roblox_user_id as number,
    username: row.username as string,
    displayName: (row.display_name as string) || '',
    encryptedCookie: (row.encrypted_cookie as string) || '',
    cookieHash: (row.cookie_hash as string) || '',
    group: (row.group_name as string) || 'Default',
    description: (row.description as string) || '',
    lastUsed: row.last_used ? new Date(row.last_used as string) : new Date(),
    createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
    avatarUrl: (row.avatar_url as string) || '',
    cookieExpiresAt: row.cookie_expires_at ? new Date(row.cookie_expires_at as string) : null,
    savedPlaceId: (row.saved_place_id as string) || '',
    savedJobId: (row.saved_job_id as string) || '',
    password: (row.password as string) || '',
    autoRelaunch: Boolean(row.auto_relaunch),
    isFavorite: Boolean(row.is_favorite),
    fields: JSON.parse((row.custom_fields as string) || '{}'),
    browserTrackerId: (row.browser_tracker_id as string) || '',
  });
}

function rowToRecentGame(row: Record<string, unknown>): RecentGame {
  return {
    id: row.id as string,
    gameId: row.game_id as number,
    name: (row.name as string) || '',
    icon: (row.icon as string) || '',
    lastPlayed: row.last_played ? new Date(row.last_played as string) : new Date(),
    placeId: (row.place_id as string) || '',
    placeName: (row.place_name as string) || '',
    universeId: (row.universe_id as number) || 0,
  };
}

function rowToFavoriteGame(row: Record<string, unknown>): FavoriteGame {
  return {
    id: row.id as string,
    gameId: row.game_id as number,
    name: (row.name as string) || '',
    icon: (row.icon as string) || '',
    addedAt: row.added_at ? new Date(row.added_at as string) : new Date(),
  };
}

export class AccountRepositoryImpl implements AccountRepository {
  async getAll(): Promise<Account[]> {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM accounts ORDER BY is_favorite DESC, last_used DESC').all() as Record<string, unknown>[];
    return rows.map(rowToAccount);
  }

  async getById(id: string): Promise<Account | null> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? rowToAccount(row) : null;
  }

  async getByGroup(group: string): Promise<Account[]> {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM accounts WHERE group_name = ? ORDER BY is_favorite DESC, last_used DESC').all(group) as Record<string, unknown>[];
    return rows.map(rowToAccount);
  }

  async getFavorites(): Promise<Account[]> {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM accounts WHERE is_favorite = 1 ORDER BY last_used DESC').all() as Record<string, unknown>[];
    return rows.map(rowToAccount);
  }

  async create(account: Account): Promise<void> {
    const db = getDb();
    db.prepare(`
      INSERT INTO accounts (id, roblox_user_id, username, display_name, encrypted_cookie, cookie_hash, group_name, description, last_used, created_at, avatar_url, custom_fields, browser_tracker_id, cookie_expires_at, saved_place_id, saved_job_id, password, auto_relaunch, is_favorite)
      VALUES (@id, @robloxUserId, @username, @displayName, @encryptedCookie, @cookieHash, @group, @description, @lastUsed, @createdAt, @avatarUrl, @fields, @browserTrackerId, @cookieExpiresAt, @savedPlaceId, @savedJobId, @password, @autoRelaunch, @isFavorite)
    `).run({
      id: account.id,
      robloxUserId: account.robloxUserId,
      username: account.username,
      displayName: account.displayName,
      encryptedCookie: account.encryptedCookie,
      cookieHash: account.cookieHash,
      group: account.group,
      description: account.description,
      lastUsed: account.lastUsed.toISOString(),
      createdAt: account.createdAt.toISOString(),
      avatarUrl: account.avatarUrl,
      fields: JSON.stringify(account.fields),
      browserTrackerId: account.browserTrackerId,
      cookieExpiresAt: account.cookieExpiresAt?.toISOString() ?? null,
      savedPlaceId: account.savedPlaceId,
      savedJobId: account.savedJobId,
      password: account.password,
      autoRelaunch: account.autoRelaunch ? 1 : 0,
      isFavorite: account.isFavorite ? 1 : 0,
    });
  }

  async update(id: string, partial: Partial<Account>): Promise<void> {
    const db = getDb();
    const current = await this.getById(id);
    if (!current) return;
    const merged = { ...current, ...partial };

    db.prepare(`
      UPDATE accounts SET
        display_name = ?, group_name = ?, description = ?, avatar_url = ?,
        cookie_expires_at = ?, saved_place_id = ?, saved_job_id = ?,
        password = ?, auto_relaunch = ?, is_favorite = ?, custom_fields = ?,
        browser_tracker_id = ?, last_used = ?
      WHERE id = ?
    `).run(
      merged.displayName, merged.group, merged.description, merged.avatarUrl,
      merged.cookieExpiresAt?.toISOString() ?? null, merged.savedPlaceId, merged.savedJobId,
      merged.password, merged.autoRelaunch ? 1 : 0, merged.isFavorite ? 1 : 0,
      JSON.stringify(merged.fields), merged.browserTrackerId, merged.lastUsed.toISOString(),
      id
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  }

  async updateLastUsed(id: string): Promise<void> {
    const db = getDb();
    db.prepare('UPDATE accounts SET last_used = ? WHERE id = ?').run(new Date().toISOString(), id);
  }

  async saveRecentGame(accountId: string, game: RecentGame): Promise<void> {
    const db = getDb();
    db.prepare(`
      INSERT INTO recent_games (id, account_id, game_id, name, icon, last_played, place_id, place_name, universe_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(game.id, accountId, game.gameId, game.name, game.icon, game.lastPlayed.toISOString(), game.placeId, game.placeName, game.universeId);
  }

  async getRecentGames(accountId: string, limit = 10): Promise<RecentGame[]> {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM recent_games WHERE account_id = ? ORDER BY last_played DESC LIMIT ?').all(accountId, limit) as Record<string, unknown>[];
    return rows.map(rowToRecentGame);
  }

  async saveFavoriteGame(accountId: string, game: FavoriteGame): Promise<void> {
    const db = getDb();
    db.prepare(`
      INSERT INTO favorite_games (id, account_id, game_id, name, icon, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(game.id, accountId, game.gameId, game.name, game.icon, game.addedAt.toISOString());
  }

  async removeFavoriteGame(accountId: string, gameId: number): Promise<void> {
    const db = getDb();
    db.prepare('DELETE FROM favorite_games WHERE account_id = ? AND game_id = ?').run(accountId, gameId);
  }

  async getFavoriteGames(accountId: string): Promise<FavoriteGame[]> {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM favorite_games WHERE account_id = ? ORDER BY added_at DESC').all(accountId) as Record<string, unknown>[];
    return rows.map(rowToFavoriteGame);
  }

  async count(): Promise<number> {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
    return result.count;
  }
}
