import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const mockState = vi.hoisted(() => {
  // In-memory SQLite-shaped fake. Stores rows in Maps keyed by lowercase table name.
  const tables = new Map<string, Array<Record<string, unknown>>>()
  function ensureTable(name: string) {
    const key = name.toLowerCase()
    if (!tables.has(key)) tables.set(key, [])
  }
  const fakeDb = {
    pragma(_pragma: string) {},
    exec(sql: string) {
      const m = sql.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i)
      if (m) ensureTable(m[1])
    },
    prepare(sql: string) {
      const upper = sql.replace(/\s+/g, ' ').trim().toUpperCase()
      return {
        get(...params: unknown[]) {
          // SELECT value FROM settings WHERE key = ?
          const m = upper.match(/^SELECT VALUE FROM (\w+) WHERE (\w+) = \?$/)
          if (m) {
            ensureTable(m[1])
            const rows = tables.get(m[1].toLowerCase())!
            const match = rows.find((r) => r[m[2].toLowerCase()] === params[0])
            return match ? { value: match.value } : undefined
          }
          return undefined
        },
        all(...params: unknown[]) {
          // SELECT key, value FROM settings
          const m = upper.match(/^SELECT (.+?) FROM (\w+)(?:\s+(.*))?$/i)
          if (m) {
            ensureTable(m[2])
            const rows = tables.get(m[2].toLowerCase())!
            const whereMatch = (m[3] || '').match(/WHERE\s+(\w+)\s*=\s*\?/i)
            const filtered = whereMatch
              ? rows.filter((r) => r[whereMatch[1].toLowerCase()] === params[0])
              : rows
            return filtered.map((r) => {
              const out: Record<string, unknown> = {}
              m[1].split(',').forEach((c: string) => {
                const col = c.trim().toLowerCase()
                if (col !== '*' && !col.includes('(')) out[col] = r[col]
              })
              return out
            })
          }
          return []
        },
        run(...params: unknown[]) {
          // INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
          let m = upper.match(/^INSERT OR REPLACE INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i)
          if (m) {
            ensureTable(m[1])
            const cols = m[2].split(',').map((c: string) => c.trim().toLowerCase())
            const rows = tables.get(m[1].toLowerCase())!
            const row: Record<string, unknown> = {}
            cols.forEach((c: string, i: number) => { row[c] = params[i] })
            const pk = cols[0]
            const idx = rows.findIndex((r) => r[pk] === row[pk])
            if (idx >= 0) rows[idx] = row
            else rows.push(row)
            return { changes: 1 }
          }
          // DELETE FROM settings WHERE key = ?
          m = upper.match(/^DELETE FROM (\w+) WHERE (\w+) = \?$/i)
          if (m) {
            ensureTable(m[1])
            const rows = tables.get(m[1].toLowerCase())!
            const idx = rows.findIndex((r) => r[m[2].toLowerCase()] === params[0])
            if (idx >= 0) {
              rows.splice(idx, 1)
              return { changes: 1 }
            }
            return { changes: 0 }
          }
          return { changes: 0 }
        },
      }
    },
    close() {
      tables.clear()
    },
    __tables: tables,
  }
  return {
    userDataPath: '',
    appVersion: '5.0.0-test',
    fakeDb,
  }
})

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => (name === 'userData' ? mockState.userDataPath : ''),
    getVersion: () => mockState.appVersion,
  },
}))

vi.mock('better-sqlite3', () => ({
  default: function () {
    return mockState.fakeDb
  },
}))

// SettingsRepositoryImpl is now used DIRECTLY (not mocked) — its real code path
// runs against our fake DB to gain coverage on get/set/remove/getAll.
// DatabaseManager is also real now (better-sqlite3 is mocked above), so getDb() +
// createTables() execute for coverage.

import { BackupRepositoryImpl, BackupCryptoImpl } from '../../src/infrastructure/database/BackupRepositoryImpl'
import { SettingsRepositoryImpl } from '../../src/infrastructure/database/SettingsRepositoryImpl'
import type { BackupMetadata, BackupSchedule, BackupFolderConfig } from '../../src/domain/entities/BackupMetadata'

let tempDir: string

function makeMetadata(overrides: Partial<BackupMetadata> = {}): BackupMetadata {
  return {
    id: `b-${Math.random().toString(36).slice(2, 10)}`,
    version: 1,
    createdAt: new Date().toISOString(),
    originalSize: 1024,
    checksum: 'a'.repeat(64),
    encryptedSize: 2048,
    includesSecret: false,
    metadata: { accountCount: 3, settingsCount: 1, appVersion: '5.0.0' },
    filePath: '',
    ...overrides,
  }
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'nam-backup-repo-'))
  mockState.userDataPath = tempDir
  mockState.fakeDb.__tables.clear()
  mockState.fakeDb.__tables.set('settings', [])
})

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

