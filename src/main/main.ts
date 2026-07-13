import { app, BrowserWindow, ipcMain, dialog, Menu, session, shell } from 'electron';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { AccountManager } from './core/AccountManager';
import { CryptoService } from './core/CryptoService';
import { DatabaseManager } from './storage/DatabaseManager';
import { AccountSettingsService } from './core/AccountSettingsService';
import { PresenceService } from './services/PresenceService';
import { CookieExpiryService } from './services/CookieExpiryService';
import { ThemeService, ThemeSettings, ThemeId } from './core/ThemeService';

// =============================================================================
// TYPE GUARDS PARA VALIDACIÓN DE PAYLOADS IPC (Defense in Depth)
// Nunca confiar en los datos que llegan del renderer
// =============================================================================

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isBool(value: unknown): value is boolean {
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
]);

// Solución para __dirname en ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Límite máximo de cuentas — 50, hardcoded
const MAX_ACCOUNTS = 50;

class NexoApp {
  private mainWindow: BrowserWindow | null = null;
  private accountManager: AccountManager;
  private db: DatabaseManager;
  private crypto: CryptoService;
  private accountSettingsService: AccountSettingsService;
  presenceService: PresenceService;
  cookieExpiryService: CookieExpiryService;
  private themeService: ThemeService;

  constructor() {
    this.db = new DatabaseManager();
    this.crypto = new CryptoService();
    this.accountManager = new AccountManager(this.db, this.crypto);
    this.accountSettingsService = new AccountSettingsService();
    this.presenceService = new PresenceService(this.db, this.crypto);
    this.cookieExpiryService = new CookieExpiryService(this.db, this.crypto);
    this.themeService = new ThemeService(this.db);
  }

