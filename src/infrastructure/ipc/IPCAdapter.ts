// Infrastructure: IPCAdapter — orquestador de namespaces.
// DT-5: cada namespace vive en su archivo bajo ./handlers/ (SRP).
// Cada handler: valida input → llama servicio/use-case → retorna IpcResult.

import { BrowserWindow } from 'electron';
import { registerAccountHandlers } from './handlers/accountHandlers';
import { registerRobloxHandlers } from './handlers/robloxHandlers';
import { registerSettingsHandlers } from './handlers/settingsHandlers';
import { registerAdvancedHandlers } from './handlers/advancedHandlers';

let mainWindow: BrowserWindow | null = null;

/** Inyecta la BrowserWindow principal. Los handlers pueden usarla para
 *  enviar eventos al renderer (send/on) cuando sea necesario. */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win;
}

/** Devuelve la ventana principal registrada con setMainWindow. */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/** Registra TODOS los IPC handlers por namespace.
 *  Punto único de entrada invocado desde main.ts al arrancar la app. */
export function registerAllHandlers(): void {
  registerAccountHandlers();
  registerRobloxHandlers();
  registerSettingsHandlers();
  registerAdvancedHandlers();
}

/** Alias de registerAllHandlers — preservado para no romper main.ts. */
export const registerHandlers = registerAllHandlers;
