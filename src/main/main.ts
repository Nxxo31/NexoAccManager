import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
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

    if (!result.canceled && result.filePaths.length > 0) {
      // Implementar importaciÃ³n
    }
  }

  private async exportAccounts(): Promise<void> {
    const result = await dialog.showSaveDialog({
      defaultPath: 'cuentas_nexo.json',
      filters: [{ name: 'Archivos JSON', extensions: ['json'] }],
    });

    if (!result.canceled) {
      // Implementar exportaciÃ³n
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