  async initialize(): Promise<void> {
    await this.db.initialize();
    await this.accountManager.init();
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

    ipcMain.handle('account:add', async (event, cookie: unknown, group: unknown) => {
      if (!isNonEmptyString(cookie)) {
        return err('Payload inválido: cookie debe ser un string no vacío');
      }
      if (!cookie.trim().startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
        return err('La cookie no tiene el formato válido de .ROBLOSECURITY');
      }
      try {
        const groupName = isNonEmptyString(group) ? group.trim() : 'Default';
        const result = await this.accountManager.addAccountFromCookie(cookie.trim(), groupName);
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
        // Retornar el array directamente — el renderer espera un array, no un wrapper { success, data }
        return accounts;
      } catch (e) {
        console.error('Error listando cuentas:', e);
        return [];
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
      if (!isBool(enabled)) {
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
        if (p.displayName) {
          const okDisplay = await this.accountSettingsService.updateDisplayName(cookie, p.displayName);
          if (!okDisplay) return err('Error actualizando display name');
        }
        if (p.description !== undefined) {
          const okDesc = await this.accountSettingsService.updateDescription(cookie, p.description);
          if (!okDesc) return err('Error actualizando descripción');
        }
        return ok(true);
      } catch (e) {
        return err(`Error actualizando perfil: ${(e as Error).message}`);
      }
    });

    // SECURITY
    ipcMain.handle('settings:security:password', async (_, accountId: unknown, oldPw: unknown, newPw: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (!isNonEmptyString(oldPw)) return err('oldPw inválido');
      if (!isNonEmptyString(newPw)) return err('newPw inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.changePassword(cookie, oldPw.trim(), newPw.trim());
        return result ? ok(true) : err('Error cambiando contraseña');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:sessions', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const sessions = await this.accountSettingsService.getActiveSessions(cookie);
        return ok(sessions);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:logout', async (_, accountId: unknown, sessionId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (!isNonEmptyString(sessionId)) return err('sessionId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.logoutSession(cookie, sessionId.trim());
        return result ? ok(true) : err('Error cerrando sesión');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:logout-all', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.logoutAllSessions(cookie);
        return result ? ok(true) : err('Error cerrando todas las sesiones');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:avatar-thumbnail', async (_, userId: unknown) => {
      if (typeof userId !== 'number' || !Number.isFinite(userId)) {
        return err('userId debe ser un número válido');
      }
      try {
        const res = await axios.get<{ data: Array<{ imageUrl: string }> }>(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`,
          { timeout: 10_000 }
        );
        const url = res.data.data?.[0]?.imageUrl || null;
        return ok(url);
      } catch (e) {
        return err(`Error obteniendo avatar: ${(e as Error).message}`);
      }
    });

    // PRIVACY
    ipcMain.handle('settings:privacy:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const privacy = await this.accountSettingsService.getPrivacySettings(cookie);
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
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.updatePrivacySetting(cookie, key.trim(), value);
        return result ? ok(true) : err('Error actualizando privacidad');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:2fa:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const data = await this.accountSettingsService.get2FAStatus(cookie);
        return ok(data);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:security:2fa:set', async (_, accountId: unknown, enabled: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (typeof enabled !== 'boolean') return err('enabled debe ser booleano');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.toggle2FA(cookie, enabled);
        return result ? ok(true) : err('Error configurando 2FA');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:notifications:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const data = await this.accountSettingsService.getNotificationSettings(cookie);
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
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.updateNotificationSetting(cookie, key.trim(), value);
        return result ? ok(true) : err('Error actualizando notificación');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    // FRIENDS + BLOCKED
    ipcMain.handle('account:friends:list', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const friends = await this.accountSettingsService.getFriendsList(cookie);
        return ok(friends);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:friends:requests', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const requests = await this.accountSettingsService.getFriendRequests(cookie);
        return ok(requests);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:friends:respond', async (_, accountId: unknown, userId: unknown, accept: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
      if (typeof accept !== 'boolean') return err('accept debe ser booleano');
      // El servicio acepta number como userId
      const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
      if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.respondFriendRequest(cookie, userIdNumber, accept);
        return result ? ok(true) : err('Error respondiendo solicitud');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:blocked:list', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const blocked = await this.accountSettingsService.getBlockedUsers(cookie);
        return ok(blocked);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:block:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
      const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
      if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.blockUser(cookie, userIdNumber);
        return result ? ok(true) : err('Error bloqueando usuario');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:unblock:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
      const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
      if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.unblockUser(cookie, userIdNumber);
        return result ? ok(true) : err('Error desbloqueando usuario');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:follow:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
      const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
      if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.followUser(cookie, userIdNumber);
        return result ? ok(true) : err('Error siguiendo usuario');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('account:unfollow:user', async (_, accountId: unknown, userId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
      const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
      if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
      try {
        const raw = (this.db as any).getAccount?.(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.unfollowUser(cookie, userIdNumber);
        return result ? ok(true) : err('Error dejando de seguir usuario');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    // PRESENCE
    ipcMain.handle('presence:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const presence = await this.presenceService.getPresence([accountId.trim()]);
        return ok(presence);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('presence:start-polling', async (_, accountIds: unknown, intervalMs: unknown) => {
      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return err('Payload inválido: accountIds debe ser un array no vacío');
      }
      if (intervalMs !== undefined && typeof intervalMs !== 'number') {
        return err('Payload inválido: intervalMs debe ser number o undefined');
      }
      try {
        const ids = accountIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
        if (ids.length === 0) return err('Ningún accountId válido');
        const interval = typeof intervalMs === 'number' && intervalMs > 0 ? intervalMs : undefined;
        this.presenceService.startPolling(ids, interval as number);
        return ok(true);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('presence:stop-polling', async () => {
      try {
        this.presenceService.stopPolling();
        return ok(true);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('presence:recent-games', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const games = await this.presenceService.getRecentGames(accountId.trim());
        return ok(games);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('presence:robux-balance', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const balance = await this.presenceService.getRobuxBalance(accountId.trim());
        return ok(balance);
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // TEMAS — sistema de themes
    // =================================================================

    // El preload expone 'settings:theme:get' como canal de consulta
    ipcMain.handle('settings:theme:get', async () => {
      try {
        const settings = this.themeService.getSettings();
        const css = this.themeService.getThemeCSS();
        // Retornar directamente { settings, css } — sin wrapper ok()
        return { settings, css };
      } catch (e) {
        console.error('Error obteniendo tema:', e);
        return null;
      }
    });

    // El preload expone 'settings:theme:set' con un objeto settings
    ipcMain.handle('settings:theme:set', async (_, settings: unknown) => {
      if (!settings || typeof settings !== 'object') {
        return null;
      }
      try {
        const s = settings as Record<string, unknown>;
        const patch: Partial<ThemeSettings> = {};
        if (typeof s.theme === 'string') {
          const validThemes: ThemeId[] = ['dark', 'light', 'roblox-classic', 'custom'];
          if (!validThemes.includes(s.theme as ThemeId)) {
            return null;
          }
          patch.theme = s.theme as ThemeId;
        }
        if (typeof s.fontSize === 'string') {
          if (!['small', 'medium', 'large'].includes(s.fontSize)) {
            return null;
          }
          patch.fontSize = s.fontSize as ThemeSettings['fontSize'];
        }
        if (typeof s.uiDensity === 'string') {
          if (!['compact', 'normal', 'spacious'].includes(s.uiDensity)) {
            return null;
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
        const merged = this.themeService.setSettings(patch);
        const css = this.themeService.getThemeCSS();
        // Retornar { settings, css } — sin wrapper
        return { settings: merged, css };
      } catch (e) {
        console.error('Error configurando tema:', e);
        return null;
      }
    });

    ipcMain.handle('theme:get-css', async () => {
      try {
        const css = this.themeService.getThemeCSS();
        return ok(css);
      } catch (e) {
        return err(`Error generando CSS del tema: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // i18n — sistema de idioma
    // =================================================================

    ipcMain.handle('settings:language:get', async () => {
      try {
        const lang = this.db.getSetting('language') || 'es';
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
        this.db.setSetting('language', lang.trim());
        return ok(true);
      } catch (e) {
        return err(`Error configurando idioma: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // AVANZADO — utilidades
    // =================================================================

    // 'advanced:exportData' — exporta datos de cuentas manuales desde getAllAccounts()
    ipcMain.handle('advanced:exportData', async () => {
      try {
        const accounts = this.accountManager.getAllAccounts();
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

    // 'advanced:deleteAllAccounts' — borra cada cuenta con deleteAccount(id)
    ipcMain.handle('advanced:deleteAllAccounts', async () => {
      try {
        const accounts = this.accountManager.getAllAccounts();
        let deleted = 0;
        for (const account of accounts) {
          try {
            this.db.deleteAccount(account.id);
            deleted++;
          } catch (accountErr) {
            console.error(`[advanced:deleteAllAccounts] Error borrando cuenta ${account.id}:`, accountErr);
          }
        }
        // Refrescar el caché del AccountManager
        (this.accountManager as any).updateCachedAccounts?.();
        return ok({ deleted, total: accounts.length });
      } catch (e) {
        return err(`Error borrando datos locales: ${(e as Error).message}`);
      }
    });

    // 'advanced:clearCache' — no-op seguro para caché de friends (CookieExpiryService no tiene clearCache)
    ipcMain.handle('advanced:clearCache', async () => {
      try {
        // El método privado friendsCache.clear() no es accesible públicamente,
        // así que lo invocamos vía bracket access defensivo; si no existe, no-op.
        const service = this.accountSettingsService as unknown as {
          friendsCache?: { clear(): void };
        };
        service.friendsCache?.clear?.();
        return ok(true);
      } catch (e) {
        return err(`Error limpiando caché: ${(e as Error).message}`);
      }
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

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'NexoAccManager',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'Editar',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'Ver',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

let appInstance: NexoApp;

app.whenReady().then(async () => {
  appInstance = new NexoApp();
  await appInstance.initialize();
});

app.on('window-all-closed', () => {
  if (appInstance) {
    try {
      appInstance.presenceService?.cleanup();
      appInstance.cookieExpiryService?.stop?.();
    } catch { /* ignore on quit */ }
  }
  app.quit();
});

app.on('activate', () => {
  // macOS: recrear ventana cuando dock icon se clickea
  if (appInstance) {
    // La ventana ya existe, solo se reabre
  }
});
