// Infrastructure: RobloxCookieService — cookie expiry + refresh

import { apiGet } from './RobloxHttp';

export async function getCookieExpiry(cookie: string): Promise<Date | null> {
  try {
    const data = await apiGet<{ expirationDate: string }>('https://auth.roblox.com/v1/session-info', cookie);
    if (data?.expirationDate) return new Date(data.expirationDate);
  } catch { /* invalid or no session */ }
  return null;
}

export async function refreshCookie(cookie: string): Promise<string> {
  // Roblox doesn't have a public refresh API — the cookie is valid until expiry.
  // This returns the same cookie if still valid, or throws if expired.
  const expiry = await getCookieExpiry(cookie);
  if (expiry && expiry > new Date()) {
    return cookie; // still valid
  }
  throw new Error('Cookie expirada — necesita re-login');
}
