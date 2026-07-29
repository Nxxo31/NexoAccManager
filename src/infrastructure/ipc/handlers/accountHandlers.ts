// Account namespace handlers — account management + per-account Roblox profile
// settings (profile / security / privacy / notifications).
//
// Channels: account:* and account:profile:* / account:security:* /
// account:privacy:* / account:notifications:*.
//
// Cookie resolution: handlers that talk to Roblox resolve the encrypted cookie
// from accountRepo + decrypt — the renderer NEVER receives raw cookies.

import { ipcMain } from 'electron';
import { v4 as uuid } from 'uuid';
import { AccountRepositoryImpl } from '../../database/AccountRepositoryImpl';
import { encrypt, decrypt, hashCookie } from '../../database/CryptoService';
// DT-4 (DIP): los handlers dependen de los Ports (interfaces del domain) vía
// adapter singletons en lugar de importar funciones concretas. Esto hace la
// dependencia explícita y permite inyectar mocks en tests sin reescribir imports.
import { robloxAuthApi } from '../../external/RobloxAuthService';
import { robloxSettingsApi } from '../../external/RobloxSettingsService';
// B-1: la conexión persistente WS al LocalApiService para el handler account:control.
import { controlWs } from '../../external/ControlWebSocketService';
import type { Account } from '../../../domain/entities/Account';
import { createAccount } from '../../../domain/entities/Account';
import { makeEncryptedString } from '../../../domain/types/EncryptedString';
import { ok, err, errMsg } from './shared';

