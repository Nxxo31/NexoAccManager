// Main Process: App bootstrap
// Un solo archivo — crea ventana, inicializa DB, registra handlers

import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'node:path';
import { getDb, closeDb } from './infrastructure/database/DatabaseManager';
import { registerHandlers, setMainWindow } from './infrastructure/ipc/IPCAdapter';

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'NexoAccManager',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  // En desarrollo carga Vite, en producción o test carga el build empaquetado
  // NODE_ENV=test fuerza el archivo empaquetado aunque app.isPackaged sea false
  // (necesario para Playwright Electron que lanza el bundle sin empaquetar AVR)
  if (app.isPackaged || process.env.NODE_ENV === 'test') {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  }

  // Abrir links externos en navegador, no en Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'deny' };
  });

  return win;
}

app.whenReady().then(() => {
  // Inicializar DB
  getDb();

  // Crear ventana
  mainWindow = createWindow();
  setMainWindow(mainWindow);

  // Registrar todos los IPC handlers
  registerHandlers();

  // Menu
  Menu.setApplicationMenu(null);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
      setMainWindow(mainWindow);
    }
  });
}).catch((e) => {
  console.error('Failed to initialize app:', e);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  closeDb();
});
