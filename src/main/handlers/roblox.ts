import { ipcMain } from 'electron';
import axios from 'axios';
import { ok, err, isNonEmptyString, isValidPlaceId, isValidJobId, isPositiveInteger, isBool } from './shared';
import type { NexoApp } from '../main';

export function registerRobloxHandlers(app: NexoApp): void {
      ipcMain.handle('roblox:launch', async (_, accountId: unknown, placeId: unknown, jobId: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        if (!isValidPlaceId(placeId)) {
          return err('Payload inválido: placeId debe ser un string numérico no vacío');
        }
        if (!isValidJobId(jobId)) {
          return err('Payload inválido: jobId tiene formato inválido');
        }
        try {
          const result = await app.accountManager.launchRoblox(
            accountId.trim(),
            String(placeId).trim(),
            jobId ? String(jobId).trim() : undefined
          );
          return ok(result);
        } catch (e) {
          return err(`Error lanzando Roblox: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:games:search', async (_, placeId: unknown, accountId: unknown) => {
        if (!isValidPlaceId(placeId)) {
          return err('Payload inválido: placeId debe ser un string numérico no vacío');
        }
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie
            ? app.crypto.decrypt(raw.encrypted_cookie)
            : '';
          if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
          const game = await app.robloxContext.games.searchGame(placeId.trim(), cookie);
          return ok(game);
        } catch (e) {
          return err(`Error buscando juego: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:servers:list', async (_, placeId: unknown, accountId: unknown) => {
        if (!isValidPlaceId(placeId)) {
          return err('Payload inválido: placeId debe ser un string numérico no vacío');
        }
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie
            ? app.crypto.decrypt(raw.encrypted_cookie)
            : '';
          if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
          const servers = await app.robloxContext.servers.getGameServers(placeId.trim(), cookie);
          return ok(servers);
        } catch (e) {
          return err(`Error listando servers: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:servers:users', async (_, placeId: unknown, accountId: unknown) => {
        if (!isValidPlaceId(placeId)) {
          return err('Payload inválido: placeId debe ser un string numérico no vacío');
        }
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie
            ? app.crypto.decrypt(raw.encrypted_cookie)
            : '';
          if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
          const users = await app.robloxContext.servers.getServerUsers(String(placeId).trim(), '', cookie);
          return ok(users);
        } catch (e) {
          return err(`Error obteniendo usuarios del server: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:servers:join', async (_, placeId: unknown, jobId: unknown, accountId: unknown) => {
        if (!isValidPlaceId(placeId)) {
          return err('Payload inválido: placeId debe ser un string numérico no vacío');
        }
        if (!isValidJobId(jobId)) {
          return err('Payload inválido: jobId tiene formato inválido');
        }
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const result = await app.robloxContext.servers.joinServer(placeId.trim(), jobId as string, accountId);
          return ok(result);
        } catch (e) {
          return err(`Error uniéndose al server: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:servers:distribute', async (_, placeId: unknown, accountIds: unknown) => {
        if (!isValidPlaceId(placeId)) {
          return err('Payload inválido: placeId debe ser un string numérico no vacío');
        }
        if (!Array.isArray(accountIds) || accountIds.length === 0) {
          return err('Payload inválido: accountIds debe ser un array no vacío');
        }
        try {
          // Obtener cookie del primer accountId para listar servers
          const firstId = String(accountIds[0]).trim();
          const raw = app.db.getAccount(firstId) || {};
          const cookie = raw.encrypted_cookie
            ? app.crypto.decrypt(raw.encrypted_cookie)
            : '';
          if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');

          const results = await app.robloxContext.servers.distributeAccounts(placeId.trim(), accountIds, cookie);
          return ok(results);
        } catch (e) {
          return err(`Error distribuyendo cuentas: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:search-user', async (_, username: unknown) => {
        if (!isNonEmptyString(username)) return err('username inválido');
        try {
          const response = await axios.get(
            `https://users.roblox.com/v1/usernames/users`,
            {
              method: 'POST',
              data: { usernames: [username.trim()], excludeBannedUsers: true },
              headers: { 'Content-Type': 'application/json' },
            }
          );
          const data = response.data;
          if (data?.data?.length > 0) {
            const user = data.data[0];
            return ok({ id: user.id, name: user.name, displayName: user.displayName });
          }
          return err('Usuario no encontrado');
        } catch (e) {
          return err(`Error buscando usuario: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:join-group', async (_, accountId: unknown, groupId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (!isPositiveInteger(groupId)) return err('groupId inválido');
        try {
          const account = app.accountManager.getAccountById(accountId);
          if (!account) return err('Cuenta no encontrada');
          // Get decrypted cookie
          const cookie = app.crypto.decrypt((account as any).encrypted_cookie || account.cookie || '');
          if (!cookie) return err('Cookie no disponible');
          // Get CSRF token
          const csrfRes = await axios.post('https://auth.roblox.com/v2/login', {}, {
            headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
          });
          const csrfToken = csrfRes.headers['x-csrf-token'];
          if (!csrfToken) return err('No se pudo obtener token CSRF');
          // Join group
          await axios.post(
            `https://groups.roblox.com/v1/groups/${Number(groupId)}/users`,
            {},
            {
              headers: {
                Cookie: `.ROBLOSECURITY=${cookie}`,
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json',
              },
            }
          );
          return ok(true);
        } catch (e) {
          return err(`Error uniéndose al grupo: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:quick-login', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const account = app.accountManager.getAccountById(accountId);
          if (!account) return err('Cuenta no encontrada');
          const cookie = app.crypto.decrypt((account as any).encrypted_cookie || account.cookie || '');
          if (!cookie) return err('Cookie no disponible');
          // Verify cookie
          // Use launchRoblox with placeId=0 for quick login
          const result = await app.accountManager.launchRoblox(accountId, '0', undefined);
          return ok(result);
        } catch (e) {
          return err(`Error en inicio rápido: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('roblox:kill-all', async () => {
        try {
          const result = await app.multiRobloxService.killAll();
          return ok(result);
        } catch (e) {
          return err(`Error cerrando instancias: ${(e as Error).message}`);
        }
      });
}
