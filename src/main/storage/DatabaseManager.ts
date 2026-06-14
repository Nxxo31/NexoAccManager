/**
 * DatabaseManager - Almacenamiento local de cuentas
 *
 * Usa SQLite para persistencia estructurada de datos.
 * Las cookies se almacenan cifradas mediante CryptoService.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export class DatabaseManager {
  private db!: Database.Database;

  async initialize(): Promise<void> {
    const dbPath = path.join(app.getPath('userData'), 'nexoaccmanager.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    this.createTables();
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        roblox_user_id INTEGER,
        username TEXT NOT NULL,
        display_name TEXT,
        encrypted_cookie TEXT NOT NULL,
        cookie_hash TEXT,
        group_name TEXT DEFAULT 'Default',
        description TEXT DEFAULT '',
        last_used TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        avatar_url TEXT,
        custom_fields TEXT DEFAULT '{}',
        browser_tracker_id TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recent_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id TEXT NOT NULL,
        game_name TEXT,
        last_joined TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_group ON accounts(group_name);
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(roblox_user_id);
    `);
  }

  /**
   * Obtiene todas las cuentas
   */
  getAllAccounts(): any[] {
    const stmt = this.db.prepare('SELECT * FROM accounts ORDER BY group_name, username');
    return stmt.all();
  }

  /**
   * Obtiene una cuenta por ID
   */
  getAccount(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Crea una nueva cuenta
   */
  createAccount(data: {
    id: string;
    robloxUserId: number;
    username: string;
    encryptedCookie: string;
    cookieHash?: string;
    groupName?: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (id, roblox_user_id, username, encrypted_cookie, cookie_hash, group_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(data.id, data.robloxUserId, data.username, data.encryptedCookie, data.cookieHash || null, data.groupName || 'Default');
  }

  /**
   * Actualiza la Ãºltima vez que se usÃ³ una cuenta
   */
  updateLastUsed(id: string): void {
    const stmt = this.db.prepare('UPDATE accounts SET last_used = datetime(\'now\') WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Elimina una cuenta
   */
  deleteAccount(id: string): void {
    const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Obtiene un setting
   */
  getSetting(key: string): string | undefined {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row?.value;
  }

  /**
   * Guarda un setting
   */
  setSetting(key: string, value: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
  }

  /**
   * Agrega un juego reciente
   */
  addRecentGame(placeId: string, gameName?: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO recent_games (place_id, game_name) VALUES (?, ?)');
    stmt.run(placeId, gameName || null);
  }

  /**
   * Cierra la conexiÃ³n a la base de datos
   */
  close(): void {
    this.db.close();
  }
}