export function registerAccountHandlers(): void {
  // Reused repository instance (same lifecycle as the original IPCAdapter singleton).
  const accountRepo = new AccountRepositoryImpl();

  // ============ ACCOUNT ============
  ipcMain.handle('account:add', async (_e, { cookie, group = 'Default' }: { cookie: string; group?: string }) => {
    try {
      const info = await robloxAuthApi.verifyCookie(cookie);
      if (!info.valid) return err('Cookie inválida');
      const count = await accountRepo.count();
      if (count >= 50) return err('Límite de 50 cuentas alcanzado');
      const account = createAccount({
        id: uuid(), robloxUserId: info.userId, username: info.username,
        encryptedCookie: makeEncryptedString(encrypt(cookie)), cookieHash: hashCookie(cookie), group,
      });
      await accountRepo.create(account);
      return ok(account.id);
    } catch (e) { return err(errMsg(e)); }
  });

  ipcMain.handle('account:list', async () => {
    try { return ok(await accountRepo.getAll()); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:remove', async (_e, { id }: { id: string }) => {
    try { await accountRepo.delete(id); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:move', async (_e, { id, group }: { id: string; group: string }) => {
    try { await accountRepo.update(id, { group }); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:field:set', async (_e, { id, field, value }: { id: string; field: string; value: string }) => {
    try {
      if (field === 'savedPlaceId' || field === 'savedJobId' || field === 'description' || field === 'password') {
        // Para campos no cifrados (savedPlaceId/savedJobId/description), value pasa tal cual.
        // Para 'password' el renderer envía la contraseña CIFRADA ya — la encripción ocurre
        // exponiendo el boundary correcto: este handler NO descifra/almacena texto plano,
        // solo marca el branded type para el dominio. Los callers válidos (account:savePassword)
        // envían encrypt(...) hecha. Si un caller del renderer envía texto plano perdido, el
        // branded type no lo detecta en runtime pero la invariante de tipos queda explícita.
        const accountField = field as keyof Account;
        const payload: Partial<Account> = { [accountField]: field === 'password' ? makeEncryptedString(value) : value } as Partial<Account>;
        await accountRepo.update(id, payload);
      }
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:savePassword', async (_e, { id, password }: { id: string; password: string }) => {
    try { await accountRepo.update(id, { password: makeEncryptedString(encrypt(password)) }); return ok(null); } catch (e) { return err(String(e)); }
  });

  // account:getPassword — ELIMINADO: exponía la contraseña descifrada al renderer (violación de boundary)
  // Las contraseñas NUNCA salen descifradas del main process.

  ipcMain.handle('account:setFavorite', async (_e, { id, favorite }: { id: string; favorite: boolean }) => {
    try { await accountRepo.update(id, { isFavorite: favorite }); return ok(null); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:check', async (_e, { cookie }: { cookie: string }) => {
    try { return ok(await robloxAuthApi.verifyCookie(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:bulk-import', async (_e, { accounts }: { accounts: { username: string; password: string }[] }) => {
    try {
      let added = 0;
      for (const a of accounts) {
        try {
          const result = await robloxAuthApi.loginUserPass(a.username, a.password);
          const info = await robloxAuthApi.verifyCookie(result.cookie);
          if (info.valid) {
            const count = await accountRepo.count();
            if (count >= 50) break;
            const account = createAccount({ id: uuid(), robloxUserId: info.userId, username: info.username, encryptedCookie: makeEncryptedString(encrypt(result.cookie)), cookieHash: hashCookie(result.cookie) });
            await accountRepo.create(account);
            added++;
          }
        } catch { /* skip failed */ }
      }
      return ok({ added });
    } catch (e) { return err(String(e)); }
  });

  // ============ ACCOUNT CONTROL (WebSocket bridge to LocalApiService) =========
  // B-1 (backlog): reemplazo del HTTP bridge interino por una conexión
  // WebSocket persistente contra el LocalApiService. La conexión se gestiona en
  // src/infrastructure/external/ControlWebSocketService.ts: reconexión con
  // backoff exponencial, cola de comandos pendientes, y push messages de estado
  // en tiempo real vía el event listener onStatus.
  //
  // Comportamiento:
  //   - Cada llamada retorna IpcResult (ok|err); nunca hace throw.
  //   - Si el LocalApiService no está corriendo, el WS no connecta y el
  //     comando se encola hasta que el timeout de 8s lo descarta con un mensaje
  //     claro ("Local API service is not running …").
  //   - El LocalApiService responde con `{ id, ok, data? } | { id, ok: false, error }`.
  ipcMain.handle('account:control', async (_e, { accountId, command }: { accountId: string; command: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) {
        return err('Account not found');
      }

      // Validación temprana del comando (fail-fast en el renderer).
      if (command !== 'launch' && command !== 'kill' && command !== 'status' && command !== 'refresh-cookie') {
        return err(`Unknown command: ${command}`);
      }

      // Best-effort audit log — wrap so a logging failure never breaks the IPC contract.
      try { console.log(`[account:control] cmd=${command} account=${accountId} (ws)`); } catch { /* best-effort */ }

      const result = await controlWs.sendCommand(accountId, command as 'launch' | 'kill' | 'status' | 'refresh-cookie');
      if (result.success) {
        try { console.log(`[account:control] ok cmd=${command} account=${accountId}`); } catch { /* best-effort */ }
        return ok(result.data);
      }
      // Traducir errores conocidos del WS al usuario final.
      return err(result.error);
    } catch (caught) {
      // Errores de accountRepo.getById u otros inesperados.
      return err(errMsg(caught));
    }
  });

  // ============ BY-ACCOUNT PROFILE ============
  ipcMain.handle('account:profile:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await robloxSettingsApi.getProfile(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:profile:update', async (_e, { accountId, updates }: { accountId: string; updates: { displayName?: string; description?: string } }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await robloxSettingsApi.updateProfile(cookie, updates);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT SECURITY ============
  ipcMain.handle('account:security:2fa', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      const result = await robloxSettingsApi.get2FAStatus(cookie);
      return ok(result);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:2fa-toggle', async (_e, { accountId, enable }: { accountId: string; enable: boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await robloxSettingsApi.toggle2FA(cookie, enable);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:sessions', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await robloxSettingsApi.getActiveSessions(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:logout', async (_e, { accountId, sessionId }: { accountId: string; sessionId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await robloxSettingsApi.logoutSession(cookie, sessionId);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:logout-all', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await robloxSettingsApi.logoutAllSessions(cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:password', async (_e, { accountId, current, next }: { accountId: string; current: string; next: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await robloxSettingsApi.changePassword(cookie, current, next);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT PRIVACY ============
  ipcMain.handle('account:privacy:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await robloxSettingsApi.getPrivacySettings(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:privacy:update', async (_e, { accountId, key, value }: { accountId: string; key: string; value: string | boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await robloxSettingsApi.updatePrivacySetting(cookie, key, value);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT NOTIFICATIONS ============
  ipcMain.handle('account:notifications:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await robloxSettingsApi.getNotificationSettings(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:notifications:update', async (_e, { accountId, key, value }: { accountId: string; key: string; value: boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await robloxSettingsApi.updateNotificationSetting(cookie, key, value);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ RESTORED LOGIN HANDLERS (R-001/R-002) ============
  // R-001: account:login-browser — replaced legacy handler that accepted/returned raw cookie.
  // Nuevo flujo seguro: render → invoca loginBrowser (muestra ventana Chromium aislada)
  // → main procesa cookie, la cifra y guarda en base de datos → render recibe solo accountId.
  // La cookie NUNCA abandona el main process (se cumple regla de seguridad "cookies nunca abandonan el PC").
  ipcMain.handle('account:login-browser', async () => {
    try {
      const { cookie } = await robloxAuthApi.loginBrowser(); // usa Chromium aislado
      // Validar y crear cuenta (mismo flujo que account:add)
      const info = await robloxAuthApi.verifyCookie(cookie);
      if (!info.valid) return err('Cookie inválida');
      const count = await accountRepo.count();
      if (count >= 50) return err('Límite de 50 cuentas alcanzado');
      const account = createAccount({
        id: uuid(),
        robloxUserId: info.userId,
        username: info.username,
        encryptedCookie: makeEncryptedString(encrypt(cookie)),
        cookieHash: hashCookie(cookie),
      });
      await accountRepo.create(account);
      return ok(account.id); // renderer recibe SOLO el id, nunca la cookie
    } catch (e) { return err(String(e)); }
  });

  // R-002: account:login — replaced legacy handler that accepted user:pass + returned cookie.
  // Nuevo flujo seguro: render → envía user:pass → main intenta loginUserPass
  // → main cifra/guarda cookie → render recibe solo accountId.
  // La cookie NUNCA abandona el main process.
  ipcMain.handle('account:login', async (_e, { username, password }: { username: string; password: string }) => {
    try {
      const result = await robloxAuthApi.loginUserPass(username, password); // usa Chromium aislado
      const info = await robloxAuthApi.verifyCookie(result.cookie);
      if (!info.valid) return err('Cookie inválida');
      const count = await accountRepo.count();
      if (count >= 50) return err('Límite de 50 cuentas alcanzado');
      const account = createAccount({
        id: uuid(),
        robloxUserId: info.userId,
        username: info.username,
        encryptedCookie: makeEncryptedString(encrypt(result.cookie)),
        cookieHash: hashCookie(result.cookie),
      });
      await accountRepo.create(account);
      return ok(account.id); // renderer recibe SOLO el id
    } catch (e) { return err(String(e)); }
  });
}