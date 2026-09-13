import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const mockState = vi.hoisted(() => {
  // In-memory SQLite-shaped fake. Stores rows in Maps keyed by table name.
  // Supports only the queries used by BackupServiceImpl/BackupRepositoryImpl/SettingsRepositoryImpl.
  const tables = new Map<string, Array<Record<string, unknown>>>()

  function ensureTable(name: string) {
    const key = name.toLowerCase()
    if (!tables.has(key)) tables.set(key, [])
  }

  function evalWhere(rows: Array<Record<string, unknown>>, whereSql: string, params: unknown[]): Array<Record<string, unknown>> {
    if (!whereSql) return rows
    const whereMatch = whereSql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+LIMIT|$)/i)
    if (!whereMatch) return rows
    const conds = whereMatch[1].split(/\s+AND\s+/i).map((c) => c.trim())
    return rows.filter((row) => {
      return conds.every((cond, i) => {
        const m = cond.match(/^(\w+)\s*=\s*\?$/i)
        if (!m) return true
        const col = m[1].toLowerCase()
        return row[col] === params[i]
      })
    })
  }

  const fakeDb = {
    pragma(_pragma: string) {},
    exec(sql: string) {
      // CREATE TABLE IF NOT EXISTS table (cols)
      const m = sql.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i)
      if (m) ensureTable(m[1])
    },
    prepare(sql: string) {
      // Normalize whitespace
      const norm = sql.replace(/\s+/g, ' ').trim()
      const upper = norm.toUpperCase()
      return {
        get(...params: unknown[]) {
          // SELECT COUNT(*) AS count FROM table
          let m = upper.match(/^SELECT COUNT\(\*\) AS (\w+) FROM (\w+)/)
          if (m) {
            ensureTable(m[2])
            const rows = tables.get(m[2].toLowerCase())!
            const result: Record<string, unknown> = { [m[1].toLowerCase()]: rows.length }
            return result
          }
          // SELECT value FROM settings WHERE key = ?
          m = upper.match(/^SELECT VALUE FROM (\w+) WHERE (\w+) = \?$/)
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
            const filtered = evalWhere(rows, m[3] || '', params)
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
            const placeholders = m[3].split(',').map((c: string) => c.trim())
            if (placeholders.length !== cols.length) return { changes: 0 }
            const rows = tables.get(m[1].toLowerCase())!
            const row: Record<string, unknown> = {}
            cols.forEach((c: string, i: number) => {
              row[c] = params[i]
            })
            // Replace by primary key (assume col 0 is PK)
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
    settings: new Map<string, unknown>(),
    fakeDb,
  }
})

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => (name === 'userData' ? mockState.userDataPath : ''),
    getVersion: () => mockState.appVersion,
  },
}))

vi.mock('../../src/infrastructure/database/DatabaseManager', () => ({
  getDb: () => mockState.fakeDb,
  closeDb: () => mockState.fakeDb.close(),
}))

vi.mock('../../src/infrastructure/database/SettingsRepositoryImpl', () => ({
  SettingsRepositoryImpl: class MockSettingsRepo {
    get<T>(key: string) {
      return mockState.settings.get(key) as T | undefined
    }
    set<T>(key: string, value: T) {
      mockState.settings.set(key, value)
    }
    remove(key: string) {
      mockState.settings.delete(key)
    }
    getAll() {
      return Object.fromEntries(mockState.settings)
    }
  },
}))

vi.mock('../../src/infrastructure/logging/logger', () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}))

import { BackupServiceImpl, resetBackupServiceInstance, getBackupService } from '../../src/infrastructure/services/BackupServiceImpl'

let tempDir: string

function seedAccounts(n: number) {
  for (let i = 0; i < n; i++) {
    mockState.fakeDb.__tables.get('accounts')!.push({
      id: `acc-${i}`,
      roblox_user_id: 1000 + i,
      username: `user${i}`,
      encrypted_cookie: 'blob',
    })
  }
}

function seedSettings(n: number) {
  for (let i = 0; i < n; i++) {
    mockState.fakeDb.__tables.get('settings')!.push({
      key: `setting-${i}`,
      value: `"value-${i}"`,
    })
  }
}

