import { vi } from 'vitest';

vi.mock('electron', () => {
  const cwd = process.cwd();
  return {
    app: {
      getPath: vi.fn((name: string) => {
        if (name === 'userData') return cwd;
        if (name === 'appData') return cwd;
        if (name === 'home') return cwd;
        return cwd;
      }),
      getAppPath: vi.fn(() => cwd),
      isReady: vi.fn(() => true),
      isPackaged: false,
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn(),
      quit: vi.fn(),
      name: 'nx-manager-test',
      version: '5.0.0-test',
    },
    BrowserWindow: vi.fn(() => ({
      loadURL: vi.fn(),
      on: vi.fn(),
      webContents: { send: vi.fn(), on: vi.fn() },
      isDestroyed: vi.fn(() => false),
    })),
    session: {
      defaultSession: {
        clearStorageData: vi.fn(),
        cookies: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
      },
    },
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
      removeHandler: vi.fn(),
    },
    ipcRenderer: {
      invoke: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
    },
    contextBridge: {
      exposeInMainWorld: vi.fn(),
    },
    dialog: {
      showOpenDialog: vi.fn(),
      showSaveDialog: vi.fn(),
      showMessageBox: vi.fn(),
    },
    nativeImage: {
      createFromPath: vi.fn(),
    },
    shell: {
      openExternal: vi.fn(),
      openPath: vi.fn(),
    },
  };
});