// Domain Service Implementation: BackupServiceImpl
// Implementación completa del servicio de backups

import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import type { BackupMetadata, BackupSchedule, BackupFolderConfig } from '../entities/BackupMetadata';
import type { BackupService, BackupRepository, BackupCrypto } from './BackupService';
import { BackupRepositoryImpl, BackupCryptoImpl } from '../../infrastructure/database/BackupRepositoryImpl';
import { getDb } from '../../infrastructure/database/DatabaseManager';
import { encrypt, decrypt } from '../../infrastructure/database/CryptoService';

export class BackupServiceImpl implements BackupService {
  private repo: BackupRepository;
  private crypto: BackupCrypto;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.repo = new BackupRepositoryImpl();
    this.crypto = new BackupCryptoImpl();
  }

  // ============ CONFIGURACIÓN ============

  getBackupFolder(): BackupFolderConfig | null {
    return this.repo.getBackupFolder();
  }

  async setBackupFolder(path: string): Promise<BackupFolderConfig> {
    const config: BackupFolderConfig = {
      path,
      lastSelectedAt: new Date().toISOString(),
    };
    this.repo.setBackupFolder(config);
    return config;
  }

  async selectBackupFolder(): Promise<BackupFolderConfig | null> {
    // This will be called from renderer via IPC
    // The actual dialog.open is in the preload/main process
    // Here we just return the current folder
    return this.repo.getBackupFolder();
  }

  // ============ OPERACIONES DE BACKUP ============

  async createBackup(description?: string, includeSecret: boolean = false): Promise<BackupMetadata> {
    const backupDir = this.repo.getBackupFolder()?.path ?? join(app.getPath('userData'), 'backups');
    if (!existsSync(backupDir)) {
      const { mkdirSync } = require('node:fs');
      mkdirSync(backupDir, { recursive: true });
    }

    const dbPath = join(app.getPath('userData'), 'nexoacc.db');
    if (!existsSync(dbPath)) {
      throw new Error('Database file not found');
    }

    // Read DB file
    const dbData = readFileSync(dbPath);
    const originalSize = dbData.length;

    // Get counts for metadata
    const db = getDb();
    const accountCount = (db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number }).count;
    const settingsCount = (db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }).count;

    // Encrypt
    const { encrypted, checksum } = await this.crypto.encrypt(dbData);
    const encryptedSize = Buffer.from(encrypted, 'base64').length;

    // Handle secret file
    let secretEncrypted: string | null = null;
    if (includeSecret) {
      const { secretDir } = require('../../infrastructure/database/CryptoService');
      const secretPath = join(secretDir(), '.nam-secret');
      if (existsSync(secretPath)) {
        const secretData = readFileSync(secretPath, 'utf8');
        secretEncrypted = encrypt(secretData);
      }
    }

    // Create metadata
    const metadata: BackupMetadata = {
      id: uuidv4(),
      version: 1,
      createdAt: new Date().toISOString(),
      originalSize,
      checksum,
      encryptedSize,
      includesSecret: !!secretEncrypted,
      metadata: {
        accountCount,
        settingsCount,
        appVersion: app.getVersion(),
      },
      filePath: join(backupDir, `backup-${Date.now()}-${uuidv4().slice(0, 8)}.enc`),
    };

    // Write backup file
    const backupFileData = {
      version: metadata.version,
      createdAt: metadata.createdAt,
      originalSize: metadata.originalSize,
      checksum: metadata.checksum,
      encryptedData: encrypted,
      includesSecret: metadata.includesSecret,
      secretEncrypted,
      metadata: metadata.metadata,
    };
    writeFileSync(metadata.filePath, JSON.stringify(backupFileData), 'utf8');

    // Save metadata
    this.repo.saveBackupMetadata(metadata);

    return metadata;
  }

  listBackups(): BackupMetadata[] {
    return this.repo.listBackups();
  }

  async restoreBackup(backupId: string, confirm: boolean): Promise<{ success: boolean; restoredTables: string[] }> {
    if (!confirm) {
      throw new Error('Restoration requires explicit confirmation');
    }

    const metadata = this.repo.getBackupById(backupId);
    if (!metadata) {
      throw new Error('Backup not found');
    }

    if (!existsSync(metadata.filePath)) {
      throw new Error('Backup file missing');
    }

    // Read and parse backup file
    const backupFileData = JSON.parse(readFileSync(metadata.filePath, 'utf8'));

    // Verify integrity
    const decryptedData = await this.crypto.decrypt(backupFileData.encryptedData, backupFileData.checksum);

    // Safety: backup current DB before restore
    const dbPath = join(app.getPath('userData'), 'nexoacc.db');
    const safetyBackupPath = `${dbPath}.pre-restore-${Date.now()}`;
    if (existsSync(dbPath)) {
      writeFileSync(safetyBackupPath, readFileSync(dbPath));
    }

    // Write restored DB
    writeFileSync(dbPath, decryptedData);

    // Restore secret if included
    if (backupFileData.includesSecret && backupFileData.secretEncrypted) {
      const { secretDir } = require('../../infrastructure/database/CryptoService');
      const secretPath = join(secretDir(), '.nam-secret');
      const secretDecrypted = decrypt(backupFileData.secretEncrypted);
      writeFileSync(secretPath, secretDecrypted, { mode: 0o600 });
    }

    // Close and reopen DB connection to pick up new data
    const { closeDb } = require('../../infrastructure/database/DatabaseManager');
    closeDb();
    getDb(); // Reinitialize

    return {
      success: true,
      restoredTables: ['accounts', 'recent_games', 'favorite_games', 'settings', 'launch_presets'],
    };
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    return this.repo.deleteBackup(backupId);
  }

  // ============ SCHEDULING ============

  getSchedule(): BackupSchedule | null {
    return this.repo.getSchedule();
  }

  async setSchedule(schedule: BackupSchedule): Promise<void> {
    this.repo.setSchedule(schedule);
    this.restartScheduler();
  }

  getNextScheduledRun(): Date | null {
    const schedule = this.repo.getSchedule();
    if (!schedule || !schedule.enabled) return null;

    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      // Move to next interval
      switch (schedule.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }

    return nextRun;
  }

  private restartScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    const schedule = this.repo.getSchedule();
    if (!schedule || !schedule.enabled) return;

    const checkAndRun = async () => {
      const nextRun = this.getNextScheduledRun();
      if (nextRun && nextRun <= new Date()) {
        try {
          await this.createBackup('Scheduled backup');
          // Update lastRun
          schedule.lastRun = new Date().toISOString();
          schedule.nextRun = this.getNextScheduledRun()?.toISOString();
          this.repo.setSchedule(schedule);
        } catch (e) {
          console.error('[BackupScheduler] Scheduled backup failed:', e);
        }
      }
    };

    // Check every minute
    this.schedulerInterval = setInterval(checkAndRun, 60_000);
    // Run check immediately
    checkAndRun();
  }

  // ============ UTILIDADES ============

  async verifyBackupIntegrity(backupId: string): Promise<boolean> {
    const metadata = this.repo.getBackupById(backupId);
    if (!metadata || !existsSync(metadata.filePath)) return false;

    try {
      const backupFileData = JSON.parse(readFileSync(metadata.filePath, 'utf8'));
      await this.crypto.decrypt(backupFileData.encryptedData, backupFileData.checksum);
      return true;
    } catch {
      return false;
    }
  }

  getBackupStats(): { totalBackups: number; totalSize: number; oldestBackup: string | null; newestBackup: string | null } {
    const backups = this.repo.listBackups();
    if (backups.length === 0) {
      return { totalBackups: 0, totalSize: 0, oldestBackup: null, newestBackup: null };
    }
    const sorted = [...backups].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.encryptedSize, 0),
      oldestBackup: sorted[0].createdAt,
      newestBackup: sorted[sorted.length - 1].createdAt,
    };
  }
}

// Singleton instance
let backupServiceInstance: BackupServiceImpl | null = null;

export function getBackupService(): BackupServiceImpl {
  if (!backupServiceInstance) {
    backupServiceInstance = new BackupServiceImpl();
  }
  return backupServiceInstance;
}