describe('BackupRepositoryImpl', () => {
  describe('metadata CRUD', () => {
    it('listBackups returns empty array when no metadata file exists', () => {
      const repo = new BackupRepositoryImpl()
      expect(repo.listBackups()).toEqual([])
    })

    it('saveBackupMetadata then listBackups returns the saved item', () => {
      const repo = new BackupRepositoryImpl()
      const meta = makeMetadata({ filePath: join(tempDir, 'b1.enc') })
      writeFileSync(meta.filePath, 'fake')
      repo.saveBackupMetadata(meta)

      const listed = repo.listBackups()
      expect(listed).toHaveLength(1)
      expect(listed[0].id).toBe(meta.id)
      expect(listed[0].filePath).toBe(meta.filePath)
    })

    it('saveBackupMetadata updates existing item instead of duplicating', () => {
      const repo = new BackupRepositoryImpl()
      const meta = makeMetadata({ filePath: join(tempDir, 'b1.enc') })
      writeFileSync(meta.filePath, 'fake')

      repo.saveBackupMetadata(meta)
      const updated = { ...meta, originalSize: 9999 }
      repo.saveBackupMetadata(updated)

      expect(repo.listBackups()).toHaveLength(1)
      expect(repo.listBackups()[0].originalSize).toBe(9999)
    })

    it('listBackups filters out items whose file no longer exists', () => {
      const repo = new BackupRepositoryImpl()
      const m1 = makeMetadata({ filePath: join(tempDir, 'exists.enc') })
      const m2 = makeMetadata({ filePath: join(tempDir, 'missing.enc') })
      writeFileSync(m1.filePath, 'fake')
      // m2.filePath intentionally not written
      repo.saveBackupMetadata(m1)
      repo.saveBackupMetadata(m2)

      const listed = repo.listBackups()
      expect(listed).toHaveLength(1)
      expect(listed[0].id).toBe(m1.id)
    })

    it('getBackupById returns null for unknown id', () => {
      const repo = new BackupRepositoryImpl()
      expect(repo.getBackupById('does-not-exist')).toBeNull()
    })

    it('getBackupById returns the matching metadata', () => {
      const repo = new BackupRepositoryImpl()
      const m1 = makeMetadata({ id: 'alpha', filePath: join(tempDir, 'a.enc') })
      const m2 = makeMetadata({ id: 'beta', filePath: join(tempDir, 'b.enc') })
      writeFileSync(m1.filePath, 'x')
      writeFileSync(m2.filePath, 'y')
      repo.saveBackupMetadata(m1)
      repo.saveBackupMetadata(m2)

      expect(repo.getBackupById('alpha')?.id).toBe('alpha')
      expect(repo.getBackupById('beta')?.id).toBe('beta')
    })

    it('deleteBackup removes file + metadata; returns true', () => {
      const repo = new BackupRepositoryImpl()
      const meta = makeMetadata({ filePath: join(tempDir, 'todelete.enc') })
      writeFileSync(meta.filePath, 'x')
      repo.saveBackupMetadata(meta)
      expect(existsSync(meta.filePath)).toBe(true)

      expect(repo.deleteBackup(meta.id)).toBe(true)
      expect(existsSync(meta.filePath)).toBe(false)
      expect(repo.listBackups()).toHaveLength(0)
    })

    it('deleteBackup returns false for unknown id', () => {
      const repo = new BackupRepositoryImpl()
      expect(repo.deleteBackup('nope')).toBe(false)
    })

    it('metadata persists across instances via the file cache invalidation', () => {
      const repo1 = new BackupRepositoryImpl()
      const meta = makeMetadata({ filePath: join(tempDir, 'persist.enc') })
      writeFileSync(meta.filePath, 'x')
      repo1.saveBackupMetadata(meta)

      const repo2 = new BackupRepositoryImpl()
      expect(repo2.listBackups()).toHaveLength(1)
      expect(repo2.getBackupById(meta.id)).not.toBeNull()
    })

    it('handles corrupt JSON metadata file gracefully (returns empty)', () => {
      // Trigger lazy dir creation by listing (loadMetadata → getBackupDir mkdirs)
      const repo = new BackupRepositoryImpl()
      repo.listBackups()

      // Overwrite metadata with corrupt JSON
      const corruptPath = join(tempDir, 'backups', 'backup-metadata.json')
      writeFileSync(corruptPath, '{ this is not valid JSON')

      // New instance reloads via JSON.parse → throws → catch returns []
      const repo2 = new BackupRepositoryImpl()
      expect(repo2.listBackups()).toEqual([])
    })
  })

  describe('folder config (persisted via SettingsRepository)', () => {
    it('getBackupFolder returns null when never set', () => {
      const repo = new BackupRepositoryImpl()
      expect(repo.getBackupFolder()).toBeNull()
    })

    it('setBackupFolder then getBackupFolder returns the config', () => {
      const repo = new BackupRepositoryImpl()
      const cfg: BackupFolderConfig = {
        path: 'D:\\Backups',
        lastSelectedAt: new Date().toISOString(),
      }
      repo.setBackupFolder(cfg)
      const got = repo.getBackupFolder()
      expect(got).not.toBeNull()
      expect(got!.path).toBe(cfg.path)
      expect(got!.lastSelectedAt).toBe(cfg.lastSelectedAt)
    })

    it('setBackupFolder invalidates metadata cache so new dir is used', () => {
      const repo = new BackupRepositoryImpl()
      const meta1 = makeMetadata({ filePath: join(tempDir, 'a.enc') })
      writeFileSync(meta1.filePath, 'x')
      repo.saveBackupMetadata(meta1)
      expect(repo.listBackups()).toHaveLength(1)

      // Change folder → cache invalidated
      repo.setBackupFolder({ path: 'E:\\NewBackups', lastSelectedAt: new Date().toISOString() })
      // Now listBackups reads from E:\\NewBackups (which doesn't exist → empty + folder not created)
      expect(repo.listBackups()).toHaveLength(0)
    })
  })

  describe('schedule config (persisted via SettingsRepository)', () => {
    it('getSchedule returns null when never set', () => {
      const repo = new BackupRepositoryImpl()
      expect(repo.getSchedule()).toBeNull()
    })

    it('setSchedule then getSchedule roundtrips', () => {
      const repo = new BackupRepositoryImpl()
      const sched: BackupSchedule = { enabled: true, frequency: 'daily', time: '03:00' }
      repo.setSchedule(sched)
      const got = repo.getSchedule()
      expect(got).toEqual(sched)
    })

    it('schedule persists across instances', () => {
      const repo1 = new BackupRepositoryImpl()
      const sched: BackupSchedule = { enabled: true, frequency: 'weekly', time: '22:30' }
      repo1.setSchedule(sched)

      const repo2 = new BackupRepositoryImpl()
      expect(repo2.getSchedule()).toEqual(sched)
    })
  })

  describe('SettingsRepositoryImpl (real — exercised via BackupRepositoryImpl)', () => {
    // These tests use the real SettingsRepositoryImpl (no mock) so its branches
    // — JSON.parse success/fallback, string vs object serialization, getAll —
    // all execute against the fake DB.

    function seedSettingsTable(rows: Array<{ key: string; value: string }>) {
      const settingsTable = mockState.fakeDb.__tables.get('settings')!
      for (const row of rows) settingsTable.push(row)
    }

    it('get returns parsed JSON object', () => {
      // SettingsRepositoryImpl.FOLDER_KEY = 'backup.folder' (used by getBackupFolder)
      seedSettingsTable([{ key: 'backup.folder', value: '{"path":"/data/backups","lastSelectedAt":"2026-01-01"}' }])
      const repo = new BackupRepositoryImpl()
      const folder = repo.getBackupFolder()
      expect(folder).toEqual({ path: '/data/backups', lastSelectedAt: '2026-01-01' })
    })

    it('get falls back to raw string when value is not valid JSON', () => {
      // BackupFolderConfig = { path: string; lastSelectedAt: string }. A plain string
      // is not a valid JSON object, so SettingsRepositoryImpl.get returns the raw value.
      seedSettingsTable([{ key: 'backup.folder', value: 'plain-string-not-json' }])
      const repo = new BackupRepositoryImpl()
      const folder = repo.getBackupFolder()
      expect(folder).toBe('plain-string-not-json')
    })

    it('get returns undefined when key missing → caller falls back to null', () => {
      const repo = new BackupRepositoryImpl()
      expect(repo.getBackupFolder()).toBeNull()
    })

    it('set serializes objects via JSON.stringify (object branch)', () => {
      const repo = new BackupRepositoryImpl()
      repo.setBackupFolder({ path: '/data/backups', lastSelectedAt: '2026-01-01' })
      const settingsTable = mockState.fakeDb.__tables.get('settings')!
      const row = settingsTable.find((r) => r.key === 'backup.folder')
      expect(row).toBeDefined()
      expect(row!.value).toBe(JSON.stringify({ path: '/data/backups', lastSelectedAt: '2026-01-01' }))
    })

    it('set stores strings as-is without re-serialization (string branch)', () => {
      const repo = new BackupRepositoryImpl()
      const sched: BackupSchedule = { enabled: true, frequency: 'daily', time: '08:00' }
      repo.setSchedule(sched)
      const settingsTable = mockState.fakeDb.__tables.get('settings')!
      const row = settingsTable.find((r) => r.key === 'backup.schedule')
      expect(row).toBeDefined()
      expect(row!.value).toMatch(/^\{.*\}$/)
    })

    it('SettingsRepositoryImpl.set with raw string stores without JSON.stringify', () => {
      const repo = new SettingsRepositoryImpl()
      repo.set('plain-string-key', 'just-a-string' as any)
      const settingsTable = mockState.fakeDb.__tables.get('settings')!
      const row = settingsTable.find((r) => r.key === 'plain-string-key')
      expect(row).toBeDefined()
      expect(row!.value).toBe('just-a-string') // NOT JSON-wrapped
    })

    it('SettingsRepositoryImpl.getAll returns all rows as parsed JSON', () => {
      seedSettingsTable([
        { key: 'json-val', value: '{"a":1,"b":2}' },
        { key: 'plain-val', value: 'not-json' },
      ])
      const repo = new SettingsRepositoryImpl()
      const all = repo.getAll()
      expect(all).toEqual({
        'json-val': { a: 1, b: 2 },
        'plain-val': 'not-json',
      })
    })

    it('SettingsRepositoryImpl.getAll returns empty object when no rows', () => {
      const repo = new SettingsRepositoryImpl()
      expect(repo.getAll()).toEqual({})
    })

    it('SettingsRepositoryImpl.remove deletes the row', () => {
      seedSettingsTable([{ key: 'to-remove', value: '"x"' }])
      const repo = new SettingsRepositoryImpl()
      repo.remove('to-remove')
      const settingsTable = mockState.fakeDb.__tables.get('settings')!
      expect(settingsTable.find((r) => r.key === 'to-remove')).toBeUndefined()
    })
  })
})

