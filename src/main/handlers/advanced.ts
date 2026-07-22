import { ipcMain } from 'electron';
import { ok, err } from './shared';
import type { NexoApp } from '../main';

export function registerAdvancedHandlers(app: NexoApp): void {
      ipcMain.handle('advanced:exportData', async () => {
        try {
          const accounts = app.accountManager.getAllAccounts();
          const data = {
            version: 2,
            exportedAt: new Date().toISOString(),
            accounts,
          };
          return ok(data);
        } catch (e) {
          return err(`Error exportando datos: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('advanced:deleteAllAccounts', async () => {
        try {
          const accounts = app.accountManager.getAllAccounts();
          let deleted = 0;
          for (const account of accounts) {
            try {
              app.db.deleteAccount(account.id);
              deleted++;
            } catch (accountErr) {
              console.error(`[advanced:deleteAllAccounts] Error borrando cuenta ${account.id}:`, accountErr);
            }
          }
          // Refrescar el caché del AccountManager
          (app.accountManager as any).updateCachedAccounts?.();
          return ok({ deleted, total: accounts.length });
        } catch (e) {
          return err(`Error borrando datos locales: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('advanced:clearCache', async () => {
        try {
          // El método privado friendsCache.clear() no es accesible públicamente,
          // así que lo invocamos vía bracket access defensivo; si no existe, no-op.
          const service = app.accountSettingsService as unknown as {
            friendsCache?: { clear(): void };
          };
          service.friendsCache?.clear?.();
          return ok(true);
        } catch (e) {
          return err(`Error limpiando caché: ${(e as Error).message}`);
        }
      });
}
