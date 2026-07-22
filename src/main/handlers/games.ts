import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { ok, err, isNonEmptyString, isValidPlaceId, isValidJobId, isPositiveInteger, isBool } from './shared';
import type { NexoApp } from '../main';

export function registerGamesHandlers(app: NexoApp): void {
      ipcMain.handle('games:addFavorite', async (_, payload: unknown) => {
        if (!payload || typeof payload !== 'object') {
          return err('Payload inválido: se esperaba un objeto');
        }
        const { accountId, gameId, name, icon } = payload as {
          accountId: string;
          gameId: number;
          name: string;
          icon?: string;
        };
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        if (typeof gameId !== 'number' || isNaN(gameId)) {
          return err('Payload inválido: gameId debe ser un número válido');
        }
        if (!isNonEmptyString(name)) {
          return err('Payload inválido: name debe ser un string no vacío');
        }
        try {
          const favoriteGame = {
            id: uuidv4(),
            gameId: gameId,
            name: name,
            icon: icon || undefined,
            addedAt: new Date()
          };
          app.accountManager.addFavoriteGame(accountId.trim(), favoriteGame);
          return ok(true);
        } catch (e) {
          return err(`Error agregando juego a favoritos: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('games:removeFavorite', async (_, payload: unknown) => {
        if (!payload || typeof payload !== 'object') {
          return err('Payload inválido: se esperaba un objeto');
        }
        const { accountId, gameId } = payload as {
          accountId: string;
          gameId: number;
        };
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        if (typeof gameId !== 'number' || isNaN(gameId)) {
          return err('Payload inválido: gameId debe ser un número válido');
        }
        try {
          app.accountManager.removeFavoriteGame(accountId.trim(), gameId);
          return ok(true);
        } catch (e) {
          return err(`Error eliminando juego de favoritos: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('games:getFavorites', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const favoriteGames = app.accountManager.getFavoriteGames(accountId.trim());
          return ok({ favoriteGames });
        } catch (e) {
          return err(`Error obteniendo juegos favoritos: ${(e as Error).message}`);
        }
      });
}
