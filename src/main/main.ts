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

    // Launch Roblox
    ipcMain.handle('roblox:launch', async (_, accountId: string, placeId?: string, jobId?: string) => {
      return this.accountManager.launchRoblox(accountId, placeId, jobId);
    });

    // Multi-Roblox toggle
    ipcMain.handle('settings:multiroblox', async (_, enabled: boolean) => {
      return this.accountManager.setMultiRoblox(enabled);
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

      if (!Array.isArray(payload.cuentas)) {
        throw new Error('Formato inválido: se espera "cuentas" como array');
      }

      let added = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const item of payload.cuentas) {
        try {
          if (!item.cookie || typeof item.cookie !== 'string') {
            skipped++;
            continue;
          }
          await this.accountManager.addAccountFromCookie(item.cookie);
          added++;
        } catch (err: unknown) {
          const msg = (err as Error).message || String(err);
          errors.push(`Error importando cuenta: ${msg}`);
          skipped++;
        }
      }

      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Importación completada',
        message: `Cuentas importadas: ${added}\nOmitadas: ${skipped}`,
        detail: errors.length > 0 ? `Errores:\n${errors.slice(0, 5).join('\n')}` : undefined,
      });
    } catch (err: unknown) {
      dialog.showErrorBox('Error de importación', (err as Error).message);
    }
  }

  private async exportAccounts(): Promise<void> {
    const result = await dialog.showSaveDialog({
      defaultPath: 'cuentas_nexo.json',
      filters: [{ name: 'Archivos JSON', extensions: ['json'] }],
    });

    if (result.canceled) return;

    try {
      const accounts = this.accountManager.getAllAccounts();
      const payload = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        cuentas: accounts.map((a) => ({
          username: a.username,
          robloxUserId: a.robloxUserId,
          group: a.group,
          description: a.description,
        })),
      };

      fs.writeFileSync(result.filePath!, JSON.stringify(payload, null, 2), 'utf-8');

      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Exportación completada',
        message: `${accounts.length} cuenta(s) exportadas a ${result.filePath}`,
      });
    } catch (err: unknown) {
      dialog.showErrorBox('Error de exportación', (err as Error).message);
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
