// Infrastructure: PlaytimeService — tracks playtime per account in SQLite
import { getDb } from '../database/DatabaseManager';
import { randomUUID } from 'crypto';

interface PlaytimeSession {
  id: string;
  accountId: string;
  placeId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
}

const activeTimers = new Map<string, { placeId: string; startTime: number }>();

function ensureTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS playtime_sessions (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      placeId TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT,
      duration INTEGER
    );
  `);
}

export function startPlaytimeTracking(accountId: string, placeId: string): void {
  ensureTable();
  if (activeTimers.has(accountId)) return; // already tracking
  activeTimers.set(accountId, { placeId, startTime: Date.now() });
  const db = getDb();
  db.prepare(`
    INSERT INTO playtime_sessions (id, accountId, placeId, startTime)
    VALUES (?, ?, ?, ?)
  `).run(randomUUID(), accountId, placeId, new Date().toISOString());
}

export function stopPlaytimeTracking(accountId: string): void {
  ensureTable();
  const timer = activeTimers.get(accountId);
  if (!timer) return;
  activeTimers.delete(accountId);
  const endTime = new Date();
  const duration = Math.floor((Date.now() - timer.startTime) / 1000); // seconds
  const db = getDb();
  db.prepare(`
    UPDATE playtime_sessions SET endTime = ?, duration = ?
    WHERE accountId = ? AND endTime IS NULL
  `).run(endTime.toISOString(), duration, accountId);
}

export function getTotalPlaytime(accountId: string): { totalSeconds: number; sessionCount: number } {
  ensureTable();
  const row = getDb().prepare(`
    SELECT COUNT(*) as sessionCount, COALESCE(SUM(duration), 0) as totalSeconds
    FROM playtime_sessions WHERE accountId = ?
  `).get(accountId) as { sessionCount: number; totalSeconds: number };
  return { totalSeconds: row.totalSeconds, sessionCount: row.sessionCount };
}

export function getSessionHistory(accountId: string, limit = 50): Array<{
  placeId: string; startTime: string; endTime: string | null; duration: number | null;
}> {
  ensureTable();
  return getDb().prepare(`
    SELECT placeId, startTime, endTime, duration
    FROM playtime_sessions WHERE accountId = ?
    ORDER BY startTime DESC LIMIT ?
  `).all(accountId, limit) as Array<{ placeId: string; startTime: string; endTime: string | null; duration: number | null }>;
}

export function clearPlaytimeHistory(accountId: string): void {
  ensureTable();
  getDb().prepare('DELETE FROM playtime_sessions WHERE accountId = ?').run(accountId);
}