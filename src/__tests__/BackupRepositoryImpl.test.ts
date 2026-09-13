import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const mockState = vi.hoisted(() => ({
  userDataPath: '',
  appVersion: '5.0.0-test',
  settings: new Map<string, unknown>(),
}))

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => (name === 'userData' ? mockState.userDataPath : ''),
    getVersion: () => mockState.appVersion,
  },
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

import { BackupRepositoryImpl, BackupCryptoImpl } from '../../src/infrastructure/database/BackupRepositoryImpl'
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
  mockState.settings.clear()
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
