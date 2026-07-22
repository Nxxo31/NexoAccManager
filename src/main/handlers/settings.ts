import { ipcMain } from 'electron';
import { ThemeSettings, ThemeId } from '../core/ThemeService';
import { ok, err, isNonEmptyString, isValidPlaceId, isValidJobId, isPositiveInteger, isBool } from './shared';
import type { NexoApp } from '../main';

export function registerSettingsHandlers(app: NexoApp): void {
      ipcMain.handle('settings:get', async (_, key: unknown) => {
        if (!isNonEmptyString(key)) {
          return err('Payload inválido: key debe ser un string no vacío');
        }
        try {
          const value = app.db.getSetting(key.trim());
          return ok(value);
        } catch (e) {
          return err(`Error obteniendo setting: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:set', async (_, key: unknown, value: unknown) => {
        if (!isNonEmptyString(key)) {
          return err('Payload inválido: key debe ser un string no vacío');
        }
        if (value === undefined) {
          return err('Payload inválido: value no puede ser undefined');
        }
        try {
          app.db.setSetting(key.trim(), String(value));
          return ok(true);
        } catch (e) {
          return err(`Error configurando setting: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:security:password', async (_, accountId: unknown, oldPw: unknown, newPw: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (!isNonEmptyString(oldPw)) return err('oldPw inválido');
        if (!isNonEmptyString(newPw)) return err('newPw inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.changePassword(cookie, oldPw.trim(), newPw.trim());
          return result ? ok(true) : err('Error cambiando contraseña');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:security:sessions', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const sessions = await app.accountSettingsService.getActiveSessions(cookie);
          return ok(sessions);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:security:logout', async (_, accountId: unknown, sessionId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (!isNonEmptyString(sessionId)) return err('sessionId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.logoutSession(cookie, sessionId.trim());
          return result ? ok(true) : err('Error cerrando sesión');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:security:logout-all', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.logoutAllSessions(cookie);
          return result ? ok(true) : err('Error cerrando todas las sesiones');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:privacy:get', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const privacy = await app.accountSettingsService.getPrivacySettings(cookie);
          return ok(privacy);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:privacy:update', async (_, accountId: unknown, key: unknown, value: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (!isNonEmptyString(key)) return err('key inválido');
        if (typeof value !== 'string') return err('value debe ser string');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.updatePrivacySetting(cookie, key.trim(), value);
          return result ? ok(true) : err('Error actualizando privacidad');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:security:2fa:get', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const data = await app.accountSettingsService.get2FAStatus(cookie);
          return ok(data);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:security:2fa:set', async (_, accountId: unknown, enabled: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (typeof enabled !== 'boolean') return err('enabled debe ser booleano');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.toggle2FA(cookie, enabled);
          return result ? ok(true) : err('Error configurando 2FA');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:notifications:get', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const data = await app.accountSettingsService.getNotificationSettings(cookie);
          return ok(data);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:notifications:update', async (_, accountId: unknown, key: unknown, value: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (!isNonEmptyString(key)) return err('key inválido');
        if (typeof value !== 'boolean') return err('value debe ser booleano');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.updateNotificationSetting(cookie, key.trim(), value);
          return result ? ok(true) : err('Error actualizando notificación');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:theme:get', async () => {
        try {
          const settings = app.themeService.getSettings();
          const css = app.themeService.getThemeCSS();
          return ok({ settings, css });
        } catch (e) {
          return err(`Error obteniendo tema: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:theme:set', async (_, settings: unknown) => {
        if (!settings || typeof settings !== 'object') {
          return err('Payload inválido: settings debe ser un objeto');
        }
        try {
          const s = settings as Record<string, unknown>;
          const patch: Partial<ThemeSettings> = {};
          if (typeof s.theme === 'string') {
            const validThemes: ThemeId[] = ['dark', 'light', 'roblox-classic', 'custom'];
            if (!validThemes.includes(s.theme as ThemeId)) {
              return err(`Tema no válido: ${s.theme}. Válidos: ${validThemes.join(', ')}`);
            }
            patch.theme = s.theme as ThemeId;
          }
          if (typeof s.fontSize === 'string') {
            if (!['small', 'medium', 'large'].includes(s.fontSize)) {
              return err(`fontSize no válido: ${s.fontSize}. Válidos: small, medium, large`);
            }
            patch.fontSize = s.fontSize as ThemeSettings['fontSize'];
          }
          if (typeof s.uiDensity === 'string') {
            if (!['compact', 'normal', 'spacious'].includes(s.uiDensity)) {
              return err(`uiDensity no válido: ${s.uiDensity}. Válidos: compact, normal, spacious`);
            }
            patch.uiDensity = s.uiDensity as ThemeSettings['uiDensity'];
          }
          if (typeof s.animationsEnabled === 'boolean') {
            patch.animationsEnabled = s.animationsEnabled;
          }
          if (typeof s.primaryColor === 'string') {
            patch.primaryColor = s.primaryColor;
          }
          if (typeof s.accentColor === 'string') {
            patch.accentColor = s.accentColor;
          }
          const merged = app.themeService.setSettings(patch);
          const css = app.themeService.getThemeCSS();
          return ok({ settings: merged, css });
        } catch (e) {
          return err(`Error configurando tema: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:language:get', async () => {
        try {
          const lang = app.db.getSetting('language') || 'es';
          return ok(lang);
        } catch (e) {
          return err(`Error obteniendo idioma: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:language:set', async (_, lang: unknown) => {
        if (!isNonEmptyString(lang)) return err('lang inválido');
        const valid = ['es', 'en', 'pt'];
        if (!valid.includes(lang.trim())) return err(`Idioma no soportado: ${lang}. Válidos: ${valid.join(', ')}`);
        try {
          app.db.setSetting('language', lang.trim());
          return ok(true);
        } catch (e) {
          return err(`Error configurando idioma: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:autoRelaunch:get', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const account = app.accountManager.getAccountById(accountId);
          if (!account) return err('Cuenta no encontrada');
          return ok({ autoRelaunch: account.autoRelaunch ?? false });
        } catch (e) {
          return err(`Error obteniendo autoRelaunch: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:autoRelaunch:set', async (_, payload: unknown) => {
        if (!payload || typeof payload !== 'object') return err('payload inválido');
        const { accountId, enabled } = payload as { accountId: string; enabled: boolean };
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (typeof enabled !== 'boolean') return err('enabled debe ser boolean');
        try {
          const account = app.accountManager.getAccountById(accountId);
          if (!account) return err('Cuenta no encontrada');
          app.db.updateAccountField(accountId, 'autoRelaunch', String(enabled));
          app.accountManager.setAccountField(accountId, 'autoRelaunch', String(enabled));
          return ok(true);
        } catch (e) {
          return err(`Error configurando autoRelaunch: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:connectionWatcher:get', async () => {
        try {
          const enabled = app.db.getSetting('connectionWatcher') === 'true';
          return ok(enabled);
        } catch (e) {
          return err(`Error obteniendo connectionWatcher: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:connectionWatcher:set', async (_, enabled: unknown) => {
        if (typeof enabled !== 'boolean') return err('enabled debe ser boolean');
        try {
          app.db.setSetting('connectionWatcher', String(enabled));
          return ok(true);
        } catch (e) {
          return err(`Error configurando connectionWatcher: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:preventDuplicateInstances:get', async () => {
        try {
          const enabled = app.db.getSetting('preventDuplicateInstances') === 'true';
          return ok(enabled);
        } catch (e) {
          return err(`Error obteniendo preventDuplicateInstances: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:preventDuplicateInstances:set', async (_, enabled: unknown) => {
        if (typeof enabled !== 'boolean') return err('enabled debe ser boolean');
        try {
          app.db.setSetting('preventDuplicateInstances', String(enabled));
          return ok(true);
        } catch (e) {
          return err(`Error configurando preventDuplicateInstances: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:webapi:get', async () => {
        try {
          const enabled = app.db.getSetting('webApiEnabled') === 'true';
          const port = parseInt(app.db.getSetting('webApiPort') || '8080', 10);
          return ok({ enabled, port });
        } catch (e) {
          return err(`Error obteniendo Web API config: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('settings:webapi:set', async (_, enabled: unknown, port: unknown) => {
        if (typeof enabled !== 'boolean') return err('enabled debe ser boolean');
        if (port !== undefined && (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535)) {
          return err('port debe ser entero 1-65535');
        }
        try {
          app.db.setSetting('webApiEnabled', String(enabled));
          if (port !== undefined) app.db.setSetting('webApiPort', String(port));
          return ok(true);
        } catch (e) {
          return err(`Error configurando Web API: ${(e as Error).message}`);
        }
      });
}
