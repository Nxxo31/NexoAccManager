// Infrastructure: LaunchPresetService — persists launch presets in SQLite
import { getDb } from '../database/DatabaseManager';
import { randomUUID } from 'crypto';
import type { LaunchPreset } from '../../domain/entities/LaunchPreset';

function ensureTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS launch_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      placeId TEXT NOT NULL,
      accountIds TEXT NOT NULL,
      autoShuffle INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

export function getAllPresets(): LaunchPreset[] {
  ensureTable();
  const rows = getDb().prepare('SELECT * FROM launch_presets ORDER BY updatedAt DESC').all() as Array<{
    id: string; name: string; placeId: string; accountIds: string;
    autoShuffle: number; createdAt: string; updatedAt: string;
  }>;
  return rows.map(rowToPreset);
}

export function savePreset(preset: Omit<LaunchPreset, 'id'>): string {
  ensureTable();
  const id = randomUUID();
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO launch_presets (id, name, placeId, accountIds, autoShuffle, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, preset.name, preset.placeId, JSON.stringify(preset.accountIds),
         preset.autoShuffle ? 1 : 0, now, now);
  return id;
}

export function deletePreset(presetId: string): void {
  ensureTable();
  getDb().prepare('DELETE FROM launch_presets WHERE id = ?').run(presetId);
}

export async function launchPreset(presetId: string): Promise<void> {
  ensureTable();
  const row = getDb().prepare('SELECT * FROM launch_presets WHERE id = ?').get(presetId) as
    | { id: string; name: string; placeId: string; accountIds: string; autoShuffle: number }
    | undefined;
  if (!row) throw new Error('Preset not found');
  // Actual launch logic deferred to caller — this is the data layer
}

function rowToPreset(row: {
  id: string; name: string; placeId: string; accountIds: string;
  autoShuffle: number; createdAt: string; updatedAt: string;
}): LaunchPreset {
  return {
    id: row.id,
    name: row.name,
    placeId: row.placeId,
    accountIds: JSON.parse(row.accountIds),
    autoShuffle: row.autoShuffle === 1,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}