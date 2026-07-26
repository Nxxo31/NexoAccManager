import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);
const runningInstances = new Map<string, number>(); // accountId -> PID

// Validate Roblox jobId format: UUID v4 (hex chars + hyphens, 36 chars total)
const JOB_ID_REGEX = /^[a-f0-9-]{36}$/;

function isValidJobId(jobId: string): boolean {
  return typeof jobId === 'string' && JOB_ID_REGEX.test(jobId);
}

function isValidPid(pid: unknown): pid is number {
  return typeof pid === 'number' && Number.isInteger(pid) && pid > 0;
}

export async function launchMulti(accountId: string, placeId: string, jobId: string, cookie: string): Promise<number> {
  // Validate jobId to prevent command injection via the URL
  if (!isValidJobId(jobId)) {
    return 0;
  }
  const url = `roblox-player://1+launchmode=play+gameinfo=${jobId}+launchtime=${Date.now()}+placelauncherurl=https://assetgame.roblox.com/v1/placelauncher/placelauncher`;
  if (process.platform === 'win32') {
    execSync(`start "" "${url}"`, { shell: 'cmd.exe' });
  }
  // Try to find the PID of the newly launched process
  try {
    const output = execSync('tasklist /FI "IMAGENAME eq RobloxPlayerBeta.exe" /FO CSV /NH', { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    if (lines.length > 0) {
      const match = lines[lines.length - 1].match(/"(\d+)"/);
      if (match) {
        const pid = parseInt(match[1], 10);
        runningInstances.set(accountId, pid);
        return pid;
      }
    }
  } catch { /* ignore */ }
  return 0;
}

export async function killInstance(accountId: string): Promise<void> {
  const pid = runningInstances.get(accountId);
  if (pid !== undefined && isValidPid(pid)) {
    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /F /PID ${pid}`);
      } else {
        await execAsync(`kill -9 ${pid}`);
      }
    } catch { /* process already dead */ }
    runningInstances.delete(accountId);
  }
}

export function getRunningInstances(): { accountId: string; pid: number }[] {
  return Array.from(runningInstances.entries()).map(([accountId, pid]) => ({ accountId, pid }));
}
