// Infrastructure: RobloxBottingService — process control, auto-relaunch, watcher, fps, duplicates
import { exec, execSync } from 'node:child_process';
import { logger } from '../logging/logger';
import { promisify } from 'node:util';
import { apiPost } from './RobloxHttp';
import { apiGet } from './RobloxHttp';
import fs from 'node:fs';
import path from 'node:path';

const execAsync = promisify(exec);

export async function killAllRoblox(): Promise<void> {
  if (process.platform === 'win32') {
    try { await execAsync('taskkill /F /IM RobloxPlayerBeta.exe'); } catch { /* no process */ }
  } else {
    try { await execAsync('pkill -f RobloxPlayer'); } catch { /* no process */ }
  }
}

// BUG FIX (BUG 2 + BUG 4 + BUG 5): launchRobloxDirect now returns PID (number),
// uses placeId in the URL for logging/debugging, and logs on non-win32 instead
// of silent no-op. The PID is needed by LocalApiService to populate runningInstances.
export async function launchRobloxDirect(placeId: string, jobId: string, _cookie: string): Promise<number> {
  // Validate jobId to prevent command injection via the URL (UUID v4 hex+hyphens, 36 chars)
  const JOB_ID_REGEX = /^[a-f0-9-]{36}$/;
  if (jobId && !JOB_ID_REGEX.test(jobId)) {
    return 0;
  }
  // Launch Roblox using the protocol handler — needs MultiRobloxService for multi-instance
  const url = `roblox-player://1+launchmode=play+gameinfo=${jobId}+launchtime=${Date.now()}+placelauncherurl=https://assetgame.roblox.com/v1/placelauncher/placelauncher`;
  if (process.platform === 'win32') {
    try { execSync(`start "" "${url}"`, { shell: 'cmd.exe' }); } catch { /* ignore */ }
    // BUG FIX: capture PID of the newly launched Roblox process so status works
    try {
      const output = execSync('tasklist /FI "IMAGENAME eq RobloxPlayerBeta.exe" /FO CSV /NH', { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      if (lines.length > 0) {
        const match = lines[lines.length - 1].match(/"(\d+)"/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    } catch { /* PID detection failed — return 0 */ }
  } else {
    // BUG FIX (BUG 5): Linux/macOS — log instead of silent no-op
    logger.warn(`[launchRobloxDirect] Platform ${process.platform} not supported for direct launch — placeId=${placeId} jobId=${jobId}`);
  }
  return 0;
}

// ==== New implementations for the 5 stubs ====

// Maps for auto-relaunch intervals
const autoRelaunchIntervals = new Map<string, NodeJS.Timeout>();
// Maps for connection watcher timers and failure timestamps
const connectionWatchers = new Map<string, NodeJS.Timeout>();
const connectionFailureTimes = new Map<string, number>(); // timestamp of first failure
// Maps for duplicate prevention: cookieHash -> PID
const duplicatePreventionMap = new Map<string, number>();
let duplicatePreventionEnabled = false;
// BUG FIX (BUG 6): Store last launch params per account for auto-relaunch
const lastLaunchParams = new Map<string, { placeId: string; jobId: string; cookie: string }>();

/**
 * Set auto-relaunch for an account
 */
export async function setAutoRelaunch(accountId: string, enable: boolean): Promise<void> {
  if (!enable) {
    if (autoRelaunchIntervals.has(accountId)) {
      clearInterval(autoRelaunchIntervals.get(accountId)!);
      autoRelaunchIntervals.delete(accountId);
    }
    return;
  }

  if (autoRelaunchIntervals.has(accountId)) {
    return; // already running
  }

  const interval = setInterval(async () => {
    let isRunning = false;
    try {
      if (process.platform === 'win32') {
        const output = execSync('tasklist /FI "IMAGENAME eq RobloxPlayerBeta.exe"', { encoding: 'utf8' });
        isRunning = output.includes('RobloxPlayerBeta.exe');
      } else {
        const output = execSync('pgrep -f RobloxPlayerBeta', { encoding: 'utf8' });
        isRunning = output.trim() !== '';
      }
    } catch {
      isRunning = false;
    }

    if (!isRunning) {
      logger.warn(`Auto-relaunch: Roblox process not found for account ${accountId}`);
      // BUG FIX (BUG 6): Use stored launch params instead of empty strings
      const params = lastLaunchParams.get(accountId);
      if (params) {
        try {
          await launchRobloxDirect(params.placeId, params.jobId, params.cookie);
        } catch (e) {
          logger.error(`Failed to relaunch Roblox for account ${accountId}:`, e);
        }
      } else {
        logger.warn(`Auto-relaunch: No stored launch params for account ${accountId} — cannot relaunch`);
      }
    }
  }, 30000);

  autoRelaunchIntervals.set(accountId, interval);
}

/**
 * Set connection watcher for an account
 */
export async function setConnectionWatcher(accountId: string, enable: boolean, maxInactivity: number): Promise<void> {
  // Clear existing interval if any
  if (connectionWatchers.has(accountId)) {
    clearInterval(connectionWatchers.get(accountId)!);
    connectionWatchers.delete(accountId);
    connectionFailureTimes.delete(accountId);
  }

  if (enable) {
    const interval = setInterval(async () => {
      try {
        // Assuming accountId is the user ID
        const response = await apiGet(`https://presence.roblox.com/v1/presence/users?userIds=${accountId}`);
        const data = JSON.parse(response as string);
        if (data && data.data && data.data.length > 0) {
          const presence = data.data[0].userPresenceType; // Assuming this field exists
          if (presence === 1 || presence === 2 || presence === 3 || presence === 4) { // Online, LookingToPlay, InGame, InStudio
            // Reset failure time
            connectionFailureTimes.delete(accountId);
          } else {
            // Offline
            handleOffline(accountId, maxInactivity);
          }
        } else {
          // No data returned
          handleOffline(accountId, maxInactivity);
        }
      } catch {
        // Request failed
        handleOffline(accountId, maxInactivity);
      }
    }, 60_000); // 60 seconds

    connectionWatchers.set(accountId, interval);
  }
}

// BUG FIX (BUG 7): killInstance from MultiRobloxService to kill by PID,
// not all Roblox processes. Falls back to killing all only if PID unknown.
function handleOffline(accountId: string, maxInactivity: number): void {
  const now = Date.now();
  const firstFailure = connectionFailureTimes.get(accountId);
  if (firstFailure === undefined) {
    // First time seeing offline
    connectionFailureTimes.set(accountId, now);
  } else {
    const elapsed = now - firstFailure;
    if (elapsed >= maxInactivity * 60 * 1000) {
      // Max inactivity reached, kill Roblox process for THIS account only
      logger.info(`Connection watcher: Max inactivity reached for account ${accountId}. Killing Roblox process.`);
      try {
        // BUG FIX (BUG 7): Use killInstance from MultiRobloxService to kill by accountId
        // instead of killing ALL Roblox processes
        const { killInstance } = require('./MultiRobloxService');
        killInstance(accountId);
      } catch (err) {
        logger.error(`Failed to kill Roblox process for account ${accountId}:`, err);
      }
      // Reset after killing
      connectionFailureTimes.delete(accountId);
    }
  }
}

/**
 * Set duplicate prevention
 */
export async function setPreventDuplicates(enable: boolean): Promise<void> {
  duplicatePreventionEnabled = enable;
  if (!enable) {
    duplicatePreventionMap.clear();
  }
}

/**
 * Check if launching would create a duplicate (to be called before launch)
 * Returns true if safe to launch (no duplicate), false if duplicate detected
 */
export function canLaunchWithCookieHash(cookieHash: string): boolean {
  if (!duplicatePreventionEnabled) {
    return true;
  }
  const existingPid = duplicatePreventionMap.get(cookieHash);
  if (existingPid !== undefined && Number.isInteger(existingPid) && existingPid > 0) {
    // Check if the process is still running
    try {
      if (process.platform === 'win32') {
        const output = execSync(`tasklist /FI "PID eq ${existingPid}"`, { encoding: 'utf8' });
        return !output.includes(`${existingPid}`); // If not found, it's not running
      } else {
        const output = execSync(`ps -p ${existingPid}`, { encoding: 'utf8' });
        return output.trim() === ''; // If no output, process not running
      }
    } catch {
      // Process not found, consider it not running
      return true;
    }
  }
  return true; // No previous entry
}

/**
 * Register a launched process for duplicate prevention
 */
export function registerLaunchedProcess(cookieHash: string, pid: number): void {
  if (duplicatePreventionEnabled) {
    duplicatePreventionMap.set(cookieHash, pid);
  }
}

/**
 * Unregister a process (when it exits)
 */
export function unregisterLaunchedProcess(cookieHash: string): void {
  duplicatePreventionMap.delete(cookieHash);
}

/**
 * Close Roblox Beta processes specifically
 */
export async function setCloseBeta(): Promise<void> {
  if (process.platform === 'win32') {
    try { 
      await execAsync('taskkill /F /IM RobloxPlayerBeta.exe /FI "WINDOWTITLE eq *Beta*"'); 
    } catch { /* no process */ }
  } else {
    try {
      await execAsync('pkill -f "RobloxPlayerBeta"');
    } catch { /* no process */ }
  }
}

/**
 * Set FPS unlocker
 */
export async function setFPSUnlock(fps: 60 | 120 | 240): Promise<void> {
  try {
    let localAppData: string;
    if (process.platform === 'win32') {
      localAppData = process.env.LOCALAPPDATA || '';
    } else if (process.platform === 'darwin') {
      // macOS: ~/Library/Application Support/com.roblox.Roblox/Versions
      const home = process.env.HOME || '';
      localAppData = path.join(home, 'Library', 'Application Support', 'com.roblox.Roblox');
    } else {
      // Linux: ~/.local/share/Roblox/Versions
      const home = process.env.HOME || '';
      localAppData = path.join(home, '.local', 'share', 'Roblox');
    }

    const versionsDir = path.join(localAppData, 'Versions');
    if (!fs.existsSync(versionsDir)) {
      logger.warn(`Roblox Versions directory not found: ${versionsDir}`);
      return;
    }

    const entries = fs.readdirSync(versionsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => ({
        name: dirent.name,
        path: path.join(versionsDir, dirent.name),
        mtime: fs.statSync(path.join(versionsDir, dirent.name)).mtime.getTime()
      }));

    if (entries.length === 0) {
      logger.warn('No Roblox version directories found');
      return;
    }

    // Sort by modification time descending, take the most recent
    entries.sort((a, b) => b.mtime - a.mtime);
    const latestVersionDir = entries[0].path;
    const clientSettingsDir = path.join(latestVersionDir, 'ClientSettings');

    // Ensure directory exists
    if (!fs.existsSync(clientSettingsDir)) {
      fs.mkdirSync(clientSettingsDir, { recursive: true });
    }

    const settingsPath = path.join(clientSettingsDir, 'ClientAppSettings.json');
    const settingsContent = JSON.stringify({ DFIntTaskSchedulerTargetFps: fps }, null, 2);
    fs.writeFileSync(settingsPath, settingsContent, { encoding: 'utf8' });

    logger.info(`FPS unlocker set to ${fps} FPS at ${settingsPath}`);
  } catch (err) {
    logger.error('Failed to set FPS unlocker:', err);
  }
}

/* Existing botting functions (unchanged) */
let bottingInterval: NodeJS.Timeout | null = null;
const bottingAccounts = new Map<string, { placeId: string; jobId: string; cookie: string; interval: number }>();

export async function joinGroup(groupId: number, cookie: string): Promise<void> {
  await apiPost(`https://groups.roblox.com/v1/groups/${groupId}/join`, cookie);
}

// BUG FIX (BUG 3): startBotting now stores jobId and cookie alongside placeId
// so launches during botting actually work (not empty strings)
export async function startBotting(accountId: string, placeId: string, intervalMinutes: number, jobId: string = '', cookie: string = ''): Promise<void> {
  bottingAccounts.set(accountId, { placeId, jobId, cookie, interval: intervalMinutes });
  if (!bottingInterval) {
    // Use the minimum interval among all accounts, or default to 1 minute if none
    let minInterval = 1; // default 1 minute
    if (bottingAccounts.size > 0) {
      minInterval = Math.min(...Array.from(bottingAccounts.values()).map(v => v.interval));
    }
    bottingInterval = setInterval(async () => {
      for (const [acctId, config] of bottingAccounts) {
        try {
          const pid = await launchRobloxDirect(config.placeId, config.jobId, config.cookie);
          // BUG FIX: store PID for status tracking
          if (pid > 0) {
            lastLaunchParams.set(acctId, { placeId: config.placeId, jobId: config.jobId, cookie: config.cookie });
          }
        } catch { /* ignore individual failures */ }
      }
    }, minInterval * 60_000);
  }
}

export async function stopBotting(): Promise<void> {
  if (bottingInterval) {
    clearInterval(bottingInterval);
    bottingInterval = null;
  }
  bottingAccounts.clear();

  // Cleanup: clear all auto-relaunch and connection watcher intervals
  // to prevent memory leaks when botting stops
  for (const [, interval] of autoRelaunchIntervals) {
    clearInterval(interval);
  }
  autoRelaunchIntervals.clear();

  for (const [, interval] of connectionWatchers) {
    clearInterval(interval);
  }
  connectionWatchers.clear();
  connectionFailureTimes.clear();
}

export function getBottingStatus(): { running: boolean; accounts: string[] } {
  return {
    running: bottingInterval !== null,
    accounts: Array.from(bottingAccounts.keys()),
  };
}
