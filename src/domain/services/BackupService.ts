// Domain Service: BackupService Interface
// Lógica pura de negocio para respaldos - sin dependencias de infraestructura

import type { BackupMetadata, BackupSchedule, BackupFolderConfig } from '../entities/BackupMetadata';

export interface BackupRepository {
  getBackupFolder(): BackupFolderConfig | null;
  setBackupFolder(config: BackupFolderConfig): void;
  listBackups(): BackupMetadata[];
  getBackupById(id: string): BackupMetadata | null;
  deleteBackup(id: string): boolean;
  saveBackupMetadata(metadata: BackupMetadata): void;
  getSchedule(): BackupSchedule | null;
  setSchedule(schedule: BackupSchedule): void;
}

export interface BackupCrypto {
  encrypt(data: Buffer): Promise<{ encrypted: string; checksum: string }>;
  decrypt(encryptedData: string, expectedChecksum: string): Promise<Buffer>;
}

export interface BackupService {
  // Configuración
  getBackupFolder(): BackupFolderConfig | null;
  setBackupFolder(path: string): Promise<BackupFolderConfig>;

  // Operaciones de backup
  createBackup(description?: string, includeSecret?: boolean): Promise<BackupMetadata>;
  listBackups(): BackupMetadata[];
  restoreBackup(backupId: string, confirm: boolean): Promise<{ success: boolean; restoredTables: string[] }>;
  deleteBackup(backupId: string): Promise<boolean>;

  // Scheduling
  getSchedule(): BackupSchedule | null;
  setSchedule(schedule: BackupSchedule): Promise<void>;
  getNextScheduledRun(): Date | null;

  // Utilidades
  verifyBackupIntegrity(backupId: string): Promise<boolean>;
  getBackupStats(): { totalBackups: number; totalSize: number; oldestBackup: string | null; newestBackup: string | null };
}