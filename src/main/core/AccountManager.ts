/**
 * AccountManager - Controlador principal de lÃ³gica de negocio
 *
 * Encapsula las operaciones relacionadas con cuentas, cifrado,
 * lanzamiento de Roblox y gestiÃ³n de grupos.
 */
import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { shell } from 'electron';
import { Account } from '../../types/Account';
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
   * Lanza Roblox con una cuenta especÃ­fica a travÃ©s del protocolo roblox-player://
   *
   * Flujo:
   * 1. Valida que la cuenta exista
   * 2. Descifra la cookie
   * 3. Verifica la cookie contra auth.roblox.com (con retry 1 vez)
   * 4. Obtiene auth ticket de Roblox
   * 5. Construye URL del protocolo roblox-player://
   * 6. Lanza la URL con shell.openExternal
   * 7. Actualiza lastUsed en la base de datos
   */
  async launchRoblox(accountId: string, placeId?: string, jobId?: string): Promise<boolean> {
    // 1. Buscar la cuenta en SQLite por accountId
    const account = this.db.getAccount(accountId);
    if (!account) {
      throw new Error('Cuenta no encontrada');
    }

    if (!placeId) {
      throw new Error('Se requiere placeId para lanzar Roblox');
    }

    // 2. Descifrar la cookie usando CryptoService
    let cookie: string;
    try {
      cookie = this.crypto.decrypt(account.encrypted_cookie);
    } catch {
      throw new Error('Error al descifrar la cookie de la cuenta');
    }

    // 3. Verificar que la cookie sigue siendo vÃ¡lida contra auth.roblox.com (con retry 1 vez)
    const isValid = await this.verifyCookieWithRetry(cookie, 1);
    if (!isValid) {
      throw new Error('Cookie invÃ¡lida o expirada');
    }

    // 4. Obtener auth ticket para construir la URL del protocolo
    let authTicket: string;
    try {
      authTicket = await this.getAuthTicket(cookie);
    } catch (error) {
      throw new Error(
        `No se pudo obtener el auth ticket de Roblox: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // 5. Construir la URL del protocolo roblox-player:// con los parÃ¡metros correctos
    const encodedPlaceId = encodeURIComponent(placeId);
    let launchUrl = `roblox-player:1+launchmode:play+gameinfo:${authTicket}+placelauncherurl:https://assetgame.roblox.com/game/placelauncher.ashx?request=RequestGame&placeId=${encodedPlaceId}&isPlayTogetherGame=false`;

    // 6. Si jobId existe, agregar &gameId=[jobId] a la URL
    if (jobId) {
      launchUrl += `&gameId=${encodeURIComponent(jobId)}`;
    }

    // 7. Lanzar la URL con el shell del sistema operativo (shell.openExternal en Electron)
    try {
      await shell.openExternal(launchUrl);
    } catch (error) {
      // 9. Roblox no instalado â†' detectar y lanzar error descriptivo
      throw new Error('Roblox no estÃ¡ instalado o el protocolo roblox-player no estÃ¡ registrado en el sistema');
    }

    // 8. Actualizar el campo lastUsed de la cuenta en SQLite
    this.db.updateLastUsed(accountId);

    // 10. Retornar true si el lanzamiento fue exitoso
    return true;
  }

  /**
   * Verifica la cookie contra auth.roblox.com con soporte de retry
   */
  private async verifyCookieWithRetry(cookie: string, maxRetries: number): Promise<boolean> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.verifyCookie(cookie);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // 9. Error de red â†' retry 1 vez antes de fallar
        if (this.isNetworkError(error)) {
          continue;
        }
        throw error;
      }
    }
    return false;
  }

  /**
   * Verifica que la cookie sea vÃ¡lida haciendo una peticiÃ³n a Roblox
   */
  private async verifyCookie(cookie: string): Promise<boolean> {
    const headers = { Cookie: `.ROBLOSECURITY=${cookie.trim()}` };
    try {
      const response = await axios.get('https://users.roblox.com/v1/users/authenticated', {
        headers,
        validateStatus: (status) => status === 200,
      });
      return response.status === 200;
    } catch (error: any) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        throw new Error('Cookie invÃ¡lida o expirada');
      }
      throw error;
    }
  }

  /**
   * Obtiene el auth ticket de Roblox para usar en el protocolo roblox-player://
   */
  private async getAuthTicket(cookie: string): Promise<string> {
    // Paso 1: Obtener X-CSRF-Token
    const csrfToken = await this.getCsrfToken(cookie);

    // Paso 2: Obtener auth ticket
    const headers = {
      Cookie: `.ROBLOSECURITY=${cookie.trim()}`,
      'x-csrf-token': csrfToken,
      referer: 'https://www.roblox.com',
    };

    try {
      const response = await axios.post(
        'https://auth.roblox.com/v1/authentication-ticket',
        {},
        { headers, validateStatus: (status) => status === 200 }
      );

      const ticket = response.headers['rbx-authentication-ticket'];
      if (!ticket) {
        throw new Error('No se decibiÃ³ auth ticket en la respuesta de Roblox');
      }
      return ticket as string;
    } catch (error: any) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        throw new Error('Cookie invÃ¡lida o expirada al obtener auth ticket');
      }
      throw new Error(`Error al obtener auth ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Obtiene el X-CSRF-Token haciendo POST a auth.roblox.com/v2/logout
   */
  private async getCsrfToken(cookie: string): Promise<string> {
    const headers = { Cookie: `.ROBLOSECURITY=${cookie.trim()}` };
    try {
      await axios.post('https://auth.roblox.com/v2/logout', {}, { headers });
      return '';
    } catch (error: any) {
      if (error.response && error.response.headers && error.response.headers['x-csrf-token']) {
        return error.response.headers['x-csrf-token'] as string;
      }
      throw new Error('No se pudo obtener el X-CSRF-Token de Roblox');
    }
  }

  /**
   * Determina si un error es de red para aplicar retry
   */
  private isNetworkError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as any).code;
      return code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENOTFOUND';
    }
    return false;
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