function writeSecretFile() {
  // CryptoService reads secretDir()/.nam-secret. With NAM_SECRET env var unset,
  // loadOrCreateSecret() writes a random hex here on first call. To pre-seed a
  // known secret, write directly to this path BEFORE the first createBackup.
  writeFileSync(join(tempDir, '.nam-secret'), 'a'.repeat(64))
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'nam-backup-svc-'))
  mockState.userDataPath = tempDir
  mockState.appVersion = '5.0.0-test'
  mockState.settings.clear()
  mockState.fakeDb.__tables.clear()
  mockState.fakeDb.__tables.set('accounts', [])
  mockState.fakeDb.__tables.set('settings', [])
  // Force CryptoService to use env var (skips filesystem secret file generation,
  // which would otherwise leak state between tests via cachedSecret at module level).
  process.env.NAM_SECRET = 'test-secret-fixed-string-min-16-chars'
  // Force secretDir() to return tempDir (CryptoService.secretDir() uses require('electron')
  // at runtime, which bypasses vi.mock — NAM_DATA_DIR env var is the documented override).
  process.env.NAM_DATA_DIR = tempDir
  resetBackupServiceInstance()
})

afterEach(() => {
  resetBackupServiceInstance()
  delete process.env.NAM_SECRET
  delete process.env.NAM_DATA_DIR
  rmSync(tempDir, { recursive: true, force: true })
})

