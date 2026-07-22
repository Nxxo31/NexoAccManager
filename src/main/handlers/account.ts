import { ipcMain } from 'electron';
import axios from 'axios';
import { ok, err, isNonEmptyString, isValidPlaceId, isValidJobId, isPositiveInteger, isBool } from './shared';
import type { NexoApp } from '../main';
import { MAX_ACCOUNTS } from '../main';

export function registerAccountHandlers(app: NexoApp): void {
      ipcMain.handle('account:add', async (event, cookie: unknown, group: unknown) => {
        if (!isNonEmptyString(cookie)) {
          return err('Payload inválido: cookie debe ser un string no vacío');
        }
        if (!cookie.trim().startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
          return err('La cookie no tiene el formato válido de .ROBLOSECURITY');
        }
        // Validar límite máximo de cuentas
        if (app.accountManager.getAllAccounts().length >= MAX_ACCOUNTS) {
          return err(`Límite máximo de ${MAX_ACCOUNTS} cuentas alcanzado. Elimina algunas cuentas antes de agregar nuevas.`);
        }
        try {
          const groupName = isNonEmptyString(group) ? group.trim() : 'Default';
          const result = await app.accountManager.addAccountFromCookie(cookie.trim(), groupName);
          return ok(result);
        } catch (e) {
          return err(`Error agregando cuenta: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:login-browser', async (_, group: unknown) => {
        // Validar límite máximo de cuentas
        if (app.accountManager.getAllAccounts().length >= MAX_ACCOUNTS) {
          return err(`Límite máximo de ${MAX_ACCOUNTS} cuentas alcanzado. Elimina algunas cuentas antes de agregar nuevas.`);
        }
        try {
          const loginResult = await app.loginBrowserService.loginWithBrowser();

          const groupName = isNonEmptyString(group) ? group.trim() : 'Default';
          const result = await app.accountManager.addAccountFromCookie(loginResult.cookie, groupName);
          return ok(result);
        } catch (e) {
          const msg = (e as Error).message;
          if (msg.includes('Ventana cerrada')) {
            return err('Login cancelado por el usuario');
          }
          if (msg.includes('Tiempo de espera')) {
            return err('Tiempo de espera agotado. Vuelve a intentarlo.');
          }
          return err(`Error iniciando sesión: ${msg}`);
        }
      });

      ipcMain.handle('account:login', async (_, username: unknown, password: unknown, group: unknown) => {
        if (!isNonEmptyString(username)) {
          return err('Payload inválido: username debe ser un string no vacío');
        }
        if (!isNonEmptyString(password)) {
          return err('Payload inválido: password debe ser un string no vacío');
        }
        // Validar límite máximo de cuentas
        if (app.accountManager.getAllAccounts().length >= MAX_ACCOUNTS) {
          return err(`Límite máximo de ${MAX_ACCOUNTS} cuentas alcanzado. Elimina algunas cuentas antes de agregar nuevas.`);
        }
        try {
          const loginResult = await app.authService.login(username.trim(), password);

          const groupName = isNonEmptyString(group) ? group.trim() : 'Default';
          const result = await app.accountManager.addAccountFromCookie(loginResult.cookie, groupName);
          return ok(result);
        } catch (e) {
          const msg = (e as Error).message;
          if (msg.includes('2FA') || msg.includes('dos pasos')) {
            return err('Esta cuenta requiere verificación en dos pasos (2FA). Usa el método de ventana de navegador.');
          }
          if (msg.includes('captcha')) {
            return err('Roblox requiere captcha. Usa el método de ventana de navegador.');
          }
          return err(`Error iniciando sesión: ${msg}`);
        }
      });

      ipcMain.handle('account:remove', async (_, id: unknown) => {
        if (!isNonEmptyString(id)) {
          return err('Payload inválido: id debe ser un string no vacío');
        }
        try {
          const removed = await app.accountManager.removeAccount(id.trim());
          return removed ? ok(true) : err('Cuenta no encontrada');
        } catch (e) {
          return err(`Error removiendo cuenta: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:list', async () => {
        try {
          const accounts = app.accountManager.getAllAccounts();
          return ok(accounts);
        } catch (e) {
          return err(`Error listando cuentas: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:savePassword', async (_, accountId: unknown, password: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        if (!isNonEmptyString(password)) {
          return err('Payload inválido: password debe ser un string no vacío');
        }
        try {
          const encrypted = app.crypto.encrypt(password);
          app.accountManager.setAccountField(accountId.trim(), 'password', encrypted);
          return ok(true);
        } catch (e) {
          return err(`Error guardando contraseña: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:getPassword', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const account = app.accountManager.getAccountById(accountId.trim());
          if (!account) return err('Cuenta no encontrada');
          const encrypted = account.fields?.['password'];
          if (!encrypted) return ok(null);
          const decrypted = app.crypto.decrypt(encrypted);
          return ok(decrypted);
        } catch (e) {
          return err(`Error obteniendo contraseña: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:move', async (_, accountId: unknown, groupName: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        if (!isNonEmptyString(groupName)) {
          return err('Payload inválido: groupName debe ser un string no vacío');
        }
        try {
          app.accountManager.setAccountField(accountId.trim(), 'group', groupName.trim());
          return ok(true);
        } catch (e) {
          return err(`Error moviendo cuenta: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:field:set', async (_, accountId: unknown, key: unknown, value: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        if (!isNonEmptyString(key)) {
          return err('Payload inválido: key debe ser un string no vacío');
        }
        if (typeof value !== 'string') {
          return err('Payload inválido: value debe ser un string');
        }
        try {
          app.accountManager.setAccountField(accountId.trim(), key.trim(), value);
          return ok(true);
        } catch (e) {
          return err(`Error actualizando campo: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:check', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const account = app.accountManager.getAccountById(accountId.trim());
          return account ? ok(account) : err('Cuenta no encontrada');
        } catch (e) {
          return err(`Error verificando cuenta: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:bulk-import', async (_, input: unknown, format: unknown) => {
        if (typeof input !== 'string') {
          return err('Payload inválido: input debe ser un string');
        }
        if (format !== 'user:pass' && format !== 'cookies') {
          return err('Payload inválido: format debe ser \'user:pass\' o \'cookies\'');
        }
        const lines = input
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        if (lines.length === 0) {
          return err('Ingrese al menos una cuenta');
        }
        if (lines.length > 50) {
          return err('Máximo 50 cuentas permitidas');
        }
        const results: Array<{ success: boolean; message: string; accountId?: string }> = [];
        try {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            try {
              let accountId: string;
              if (format === 'user:pass') {
                const [username, password] = line.split(':');
                if (!username || !password) {
                  throw new Error(`Línea ${i + 1}: formato inválido, se esperaba usuario:contraseña`);
                }
                const loginResult = await app.authService.login(username, password);
                const result = await app.accountManager.addAccountFromCookie(loginResult.cookie, 'Default');
                accountId = result.id;
                results.push({ success: true, message: `Línea ${i + 1}: cuenta agregada`, accountId });
              } else {
                if (!line.startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
                  throw new Error(`Línea ${i + 1}: cookie no tiene formato .ROBLOSECURITY válido`);
                }
                const result = await app.accountManager.addAccountFromCookie(line, 'Default');
                accountId = result.id;
                results.push({ success: true, message: `Línea ${i + 1}: cuenta agregada`, accountId });
              }
            } catch (e) {
              results.push({ success: false, message: (e as Error).message });
            }
          }
          return ok(results);
        } catch (e) {
          return err(`Error procesando importación masiva: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:profile:get', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        try {
          const account = app.accountManager.getAccountById(accountId.trim());
          if (!account) return err('Cuenta no encontrada');
          const raw = app.db.getAccount(accountId) || {};
          const cookie = raw.encrypted_cookie
            ? app.crypto.decrypt(raw.encrypted_cookie)
            : '';
          if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');
          const profile = await app.accountSettingsService.getProfile(cookie);
          return ok(profile);
        } catch (e) {
          return err(`Error obteniendo perfil: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:profile:update', async (_, accountId: unknown, patch: unknown) => {
        if (!isNonEmptyString(accountId)) {
          return err('Payload inválido: accountId debe ser un string no vacío');
        }
        if (!patch || typeof patch !== 'object') {
          return err('Payload inválido: patch debe ser un objeto');
        }
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie
            ? app.crypto.decrypt(raw.encrypted_cookie)
            : '';
          if (!cookie) return err('No se pudo descifrar la cookie de la cuenta');

          const p = patch as { displayName?: string; description?: string };
          if (p.displayName) {
            const okDisplay = await app.accountSettingsService.updateDisplayName(cookie, p.displayName);
            if (!okDisplay) return err('Error actualizando display name');
          }
          if (p.description !== undefined) {
            const okDesc = await app.accountSettingsService.updateDescription(cookie, p.description);
            if (!okDesc) return err('Error actualizando descripción');
          }
          return ok(true);
        } catch (e) {
          return err(`Error actualizando perfil: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:avatar-thumbnail', async (_, userId: unknown) => {
        if (typeof userId !== 'number' || !Number.isFinite(userId)) {
          return err('userId debe ser un número válido');
        }
        try {
          const res = await axios.get<{ data: Array<{ imageUrl: string }> }>(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`,
            { timeout: 10_000 }
          );
          const url = res.data.data?.[0]?.imageUrl || null;
          return ok(url);
        } catch (e) {
          return err(`Error obteniendo avatar: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:friends:list', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const friends = await app.accountSettingsService.getFriendsList(cookie);
          return ok(friends);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:friends:requests', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const requests = await app.accountSettingsService.getFriendRequests(cookie);
          return ok(requests);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:friends:respond', async (_, accountId: unknown, userId: unknown, accept: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
        if (typeof accept !== 'boolean') return err('accept debe ser booleano');
        // El servicio acepta number como userId
        const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
        if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.respondFriendRequest(cookie, userIdNumber, accept);
          return result ? ok(true) : err('Error respondiendo solicitud');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:blocked:list', async (_, accountId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const blocked = await app.accountSettingsService.getBlockedUsers(cookie);
          return ok(blocked);
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:block:user', async (_, accountId: unknown, userId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
        const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
        if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.blockUser(cookie, userIdNumber);
          return result ? ok(true) : err('Error bloqueando usuario');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:unblock:user', async (_, accountId: unknown, userId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
        const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
        if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.unblockUser(cookie, userIdNumber);
          return result ? ok(true) : err('Error desbloqueando usuario');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:follow:user', async (_, accountId: unknown, userId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
        const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
        if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.followUser(cookie, userIdNumber);
          return result ? ok(true) : err('Error siguiendo usuario');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });

      ipcMain.handle('account:unfollow:user', async (_, accountId: unknown, userId: unknown) => {
        if (!isNonEmptyString(accountId)) return err('accountId inválido');
        if (typeof userId !== 'number' && !isNonEmptyString(userId)) return err('userId inválido');
        const userIdNumber = typeof userId === 'number' ? userId : Number(userId);
        if (!Number.isFinite(userIdNumber)) return err('userId debe ser numérico');
        try {
          const raw = app.db.getAccount(accountId.trim()) || {};
          const cookie = raw.encrypted_cookie ? app.crypto.decrypt(raw.encrypted_cookie) : '';
          if (!cookie) return err('No se pudo descifrar la cookie');
          const result = await app.accountSettingsService.unfollowUser(cookie, userIdNumber);
          return result ? ok(true) : err('Error dejando de seguir usuario');
        } catch (e) {
          return err(`Error: ${(e as Error).message}`);
        }
      });
}
