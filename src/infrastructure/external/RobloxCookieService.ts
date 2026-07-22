// Infrastructure: RobloxCookieService — cookie expiry + refresh

import { BrowserWindow } from 'electron';
import { apiGet } from './RobloxHttp';

export async function getCookieExpiry(cookie: string): Promise<Date | null> {
  try {
    const data = await apiGet<{ expirationDate: string }>('https://auth.roblox.com/v1/session-info', cookie);
    if (data?.expirationDate) return new Date(data.expirationDate);
  } catch { /* invalid or no session */ }
  return null;
}

export async function refreshCookie(cookie: string): Promise<string> {
  const expiry = await getCookieExpiry(cookie);
  if (!expiry) throw new Error('No se pudo verificar la cookie');

  const now = new Date();
  const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilExpiry > 24) {
    return cookie; // still valid, no need to refresh
  }

  // Cookie expires in <24h — open silent BrowserWindow to refresh session
  const win = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  try {
    // Set the cookie in the window's session
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

    // Navigate to trigger session refresh
    await win.webContents.loadURL('https://www.roblox.com/home');

    // Wait 3s for session to refresh
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Read the refreshed cookie
    const cookies = await win.webContents.session.cookies.get({ name: '.ROBLOSECURITY' });
    if (cookies.length > 0 && cookies[0].value) {
      return cookies[0].value;
    }

    // If no refreshed cookie, return original
    return cookie;
  } catch {
    // If refresh fails, return original cookie if still valid
    if (expiry > now) return cookie;
    throw new Error('Cookie expirada — necesita re-login');
  } finally {
    win.destroy();
  }
}