describe('BackupServiceImpl', () => {
  describe('setBackupFolder / getBackupFolder', () => {
    it('returns null when never set', () => {
      const svc = new BackupServiceImpl()
      expect(svc.getBackupFolder()).toBeNull()
    })

    it('rejects empty path', async () => {
      const svc = new BackupServiceImpl()
      await expect(svc.setBackupFolder('')).rejects.toThrow(/invalido/i)
      await expect(svc.setBackupFolder('   ')).rejects.toThrow(/invalido/i)
    })

    it('rejects Windows system paths', async () => {
      const svc = new BackupServiceImpl()
      await expect(svc.setBackupFolder('C:\\Windows')).rejects.toThrow(/sistema/i)
      await expect(svc.setBackupFolder('C:\\Windows\\System32')).rejects.toThrow(/sistema/i)
      await expect(svc.setBackupFolder('C:\\Program Files')).rejects.toThrow(/sistema/i)
    })

    it('rejects lowercase variants of system paths (Windows case-insensitive)', async () => {
      const svc = new BackupServiceImpl()
      await expect(svc.setBackupFolder('c:\\windows')).rejects.toThrow(/sistema/i)
    })

    it('rejects path with trailing separator under forbidden', async () => {
      const svc = new BackupServiceImpl()
      await expect(svc.setBackupFolder('C:\\Windows\\')).rejects.toThrow(/sistema/i)
    })

    it('accepts normal user path and persists via repository', async () => {
      const svc = new BackupServiceImpl()
      const cfg = await svc.setBackupFolder(join(tempDir, 'mybackups'))
      expect(cfg.path).toBe(join(tempDir, 'mybackups'))
      expect(cfg.lastSelectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(svc.getBackupFolder()?.path).toBe(cfg.path)
    })
  })

  describe('createBackup', () => {
    it('throws when database file does not exist', async () => {
      const svc = new BackupServiceImpl()
      await expect(svc.createBackup()).rejects.toThrow(/Database file not found/)
    })

    it('creates a backup file with metadata, persists it, returns metadata', async () => {
      seedAccounts(3)
      seedSettings(2)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake-db-content')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('test backup')

      expect(meta.id).toMatch(/^[a-f0-9-]{36}$/)
      expect(meta.version).toBe(1)
      expect(meta.originalSize).toBeGreaterThan(0)
      expect(meta.checksum).toMatch(/^[a-f0-9]{64}$/)
      expect(meta.metadata.accountCount).toBe(3)
      expect(meta.metadata.settingsCount).toBe(2)
      expect(meta.metadata.appVersion).toBe('5.0.0-test')
      expect(meta.includesSecret).toBe(false)
      expect(existsSync(meta.filePath)).toBe(true)

      expect(svc.listBackups()).toHaveLength(1)
      expect(svc.listBackups()[0].id).toBe(meta.id)
    })

    it('createBackup with includeSecret but no secret file → includesSecret=false', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('with secret', true)
      expect(meta.includesSecret).toBe(false)
    })

    it('createBackup with includeSecret and existing secret → includesSecret=true', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      writeSecretFile()
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('with secret', true)
      expect(meta.includesSecret).toBe(true)
      const data = JSON.parse(readFileSync(meta.filePath, 'utf8'))
      expect(data.secretEncrypted).toBeTypeOf('string')
      expect(data.secretEncrypted.length).toBeGreaterThan(0)
    })

    it('createBackup default folder is userData/backups when none configured', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup()
      expect(meta.filePath).toContain(join(tempDir, 'backups'))
      expect(existsSync(meta.filePath)).toBe(true)
    })

    it('createBackup uses configured folder when set', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const customDir = join(tempDir, 'custom-backups')
      const svc = new BackupServiceImpl()
      await svc.setBackupFolder(customDir)
      const meta = await svc.createBackup()
      expect(meta.filePath.startsWith(customDir)).toBe(true)
    })
  })

  describe('restoreBackup', () => {
    it('throws when confirm=false', async () => {
      const svc = new BackupServiceImpl()
      await expect(svc.restoreBackup('any-id', false)).rejects.toThrow(/confirmation/)
    })

    it('throws when backupId unknown', async () => {
      const svc = new BackupServiceImpl()
      await expect(svc.restoreBackup('does-not-exist', true)).rejects.toThrow(/Backup not found/)
    })

    it('throws when backup file missing on disk', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('todelete')
      rmSync(meta.filePath)
      await expect(svc.restoreBackup(meta.id, true)).rejects.toThrow(/file missing/)
    })

    it('happy path: restores DB content, returns success', async () => {
      seedAccounts(2)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake-content')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('restore-test')

      const result = await svc.restoreBackup(meta.id, true)
      expect(result.success).toBe(true)
      expect(result.restoredTables).toContain('accounts')
    })

    it('refuses to restore secret-including backup over local accounts without forceOverwriteSecret', async () => {
      seedAccounts(2)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      writeSecretFile()
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('with-secret', true)
      expect(meta.includesSecret).toBe(true)

      await expect(svc.restoreBackup(meta.id, true)).rejects.toThrow(/destruiria.*cuenta/i)
    })

    it('allows restore with forceOverwriteSecret=true even when accounts exist', async () => {
      seedAccounts(2)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      writeSecretFile()
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('with-secret', true)

      const result = await svc.restoreBackup(meta.id, true, { forceOverwriteSecret: true })
      expect(result.success).toBe(true)
    })
  })

  describe('deleteBackup', () => {
    it('removes the backup file + metadata', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('toremove')
      expect(existsSync(meta.filePath)).toBe(true)

      expect(await svc.deleteBackup(meta.id)).toBe(true)
      expect(existsSync(meta.filePath)).toBe(false)
      expect(svc.listBackups()).toHaveLength(0)
    })

    it('returns false when id unknown', async () => {
      const svc = new BackupServiceImpl()
      expect(await svc.deleteBackup('nope')).toBe(false)
    })
  })

  describe('verifyBackupIntegrity', () => {
    it('returns true for a valid backup', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('verify-test')
      expect(await svc.verifyBackupIntegrity(meta.id)).toBe(true)
    })

    it('returns false when backup metadata missing', async () => {
      const svc = new BackupServiceImpl()
      expect(await svc.verifyBackupIntegrity('unknown')).toBe(false)
    })

    it('returns false when backup file missing on disk', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('verify-missing')
      rmSync(meta.filePath)
      expect(await svc.verifyBackupIntegrity(meta.id)).toBe(false)
    })

    it('returns false when checksum tampered', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const meta = await svc.createBackup('tamper-test')
      const data = JSON.parse(readFileSync(meta.filePath, 'utf8'))
      data.encryptedData = 'AAAA' + data.encryptedData.slice(4)
      writeFileSync(meta.filePath, JSON.stringify(data))

      expect(await svc.verifyBackupIntegrity(meta.id)).toBe(false)
    })
  })

  describe('getBackupStats', () => {
    it('returns zeros when no backups', () => {
      const svc = new BackupServiceImpl()
      expect(svc.getBackupStats()).toEqual({
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
      })
    })

    it('aggregates correctly across multiple backups', async () => {
      seedAccounts(1)
      writeFileSync(join(tempDir, 'nexoacc.db'), 'fake')
      const svc = new BackupServiceImpl()
      const a = await svc.createBackup('first')
      // First backup was created earlier, second later → oldestBackup === a.createdAt
      const b = await svc.createBackup('second')

      const stats = svc.getBackupStats()
      expect(stats.totalBackups).toBe(2)
      expect(stats.oldestBackup).toBe(a.createdAt)
      expect(stats.newestBackup).toBe(b.createdAt)
      expect(stats.totalSize).toBeGreaterThan(0)
      // Oldest is lexicographically <= newest (ISO 8601 sorts correctly)
      expect(a.createdAt <= b.createdAt).toBe(true)
    })
  })

  describe('schedule', () => {
    it('getSchedule returns null when never set', () => {
      const svc = new BackupServiceImpl()
      expect(svc.getSchedule()).toBeNull()
    })

    it('setSchedule + getSchedule roundtrip', async () => {
      const svc = new BackupServiceImpl()
      await svc.setSchedule({ enabled: true, frequency: 'daily', time: '12:00' })
      const sched = svc.getSchedule()
      expect(sched?.enabled).toBe(true)
      expect(sched?.frequency).toBe('daily')
      expect(sched?.time).toBe('12:00')
      svc.shutdown()
    })

    it('getNextScheduledRun returns null when disabled', async () => {
      const svc = new BackupServiceImpl()
      await svc.setSchedule({ enabled: false, frequency: 'daily', time: '12:00' })
      expect(svc.getNextScheduledRun()).toBeNull()
      svc.shutdown()
    })

    it('getNextScheduledRun returns today when time is in the future', async () => {
      const svc = new BackupServiceImpl()
      const future = new Date()
      future.setHours(future.getHours() + 2)
      const hh = String(future.getHours()).padStart(2, '0')
      const mm = String(future.getMinutes()).padStart(2, '0')
      await svc.setSchedule({ enabled: true, frequency: 'daily', time: `${hh}:${mm}` })
      const next = svc.getNextScheduledRun()
      expect(next).not.toBeNull()
      const diff = next!.getTime() - new Date().getTime()
      expect(diff).toBeGreaterThan(0)
      expect(diff).toBeLessThan(3 * 60 * 60 * 1000)
      svc.shutdown()
    })

    it('getNextScheduledRun moves to next day when time already passed (daily)', async () => {
      const svc = new BackupServiceImpl()
      const past = new Date()
      past.setHours(past.getHours() - 2)
      const hh = String(past.getHours()).padStart(2, '0')
      const mm = String(past.getMinutes()).padStart(2, '0')
      await svc.setSchedule({ enabled: true, frequency: 'daily', time: `${hh}:${mm}` })
      const next = svc.getNextScheduledRun()
      expect(next).not.toBeNull()
      // The next run is on the NEXT calendar day at HH:mm — diff is roughly 24h - elapsed
      const diff = next!.getTime() - new Date().getTime()
      expect(diff).toBeGreaterThan(20 * 60 * 60 * 1000) // > 20h
      expect(diff).toBeLessThan(26 * 60 * 60 * 1000) // < 26h
      svc.shutdown()
    })

    it('getNextScheduledRun for weekly pushes +7 days', async () => {
      const svc = new BackupServiceImpl()
      const past = new Date()
      past.setHours(past.getHours() - 2)
      const hh = String(past.getHours()).padStart(2, '0')
      const mm = String(past.getMinutes()).padStart(2, '0')
      await svc.setSchedule({ enabled: true, frequency: 'weekly', time: `${hh}:${mm}` })
      const next = svc.getNextScheduledRun()!
      const diff = next.getTime() - new Date().getTime()
      expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000)
      expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000)
      svc.shutdown()
    })

    it('getNextScheduledRun for monthly pushes +1 month', async () => {
      const svc = new BackupServiceImpl()
      const past = new Date()
      past.setHours(past.getHours() - 2)
      const hh = String(past.getHours()).padStart(2, '0')
      const mm = String(past.getMinutes()).padStart(2, '0')
      await svc.setSchedule({ enabled: true, frequency: 'monthly', time: `${hh}:${mm}` })
      const next = svc.getNextScheduledRun()!
      const diffDays = (next.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThan(27)
      expect(diffDays).toBeLessThan(32)
      svc.shutdown()
    })

    it('shutdown clears the scheduler interval', async () => {
      const svc = new BackupServiceImpl()
      await svc.setSchedule({ enabled: true, frequency: 'daily', time: '12:00' })
      // @ts-ignore
      expect(svc.schedulerInterval).not.toBeNull()
      svc.shutdown()
      // @ts-ignore
      expect(svc.schedulerInterval).toBeNull()
    })
  })

  describe('singleton lifecycle', () => {
    it('getBackupService returns the same instance', () => {
      const a = getBackupService()
      const b = getBackupService()
      expect(a).toBe(b)
      resetBackupServiceInstance()
    })

    it('resetBackupServiceInstance creates a fresh instance', () => {
      const a = getBackupService()
      resetBackupServiceInstance()
      const b = getBackupService()
      expect(a).not.toBe(b)
    })
  })
})
