import { ipcMain } from 'electron';
import { ok, err } from './shared';
import type { NexoApp } from '../main';

export function registerBottingHandlers(app: NexoApp): void {
      ipcMain.handle('botting:start', async (_, data: unknown) => {
        if (!Array.isArray(data) || data.length < 2) {
          return err('Payload inválido: [accountIds: string[], intervalMinutes: number, placeId?: string, jobId?: string]');
        }
        const [accountIds, intervalMinutes, placeId, jobId] = data as [unknown, unknown, unknown?, unknown?];
        if (!Array.isArray(accountIds) || !accountIds.every(id => typeof id === 'string')) {
          return err('Payload inválido: accountIds debe ser string[]');
        }
        if (typeof intervalMinutes !== 'number' || isNaN(intervalMinutes) || intervalMinutes < 1) {
          return err('Payload inválido: intervalMinutes debe ser número >= 1');
        }
        const safePlaceId = typeof placeId === 'string' ? placeId : undefined;
        const safeJobId = typeof jobId === 'string' ? jobId : undefined;
        await app.robloxContext.botting.start(
          accountIds as string[],
          intervalMinutes as number,
          safePlaceId,
          safeJobId
        );
        return ok({ started: true });
      });

      ipcMain.handle('botting:stop', async () => {
        await app.robloxContext.botting.stop();
        return ok({ stopped: true });
      });

      ipcMain.handle('botting:getStatus', async () => {
        return ok(app.robloxContext.botting.getStatus());
      });

      ipcMain.handle('botting:setInterval', async (_, intervalMinutes: unknown) => {
        if (typeof intervalMinutes !== 'number' || isNaN(intervalMinutes) || intervalMinutes <= 0) {
          return err('Payload inválido: intervalMinutes debe ser número > 0');
        }
        await app.robloxContext.botting.setInterval(intervalMinutes as number);
        return ok({ updated: true });
      });
}
