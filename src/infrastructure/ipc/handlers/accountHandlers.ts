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
import * as http from 'node:http';
import { AccountRepositoryImpl } from '../../database/AccountRepositoryImpl';
import { encrypt, decrypt, hashCookie } from '../../database/CryptoService';
import { loginUserPass, verifyCookie } from '../../external/RobloxAuthService';
import {
  getProfile,
  updateProfile,
  get2FAStatus,
  toggle2FA,
  getActiveSessions,
  logoutSession,
  logoutAllSessions,
  changePassword,
  getPrivacySettings,
  updatePrivacySetting,
  getNotificationSettings,
  updateNotificationSetting,
} from '../../external/RobloxSettingsService';
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
      const info = await verifyCookie(cookie);
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
    try { return ok(await verifyCookie(cookie)); } catch (e) { return err(String(e)); }
  });

  ipcMain.handle('account:bulk-import', async (_e, { accounts }: { accounts: { username: string; password: string }[] }) => {
    try {
      let added = 0;
      for (const a of accounts) {
        try {
          const result = await loginUserPass(a.username, a.password);
          const info = await verifyCookie(result.cookie);
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

  // ============ ACCOUNT CONTROL (via HTTP to LocalApiService) ============
  ipcMain.handle('account:control', async (_e, { accountId, command }: { accountId: string; command: string }) => {
    try {
      // Validate accountId exists (optional, but we can let the service handle it)
      const account = await accountRepo.getById(accountId);
      if (!account) {
        return err('Account not found');
      }

      const baseUrl = 'http://127.0.0.1:31415';
      let endpoint = '';
      let method = 'POST';

      switch (command) {
        case 'launch':
          endpoint = `/accounts/${accountId}/launch`;
          break;
        case 'kill':
          endpoint = `/accounts/${accountId}/kill`;
          break;
        case 'status':
          endpoint = `/accounts/${accountId}/status`;
          method = 'GET';
          break;
        case 'refresh-cookie':
          endpoint = `/accounts/${accountId}/refresh-cookie`;
          break;
        default:
          return err(`Unknown command: ${command}`);
      }

      const url = `${baseUrl}${endpoint}`;

      // Make the HTTP request
      const response = await new Promise<{ statusCode: number; data: Record<string, unknown> | string }>((resolve, reject) => {
        const req = http.request(url, { method }, (res: http.IncomingMessage) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ statusCode: res.statusCode ?? 0, data: parsed as Record<string, unknown> });
            } catch {
              resolve({ statusCode: res.statusCode ?? 0, data });
            }
          });
        });

        // Enforce a 5s timeout to avoid hanging the IPC handler indefinitely
        req.setTimeout(5000, () => {
          req.destroy(new Error('Request timeout'));
        });

        req.on('error', (error: Error) => {
          reject(error);
        });

        req.end();
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ok(response.data);
      } else {
        const errorMsg = typeof response.data === 'object' && response.data !== null && 'error' in response.data
          ? String(response.data.error)
          : `HTTP ${response.statusCode}`;
        return err(errorMsg);
      }
    } catch (caught) {
      return err(errMsg(caught));
    }
  });

  // ============ BY-ACCOUNT PROFILE ============
  ipcMain.handle('account:profile:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getProfile(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:profile:update', async (_e, { accountId, updates }: { accountId: string; updates: { displayName?: string; description?: string } }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await updateProfile(cookie, updates);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT SECURITY ============
  ipcMain.handle('account:security:2fa', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      const result = await get2FAStatus(cookie);
      return ok(result);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:2fa-toggle', async (_e, { accountId, enable }: { accountId: string; enable: boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await toggle2FA(cookie, enable);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:sessions', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getActiveSessions(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:logout', async (_e, { accountId, sessionId }: { accountId: string; sessionId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await logoutSession(cookie, sessionId);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:logout-all', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await logoutAllSessions(cookie);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:security:password', async (_e, { accountId, current, next }: { accountId: string; current: string; next: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await changePassword(cookie, current, next);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT PRIVACY ============
  ipcMain.handle('account:privacy:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getPrivacySettings(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:privacy:update', async (_e, { accountId, key, value }: { accountId: string; key: string; value: string | boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await updatePrivacySetting(cookie, key, value);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });

  // ============ BY-ACCOUNT NOTIFICATIONS ============
  ipcMain.handle('account:notifications:get', async (_e, { accountId }: { accountId: string }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      return ok(await getNotificationSettings(cookie));
    } catch (e) { return err(String(e)); }
  });
  ipcMain.handle('account:notifications:update', async (_e, { accountId, key, value }: { accountId: string; key: string; value: boolean }) => {
    try {
      const account = await accountRepo.getById(accountId);
      if (!account) return err('Account not found');
      const cookie = decrypt(account.encryptedCookie);
      await updateNotificationSetting(cookie, key, value);
      return ok(null);
    } catch (e) { return err(String(e)); }
  });
}
