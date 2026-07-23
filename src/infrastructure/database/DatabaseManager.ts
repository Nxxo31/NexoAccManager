// Infrastructure: Database Manager
// Wrapper sobre better-sqlite3 — un solo lugar para toda la persistencia

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'nexoacc.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    createTables(db);
  }
  return db;
}

function createTables(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      roblox_user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      encrypted_cookie TEXT NOT NULL,
      cookie_hash TEXT DEFAULT '',
      group_name TEXT DEFAULT 'Default',
      description TEXT DEFAULT '',
      last_used TEXT,
      created_at TEXT,
      avatar_url TEXT DEFAULT '',
      custom_fields TEXT DEFAULT '{}',
      browser_tracker_id TEXT DEFAULT '',
      cookie_expires_at TEXT,
      saved_place_id TEXT DEFAULT '',
      saved_job_id TEXT DEFAULT '',
      password TEXT DEFAULT '',
      auto_relaunch INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS recent_games (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      game_id INTEGER NOT NULL,
      name TEXT,
      icon TEXT,
      last_played TEXT,
      place_id TEXT,
      place_name TEXT,
      universe_id INTEGER,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorite_games (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      game_id INTEGER NOT NULL,
      name TEXT,
      icon TEXT,
      added_at TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
