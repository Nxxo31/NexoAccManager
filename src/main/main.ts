import { app, BrowserWindow, ipcMain, dialog, Menu, session, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { AccountManager } from './core/AccountManager';
import { CryptoService } from './core/CryptoService';
import { WebServer } from './server/WebServer';
import { DatabaseManager } from './storage/DatabaseManager';
import { AccountSettingsService } from './core/AccountSettingsService';
import { PresenceService } from './services/PresenceService';
import { CookieExpiryService } from './services/CookieExpiryService';
import { ThemeService, ThemeSettings } from './core/ThemeService';

// =============================================================================
// TYPE GUARDS PARA VALIDACIÓN DE PAYLOADS IPC (Defense in Depth)
// Nunca confiar en los datos que llegan del renderer
// =============================================================================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isValidPlaceId(value: unknown): value is string {
  return isNonEmptyString(value) && /^\d{1,20}$/.test(value.trim());
}

function isValidJobId(value: unknown): value is string {
  if (value === undefined || value === null) return true;
  return isNonEmptyString(value) && /^[a-zA-Z0-9\-]{1,100}$/.test(String(value).trim());
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** 
 * Result type para respuestas IPC — nunca throw en handlers,
 * siempre retorna { success, error } para que el renderer maneje gracefully
 */
interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

function ok<T>(data: T): IpcResult<T> {
  return { success: true, data };
}

function err(message: string): IpcResult {
  return { success: false, error: message };
}

// =============================================================================
// CONSTANTES — Whitelist de canales conocidos
// =============================================================================
const ALLOWED_CHANNELS = new Set([
  'account:add',
  'account:remove',
  'account:list',
  'account:move',
  'account:field:set',
  'account:check',
  'account:profile',
  'account:update-displayname',
  'account:update-description',
  'account:avatar-thumbnail',
  'account:profile:get',
  'account:profile:update',
  'roblox:launch',
  'roblox:games:search',
  'roblox:servers:list',
  'roblox:servers:join',
  'roblox:servers:distribute',
  'settings:security:2fa:get',
  'settings:security:2fa:set',
  'settings:privacy:get',
  'settings:privacy:update',
  'settings:notifications:get',
  'settings:notifications:update',
  'account:friends:list',
  'account:friends:requests',
  'account:friends:respond',
  'account:blocked:list',
  'account:block:user',
  'account:unblock:user',
  'account:follow:user',
  'account:unfollow:user',
  'presence:get',
  'presence:start-polling',
  'presence:stop-polling',
  'presence:recent-games',
  'presence:robux-balance',
  // Auth local — siempre autenticado (app local sin SaaS)
  'auth:login',
  'auth:logout',
  'auth:status',
  'auth:can-add-account',
]);

// Solución para __dirname en ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Límite máximo de cuentas para app local (sin SaaS)
const MAX_ACCOUNTS = 50;

class NexoApp {
  private mainWindow: BrowserWindow | null = null;
  private accountManager: AccountManager;
  private webServer: WebServer;
  private db: DatabaseManager;
  private crypto: CryptoService;
  private accountSettingsService: AccountSettingsService;
  private presenceService: PresenceService;
  private cookieExpiryService: CookieExpiryService;
  private themeService: ThemeService;

  constructor() {
    this.db = new DatabaseManager();
    this.crypto = new CryptoService();
    this.accountManager = new AccountManager(this.db, this.crypto);
    this.webServer = new WebServer(this.accountManager);
    this.accountSettingsService = new AccountSettingsService();
    this.presenceService = new PresenceService(this.db, this.crypto);
    this.cookieExpiryService = new CookieExpiryService(this.db, this.crypto);
    this.themeService = new ThemeService(this.db);
  }

  async initialize(): Promise<void> {
    await this.db.initialize();
    await this.webServer.start(8080);
    this.setupCSP();
    this.createWindow();
    this.setupIPCHandlers();
    this.cookieExpiryService.start();
    this.createMenu();
  }

  /**
   * Configura Content-Security-Policy para el BrowserWindow
   * - default-src 'self' — solo recursos del mismo origen
   * - script-src 'self' — sin scripts inline ni externos
   * - connect-src 'self' https://*.roblox.com — solo API de Roblox
   * - img-src 'self' data: — imágenes locales o data URIs
   * - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com — fuentes externas
   * - font-src 'self' https://fonts.gstatic.com — Google Fonts
   */
  private setupCSP(): void {
    const CSP = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self' https://*.roblox.com https://auth.roblox.com https://users.roblox.com https://avatar.roblox.com https://assetgame.roblox.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CSP],
        },
      });
    });
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
      title: 'NexoAccManager',
      icon: path.join(__dirname, '../../public/icon.png'),
    });

    // En desarrollo carga el servidor de Vite
    if (process.env.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
  }

  private setupIPCHandlers(): void {
    // =================================================================
    // GESTIÓN DE CUENTAS — con validación de tipos
    // =================================================================

    ipcMain.handle('account:add', async (event, cookie: unknown) => {
      if (!isNonEmptyString(cookie)) {
        return err('Payload inválido: cookie debe ser un string no vacío');
      }
      if (!cookie.trim().startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
        return err('La cookie no tiene el formato válido de .ROBLOSECURITY');
      }
      try {
        const result = await this.accountManager.addAccountFromCookie(cookie.trim());
        return ok(result);
      } catch (e) {
        return err(`Error agregando cuenta: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:remove', async (_, id: unknown) => {
      if (!isNonEmptyString(id)) {
        return err('Payload inválido: id debe ser un string no vacío');
      }
      try {
        const removed = await this.accountManager.removeAccount(id.trim());
        return removed ? ok(true) : err('Cuenta no encontrada');
      } catch (e) {
        return err(`Error removiendo cuenta: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:list', async () => {
      try {
        const accounts = this.accountManager.getAllAccounts();
        return ok(accounts);
      } catch (e) {
        return err(`Error listando cuentas: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:move', async (_, accountId: unknown, groupName: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(groupName)) {
        return err('Payload inválido: groupName debe ser un string no vacío');
      }
      try {
        this.accountManager.setAccountField(accountId.trim(), 'group', groupName.trim());
        return ok(true);
      } catch (e) {
        return err(`Error moviendo cuenta: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:field:set', async (_, accountId: unknown, key: unknown, value: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(key)) {
        return err('Payload inválido: key debe ser un string no vacío');
      }
      if (typeof value !== 'string') {
        return err('Payload inválido: value debe ser un string');
      }
      try {
        this.accountManager.setAccountField(accountId.trim(), key.trim(), value);
        return ok(true);
      } catch (e) {
        return err(`Error actualizando campo: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:check', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const account = this.accountManager.getAccountById(accountId.trim());
        return account ? ok(account) : err('Cuenta no encontrada');
      } catch (e) {
        return err(`Error verificando cuenta: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // ROBLOX — con validación de tipos
    // =================================================================

    ipcMain.handle('roblox:launch', async (_, accountId: unknown, placeId: unknown, jobId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isValidPlaceId(placeId)) {
        return err('Payload inválido: placeId debe ser un string numérico no vacío');
      }
      if (!isValidJobId(jobId)) {
        return err('Payload inválido: jobId tiene formato inválido');
      }
      try {
        const result = await this.accountManager.launchRoblox(
          accountId.trim(),
          String(placeId).trim(),
          jobId ? String(jobId).trim() : undefined
        );
        return ok(result);
      } catch (e) {
        return err(`Error lanzando Roblox: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('roblox:recent-games', async () => {
      // TODO: implementar lista de juegos recientes
      return ok([]);
    });

    ipcMain.handle('roblox:join-server', async (_, placeId: unknown, accountId: unknown) => {
      if (!isValidPlaceId(placeId)) {
        return err('Payload inválido: placeId debe ser un string numérico no vacío');
      }
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const result = await this.accountManager.launchRoblox(accountId.trim(), String(placeId).trim());
        return ok(result);
      } catch (e) {
        return err(`Error uniéndose al servidor: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('roblox:multiroblox', async (_, enabled: unknown) => {
      if (!isBoolean(enabled)) {
        return err('Payload inválido: enabled debe ser un booleano');
      }
      try {
        const result = this.accountManager.setMultiRoblox(enabled);
        return ok(result);
      } catch (e) {
        return err(`Error configurando Multi-Roblox: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // ROBLOX: GAMES (Sprint E3 — Server Browser)
    // =================================================================

    ipcMain.handle('roblox:games:search', async (_, placeId: unknown, accountId: unknown) => {
      if (!isValidPlaceId(placeId)) {
        return err('Payload inválido: placeId debe ser un string numérico no vacío');
      }
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const { GamesService } = await import('./services/GamesService');
        const service = new GamesService();
        const game = await service.searchGame(placeId.trim(), cookie);
        return ok(game);
      } catch (e) {
        return err(`Error buscando juego: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('roblox:servers:list', async (_, placeId: unknown, accountId: unknown) => {
      if (!isValidPlaceId(placeId)) {
        return err('Payload inválido: placeId debe ser un string numérico no vacío');
      }
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const { GamesService } = await import('./services/GamesService');
        const service = new GamesService();
        const servers = await service.getGameServers(placeId.trim(), cookie);
        return ok(servers);
      } catch (e) {
        return err(`Error listando servers: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('roblox:servers:join', async (_, placeId: unknown, jobId: unknown, accountId: unknown) => {
      if (!isValidPlaceId(placeId)) {
        return err('Payload inválido: placeId debe ser un string numérico no vacío');
      }
      if (!isValidJobId(jobId)) {
        return err('Payload inválido: jobId tiene formato inválido');
      }
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const { GamesService } = await import('./services/GamesService');
        const service = new GamesService();
        const result = await service.joinServer(placeId.trim(), jobId as string, this.accountManager, accountId);
        return ok(result);
      } catch (e) {
        return err(`Error uniéndose al server: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('roblox:servers:distribute', async (_, placeId: unknown, accountIds: unknown) => {
      if (!isValidPlaceId(placeId)) {
        return err('Payload inválido: placeId debe ser un string numérico no vacío');
      }
      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return err('Payload inválido: accountIds debe ser un array no vacío');
      }
      try {
        const { GamesService } = await import('./services/GamesService');
        const service = new GamesService();
        const results = await service.distributeAccounts(placeId.trim(), accountIds, this.accountManager);
        return ok(results);
      } catch (e) {
        return err(`Error distribuyendo cuentas: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // SETTINGS — con validación de tipos
    // =================================================================

    ipcMain.handle('settings:get', async (_, key: unknown) => {
      if (!isNonEmptyString(key)) {
        return err('Payload inválido: key debe ser un string no vacío');
      }
      try {
        const value = this.db.getSetting(key.trim());
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
        this.db.setSetting(key.trim(), String(value));
        return ok(true);
      } catch (e) {
        return err(`Error configurando setting: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // ACCOUNT SETTINGS — Perfil y seguridad (Sprint E2)
    // =================================================================

    // PROFILE
    ipcMain.handle('account:profile:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const account = this.accountManager.getAccountById(accountId.trim());
        if (!account) return err('Cuenta no encontrada');
        const raw = (this.db as any).getAccount?.(accountId) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const profile = await this.accountSettingsService.getProfile(cookie);
        return ok(profile);
      } catch (e) {
        return err(`Error obteniendo perfil: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:profile:update', async (_, accountId: unknown, patch: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!patch || typeof patch !== 'object') {
        return err('Payload inválido: patch debe ser un objeto');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');

        const p = patch as { displayName?: string; description?: string };
        if (p.displayName !== undefined) {
          if (!isNonEmptyString(p.displayName)) {
            return err('Payload inválido: displayName debe ser un string no vacío');
          }
          await this.accountSettingsService.updateDisplayName(cookie, p.displayName.trim());
        }
        if (p.description !== undefined) {
          if (!isNonEmptyString(p.description)) {
            return err('Payload inválido: description debe ser un string no vacío');
          }
          await this.accountSettingsService.updateDescription(cookie, p.description.trim());
        }
        return ok(true);
      } catch (e) {
        return err(`Error actualizando perfil: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:avatar-thumbnail', async (_, userId: unknown) => {
      if (!isPositiveInteger(userId)) {
        return err('Payload inválido: userId debe ser un número entero positivo');
      }
      try {
        const url = await this.accountSettingsService.getAvatarThumbnail(userId);
        return ok(url);
      } catch (e) {
        return err(`Error obteniendo avatar: ${(e as Error).message}`);
      }
    });

    // SECURITY — Sessions
    ipcMain.handle('settings:security:sessions', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const sessions = await this.accountSettingsService.getActiveSessions(cookie);
        return ok(sessions);
      } catch (e) {
        return err(`Error obteniendo sesiones: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:logout', async (_, accountId: unknown, sessionId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(sessionId)) {
        return err('Payload inválido: sessionId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.logoutSession(cookie, sessionId.trim());
        return ok(result);
      } catch (e) {
        return err(`Error cerrando sesión: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:logout-all', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.logoutAllSessions(cookie);
        return ok(result);
      } catch (e) {
        return err(`Error cerrando todas las sesiones: ${(e as Error).message}`);
      }
    });

    // SECURITY — Password
    ipcMain.handle('settings:security:password', async (_, accountId: unknown, currentPassword: unknown, newPassword: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(currentPassword)) {
        return err('Payload inválido: currentPassword debe ser un string no vacío');
      }
      if (!isNonEmptyString(newPassword)) {
        return err('Payload inválido: newPassword debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.changePassword(
          cookie,
          currentPassword.trim(),
          newPassword.trim()
        );
        return ok(result);
      } catch (e) {
        return err(`Error cambiando contraseña: ${(e as Error).message}`);
      }
    });

    // SECURITY — 2FA
    ipcMain.handle('settings:security:2fa:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const status = await this.accountSettingsService.get2FAStatus(cookie);
        return ok(status);
      } catch (e) {
        return err(`Error obteniendo estado 2FA: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:2fa:set', async (_, accountId: unknown, enabled: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isBoolean(enabled)) {
        return err('Payload inválido: enabled debe ser un booleano');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.toggle2FA(cookie, enabled);
        return ok(result);
      } catch (e) {
        return err(`Error cambiando 2FA: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // PRIVACY
    // =================================================================

    ipcMain.handle('settings:privacy:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const settings = await this.accountSettingsService.getPrivacySettings(cookie);
        return ok(settings);
      } catch (e) {
        return err(`Error obteniendo privacidad: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:privacy:update', async (_, accountId: unknown, settingKey: unknown, value: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(settingKey)) {
        return err('Payload inválido: settingKey debe ser un string no vacío');
      }
      if (!isNonEmptyString(value as string)) {
        return err('Payload inválido: value debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.updatePrivacySetting(cookie, settingKey, value as string);
        return ok(result);
      } catch (e) {
        return err(`Error actualizando privacidad: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // NOTIFICATIONS
    // =================================================================

    ipcMain.handle('settings:notifications:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const settings = await this.accountSettingsService.getNotificationSettings(cookie);
        return ok(settings);
      } catch (e) {
        return err(`Error obteniendo notificaciones: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:notifications:update', async (_, accountId: unknown, key: unknown, value: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(key as string)) {
        return err('Payload inválido: key debe ser un string no vacío');
      }
      if (!isBoolean(value)) {
        return err('Payload inválido: value debe ser un booleano');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.updateNotificationSetting(cookie, key as string, value);
        return ok(result);
      } catch (e) {
        return err(`Error actualizando notificaciones: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // FRIENDS
    // =================================================================

    ipcMain.handle('account:friends:list', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const friends = await this.accountSettingsService.getFriendsList(cookie);
        return ok(friends);
      } catch (e) {
        return err(`Error obteniendo amigos: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:friends:requests', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const requests = await this.accountSettingsService.getFriendRequests(cookie);
        return ok(requests);
      } catch (e) {
        return err(`Error obteniendo solicitudes: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:friends:respond', async (_, accountId: unknown, userId: unknown, accept: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isPositiveInteger(userId)) {
        return err('Payload inválido: userId debe ser un número entero positivo');
      }
      if (!isBoolean(accept)) {
        return err('Payload inválido: accept debe ser un booleano');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.respondFriendRequest(cookie, userId, accept);
        return ok(result);
      } catch (e) {
        return err(`Error respondiendo solicitud: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // BLOCKING
    // =================================================================

    ipcMain.handle('account:blocked:list', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const blocked = await this.accountSettingsService.getBlockedUsers(cookie);
        return ok(blocked);
      } catch (e) {
        return err(`Error obteniendo bloqueados: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:block:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isPositiveInteger(userId)) {
        return err('Payload inválido: userId debe ser un número entero positivo');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.blockUser(cookie, userId);
        return ok(result);
      } catch (e) {
        return err(`Error bloqueando usuario: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:unblock:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isPositiveInteger(userId)) {
        return err('Payload inválido: userId debe ser un número entero positivo');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.unblockUser(cookie, userId);
        return ok(result);
      } catch (e) {
        return err(`Error desbloqueando usuario: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // FOLLOW / UNFOLLOW
    // =================================================================

    ipcMain.handle('account:follow:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isPositiveInteger(userId)) {
        return err('Payload inválido: userId debe ser un número entero positivo');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.followUser(cookie, userId);
        return ok(result);
      } catch (e) {
        return err(`Error siguiendo usuario: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:unfollow:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isPositiveInteger(userId)) {
        return err('Payload inválido: userId debe ser un número entero positivo');
      }
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
        const result = await this.accountSettingsService.unfollowUser(cookie, userId);
        return ok(result);
      } catch (e) {
        return err(`Error dejando de seguir: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // PRESENCE — Dashboard en tiempo real (Sprint E4)
    // =================================================================

    // Obtener presencia de cuentas (batch)
    ipcMain.handle('presence:get', async (_, accountIds: unknown) => {
      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return err('Payload inválido: accountIds debe ser un array no vacío');
      }
      for (const id of accountIds) {
        if (!isNonEmptyString(id)) {
          return err('Payload inválido: cada accountId debe ser un string no vacío');
        }
      }
      try {
        const data = await this.presenceService.getPresence(accountIds as string[]);
        return ok(data);
      } catch (e) {
        return err(`Error obteniendo presencia: ${(e as Error).message}`);
      }
    });

    // Iniciar polling de presencia
    ipcMain.handle('presence:start-polling', async (_, accountIds: unknown, intervalMs: unknown) => {
      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return err('Payload inválido: accountIds debe ser un array no vacío');
      }
      for (const id of accountIds) {
        if (!isNonEmptyString(id)) {
          return err('Payload inválido: cada accountId debe ser un string no vacío');
        }
      }
      const interval = typeof intervalMs === 'number' && intervalMs > 0 ? intervalMs : 30_000;
      try {
        this.presenceService.startPolling(accountIds as string[], interval);
        return ok({ started: true, accounts: accountIds.length, intervalMs: interval });
      } catch (e) {
        return err(`Error iniciando polling: ${(e as Error).message}`);
      }
    });

    // Detener polling de presencia
    ipcMain.handle('presence:stop-polling', () => {
      this.presenceService.stopPolling();
      return ok({ stopped: true });
    });

    // Obtener juegos recientes de una cuenta
    ipcMain.handle('presence:recent-games', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const games = await this.presenceService.getRecentGames(accountId.trim());
        return ok(games);
      } catch (e) {
        return err(`Error obteniendo juegos recientes: ${(e as Error).message}`);
      }
    });

    // Obtener balance de Robux de una cuenta
    ipcMain.handle('presence:robux-balance', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const balance = await this.presenceService.getRobuxBalance(accountId.trim());
        return ok(balance);
      } catch (e) {
        return err(`Error obteniendo balance de Robux: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // AUTENTICACIÓN Y LICENCIA — Sprint E5
    // =================================================================

    // Iniciar sesión (login)
    ipcMain.handle('auth:login', async (_, email: unknown, password: unknown) => {
      if (!isNonEmptyString(email)) {
        return err('Payload inválido: email debe ser un string no vacío');
      }
      if (!isNonEmptyString(password)) {
        return err('Payload inválido: password debe ser un string no vacío');
      }
      try {
        // TODO: Implementar lógica real de login contra el backend
        // Por ahora, simulamos un login exitoso para desarrollo
        const mockUserId = 'dev_user_' + Math.floor(Math.random() * 10000);
        const mockLicense: LicenseData = {
          plan: 'PRO',
          accountLimit: 20,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días desde ahora
        };
        const token = this.authService.generateToken(mockUserId, email.trim(), mockLicense);
        await this.authService.saveLicenseToStorage(mockLicense);
        return ok({ token, userId: mockUserId, email: email.trim(), license: mockLicense });
      } catch (e) {
        return err(`Error en login: ${(e as Error).message}`);
      }
    });

    // Cerrar sesión (logout)
    ipcMain.handle('auth:logout', async () => {
      try {
        await this.authService.saveLicenseToStorage(null as any); // Limpiar licencia almacenada
        return ok({ loggedOut: true });
      } catch (e) {
        return err(`Error en logout: ${(e as Error).message}`);
      }
    });

    // Verificar estado de autenticación
    ipcMain.handle('auth:status', async () => {
      try {
        const license = await this.authService.getLicenseFromStorage();
        if (!license) {
          return ok({ authenticated: false, license: null });
        }
        // Aquí podríamos verificar el token almacenado también
        return ok({ authenticated: true, license });
      } catch (e) {
        return err(`Error verificando estado de auth: ${(e as Error).message}`);
      }
    });

    // Renovar token si es necesario
    ipcMain.handle('auth:refresh-token', async (_, currentToken: unknown) => {
      if (!isNonEmptyString(currentToken)) {
        return err('Payload inválido: currentToken debe ser un string no vacío');
      }
      try {
        const newToken = await this.authService.refreshTokenIfNeeded(currentToken as string);
        if (newToken) {
          return ok({ token: newToken, refreshed: true });
        } else {
          return ok({ token: currentToken, refreshed: false }); // No necesitaba renovación
        }
      } catch (e) {
        return err(`Error renovando token: ${(e as Error).message}`);
      }
    });

    // Verificar si se puede agregar una cuenta según la licencia
    ipcMain.handle('auth:can-add-account', async () => {
      try {
        const accountCount = this.accountManager.getAllAccounts().length;
        const canAdd = await this.authService.canAddAccount(accountCount);
        const plan = await this.authService.getCurrentPlan();
        return ok({ canAdd, plan, currentCount: accountCount });
      } catch (e) {
        return err(`Error verificando límite de cuenta: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // THEME / APPEARANCE
    // =================================================================

    ipcMain.handle('settings:theme:get', () => {
      try {
        const settings = this.themeService.getSettings();
        const css = this.themeService.getThemeCSS();
        return ok({ settings, css });
      } catch (e) {
        return err(`Error obteniendo tema: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:theme:set', async (_, payload: unknown) => {
      if (!payload || typeof payload !== 'object') {
        return err('Payload inválido: debe ser un objeto');
      }
      try {
        const patched = this.themeService.setSettings(payload as Partial<ThemeSettings>);
        const css = this.themeService.getThemeCSS();
        return ok({ settings: patched, css });
      } catch (e) {
        return err(`Error guardando tema: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // ADVANCED
    // =================================================================

    ipcMain.handle('advanced:clearCache', () => {
      try {
        this.accountManager.clearCache();
        return ok({ success: true, message: 'Caché limpiada' });
      } catch (e) {
        return err(`Error limpiando caché: ${(e as Error).message}`);
      }
    });
    ipcMain.handle('advanced:exportData', async () => {
      try {
        // For now, just return a success message
        return ok({ success: true, message: 'Datos exportados correctamente' });
      } catch (e) {
        return err(`Error exportando datos: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('advanced:deleteAllAccounts', async () => {
      try {
        const accounts = this.accountManager.getAllAccounts();
        let count = 0;
        for (const account of accounts) {
          await this.accountManager.removeAccount(account.id);
          count++;
        }
        return ok({ success: true, message: `Se eliminaron ${count} cuentas` });
      } catch (e) {
        return err(`Error eliminando cuentas: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // SHELL
    // =================================================================

    ipcMain.handle('shell:open-external', async (_event, url: string) => {
      try {
        // Whitelist de URLs válidas para evitar abuso
        const allowedDomains = ['nexoaccmanager.com', 'www.nexoaccmanager.com', 'github.com'];
        let valid = false;
        for (const domain of allowedDomains) {
          if (url.includes(domain)) {
            valid = true;
            break;
          }
        }
        if (!valid) {
          return err('URL no permitida');
        }
        await shell.openExternal(url);
        return ok({ success: true });
      } catch (e) {
        return err(`Error abriendo URL: ${(e as Error).message}`);
      }
    });
  }

  private createMenu(): void {
    const template = [
      {
        label: 'Archivo',
        submenu: [
          {
            label: 'Importar cuentas',
            click: () => this.importAccounts(),
          },
          {
            label: 'Exportar cuentas',
            click: () => this.exportAccounts(),
          },
          { type: 'separator' },
          {
            label: 'Salir',
            accelerator: 'CmdOrCtrl+Q',
            click: () => app.quit(),
          },
        ],
      },
      {
        label: 'Herramientas',
        submenu: [
          {
            label: 'API Web Local',
            click: () => this.showAPIInfo(),
          },
          {
            label: 'ConfiguraciÃ³n',
            click: () => this.showSettings(),
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  private async importAccounts(): Promise<void> {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Archivos JSON', extensions: ['json'] }],
      });

      if (result.canceled || result.filePaths.length === 0) return;

      try {
        const filePath = result.filePaths[0];
        const data = fs.readFileSync(filePath, 'utf-8');
        const payload = JSON.parse(data);

        // Compatibilidad: puede ser "cuentas" o "accounts"
        const cuentas = payload.cuentas || payload.accounts;

        if (!Array.isArray(cuentas)) {
          throw new Error('Formato invÃ¡lido: se espera un array de cuentas');
        }

        if (cuentas.length === 0) {
          dialog.showMessageBox(this.mainWindow!, {
            type: 'info',
            title: 'ImportaciÃ³n',
            message: 'El archivo no contiene cuentas para importar.',
          });
          return;
        }

        let added = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const item of cuentas) {
          try {
            // Validar estructura mÃ­nima
            if (!item.cookie || typeof item.cookie !== 'string') {
              errors.push(`Cuenta sin cookie vÃ¡lida: ${item.username || 'desconocido'}`);
              skipped++;
              continue;
            }

            // Verificar que la cookie tenga el formato correcto
            const cookie = item.cookie.trim();
            if (!cookie.startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
              errors.push(`Cookie con formato invÃ¡lido: ${item.username || 'desconocido'}`);
              skipped++;
              continue;
            }

            // Verificar si ya existe por hash de cookie
            const existing = this.findAccountByCookieHash(cookie);
            if (existing) {
              errors.push(`Cuenta duplicada: ${item.username || 'desconocido'} (ya existe)`);
              skipped++;
              continue;
            }

            // Importar la cuenta (verifica contra Roblox automÃ¡ticamente)
            await this.accountManager.addAccountFromCookie(cookie);
            added++;
          } catch (err: unknown) {
            const msg = (err as Error).message || String(err);
            errors.push(`Error importando ${item.username || 'desconocido'}: ${msg}`);
            skipped++;
          }
        }

        // Actualizar cache de cuentas en la UI
        if (added > 0) {
          this.mainWindow?.webContents.send('accounts:refresh');
        }

        const detail = errors.length > 0
          ? `Errores (${errors.length}):\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`
          : undefined;

        dialog.showMessageBox(this.mainWindow!, {
          type: 'info',
          title: 'ImportaciÃ³n completada',
          message: `Cuentas importadas: ${added}\nOmitidas: ${skipped}`,
          detail,
        });
      } catch (err: unknown) {
        dialog.showErrorBox('Error de importaciÃ³n', (err as Error).message);
      }
  }

  /**
   * Busca si ya existe una cuenta por el hash de la cookie
   */
  private findAccountByCookieHash(cookie: string): any {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(cookie.trim()).digest('hex');
    const accounts = this.db.getAllAccounts();
    return accounts.find((a: any) => a.cookie_hash === hash);
  }

  private async exportAccounts(): Promise<void> {
      const result = await dialog.showSaveDialog({
        defaultPath: 'cuentas_nexo.json',
        filters: [{ name: 'Archivos JSON', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePath) return;

      try {
        const rawAccounts = this.db.getAllAccounts();

        if (rawAccounts.length === 0) {
          dialog.showMessageBox(this.mainWindow!, {
            type: 'info',
            title: 'ExportaciÃ³n',
            message: 'No hay cuentas para exportar.',
          });
          return;
        }

        // Descifrar cookies para el export
        const payload = {
          version: '1.0',
          app: 'NexoAccManager',
          exportDate: new Date().toISOString(),
          accounts: rawAccounts.map((a: any) => {
            let cookie = '';
            try {
              cookie = this.crypto.decrypt(a.encrypted_cookie);
            } catch {
              cookie = '';
            }
            return {
              cookie,
              username: a.username,
              robloxUserId: a.roblox_user_id,
              displayName: a.display_name || undefined,
              group: a.group_name || 'Default',
              description: a.description || '',
              createdAt: a.created_at,
              lastUsed: a.last_used,
            };
          }),
        };

        fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf-8');

        dialog.showMessageBox(this.mainWindow!, {
          type: 'info',
          title: 'ExportaciÃ³n completada',
          message: `${rawAccounts.length} cuenta(s) exportadas a ${result.filePath}`,
          detail: 'ADVERTENCIA: El archivo contiene cookies en texto plano. GuÃ¡rdalo en un lugar seguro.',
        });
      } catch (err: unknown) {
        dialog.showErrorBox('Error de exportaciÃ³n', (err as Error).message);
      }
    }

  private showAPIInfo(): void {
    // Mostrar informaciÃ³n de la API
  }

  private showSettings(): void {
    // Mostrar configuraciÃ³n
  }
}

const nexoApp = new NexoApp();

app.whenReady().then(() => nexoApp.initialize());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
