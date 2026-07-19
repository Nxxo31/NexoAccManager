import { app, BrowserWindow, ipcMain, Menu, session, shell } from 'electron';
import axios from 'axios';
import path from 'path';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { AccountManager } from './core/AccountManager';
import { AccountSettingsService } from './core/AccountSettingsService';
import { CryptoService } from './core/CryptoService';
import { DatabaseManager } from './storage/DatabaseManager';
import { PresenceService } from './services/PresenceService';
import { BottingService } from './services/BottingService';
import { GamesService } from './services/GamesService';
import { CookieExpiryService } from './services/CookieExpiryService';
import { ThemeService, ThemeSettings, ThemeId } from './core/ThemeService';
import { MultiRobloxService } from './core/MultiRobloxService';
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
// CONSTANTES
// =============================================================================

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
    private presenceService: PresenceService;
    private bottingService: BottingService;
    private cookieExpiryService: CookieExpiryService;
    private themeService: ThemeService;
    private gamesService: GamesService;
    private multiRobloxService: MultiRobloxService;

  constructor() {
    this.db = new DatabaseManager();
    this.crypto = new CryptoService();
    this.accountManager = new AccountManager(this.db, this.crypto);
    this.accountSettingsService = new AccountSettingsService();
    this.multiRobloxService = new MultiRobloxService();
    this.presenceService = new PresenceService(this.db, this.crypto);
    this.bottingService = new BottingService(this.accountManager, this.presenceService);
    this.cookieExpiryService = new CookieExpiryService(this.db, this.crypto);
    this.themeService = new ThemeService(this.db);
    this.gamesService = new GamesService();
  }

  cleanup(): void {
    try {
      this.presenceService?.cleanup?.();
    } catch { /* ignore */ }
    try {
      this.cookieExpiryService?.stop?.();
    } catch { /* ignore */ }
    try {
      this.bottingService?.stop?.();
    } catch { /* ignore */ }
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

    // Logging de errores del renderer al main process console
    this.mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      const levelStr = ['verbose', 'info', 'warning', 'error'][level] || 'unknown';
      console.log(`[Renderer:${levelStr}] ${message} (${sourceId}:${line})`);
    });

    this.mainWindow.webContents.on('render-process-gone', (_event, details) => {
      console.error(`[Renderer CRASH] reason=${details.reason} exitCode=${details.exitCode}`);
    });

    this.mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.error(`[Renderer LOAD FAIL] code=${errorCode} desc=${errorDescription} url=${validatedURL}`);
    });
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
      // Validar límite máximo de cuentas
      if (this.accountManager.getAllAccounts().length >= MAX_ACCOUNTS) {
        return err(`Límite máximo de ${MAX_ACCOUNTS} cuentas alcanzado. Elimina algunas cuentas antes de agregar nuevas.`);
      }
      try {
        const groupName = isNonEmptyString(group) ? group.trim() : 'Default';
        const result = await this.accountManager.addAccountFromCookie(cookie.trim(), groupName);
        return ok(result);
      } catch (e) {
        return err(`Error agregando cuenta: ${(e as Error).message}`);
      }
    });

    // LOGIN con ventana de navegador — método principal (estilo RAM Original)
    ipcMain.handle('account:login-browser', async (_, group: unknown) => {
      // Validar límite máximo de cuentas
      if (this.accountManager.getAllAccounts().length >= MAX_ACCOUNTS) {
        return err(`Límite máximo de ${MAX_ACCOUNTS} cuentas alcanzado. Elimina algunas cuentas antes de agregar nuevas.`);
      }
      try {
        const { LoginBrowserService } = await import('./services/LoginBrowserService');
        const loginService = new LoginBrowserService();
        const loginResult = await loginService.loginWithBrowser();

        const groupName = isNonEmptyString(group) ? group.trim() : 'Default';
        const result = await this.accountManager.addAccountFromCookie(loginResult.cookie, groupName);
        return ok(result);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes('Ventana cerrada')) {
          return err('Login cancelado por el usuario');
        }
        if (msg.includes('Tiempo de espera')) {
          return err('Tiempo de espera agotado. Vuelve a intentarlo.');
        }
        return err(`Error iniciando sesión: ${msg}`);
      }
    });

    // LOGIN con username/password — método avanzado (en Settings)
    ipcMain.handle('account:login', async (_, username: unknown, password: unknown, group: unknown) => {
      if (!isNonEmptyString(username)) {
        return err('Payload inválido: username debe ser un string no vacío');
      }
      if (!isNonEmptyString(password)) {
        return err('Payload inválido: password debe ser un string no vacío');
      }
      // Validar límite máximo de cuentas
      if (this.accountManager.getAllAccounts().length >= MAX_ACCOUNTS) {
        return err(`Límite máximo de ${MAX_ACCOUNTS} cuentas alcanzado. Elimina algunas cuentas antes de agregar nuevas.`);
      }
      try {
        const { RobloxAuthService } = await import('./services/RobloxAuthService');
        const authService = new RobloxAuthService();
        const loginResult = await authService.login(username.trim(), password);
        
        const groupName = isNonEmptyString(group) ? group.trim() : 'Default';
        const result = await this.accountManager.addAccountFromCookie(loginResult.cookie, groupName);
        return ok(result);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes('2FA') || msg.includes('dos pasos')) {
          return err('Esta cuenta requiere verificación en dos pasos (2FA). Usa el método de ventana de navegador.');
        }
        if (msg.includes('captcha')) {
          return err('Roblox requiere captcha. Usa el método de ventana de navegador.');
        }
        return err(`Error iniciando sesión: ${msg}`);
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

    // Save password (encrypted) — Phase 3.1
    ipcMain.handle('account:savePassword', async (_, accountId: unknown, password: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(password)) {
        return err('Payload inválido: password debe ser un string no vacío');
      }
      try {
        const { CryptoService } = await import('./core/CryptoService');
        const crypto = new CryptoService();
        const encrypted = crypto.encrypt(password);
        this.accountManager.setAccountField(accountId.trim(), 'password', encrypted);
        return ok(true);
      } catch (e) {
        return err(`Error guardando contraseña: ${(e as Error).message}`);
      }
    });

    // Get password (decrypted) — Phase 3.1
    ipcMain.handle('account:getPassword', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const account = this.accountManager.getAccountById(accountId.trim());
        if (!account) return err('Cuenta no encontrada');
        const encrypted = account.fields?.['password'];
        if (!encrypted) return ok(null);
        const { CryptoService } = await import('./core/CryptoService');
        const crypto = new CryptoService();
        const decrypted = crypto.decrypt(encrypted);
        return ok(decrypted);
      } catch (e) {
        return err(`Error obteniendo contraseña: ${(e as Error).message}`);
      }
    });

    // Record game play — Phase 3.4
    ipcMain.handle('presence:recordGamePlay', async (_, payload: unknown) => {
      if (!payload || typeof payload !== 'object') {
        return err('Payload inválido: se esperaba un objeto');
      }
      const { accountId, placeId, universeId, gameName, icon } = payload as {
        accountId: string;
        placeId: string;
        universeId: number;
        gameName: string;
        icon?: string;
      };
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (!isNonEmptyString(placeId)) {
        return err('Payload inválido: placeId debe ser un string no vacío');
      }
      if (typeof universeId !== 'number' || isNaN(universeId)) {
        return err('Payload inválido: universeId debe ser un número válido');
      }
      if (!isNonEmptyString(gameName)) {
        return err('Payload inválido: gameName debe ser un string no vacío');
      }
      try {
        const { v4: uuidv4 } = await import('uuid');
        const recentGame = {
          id: uuidv4(),
          gameId: universeId,
          name: gameName,
          icon: icon || undefined,
          lastPlayed: new Date(),
          placeId: placeId,
          placeName: gameName, // Assume place name same as game name for now
          universeId: universeId
        };
        this.accountManager.addRecentGame(accountId.trim(), recentGame);
        return ok(true);
      } catch (e) {
        return err(`Error registrando juego jugado: ${(e as Error).message}`);
      }
    });

    // Get recent games — Phase 3.4
    ipcMain.handle('presence:getRecentGames', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const recentGames = this.accountManager.getRecentGames(accountId.trim());
        return ok({ recentGames });
      } catch (e) {
        return err(`Error obteniendo juegos recientes: ${(e as Error).message}`);
      }
    });

    // Add favorite game — Phase 3.5
    ipcMain.handle('games:addFavorite', async (_, payload: unknown) => {
      if (!payload || typeof payload !== 'object') {
        return err('Payload inválido: se esperaba un objeto');
      }
      const { accountId, gameId, name, icon } = payload as {
        accountId: string;
        gameId: number;
        name: string;
        icon?: string;
      };
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (typeof gameId !== 'number' || isNaN(gameId)) {
        return err('Payload inválido: gameId debe ser un número válido');
      }
      if (!isNonEmptyString(name)) {
        return err('Payload inválido: name debe ser un string no vacío');
      }
      try {
        const { v4: uuidv4 } = await import('uuid');
        const favoriteGame = {
          id: uuidv4(),
          gameId: gameId,
          name: name,
          icon: icon || undefined,
          addedAt: new Date()
        };
        this.accountManager.addFavoriteGame(accountId.trim(), favoriteGame);
        return ok(true);
      } catch (e) {
        return err(`Error agregando juego a favoritos: ${(e as Error).message}`);
      }
    });

    // Remove favorite game — Phase 3.5
    ipcMain.handle('games:removeFavorite', async (_, payload: unknown) => {
      if (!payload || typeof payload !== 'object') {
        return err('Payload inválido: se esperaba un objeto');
      }
      const { accountId, gameId } = payload as {
        accountId: string;
        gameId: number;
      };
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      if (typeof gameId !== 'number' || isNaN(gameId)) {
        return err('Payload inválido: gameId debe ser un número válido');
      }
      try {
        this.accountManager.removeFavoriteGame(accountId.trim(), gameId);
        return ok(true);
      } catch (e) {
        return err(`Error eliminando juego de favoritos: ${(e as Error).message}`);
      }
    });

    // Get favorite games — Phase 3.5
    ipcMain.handle('games:getFavorites', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) {
        return err('Payload inválido: accountId debe ser un string no vacío');
      }
      try {
        const favoriteGames = this.accountManager.getFavoriteGames(accountId.trim());
        return ok({ favoriteGames });
      } catch (e) {
        return err(`Error obteniendo juegos favoritos: ${(e as Error).message}`);
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
    // ACCOUNT — bulk import (user:pass or cookies, max 50)
    // =================================================================
    ipcMain.handle('account:bulk-import', async (_, input: unknown, format: unknown) => {
      if (typeof input !== 'string') {
        return err('Payload inválido: input debe ser un string');
      }
      if (format !== 'user:pass' && format !== 'cookies') {
        return err('Payload inválido: format debe ser \'user:pass\' o \'cookies\'');
      }
      const lines = input
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      if (lines.length === 0) {
        return err('Ingrese al menos una cuenta');
      }
      if (lines.length > 50) {
        return err('Máximo 50 cuentas permitidas');
      }
      const results: Array<{ success: boolean; message: string; accountId?: string }> = [];
      try {
        const { RobloxAuthService } = await import('./services/RobloxAuthService');
        const authService = new RobloxAuthService();
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          try {
            let accountId: string;
            if (format === 'user:pass') {
              const [username, password] = line.split(':');
              if (!username || !password) {
                throw new Error(`Línea ${i + 1}: formato inválido, se esperaba usuario:contraseña`);
              }
              const loginResult = await authService.login(username, password);
              const result = await this.accountManager.addAccountFromCookie(loginResult.cookie, 'Default');
              accountId = result.id;
              results.push({ success: true, message: `Línea ${i + 1}: cuenta agregada`, accountId });
            } else {
              if (!line.startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
                throw new Error(`Línea ${i + 1}: cookie no tiene formato .ROBLOSECURITY válido`);
              }
              const result = await this.accountManager.addAccountFromCookie(line, 'Default');
              accountId = result.id;
              results.push({ success: true, message: `Línea ${i + 1}: cuenta agregada`, accountId });
            }
          } catch (e) {
            results.push({ success: false, message: (e as Error).message });
          }
        }
        return ok(results);
      } catch (e) {
        return err(`Error procesando importación masiva: ${(e as Error).message}`);
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        // Obtener cookie del primer accountId para listar servers
        const firstId = String(accountIds[0]).trim();
        const raw = this.db.getAccount(firstId) || {};
        const cookie = raw.encrypted_cookie
          ? this.crypto.decrypt(raw.encrypted_cookie)
          : '';
        if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');

        const { GamesService } = await import('./services/GamesService');
        const service = new GamesService();
        const results = await service.distributeAccounts(placeId.trim(), accountIds, this.accountManager, cookie);
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
        const raw = this.db.getAccount(accountId) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
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
        const raw = this.db.getAccount(accountId.trim()) || {};
        const cookie = raw.encrypted_cookie ? this.crypto.decrypt(raw.encrypted_cookie) : '';
        if (!cookie) return err('No se pudo descifrar la cookie');
        const result = await this.accountSettingsService.unfollowUser(cookie, userIdNumber);
        return result ? ok(true) : err('Error dejando de seguir usuario');
      } catch (e) {
        return err(`Error: ${(e as Error).message}`);
      }
    });

    // PRESENCE
    ipcMain.handle('presence:get', async (_, accountIds: unknown) => {
      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return err('Payload inválido: accountIds debe ser un array no vacío');
      }
      try {
        const ids = accountIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
        if (ids.length === 0) return err('Ningún accountId válido');
        const presence = await this.presenceService.getPresence(ids);
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
        return ok({ settings, css });
      } catch (e) {
        return err(`Error obteniendo tema: ${(e as Error).message}`);
      }
    });

    // El preload expone 'settings:theme:set' con un objeto settings
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
        const merged = this.themeService.setSettings(patch);
        const css = this.themeService.getThemeCSS();
        return ok({ settings: merged, css });
      } catch (e) {
        return err(`Error configurando tema: ${(e as Error).message}`);
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
    // AUTO RELAUNCH — configuración por cuenta
    // =================================================================
    ipcMain.handle('settings:autoRelaunch:get', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const account = this.accountManager.getAccountById(accountId);
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
        const account = this.accountManager.getAccountById(accountId);
        if (!account) return err('Cuenta no encontrada');
        this.db.updateAccountField(accountId, 'autoRelaunch', String(enabled));
        this.accountManager.setAccountField(accountId, 'autoRelaunch', String(enabled));
        return ok(true);
      } catch (e) {
        return err(`Error configurando autoRelaunch: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // CONNECTION WATCHER — configuración global
    // =================================================================
    ipcMain.handle('settings:connectionWatcher:get', async () => {
      try {
        const enabled = this.db.getSetting('connectionWatcher') === 'true';
        return ok(enabled);
      } catch (e) {
        return err(`Error obteniendo connectionWatcher: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:connectionWatcher:set', async (_, enabled: unknown) => {
      if (typeof enabled !== 'boolean') return err('enabled debe ser boolean');
      try {
        this.db.setSetting('connectionWatcher', String(enabled));
        return ok(true);
      } catch (e) {
        return err(`Error configurando connectionWatcher: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // PREVENT DUPLICATE INSTANCES — configuración global
    // =================================================================
    ipcMain.handle('settings:preventDuplicateInstances:get', async () => {
      try {
        const enabled = this.db.getSetting('preventDuplicateInstances') === 'true';
        return ok(enabled);
      } catch (e) {
        return err(`Error obteniendo preventDuplicateInstances: ${(e as Error).message}`);
      }
    });

    ipcMain.handle('settings:preventDuplicateInstances:set', async (_, enabled: unknown) => {
      if (typeof enabled !== 'boolean') return err('enabled debe ser boolean');
      try {
        this.db.setSetting('preventDuplicateInstances', String(enabled));
        return ok(true);
      } catch (e) {
        return err(`Error configurando preventDuplicateInstances: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // FASE 4.5 — Player Finder (buscar jugador por username)
    // =================================================================
    ipcMain.handle('roblox:search-user', async (_, username: unknown) => {
      if (!isNonEmptyString(username)) return err('username inválido');
      try {
        const response = await axios.get(
          `https://users.roblox.com/v1/usernames/users`,
          {
            method: 'POST',
            data: { usernames: [username.trim()], excludeBannedUsers: true },
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const data = response.data;
        if (data?.data?.length > 0) {
          const user = data.data[0];
          return ok({ id: user.id, name: user.name, displayName: user.displayName });
        }
        return err('Usuario no encontrado');
      } catch (e) {
        return err(`Error buscando usuario: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // FASE 4.8 — Join Group (unirse a grupo de Roblox)
    // =================================================================
    ipcMain.handle('roblox:join-group', async (_, accountId: unknown, groupId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      if (!isPositiveInteger(groupId)) return err('groupId inválido');
      try {
        const account = this.accountManager.getAccountById(accountId);
        if (!account) return err('Cuenta no encontrada');
        // Get decrypted cookie
        const cookie = this.crypto.decrypt((account as any).encrypted_cookie || account.cookie || '');
        if (!cookie) return err('Cookie no disponible');
        // Get CSRF token
        const csrfRes = await axios.post('https://auth.roblox.com/v2/login', {}, {
          headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        });
        const csrfToken = csrfRes.headers['x-csrf-token'];
        if (!csrfToken) return err('No se pudo obtener token CSRF');
        // Join group
        await axios.post(
          `https://groups.roblox.com/v1/groups/${Number(groupId)}/users`,
          {},
          {
            headers: {
              Cookie: `.ROBLOSECURITY=${cookie}`,
              'X-CSRF-TOKEN': csrfToken,
              'Content-Type': 'application/json',
            },
          }
        );
        return ok(true);
      } catch (e) {
        return err(`Error uniéndose al grupo: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // FASE 4.9 — Quick Login (inicio rápido sin navegador)
    // =================================================================
    ipcMain.handle('roblox:quick-login', async (_, accountId: unknown) => {
      if (!isNonEmptyString(accountId)) return err('accountId inválido');
      try {
        const account = this.accountManager.getAccountById(accountId);
        if (!account) return err('Cuenta no encontrada');
        const cookie = this.crypto.decrypt((account as any).encrypted_cookie || account.cookie || '');
        if (!cookie) return err('Cookie no disponible');
        // Verify cookie
        // Use launchRoblox with placeId=0 for quick login
        const result = await this.accountManager.launchRoblox(accountId, '0', undefined);
        return ok(result);
      } catch (e) {
        return err(`Error en inicio rápido: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // FASE 4.7 — Local Web API (configuración de puerto y permisos)
    // =================================================================
    ipcMain.handle('settings:webapi:get', async () => {
      try {
        const enabled = this.db.getSetting('webApiEnabled') === 'true';
        const port = parseInt(this.db.getSetting('webApiPort') || '8080', 10);
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
        this.db.setSetting('webApiEnabled', String(enabled));
        if (port !== undefined) this.db.setSetting('webApiPort', String(port));
        return ok(true);
      } catch (e) {
        return err(`Error configurando Web API: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // KILL ALL — cerrar todas las instancias de Roblox
    // =================================================================
    // Delegamos al servicio MultiRobloxService
    ipcMain.handle('roblox:kill-all', async () => {
      try {
        const result = await this.multiRobloxService.killAll();
        return ok(result);
      } catch (e) {
        return err(`Error cerrando instancias: ${(e as Error).message}`);
      }
    });

    // =================================================================
    // ROBLOX: openProfile - opens user profile in default browser
    // =================================================================
    ipcMain.handle('roblox:openProfile', async (_, userId: unknown) => {
      if (typeof userId !== 'string' && typeof userId !== 'number') {
        return err('userId must be a string or number');
      }
      const url = `https://www.roblox.com/users/${userId}/profile`;
      return ok({ url });
    });

    // =================================================================
    // BOTTING MODE (opt-in, user assumes ToS ban risk)
    // =================================================================
    ipcMain.handle('botting:start', async (_, data: unknown) => {
      if (!Array.isArray(data) || data.length < 2) {
        return err('Payload inválido: [accountIds: string[], intervalMinutes: number, placeId?: string, jobId?: string]');
      }
      const [accountIds, intervalMinutes, placeId, jobId] = data as [unknown, unknown, unknown?, unknown?];
      if (!Array.isArray(accountIds) || !accountIds.every(id => typeof id === 'string')) {
        return err('Payload inválido: accountIds debe ser string[]');
      }
      if (typeof intervalMinutes !== 'number' || isNaN(intervalMinutes) || intervalMinutes < 1) {
        return err('Payload inválido: intervalMinutes debe ser número >= 1');
      }
      const safePlaceId = typeof placeId === 'string' ? placeId : undefined;
      const safeJobId = typeof jobId === 'string' ? jobId : undefined;
      this.bottingService.start(
        accountIds as string[],
        intervalMinutes as number,
        safePlaceId,
        safeJobId
      );
      return ok({ started: true });
    });

    ipcMain.handle('botting:stop', async () => {
      this.bottingService.stop();
      return ok({ stopped: true });
    });

    ipcMain.handle('botting:getStatus', async () => {
      return ok(this.bottingService.getStatus());
    });

    ipcMain.handle('botting:setInterval', async (_, intervalMinutes: unknown) => {
      if (typeof intervalMinutes !== 'number' || isNaN(intervalMinutes) || intervalMinutes <= 0) {
        return err('Payload inválido: intervalMinutes debe ser número > 0');
      }
      this.bottingService.setInterval(intervalMinutes as number);
      return ok({ updated: true });
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

    // Cookie expiry event listeners
    ipcMain.on('cookie:expiring', (event, accountId, hoursLeft) => {
      // Forward to all renderer windows
      this.mainWindow?.webContents.send('cookie:expiring', accountId, hoursLeft);
    });

    ipcMain.on('cookie:expired', (event, accountId) => {
      // Forward to all renderer windows
      this.mainWindow?.webContents.send('cookie:expired', accountId);
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
      appInstance.cleanup();
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
