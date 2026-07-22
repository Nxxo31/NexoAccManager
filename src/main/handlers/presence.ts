import { ipcMain } from 'electron';
import { ok, err, isNonEmptyString, isValidPlaceId, isValidJobId, isPositiveInteger, isBool } from './shared';
import type { NexoApp } from '../main';

export function registerPresenceHandlers(app: NexoApp): void {
      ipcMain.handle('presence:get', async (_, accountIds: unknown) => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
          return err('Payload inválido: accountIds debe ser un array no vacío');
        }
        try {
          const ids = accountIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
          if (ids.length === 0) return err('Ningún accountId válido');
          const presence = await app.robloxContext.presence.getPresence(ids);
          return ok(presence);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('presence:start-polling', async (_, accountIds: unknown, intervalMs: unknown) => {
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
          return err('Payload inválido: accountIds debe ser un array no vacío');
        }
        if (intervalMs !== undefined && typeof intervalMs !== 'number') {
          return err('Payload inválido: intervalMs debe ser number o undefined');
        }
        try {
          const ids = accountIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
          if (ids.length === 0) return err('Ningún accountId válido');
          const interval = typeof intervalMs === 'number' && intervalMs > 0 ? intervalMs : undefined;
          await app.robloxContext.presence.startPolling(ids, interval as number);
          return ok(true);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('presence:stop-polling', async () => {
        try {
          await app.robloxContext.presence.stopPolling();
          return ok(true);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('presence:recent-games', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const games = await app.robloxContext.presence.getRecentGames(accountId.trim());
          return ok(games);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('presence:robux-balance', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const balance = await app.robloxContext.presence.getRobuxBalance(accountId.trim());
          return ok(balance);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });
}
