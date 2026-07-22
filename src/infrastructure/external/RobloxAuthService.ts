// Infrastructure: RobloxAuthService — implementa la parte de auth del RobloxApiPort
// Login browser, login user:pass, verify cookie, import cookies

import { BrowserWindow, session } from 'electron';
import path from 'node:path';
import { apiGet, apiPost, cookieHeader } from './RobloxHttp';

export async function loginBrowser(): Promise<{ cookie: string; userId: number; username: string }> {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 800, height: 600,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
      title: 'Iniciar sesión en Roblox',
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; win.close(); reject(new Error('Timeout')); }
    }, 120_000);

    // Poll for cookie in session every 2s
    const pollInterval = setInterval(async () => {
      if (resolved) return;
      try {
        const cookies = await session.defaultSession.cookies.get({ domain: '.roblox.com' });
        for (const c of cookies) {
          if (c.name === '.ROBLOSECURITY') {
            const cookie = c.value.trim();
            if (!cookie) continue;
            const info = await verifyCookie(cookie);
            if (info.valid) {
              resolved = true;
              clearTimeout(timeout);
              clearInterval(pollInterval);
              win.close();
              resolve({ cookie, userId: info.userId, username: info.username });
              return;
            }
          }
        }
      } catch { /* keep polling */ }
    }, 2000);

    win.loadURL('https://www.roblox.com/login');
  });
}

export async function loginUserPass(username: string, password: string): Promise<{ cookie: string; userId: number; username: string }> {
  // Login via Roblox auth API
  try {
    const res = await apiPost<{ userData?: { userId: number; username: string } }>(
      'https://auth.roblox.com/v2/login',
      '',
      { ctype: 'Username', cvalue: username, password }
    );
    // After login, we need the cookie from the response — this requires a browser session
    // For now, we report not implemented for user:pass without browser
    throw new Error('Login user:pass requiere ventana de navegador (no implementado sin browser)');
  } catch (err) {
    throw err;
  }
}

export async function verifyCookie(cookie: string): Promise<{ valid: boolean; userId: number; username: string }> {
  try {
    const data = await apiGet<{ data: { id: number; name: string }[] }>(
      'https://users.roblox.com/v1/users/authenticated',
      cookie
    );
    if (data.data && data.data.length > 0) {
      return { valid: true, userId: data.data[0].id, username: data.data[0].name };
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
