// Infrastructure Service: BackupServiceImpl
// Implementación completa del servicio de backups.
// Hexagonalidad: vive en infrastructure/ (no en domain/) porque depende
// de fs, path, electron app, y repositorios de SQLite. La interface
// BackupService vive en domain/services/BackupService.ts (pura).

import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { app } from 'electron';
import { getDb, closeDb } from '../database/DatabaseManager';
import { BackupRepositoryImpl, BackupCryptoImpl } from '../database/BackupRepositoryImpl';
import { encrypt, decrypt, secretDir } from '../database/CryptoService';
import { logger } from '../logging/logger';
import type { BackupMetadata, BackupSchedule, BackupFolderConfig } from '../../domain/entities/BackupMetadata';
import type { BackupService, BackupRepository, BackupCrypto } from '../../domain/services/BackupService';

/**
 * Atomic file write: write to temp + rename. Si el proceso muere durante
 * el write, el archivo original (o nada) queda intacto.
 */
function atomicWriteFileSync(path: string, data: string | Buffer): void {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  try {
    writeFileSync(tmp, data);
    renameSync(tmp, path);
  } catch (e) {
    try { unlinkSync(tmp); } catch { /* ignore */ }
    throw e;
  }
}

/**
 * Paths que NUNCA deben aceptarse como backup folder (defense-in-depth
 * contra selección accidental del dialog). Comparación case-insensitive
 * en Windows.
 */
const FORBIDDEN_BACKUP_PATHS_WIN = [
  normalize('C:\\Windows'),
  normalize('C:\\Windows\\System32'),
  normalize('C:\\Program Files'),
  normalize('C:\\Program Files (x86)'),
  normalize('C:\\ProgramData'),
];
const FORBIDDEN_BACKUP_PATHS_NIX = ['/etc', '/usr', '/bin', '/sbin', '/var', '/boot', '/root'];

function isSystemPath(target: string): boolean {
  const n = normalize(target).toLowerCase();
  const list = process.platform === 'win32' ? FORBIDDEN_BACKUP_PATHS_WIN : FORBIDDEN_BACKUP_PATHS_NIX;
  return list.some((p) => n === p.toLowerCase() || n.startsWith(p.toLowerCase() + sep));
}

export class BackupServiceImpl implements BackupService {
  private repo: BackupRepository;
  private crypto: BackupCrypto;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(repo?: BackupRepository, crypto?: BackupCrypto) {
    this.repo = repo ?? new BackupRepositoryImpl();
    this.crypto = crypto ?? new BackupCryptoImpl();
  }

  // ============ CONFIGURACIÓN ============

  getBackupFolder(): BackupFolderConfig | null {
    return this.repo.getBackupFolder();
  }

  async setBackupFolder(path: string): Promise<BackupFolderConfig> {
    if (typeof path !== 'string' || !path.trim()) {
      throw new Error('Path invalido');
    }
    if (isSystemPath(path)) {
      throw new Error(`Path de sistema no permitido como backup folder: ${path}`);
    }
    const config: BackupFolderConfig = {
      path,
      lastSelectedAt: new Date().toISOString(),
    };
    this.repo.setBackupFolder(config);
    return config;
  }

  async selectBackupFolder(): Promise<BackupFolderConfig | null> {
    // El dialog real vive en backupHandlers.ts:89 (showOpenDialog).
    // Aqui solo devolvemos el folder configurado actualmente.
    return this.repo.getBackupFolder();
  }

  // ============ OPERACIONES DE BACKUP ============

  async createBackup(description?: string, includeSecret: boolean = false): Promise<BackupMetadata> {
    const backupDir = this.repo.getBackupFolder()?.path ?? join(app.getPath('userData'), 'backups');
    if (!existsSync(backupDir)) {
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

    // Write backup file (atomic)
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
    atomicWriteFileSync(metadata.filePath, JSON.stringify(backupFileData));

    // Save metadata
    this.repo.saveBackupMetadata(metadata);

    return metadata;
  }

  listBackups(): BackupMetadata[] {
    return this.repo.listBackups();
  }

  async restoreBackup(
    backupId: string,
    confirm: boolean,
    options?: { forceOverwriteSecret?: boolean },
  ): Promise<{ success: boolean; restoredTables: string[] }> {
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

    const dbPath = join(app.getPath('userData'), 'nexoacc.db');

    // GUARD CRÍTICO: si el backup incluye .nam-secret y hay cuentas locales,
    // el restore sobreescribe el secret y deja TODAS las cuentas locales
    // ilegibles (GCM auth tag mismatch). Forzar confirmación explícita.
    if (backupFileData.includesSecret && backupFileData.secretEncrypted) {
      const db = getDb();
      const localAccountCount = (db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number }).count;
      if (localAccountCount > 0 && !options?.forceOverwriteSecret) {
        throw new Error(
          `Restaurar un backup con .nam-secret destruiria ${localAccountCount} cuenta(s) local(es) ` +
          `(cifradas con el secret actual). Confirmar con forceOverwriteSecret=true si es intencional.`,
        );
      }
    }

    // Safety: backup current DB before restore (atomic, no clobber)
    const safetyBackupPath = `${dbPath}.pre-restore-${Date.now()}`;
    if (existsSync(dbPath)) {
      atomicWriteFileSync(safetyBackupPath, readFileSync(dbPath));
    }

    // Write restored DB (atomic — si crash, queda DB original o nueva completa, nunca parcial)
    atomicWriteFileSync(dbPath, decryptedData);

    // Restore secret if included
    if (backupFileData.includesSecret && backupFileData.secretEncrypted) {
      const secretPath = join(secretDir(), '.nam-secret');
      const secretDecrypted = decrypt(backupFileData.secretEncrypted);
      atomicWriteFileSync(secretPath, secretDecrypted);
      // Restore file mode 0o600 (secret)
      try { writeFileSync(secretPath, secretDecrypted, { mode: 0o600 }); } catch { /* best-effort on Windows */ }
    }

    // Close and reopen DB connection to pick up new data
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
    const nextRun = new Date();
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
          logger.error('[BackupScheduler] Scheduled backup failed:', e);
        }
      }
    };

    // Check every minute. .unref() permite que el main process termine
    // limpiamente si no hay otras handles activas.
    this.schedulerInterval = setInterval(checkAndRun, 60_000);
    this.schedulerInterval.unref();
    // Run check immediately
    checkAndRun();
  }

  /**
   * Llamado por app.on('before-quit') para limpiar timers.
   * Sin esto el setInterval mantiene el main process vivo despues de cerrar la ventana.
   */
  shutdown(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
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

/** Reset singleton — usar solo en tests. */
export function resetBackupServiceInstance(): void {
  if (backupServiceInstance) {
    backupServiceInstance.shutdown();
  }
  backupServiceInstance = null;
}