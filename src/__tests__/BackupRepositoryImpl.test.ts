import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BackupRepositoryImpl } from '../../src/infrastructure/database/BackupRepositoryImpl'

describe('BackupRepositoryImpl (basic functionality)', () => {
  let backupRepo: BackupRepositoryImpl

  beforeEach(() => {
    backupRepo = new BackupRepositoryImpl()
  })

  it('should be instantiated correctly', () => {
    expect(backupRepo).toBeInstanceOf(BackupRepositoryImpl)
  })

  it('should have listBackups method', () => {
    expect(typeof backupRepo.listBackups).toBe('function')
  })

  it('should have getBackupById method', () => {
    expect(typeof backupRepo.getBackupById).toBe('function')
  })

  it('should have deleteBackup method', () => {
    expect(typeof backupRepo.deleteBackup).toBe('function')
  })

  it('should have saveBackupMetadata method', () => {
    expect(typeof backupRepo.saveBackupMetadata).toBe('function')
  })

  it('should have getSchedule method', () => {
    expect(typeof backupRepo.getSchedule).toBe('function')
  })

  it('should have setSchedule method', () => {
    expect(typeof backupRepo.setSchedule).toBe('function')
  })
})