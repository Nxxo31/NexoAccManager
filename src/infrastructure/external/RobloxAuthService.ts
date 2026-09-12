// Infrastructure: RobloxAuthService — implementa la parte de auth del RobloxApiPort
// Login browser, login user:pass, verify cookie, import cookies
//
// DT-4 (DIP): se añade `RobloxAuthApiImpl implements RobloxAuthPort` que envuelve
// las funciones exportadas. La class es el adaptador formal del port; las funciones
// sueltas se mantienen para no romper imports existentes en IPCAdapter.ts.

import { BrowserWindow, session } from 'electron';
import { apiGet, getCsrfToken } from './RobloxHttp';
import { logger } from '../logging/logger';
import type { RobloxAuthPort } from '../../domain/repositories/RobloxApiPort';

// Track active auth timers for cleanup via shutdown()
const activeIntervals = new Set<NodeJS.Timeout>();
const activeTimeouts = new Set<NodeJS.Timeout>();

function trackInterval(id: NodeJS.Timeout): NodeJS.Timeout {
  activeIntervals.add(id);
  // .unref() permite que el main process termine limpiamente si no hay otras handles.
  id.unref();
  return id;
}

function trackTimeout(id: NodeJS.Timeout): NodeJS.Timeout {
  activeTimeouts.add(id);
  id.unref();
  return id;
}

/** Llamado por app.on('before-quit') para limpiar timers auth activos. */
export function shutdownAuthTimers(): void {
  for (const id of activeIntervals) clearInterval(id);
  for (const id of activeTimeouts) clearTimeout(id);
  activeIntervals.clear();
  activeTimeouts.clear();
}

export async function loginBrowser(): Promise<{ cookie: string; userId: number; username: string }> {
  return new Promise((resolve, reject) => {
    // Use an isolated partition to avoid contaminating the default session cookies
    const partitionName = `auth-${Date.now()}`;
    const authSession = session.fromPartition(partitionName);
    const win = new BrowserWindow({
      width: 800, height: 600,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, partition: partitionName },
      title: 'Iniciar sesión en Roblox',
    });

    let resolved = false;
    const timeout = trackTimeout(setTimeout(() => {
      if (!resolved) {
        resolved = true;
        win.close();
        try { authSession.clearStorageData(); } catch (e) { try { logger.warn(`[Auth] clearStorageData failed: ${(e as Error).message}`); } catch { /* ignore */ } }
        reject(new Error('Timeout'));
      }
    }, 120_000));

    // Poll for cookie in session every 2s
    const pollInterval = trackInterval(setInterval(async () => {
      if (resolved) return;
      try {
        const cookies = await authSession.cookies.get({ domain: '.roblox.com' });
        for (const c of cookies) {
          if (c.name === '.ROBLOSECURITY') {
            const cookie = c.value.trim();
            if (!cookie) continue;
            const info = await verifyCookie(cookie);
            if (info.valid) {
              resolved = true;
              clearTimeout(timeout);
              clearInterval(pollInterval);
              activeTimeouts.delete(timeout);
              activeIntervals.delete(pollInterval);
              win.close();
              try { authSession.clearStorageData(); } catch (e) { try { logger.warn(`[Auth] clearStorageData failed: ${(e as Error).message}`); } catch { /* ignore */ } }
              resolve({ cookie, userId: info.userId, username: info.username });
              return;
            }
          }
        }
      } catch {
          // Keep polling
        }
    }, 2000));

    win.loadURL('https://www.roblox.com/login');

    // Clean up partition storage if user closes the window manually
    const closedListener = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        clearInterval(pollInterval);
        activeTimeouts.delete(timeout);
        activeIntervals.delete(pollInterval);
        try { authSession.clearStorageData(); } catch (e) { try { logger.warn(`[Auth] clearStorageData failed: ${(e as Error).message}`); } catch { /* ignore */ } }
        reject(new Error('Window closed by user'));
      }
    };
    win.on('closed', closedListener);
  });
}

