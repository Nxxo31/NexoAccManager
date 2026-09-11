// Infrastructure: BackupRepositoryImpl
// Implementación filesystem del repositorio de backups

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import crypto from 'node:crypto';
import type { BackupMetadata, BackupSchedule, BackupFolderConfig } from '../../domain/entities/BackupMetadata';
import type { BackupRepository } from '../../domain/services/BackupService';
import { encrypt, decrypt } from '../database/CryptoService';
import { SettingsRepositoryImpl } from '../database/SettingsRepositoryImpl';

const METADATA_FILE = 'backup-metadata.json';
const SCHEDULE_KEY = 'backup.schedule';
const FOLDER_KEY = 'backup.folder';

export class BackupRepositoryImpl implements BackupRepository {
  private metadataCache: BackupMetadata[] | null = null;

  private getBackupDir(): string {
    const folder = this.getBackupFolder();
    if (folder) return folder.path;
    // Default: userData/backups
    const userData = app.getPath('userData');
    const dir = join(userData, 'backups');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  private getMetadataPath(): string {
    return join(this.getBackupDir(), METADATA_FILE);
  }

  private loadMetadata(): BackupMetadata[] {
    if (this.metadataCache) return this.metadataCache;
    const path = this.getMetadataPath();
    if (!existsSync(path)) {
      this.metadataCache = [];
      return this.metadataCache;
    }
    try {
      const data = JSON.parse(readFileSync(path, 'utf8')) as BackupMetadata[];
      this.metadataCache = data;
      return this.metadataCache;
    } catch {
      this.metadataCache = [];
      return this.metadataCache;
    }
  }

  private saveMetadata(metadata: BackupMetadata[]): void {
    this.metadataCache = metadata;
    writeFileSync(this.getMetadataPath(), JSON.stringify(metadata, null, 2), 'utf8');
  }

  getBackupFolder(): BackupFolderConfig | null {
    const settings = new SettingsRepositoryImpl();
    const stored = settings.get<BackupFolderConfig>(FOLDER_KEY);
    return stored ?? null;
  }

  setBackupFolder(config: BackupFolderConfig): void {
    const settings = new SettingsRepositoryImpl();
    settings.set(FOLDER_KEY, config);
    this.metadataCache = null; // Invalidate cache since folder changed
  }

  listBackups(): BackupMetadata[] {
    const metadata = this.loadMetadata();
    // Verify files still exist
    return metadata.filter(m => existsSync(m.filePath));
  }

  getBackupById(id: string): BackupMetadata | null {
    return this.loadMetadata().find(m => m.id === id) ?? null;
  }

  deleteBackup(id: string): boolean {
    const metadata = this.loadMetadata();
    const idx = metadata.findIndex(m => m.id === id);
    if (idx === -1) return false;
    const backup = metadata[idx];
    try {
      if (existsSync(backup.filePath)) rmSync(backup.filePath);
      metadata.splice(idx, 1);
      this.saveMetadata(metadata);
      return true;
    } catch {
      return false;
    }
  }

  saveBackupMetadata(metadata: BackupMetadata): void {
    const all = this.loadMetadata();
    const idx = all.findIndex(m => m.id === metadata.id);
    if (idx >= 0) all[idx] = metadata;
    else all.push(metadata);
    this.saveMetadata(all);
  }

  getSchedule(): BackupSchedule | null {
    const settings = new SettingsRepositoryImpl();
    return settings.get<BackupSchedule>(SCHEDULE_KEY) ?? null;
  }

  setSchedule(schedule: BackupSchedule): void {
    const settings = new SettingsRepositoryImpl();
    settings.set(SCHEDULE_KEY, schedule);
  }
}

export class BackupCryptoImpl {
  private hashData(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async encrypt(data: Buffer): Promise<{ encrypted: string; checksum: string }> {
    const checksum = this.hashData(data);
    const encrypted = encrypt(data.toString('base64'));
    return { encrypted, checksum };
  }

  async decrypt(encryptedData: string, expectedChecksum: string): Promise<Buffer> {
    const decrypted = decrypt(encryptedData);
    const data = Buffer.from(decrypted, 'base64');
    const actualChecksum = this.hashData(data);
    if (actualChecksum !== expectedChecksum) {
      throw new Error('Checksum mismatch — backup may be corrupted or tampered');
    }
    return data;
  }
}