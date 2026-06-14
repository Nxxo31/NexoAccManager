import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { AccountManager } from './core/AccountManager';
import { CryptoService } from './core/CryptoService';
import { WebServer } from './server/WebServer';
import { DatabaseManager } from './storage/DatabaseManager';

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
    this.createWindow();
    this.setupIPCHandlers();
    this.createMenu();
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
    // GestiÃ³n de cuentas
    ipcMain.handle('account:add', async (_, cookie: string) => {
      return this.accountManager.addAccountFromCookie(cookie);
    });

    ipcMain.handle('account:remove', async (_, id: string) => {
      return this.accountManager.removeAccount(id);
    });

    ipcMain.handle('account:list', async () => {
      return this.accountManager.getAllAccounts();
    });

    ipcMain.handle('account:move', async (_, accountId: string, groupName: string) => {
      this.accountManager.setAccountField(accountId, 'group', groupName);
      return true;
    });

    ipcMain.handle('account:field:set', async (_, accountId: string, key: string, value: string) => {
      this.accountManager.setAccountField(accountId, key, value);
      return true;
    });

    ipcMain.handle('account:check', async (_, accountId: string) => {
      return this.accountManager.getAccountById(accountId);
    });

    // Roblox
    ipcMain.handle('roblox:launch', async (_, accountId: string, placeId?: string, jobId?: string) => {
      return this.accountManager.launchRoblox(accountId, placeId, jobId);
    });

    ipcMain.handle('roblox:recent-games', async () => {
      // TODO: implementar lista de juegos recientes
      return [];
    });

    ipcMain.handle('roblox:join-server', async (_, placeId: string, accountId: string) => {
      // Alias para launchRoblox sin jobId
      return this.accountManager.launchRoblox(accountId, placeId);
    });

    // Multi-Roblox toggle
    ipcMain.handle('settings:multiroblox', async (_, enabled: boolean) => {
      return this.accountManager.setMultiRoblox(enabled);
    });

    // Settings
    ipcMain.handle('settings:get', async (_, key: string) => {
      return this.db.getSetting(key);
    });

    ipcMain.handle('settings:set', async (_, key: string, value: any) => {
      this.db.setSetting(key, String(value));
      return true;
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