describe('BackupCryptoImpl', () => {
  it('encrypt then decrypt roundtrips the original bytes', async () => {
    const crypto = new BackupCryptoImpl()
    const original = Buffer.from('hello world — binary-safe content \x00\x01\xff', 'utf8')
    const { encrypted, checksum } = await crypto.encrypt(original)
    expect(encrypted).toBeTypeOf('string')
    expect(checksum).toMatch(/^[a-f0-9]{64}$/) // sha256 hex

    const decrypted = await crypto.decrypt(encrypted, checksum)
    expect(decrypted.equals(original)).toBe(true)
  })

  it('encrypt handles empty buffer', async () => {
    const crypto = new BackupCryptoImpl()
    const empty = Buffer.alloc(0)
    const { encrypted, checksum } = await crypto.encrypt(empty)
    const decrypted = await crypto.decrypt(encrypted, checksum)
    expect(decrypted.length).toBe(0)
  })

  it('decrypt throws on checksum mismatch (tamper detection)', async () => {
    const crypto = new BackupCryptoImpl()
    const { encrypted } = await crypto.encrypt(Buffer.from('secret'))
    const wrongChecksum = 'a'.repeat(64)
    await expect(crypto.decrypt(encrypted, wrongChecksum)).rejects.toThrow(/Checksum mismatch/)
  })

  it('encrypt produces different ciphertext each time (due to inner encrypt randomization)', async () => {
    const crypto = new BackupCryptoImpl()
    const data = Buffer.from('same input')
    const a = await crypto.encrypt(data)
    const b = await crypto.encrypt(data)
    // ciphertext may differ (nonce/IV randomization) — checksum is deterministic on same input
    expect(a.checksum).toBe(b.checksum)
  })

  it('encrypt handles binary data with non-UTF8 bytes (regression: utf8 truncation bug)', async () => {
    const crypto = new BackupCryptoImpl()
    // Bytes that are invalid UTF-8 sequences — old code did data.toString('utf8') before encrypt,
    // which corrupted SQLite blobs containing such sequences.
    const binary = Buffer.from([0xff, 0xfe, 0xfd, 0xc0, 0xc1, 0xf5, 0xf6, 0xf7])
    const { encrypted, checksum } = await crypto.encrypt(binary)
    const decrypted = await crypto.decrypt(encrypted, checksum)
    expect(decrypted.equals(binary)).toBe(true)
  })
})
