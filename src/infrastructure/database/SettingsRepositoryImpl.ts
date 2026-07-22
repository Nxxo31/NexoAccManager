// Infrastructure: SettingsRepositoryImpl
// Implementa SettingsRepository usando DatabaseManager

import type { SettingsRepository } from '../../domain/repositories/RepositoryInterfaces';
import { getDb } from './DatabaseManager';

export class SettingsRepositoryImpl implements SettingsRepository {
  get<T>(key: string): T | undefined {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    if (!row) return undefined;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  }

  set<T>(key: string, value: T): void {
    const db = getDb();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, serialized);
  }

  remove(key: string): void {
    const db = getDb();
    db.prepare('DELETE FROM settings WHERE key = ?').run(key);
  }

  getAll(): Record<string, unknown> {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return result;
  }
}
