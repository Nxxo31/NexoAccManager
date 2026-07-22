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
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 800, height: 600,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
      title: 'Iniciar sesión en Roblox',
    });

    let resolved = false;
    let credentialsSubmitted = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        win.close();
        reject(new Error('Timeout'));
      }
    }, 120_000);

    // Poll for cookie and submit credentials every 2s
    const pollInterval = setInterval(async () => {
      if (resolved) return;
      try {
        // Try to submit credentials if we haven't already
        if (!credentialsSubmitted) {
          try {
            await win.webContents.executeJavaScript(`
              const usernameInput = document.querySelector('input[name="username"]');
              const passwordInput = document.querySelector('input[name="password"]');
              const loginButton = document.querySelector('button[type="submit"]');
              if (usernameInput && passwordInput && loginButton) {
                usernameInput.value = ${JSON.stringify(username)};
                passwordInput.value = ${JSON.stringify(password)};
                loginButton.click();
                credentialsSubmitted = true;
              }
            `);
          } catch (e) {
            // Ignore errors in execution, we'll try again next interval
          }
        }

        // Check for cookie
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
      } catch (err) {
        // If window is destroyed, break out
        if (win === null) {
          resolved = true;
          clearTimeout(timeout);
          clearInterval(pollInterval);
          reject(new Error('Window destroyed'));
          return;
        }
        // Otherwise, keep polling
      }
    }, 2000);

    win.loadURL('https://www.roblox.com/login');

    // Handle window closed by user
    win.on('closed', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        clearInterval(pollInterval);
        win.close();
        reject(new Error('Window closed by user'));
      }
    });
  });
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
