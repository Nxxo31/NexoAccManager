/**
 * AccountManager - Controlador principal de lÃ³gica de negocio
 *
 * Encapsula las operaciones relacionadas con cuentas, cifrado,
 * lanzamiento de Roblox y gestiÃ³n de grupos.
 */
import { ipcMain } from 'electron';
import axios from 'axios';
import crypto from 'crypto';
import { Account } from '../types/Account';
import { DatabaseManager } from '../storage/DatabaseManager';
import { CryptoService } from './CryptoService';

/**
 * Enum de endpoints de Roblox
 */
enum RobloxEndpoints {
  AccountInfo = 'https://users.roblox.com/v1/users/authenticated',
  Avatar = 'https://avatar.roblox.com/v1/users/:userId/avatar',
  AuthVerification = 'https://auth.roblox.com/v2/logout',
}

export class AccountManager {
  private db: DatabaseManager;
  private crypto: CryptoService;
  private multiRobloxEnabled: boolean = false;
  private cachedAccounts: Account[] = [];

  constructor(db: DatabaseManager, crypto: CryptoService) {
    this.db = db;
    this.crypto = crypto;
    this.updateCachedAccounts();
  }

  /**
   * Refresca el cache de cuentas
   */
  private async updateCachedAccounts(): Promise<void> {
    this.cachedAccounts = (await this.db.getAllAccounts()).map(this.hydrateAccount);
  }

  /**
   * Transforma los datos SQL a un objeto Account
   */
  private hydrateAccount(row: any): Account {
    return {
      id: row.id,
      robloxUserId: row.roblox_user_id,
      username: row.username,
      displayName: row.display_name || undefined,
      group: row.group_name || 'Default',
      description: row.description || '',
      lastUsed: new Date(row.last_used),
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * AÃ±ade una cuenta desde una cookie .ROBLOSECURITY
   */
  async addAccountFromCookie(cookie: string): Promise<Account> {
    if (!cookie.trim().startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
      throw new Error('Formato de cookie invÃ¡lido');
    }

    // Validar la cookie usando Roblox
    const auth = await this.verifyAndGetAuthInfo(cookie);
    if (!auth.authenticated || !auth.userId) {
      throw new Error('Cookie invÃ¡lida o expirada');
    }

    const encryptedCookie = this.crypto.encrypt(cookie);
    const hash = crypto.createHash('sha256').update(cookie.trim()).digest('hex');
    const accountId = crypto.randomUUID();

    const robloxUsername = await this.fetchUsernameFromRoblox(auth.userId);

    this.db.createAccount({
      id: accountId,
      robloxUserId: auth.userId,
      username: robloxUsername,
      encryptedCookie: encryptedCookie,
      cookieHash: hash,
    });

    await this.updateCachedAccounts();
    return this.hydrateAccount(this.db.getAccount(accountId));
  }

  /**
   * Valida una cookie y obtiene informaciÃ³n de autenticaciÃ³n
   */
  private async verifyAndGetAuthInfo(cookie: string): Promise<{ authenticated: boolean; userId: number }> {
    const headers = { Cookie: `.ROBLOSECURITY=${cookie.trim()}` };
    try {
      // Verificar autenticaciÃ³n
      await axios.get(RobloxEndpoints.AuthVerification, { headers, validateStatus: () => true });
      // Obtener UserId
      const response = await axios.get(RobloxEndpoints.AccountInfo, { headers });
      return {
        authenticated: true,
        userId: response.data.id,
      };
    } catch (error) {
      return { authenticated: false, userId: 0 };
    }
  }

  /**
   * Obtiene el nombre de usuario de Roblox desde el UserID
   */
  private async fetchUsernameFromRoblox(userId: number): Promise<string> {
    try {
      const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
      return response.data.name;
    } catch {
      return `roblox_user_${userId}`;
    }
  }

  /**
   * Activa/desactiva Multi-Roblox
   */
  setMultiRoblox(enabled: boolean): boolean {
    this.multiRobloxEnabled = enabled;
    this.db.setSetting('MultiRoblox', enabled ? 'true' : 'false');
    return this.multiRobloxEnabled;
  }

  /**
   * Lanza Roblox con una cuenta especÃ­fica
   */
  async launchRoblox(accountId: string, placeId?: string, jobId?: string): Promise<boolean> {
    const account = await this.db.getAccount(accountId);
    if (!account) throw new Error('Cuenta no encontrada');

    // Descifrar cookie
    const cookie = this.crypto.decrypt(account.encrypted_cookie);
    // Todo: LÃ³gica para lanzar Roblox con cookie mediante protocolo roblox://
    // Debe generar un launcher temporal .html o usar Node.js spawn
    return true;
  }

  /**
   * Lista todas las cuentas en cache
   */
  getAllAccounts(): Account[] {
    return this.cachedAccounts;
  }

  /**
   * Elimina una cuenta y su cookie
   */
  async removeAccount(accountId: string): Promise<boolean> {
    this.db.deleteAccount(accountId);
    await this.updateCachedAccounts();
    return true;
  }
}
