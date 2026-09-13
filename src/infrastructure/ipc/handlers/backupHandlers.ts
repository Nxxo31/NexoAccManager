// Backup namespace handlers
// Channels: backup:* — create, list, restore, delete, schedule, folder selection

import { ipcMain, dialog } from 'electron';
import { logger } from '../../logging/logger';
import { getBackupService } from '../../services/BackupServiceImpl';
import { ok, err, errMsg } from './shared';

export function registerBackupHandlers(): void {
  const backupService = getBackupService();

  // ============ BACKUP OPERATIONS ============

  ipcMain.handle('backup:create', async (_e, { description, includeSecret }: { description?: string; includeSecret?: boolean }) => {
    try {
      const metadata = await backupService.createBackup(description, includeSecret ?? false);
      return ok(metadata);
    } catch (e) {
      try { logger.error('[backup:create]', e); } catch { /* best-effort */ }
      return err(errMsg(e));
    }
  });

  ipcMain.handle('backup:list', async () => {
    try {
      const backups = backupService.listBackups();
      return ok(backups);
    } catch (e) {
      return err(errMsg(e));
    }
  });

  ipcMain.handle('backup:restore', async (_e, { backupId, confirm }: { backupId: string; confirm: boolean }) => {
    try {
      const result = await backupService.restoreBackup(backupId, confirm);
      return ok(result);
    } catch (e) {
      try { logger.error('[backup:restore]', e); } catch { /* best-effort */ }
      return err(errMsg(e));
    }
  });

  ipcMain.handle('backup:delete', async (_e, { backupId }: { backupId: string }) => {
    try {
      const success = await backupService.deleteBackup(backupId);
      return ok(success);
    } catch (e) {
      return err(errMsg(e));
    }
  });

  ipcMain.handle('backup:verify', async (_e, { backupId }: { backupId: string }) => {
    try {
      const valid = await backupService.verifyBackupIntegrity(backupId);
      return ok(valid);
    } catch (e) {
      return err(errMsg(e));
    }
  });

  // ============ SCHEDULING ============

  ipcMain.handle('backup:schedule:get', async () => {
    try {
      const schedule = backupService.getSchedule();
      const nextRun = backupService.getNextScheduledRun();
      return ok({ schedule, nextRun: nextRun?.toISOString() ?? null });
    } catch (e) {
      return err(errMsg(e));
    }
  });

  ipcMain.handle('backup:schedule:set', async (_e, { enabled, frequency, time }: { enabled: boolean; frequency: 'daily' | 'weekly' | 'monthly'; time: string }) => {
    try {
      // Validate time format HH:mm
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
        return err('Invalid time format. Use HH:mm (24h)');
      }
      const schedule = { enabled, frequency, time };
      await backupService.setSchedule(schedule);
      return ok(schedule);
    } catch (e) {
      return err(errMsg(e));
    }
  });

  // ============ FOLDER SELECTION ============

  ipcMain.handle('backup:select-folder', async () => {
    try {
      const win = require('../IPCAdapter').getMainWindow();
      if (!win) return err('No main window');

      const result = await dialog.showOpenDialog(win, {
        title: 'Seleccionar carpeta de respaldos',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: 'Seleccionar',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return ok(null);
      }

      const path = result.filePaths[0];
      const config = await backupService.setBackupFolder(path);
      return ok(config);
    } catch (e) {
      try { logger.error('[backup:select-folder]', e); } catch { /* best-effort */ }
      return err(errMsg(e));
    }
  });

  ipcMain.handle('backup:folder:get', async () => {
    try {
      const folder = backupService.getBackupFolder();
      return ok(folder);
    } catch (e) {
      return err(errMsg(e));
    }
  });

  // ============ STATS ============

  ipcMain.handle('backup:stats', async () => {
    try {
      const stats = backupService.getBackupStats();
      return ok(stats);
    } catch (e) {
      return err(errMsg(e));
    }
  });
}
