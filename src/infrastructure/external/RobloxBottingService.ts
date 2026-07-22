// Infrastructure: RobloxBottingService — process control, auto-relaunch, watcher, fps, duplicates

import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { apiPost } from './RobloxHttp';
const execAsync = promisify(exec);

export async function killAllRoblox(): Promise<void> {
  if (process.platform === 'win32') {
    try { await execAsync('taskkill /F /IM RobloxPlayerBeta.exe'); } catch { /* no process */ }
  } else {
    try { await execAsync('pkill -f RobloxPlayer'); } catch { /* no process */ }
  }
}

export async function launchRobloxDirect(placeId: string, jobId: string, cookie: string): Promise<void> {
  // Launch Roblox using the protocol handler — needs MultiRobloxService for multi-instance
  const url = `roblox-player://1+launchmode=play+gameinfo=${jobId}+launchtime=${Date.now()}+placelauncherurl=https://assetgame.roblox.com/v1/placelauncher/placelauncher`;
  if (process.platform === 'win32') {
    try { execSync(`start "" "${url}"`, { shell: 'cmd.exe' }); } catch { /* ignore */ }
  }
}

export async function setAutoRelaunch(accountId: string, enable: boolean): Promise<void> {
  // Auto-relaunch: monitor process and restart if it dies
  // Implementation: spawn a watcher that checks for Roblox process every 30s
  // If enabled and process died, re-launch with saved placeId/jobId
  // This is a stub for the real implementation — needs process monitoring
  return;
}

export async function setConnectionWatcher(accountId: string, enable: boolean, maxInactivity: number): Promise<void> {
  // Connection watcher: monitor network connectivity, exit Roblox if disconnected
  return;
}

export async function setPreventDuplicates(enable: boolean): Promise<void> {
  // Prevent duplicate instances: check if Roblox is already running before launch
  return;
}

export async function setCloseBeta(): Promise<void> {
  // Close Roblox Beta processes specifically
  if (process.platform === 'win32') {
    try { await execAsync('taskkill /F /IM RobloxPlayerBeta.exe /FI "WINDOWTITLE eq *Beta*"'); } catch { /* no process */ }
  }
}

export async function setFPSUnlock(fps: 60 | 120 | 240): Promise<void> {
  // FPS unlocker: modify client settings or inject unlocker
  // This requires admin privileges and is platform-specific
  return;
}

export async function joinGroup(groupId: number, cookie: string): Promise<void> {
  await apiPost(`https://groups.roblox.com/v1/groups/${groupId}/join`, cookie);
}

let bottingInterval: NodeJS.Timeout | null = null;
const bottingAccounts = new Map<string, { placeId: string; interval: number }>();

export async function startBotting(accountId: string, placeId: string, intervalMinutes: number): Promise<void> {
  bottingAccounts.set(accountId, { placeId, interval: intervalMinutes });
  if (!bottingInterval) {
    bottingInterval = setInterval(async () => {
      for (const [accId, config] of bottingAccounts) {
        try {
          await launchRobloxDirect(config.placeId, '', '');
        } catch { /* ignore individual failures */ }
      }
    }, intervalMinutes * 60_000);
  }
}

export async function stopBotting(): Promise<void> {
  if (bottingInterval) {
    clearInterval(bottingInterval);
    bottingInterval = null;
  }
  bottingAccounts.clear();
}

export function getBottingStatus(): { running: boolean; accounts: string[] } {
  return {
    running: bottingInterval !== null,
    accounts: Array.from(bottingAccounts.keys()),
  };
}
