// Settings namespace handlers — local preferences + theme + shell-open-external.
//
// Channels: settings:* (key/value store), theme:* (CSS theme id), and
// shell:open-external (validated https-only external URL opener).

import { ipcMain } from 'electron';
import { SettingsRepositoryImpl } from '../../database/SettingsRepositoryImpl';
import { getTheme, setTheme, type ThemeId } from '../../external/ThemeService';
import { ok, err, errMsg } from './shared';

export function registerSettingsHandlers(): void {
  const settingsRepo = new SettingsRepositoryImpl();

  // ============ SETTINGS ============
  ipcMain.handle('settings:get', async (_e, { key }: { key: string }) => {
    try { return ok(settingsRepo.get(key)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('settings:set', async (_e, { key, value }: { key: string; value: unknown }) => {
    try { settingsRepo.set(key, value); return ok(null); } catch (e) { return err(String(e)); }
  });

  // ============ THEME ============
  ipcMain.handle('theme:get', async () => { try { return ok(getTheme()); } catch (e) { return errMsg(e); } });
  ipcMain.handle('theme:set', async (_e, name: string) => { try { setTheme(name as ThemeId); return ok(name); } catch (e) { return errMsg(e); } });

  // ============ SHELL ============
  ipcMain.handle('shell:open-external', async (_e, { url }: { url: string }) => {
    try {
      // Validate protocol — only HTTPS allowed to mitigate file://, javascript:, smb:// attacks
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return err('Invalid URL');
      }
      if (parsed.protocol !== 'https:') {
        return err('Only https:// URLs are allowed');
      }
      const { shell } = await import('electron');
      await shell.openExternal(url);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
}
