// Cookie Auto-Refresh Monitor for NAM v6.0
// Detects expiring cookies and triggers refresh before expiry
// Main process only — uses existing Repository + Auth Service

import { robloxCookieApi } from '../../infrastructure/external/RobloxCookieService';

// Feature #2: Cookie auto-refresh on expiry
// Trigger refresh when cookieExpiresAt is within 24h window

/** Configuration for cookie refresh behavior */
export interface CookieRefreshConfig {
  expiryThresholdMs: number; // Default: 24h = 86400000
  checkIntervalMs: number; // Default: 60000
}

/** Default configuration values */
export const defaultConfig: CookieRefreshConfig = {
  expiryThresholdMs: 86400000, // 24 hours
  checkIntervalMs: 60000, // 60 seconds
}

/** Result of cookie refresh attempt */
export interface CookieRefreshResult {
  success: boolean;
  newCookie?: string;
  error?: string;
}

/** Check accounts for expiring cookies and refresh them
 * 
 * Must be called from main process with injected dependencies.
 * 
 * @param accounts - Array of objects with cookieExpiresAt and cookie
 * @param config - Optional config (uses defaults if not provided)
 * @returns Array of results for each account indicating if cookie was refreshed
 */
export async function checkAndRefreshCookies(
  accounts: Array<{ cookieExpiresAt?: Date | null; cookie?: string | null }>,
  config: CookieRefreshConfig = defaultConfig
): Promise<CookieRefreshResult[]> {
  const { expiryThresholdMs } = config;
  const now = Date.now();
  const results: CookieRefreshResult[] = [];

  for (const account of accounts) {
    if (!account.cookieExpiresAt) {
      results.push({ success: false, error: 'No cookie expiry date' });
      continue;
    }

    const timeUntilExpiry = account.cookieExpiresAt.getTime() - now;

    // If cookie expires within threshold, refresh it
    if (timeUntilExpiry > 0 && timeUntilExpiry <= expiryThresholdMs) {
      try {
        // Get the cookie to refresh - use plain cookie or empty string if none
        const cookieToRefresh = account.cookie || '';
        
        if (!cookieToRefresh) {
          results.push({ success: false, error: 'No cookie available' });
          continue;
        }

        // Use the robloxCookieApi to refresh the cookie
        const refreshedCookie = await robloxCookieApi.refreshCookie(cookieToRefresh);
        
        results.push({ 
          success: true, 
          newCookie: refreshedCookie 
        });
      } catch (e) {
        results.push({ 
          success: false, 
          error: e instanceof Error ? e.message : String(e) 
        });
      }
    } else {
      // Cookie is not within refresh window
      results.push({ success: false, error: 'Cookie not within refresh window' });
    }
  }

  return results;
}

export default checkAndRefreshCookies;
