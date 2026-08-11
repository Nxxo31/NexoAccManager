// Main Process: App bootstrap
// Un solo archivo — crea ventana, inicializa DB, registra handlers

import { app, BrowserWindow, Menu, shell, session } from 'electron';
import path from 'node:path';
import { getDb, closeDb } from './infrastructure/database/DatabaseManager';
import { registerHandlers, setMainWindow } from './infrastructure/ipc/IPCAdapter';
// B-4: Import first to override console.* before any module logs
import './infrastructure/logging/logger';
import { logger } from './infrastructure/logging/logger';

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
    // Esperar a que Vite dev server esté listo antes de cargar
    const devServerUrl = 'http://localhost:5173';
    const tryLoad = async (retries: number) => {
      for (let i = 0; i < retries; i++) {
        try {
          await win.loadURL(devServerUrl);
          win.webContents.openDevTools();
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      // Si Vite no responde, cargar igual (mostrará error en DevTools)
      win.loadURL(devServerUrl).catch(() => {
        logger?.error?.(`Failed to load dev server at ${devServerUrl}`);
      });
    };
    tryLoad(10);
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
  // CSP: bloquear inline scripts y conexiones externas no autorizadas
  // En dev, permitir localhost para Vite HMR
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'test';
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:5173 ws://localhost:5173 https://*.roblox.com;"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.roblox.com;",
        ],
      },
    });
  });

  // Inicializar DB
  getDb();
  try { logger.info('App starting — DB initialized'); } catch { /* best-effort */ }

  // Crear ventana
  mainWindow = createWindow();
  setMainWindow(mainWindow);
  try { logger.info('Main window created'); } catch { /* best-effort */ }

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
  logger.error('Failed to initialize app:', e);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  try { logger.info('App shutting down — cleaning up'); } catch { /* best-effort */ }
  // Cleanup: stop all botting intervals to prevent memory leaks on exit
  try {
    // Import dynamically to avoid circular dependency at module load time
    const { stopBotting } = require('./infrastructure/external/RobloxBottingService');
    stopBotting();
  } catch { /* best-effort cleanup */ }
  // B-1: cerrar el WS de control si estaba activo.
  try {
    const { controlWs } = require('./infrastructure/external/ControlWebSocketService');
    controlWs.stop();
  } catch { /* best-effort cleanup */ }
  closeDb();
});
