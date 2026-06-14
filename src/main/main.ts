import { app, BrowserWindow, ipcMain, dialog, Menu, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { AccountManager } from './core/AccountManager';
import { CryptoService } from './core/CryptoService';
import { WebServer } from './server/WebServer';
import { DatabaseManager } from './storage/DatabaseManager';

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
  'roblox:launch',
  'roblox:recent-games',
  'roblox:join-server',
  'roblox:multiroblox',
  'settings:get',
  'settings:set',
]);

// SoluciÃ³n para __dirname en ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NexoApp {
  private mainWindow: BrowserWindow | null = null;
  private accountManager: AccountManager;
  private webServer: WebServer;
  private db: DatabaseManager;
  private crypto: CryptoService;

  constructor() {
    this.db = new DatabaseManager();
    this.crypto = new CryptoService();
    this.accountManager = new AccountManager(this.db, this.crypto);
    this.webServer = new WebServer(this.accountManager);
  }

  async initialize(): Promise<void> {
    await this.db.initialize();
    await this.webServer.start(8080);
    this.setupCSP();
    this.createWindow();
    this.setupIPCHandlers();
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