export async function loginUserPass(username: string, password: string): Promise<{ cookie: string; userId: number; username: string }> {
  return new Promise((resolve, reject) => {
    // Use an isolated partition to avoid contaminating the default session cookies
    const partitionName = `auth-${Date.now()}`;
    const authSession = session.fromPartition(partitionName);
    const win = new BrowserWindow({
      width: 800, height: 600,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, partition: partitionName },
      title: 'Iniciar sesión en Roblox',
    });

    let resolved = false;
    // FIX (auditoria 2026-09-12): credentialsSubmitted es DOM-scope, no TS-scope.
    // El script inyectado usa `window.__namCredentialsSubmitted` para que el
    // TS-side pueda leer el flag via executeJavaScript return value y asi no
    // re-enviar credenciales cada 2s (Roblox rechaza duplicados pero dispara
    // rate-limiting y consume requests).
    const timeout = trackTimeout(setTimeout(() => {
      if (!resolved) {
        resolved = true;
        win.close();
        try { authSession.clearStorageData(); } catch (e) { try { logger.warn(`[Auth] clearStorageData failed: ${(e as Error).message}`); } catch { /* ignore */ } }
        reject(new Error('Timeout'));
      }
    }, 120_000));

    // Poll for cookie and submit credentials every 2s
    const pollInterval = trackInterval(setInterval(async () => {
      if (resolved) return;
      try {
        // Try to submit credentials if we haven't already (round-trip via window flag)
        let credentialsSubmitted: boolean = false;
        try {
          await win.webContents.executeJavaScript(`
            (function() {
              if (window.__namCredentialsSubmitted) return;
              const usernameInput = document.querySelector('input[name="username"]');
              const passwordInput = document.querySelector('input[name="password"]');
              const loginButton = document.querySelector('button[type="submit"]');
              if (usernameInput && passwordInput && loginButton) {
                usernameInput.value = ${JSON.stringify(username)};
                passwordInput.value = ${JSON.stringify(password)};
                loginButton.click();
                window.__namCredentialsSubmitted = true;
              }
            })();
          `);
          credentialsSubmitted = await win.webContents.executeJavaScript('Boolean(window.__namCredentialsSubmitted)');
        } catch {
                    // Ignore errors in execution, we'll try again next interval
                  }
        if (credentialsSubmitted) {
          // Si ya se enviaron, no re-pollear hasta el próximo ciclo
        }

        // Check for cookie
        const cookies = await authSession.cookies.get({ domain: '.roblox.com' });
        for (const c of cookies) {
          if (c.name === '.ROBLOSECURITY') {
            const cookie = c.value.trim();
            if (!cookie) continue;
            const info = await verifyCookie(cookie);
            if (info.valid) {
              resolved = true;
              clearTimeout(timeout);
              clearInterval(pollInterval);
              activeTimeouts.delete(timeout);
              activeIntervals.delete(pollInterval);
              win.close();
              try { authSession.clearStorageData(); } catch (e) { try { logger.warn(`[Auth] clearStorageData failed: ${(e as Error).message}`); } catch { /* ignore */ } }
              resolve({ cookie, userId: info.userId, username: info.username });
              return;
            }
          }
        }
      } catch {
                // If window is destroyed, break out
        if (win === null || win.isDestroyed()) {
          resolved = true;
          clearTimeout(timeout);
          clearInterval(pollInterval);
          activeTimeouts.delete(timeout);
          activeIntervals.delete(pollInterval);
          try { authSession.clearStorageData(); } catch (e) { try { logger.warn(`[Auth] clearStorageData failed: ${(e as Error).message}`); } catch { /* ignore */ } }
          reject(new Error('Window destroyed'));
          return;
        }
        // Otherwise, keep polling
      }
    }, 2000));

    win.loadURL('https://www.roblox.com/login');

    // Handle window closed by user
    const closedListener = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        clearInterval(pollInterval);
        try { authSession.clearStorageData(); } catch (e) { try { logger.warn(`[Auth] clearStorageData failed: ${(e as Error).message}`); } catch { /* ignore */ } }
        reject(new Error('Window closed by user'));
      }
    };
    win.on('closed', closedListener);
  });
}

export async function verifyCookie(cookie: string): Promise<{ valid: boolean; userId: number; username: string }> {
  try {
    const data = await apiGet<{ id: number; name: string }>(
      'https://users.roblox.com/v1/users/authenticated',
      cookie
    );
    if (data.id && data.name) {
      return { valid: true, userId: data.id, username: data.name };
    }
    return { valid: false, userId: 0, username: '' };
  } catch {
    return { valid: false, userId: 0, username: '' };
  }
}

export async function importCookies(cookies: string[]): Promise<{ added: number; skipped: number }> {
  let added = 0, skipped = 0;
  for (const raw of cookies) {
    const cookie = raw.trim();
    if (!cookie) { skipped++; continue; }
    try {
      const info = await verifyCookie(cookie);
      if (info.valid) added++;
      else skipped++;
    } catch {
      skipped++;
    }
  }
  return { added, skipped };
}

// ─────────────────────────────────────────────────────────────────────────────
// DT-4 (DIP): Adapter class que implementa RobloxAuthPort.
// Envuelve las funciones sueltas para que el puerto pueda inyectarse como
// dependencia en tests/use-cases sin reescribir imports de IPCAdapter.ts.
// ─────────────────────────────────────────────────────────────────────────────
export class RobloxAuthApiImpl implements RobloxAuthPort {
  public loginBrowser = loginBrowser;
  public loginUserPass = loginUserPass;
  public verifyCookie = verifyCookie;
  public importCookies = importCookies;
  public getCsrfToken = getCsrfToken;
}

// Instancia singleton exportada para consumers que quieran inyectar por DI.
export const robloxAuthApi = new RobloxAuthApiImpl();
