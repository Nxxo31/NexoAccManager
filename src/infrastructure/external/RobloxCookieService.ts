// Infrastructure: RobloxCookieService — cookie expiry + refresh
//
// DT-4 (DIP): se añade `RobloxCookieApiImpl implements RobloxCookiePort` que
// envuelve las funciones exportadas. La class es el adaptador formal del port;
// las funciones sueltas se mantienen para no romper imports existentes en IPCAdapter.ts.

import { BrowserWindow } from 'electron';
import { apiGet } from './RobloxHttp';
import { logger } from '../logging/logger';
import type { RobloxCookiePort } from '../../domain/repositories/RobloxApiPort';

export async function getCookieExpiry(cookie: string): Promise<Date | null> {
  try {
    const data = await apiGet<{ expirationDate: string }>('https://auth.roblox.com/v1/session-info', cookie);
    if (data?.expirationDate) return new Date(data.expirationDate);
  } catch { /* invalid or no session */ }
  return null;
}

/**
 * Espera a que el cookie cambie (refresh por el server de Roblox) o timeout.
 * FIX (auditoria 2026-09-12): antes esperaba 3s fijos — race condition porque
 * Roblox podia tardar mas. Ahora usa did-finish-load + cookies.changed event.
 */
function waitForCookieChange(win: BrowserWindow, oldCookie: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      win.webContents.removeListener('did-finish-load', onLoad);
      win.webContents.session.cookies.removeListener('changed', onChanged);
      resolve(oldCookie);
    }, timeoutMs);
    timer.unref();

    const onChanged = (_event: unknown, cookie: { name?: string; value?: string }) => {
      if (cookie.name === '.ROBLOSECURITY' && cookie.value && cookie.value !== oldCookie) {
        clearTimeout(timer);
        win.webContents.session.cookies.removeListener('changed', onChanged);
        win.webContents.removeListener('did-finish-load', onLoad);
        resolve(cookie.value);
      }
    };
    const onLoad = async () => {
      try {
        const cookies = await win.webContents.session.cookies.get({ name: '.ROBLOSECURITY' });
        const fresh = cookies.find((c) => c.value && c.value !== oldCookie);
        if (fresh?.value) {
          clearTimeout(timer);
          win.webContents.session.cookies.removeListener('changed', onChanged);
          win.webContents.removeListener('did-finish-load', onLoad);
          resolve(fresh.value);
        }
      } catch (e) {
        try { logger.warn(`[Cookie] onLoad error: ${(e as Error).message}`); } catch { /* ignore */ }
      }
    };
    win.webContents.session.cookies.on('changed', onChanged);
    win.webContents.on('did-finish-load', onLoad);
  });
}

export async function refreshCookie(cookie: string): Promise<string> {
  const expiry = await getCookieExpiry(cookie);
  if (!expiry) throw new Error('No se pudo verificar la cookie');

  const now = new Date();
  const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilExpiry > 24) {
    return cookie; // still valid, no need to refresh
  }

  let win: BrowserWindow | null = null;
  try {
    win = new BrowserWindow({
      width: 1,
      height: 1,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    const cookieUrl = 'https://www.roblox.com';
    await win.webContents.session.cookies.set({
      url: cookieUrl,
      name: '.ROBLOSECURITY',
      value: cookie,
      domain: '.roblox.com',
      path: '/',
      secure: true,
      httpOnly: true,
    });

    // FIX: no esperar timeout fijo. Cargar URL y esperar did-finish-load o
    // cookies.changed event (timeout 10s por si Roblox no responde).
    const loadPromise = win.webContents.loadURL('https://www.roblox.com/home');
    const [, newCookie] = await Promise.all([
      loadPromise,
      waitForCookieChange(win, cookie, 10_000),
    ]);

    return newCookie || cookie;
  } catch {
    if (expiry > now) return cookie;
    throw new Error('Cookie expirada — necesita re-login');
  } finally {
    if (win) win.destroy();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DT-4 (DIP): Adapter class que implementa RobloxCookiePort.
// Envuelve las funciones sueltas para que el puerto pueda inyectarse como
// dependencia en tests/use-cases sin reescribir imports de IPCAdapter.ts.
// ─────────────────────────────────────────────────────────────────────────────
export class RobloxCookieApiImpl implements RobloxCookiePort {
  public getCookieExpiry = getCookieExpiry;
  public refreshCookie = refreshCookie;
}

// Instancia singleton exportada para consumers que quieran inyectar por DI.
export const robloxCookieApi = new RobloxCookieApiImpl();
