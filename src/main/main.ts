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
import { RobloxContext } from './services/RobloxContext';
import { LoginBrowserService } from './services/LoginBrowserService';
import { RobloxAuthService } from './services/RobloxAuthService';
import { ServersService } from './services/ServersService';
import { v4 as uuidv4 } from 'uuid';
import { ok, err } from './handlers/shared';
import type { IpcResult } from './handlers/shared';
import { registerAccountHandlers } from './handlers/account';
import { registerSettingsHandlers } from './handlers/settings';
import { registerRobloxHandlers } from './handlers/roblox';
import { registerPresenceHandlers } from './handlers/presence';
import { registerBottingHandlers } from './handlers/botting';
import { registerGamesHandlers } from './handlers/games';
import { registerAdvancedHandlers } from './handlers/advanced';
import { registerMiscHandlers } from './handlers/misc';

// Solución para __dirname en ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MAX_ACCOUNTS = 50;

export class NexoApp {
  public mainWindow: BrowserWindow | null = null;
  public accountManager: AccountManager;
  public db: DatabaseManager;
  public crypto: CryptoService;
  public accountSettingsService: AccountSettingsService;
  public presenceService: PresenceService;
  public bottingService: BottingService;
  public cookieExpiryService: CookieExpiryService;
  public themeService: ThemeService;
  public gamesService: GamesService;
  public multiRobloxService: MultiRobloxService;
  public robloxContext: RobloxContext;
  public loginBrowserService: LoginBrowserService;
  public authService: RobloxAuthService;
  public serversService: ServersService;
  
  
  
  
  
  
  
  

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
    this.loginBrowserService = new LoginBrowserService();
    this.authService = new RobloxAuthService();
    this.serversService = new ServersService();
    
    
    
    
    
    
    
    
    
    // FACADE - RobloxContext orquesta todos los servicios
        // FACADE - RobloxContext orquesta los servicios Roblox
    this.robloxContext = new RobloxContext(
      this.db,
      this.crypto,
      this.accountManager,
      this.presenceService,
      this.bottingService,
      this.cookieExpiryService,
      this.gamesService,
      this.serversService
    );
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
      title: 'NX-Manager',
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
    registerAccountHandlers(this as any);
    registerSettingsHandlers(this as any);
    registerRobloxHandlers(this as any);
    registerPresenceHandlers(this as any);
    registerBottingHandlers(this as any);
    registerGamesHandlers(this as any);
    registerAdvancedHandlers(this as any);
    registerMiscHandlers(this as any);
  }
  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'NX-Manager',
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
