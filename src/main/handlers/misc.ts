import { ipcMain, shell } from 'electron';
import { ok, err, isNonEmptyString, isValidPlaceId, isValidJobId, isPositiveInteger, isBool } from './shared';
import type { NexoApp } from '../main';

export function registerMiscHandlers(app: NexoApp): void {
      ipcMain.handle('theme:get-css', async () => {
        try {
          const css = app.themeService.getThemeCSS();
          return ok(css);
        } catch (e) {
          return err(`Error generando CSS del tema: ${(e as Error).message}`);
        }
      });
      ipcMain.on('cookie:expiring', (event, accountId, hoursLeft) => {
        // Forward to all renderer windows
        app.mainWindow?.webContents.send('cookie:expiring', accountId, hoursLeft);
      });
      ipcMain.on('cookie:expired', (event, accountId) => {
        // Forward to all renderer windows
        app.mainWindow?.webContents.send('cookie:expired', accountId);
      });
      ipcMain.handle('shell:open-external', async (_, url: unknown) => {
        if (!isNonEmptyString(url)) return err('url inválida');
        const allowed = url.trim().startsWith('roblox-player://');
        if (!allowed) return err('Solo URLs roblox-player:// permitidas');
        try {
          await shell.openExternal(url.trim());
          return ok(true);
        } catch (e) {
          return err(`Error abriendo URL: ${(e as Error).message}`);
        }
      });
}
