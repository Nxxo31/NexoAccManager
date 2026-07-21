import { exec } from 'child_process';
import { join, dirname } from 'path';
import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'fs';

/**
 * RobloxWatcherService — vigila y gestiona procesos de Roblox
 */
export class RobloxWatcherService {
  private preventDuplicatesEnabled = false;

  async autoRelaunch(accountIds: string[], placeId: string, maxAttempts: number): Promise<boolean> {
    return false;
  }

  preventDuplicates(enable: boolean): void {
    this.preventDuplicatesEnabled = enable;
  }

  async initWatcher(accountId: string, maxInactivityMinutes: number, autoExit: boolean): Promise<boolean> {
    return true;
  }

  closeBeta(): void {
    const cmd = process.platform === 'win32'
      ? 'taskkill /f /im RobloxPlayerBeta.exe'
      : 'taskkill /f /im RobloxPlayerBeta.exe 2>/dev/null || pkill -f RobloxPlayerBeta';
    exec(cmd, () => {});
  }

  fpsUnlock(fps: 60 | 120 | 240): void {
    const localAppData = process.env.LOCALAPPDATA || process.env.HOME || '/tmp';
    const robloxPath = process.platform === 'win32'
      ? `${localAppData}\\Roblox\\Versions`
      : `${localAppData}/.wine/drive_c/users/${process.env.USER}/Local Settings/Application Data/Roblox/Versions`;

    try {
      const versions = this._getDirs(robloxPath);
      if (versions.length === 0) return;
      const latest = versions.sort().pop()!;
      const settingsPath = join(robloxPath, latest, 'ClientAppSettings.json');
      const settingsDir = dirname(settingsPath);
      if (!existsSync(settingsDir)) mkdirSync(settingsDir, { recursive: true });
      writeFileSync(settingsPath, JSON.stringify({
        'FFlagTaskSchedulerTargetFps': fps,
        'FFlagTaskSchedulerOverrideTargetFps': true
      }, null, 2), 'utf8');
    } catch (_) {}
  }

  private _getDirs(dirPath: string): string[] {
    try { return readdirSync(dirPath).filter(f => statSync(join(dirPath, f)).isDirectory()); }
    catch { return []; }
  }
}