/**
 * AccountManager - Controlador principal de lógica de negocio
 *
 * Encapsula las operaciones relacionadas con cuentas, cifrado,
 * lanzamiento de Roblox y gestión de grupos.
 */
import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { shell } from 'electron';
import { Account } from '../../types/Account';
import { DatabaseManager } from '../storage/DatabaseManager';
import { CryptoService } from './CryptoService';
import { MultiRobloxService } from './MultiRobloxService';

// =============================================================================
// SEGURIDAD — Constantes de validación
// =============================================================================

/**
 * Valida que una URL use exclusivamente el protocolo roblox-player://
 * Defense in depth: shell.openExternal solo debe aceptar URLs de Roblox
 */
function isValidRobloxProtocol(url: string): boolean {
  return typeof url === 'string' && url.startsWith('roblox-player:');
}

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
 private multiRobloxService: MultiRobloxService;
 private multiRobloxEnabled: boolean = false;
 private cachedAccounts: Account[] = [];

 constructor(db: DatabaseManager, crypto: CryptoService) {
   this.db = db;
   this.crypto = crypto;
   this.multiRobloxService = new MultiRobloxService();
   // No llamar updateCachedAccounts() aquí — la DB no está inicializada todavía.
   // Se llama explícitamente desde NexoApp.initialize() después de db.initialize().
 }

 /**
  * Inicialización post-DB — llama después de db.initialize()
  */
 async init(): Promise<void> {
   await this.updateCachedAccounts();
 }

  /**
   * Refresca el cache de cuentas
   */
  private async updateCachedAccounts(): Promise<void> {
    this.cachedAccounts = (await this.db.getAllAccounts()).map(this.hydrateAccount);
  }

  /**
   * Clears the cached accounts
   */
  clearCache(): void {
    this.cachedAccounts = [];
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
      lastUsed: row.last_used ? new Date(row.last_used) : new Date(),
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      cookieExpiresAt: row.cookie_expires_at ? new Date(row.cookie_expires_at) : undefined,
    };
  }

  /**
   * AÃ±ade una cuenta desde una cookie .ROBLOSECURITY
   */
  async addAccountFromCookie(cookie: string, group: string = 'Default'): Promise<Account> {
    if (!cookie.trim().startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
      throw new Error('Formato de cookie inválido');
    }

    // Validar la cookie usando Roblox
    const auth = await this.verifyAndGetAuthInfo(cookie);
    if (!auth.authenticated || !auth.userId) {
      throw new Error('Cookie inválida o expirada');
    }

    const encryptedCookie = this.crypto.encrypt(cookie);
    const hash = crypto.createHash('sha256').update(cookie.trim()).digest('hex');
    const accountId = crypto.randomUUID();

    const robloxUsername = await this.fetchUsernameFromRoblox(auth.userId);

    // Calculate cookie expiration (30 days from now for Roblox .ROBLOSECURITY cookies)
    const cookieExpiresAt = new Date();
    cookieExpiresAt.setDate(cookieExpiresAt.getDate() + 30);

    this.db.createAccount({
      id: accountId,
      robloxUserId: auth.userId,
      username: robloxUsername,
      encryptedCookie: encryptedCookie,
      cookieHash: hash,
      cookieExpiresAt: cookieExpiresAt.toISOString(),
      groupName: group,
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
   *
   * Habilita o deshabilita el mutex de instancia Ãºnica de Roblox en Windows.
   * Solo tiene efecto en Windows (modifica el registro).
   *
   * @param enabled true para habilitar, false para deshabilitar
   * @returns true si la operaciÃ³n fue exitosa
   */
  setMultiRoblox(enabled: boolean): boolean {
    this.multiRobloxEnabled = enabled;
    this.db.setSetting('MultiRoblox', enabled ? 'true' : 'false');

    if (!MultiRobloxService.isSupported()) {
      console.warn('[AccountManager] Multi-Roblox solo disponible en Windows');
      return false;
    }

    if (enabled) {
      const ok = this.multiRobloxService.enable();
      if (!ok) {
        console.error('[AccountManager] No se pudo habilitar Multi-Roblox');
        this.multiRobloxEnabled = false;
        this.db.setSetting('MultiRoblox', 'false');
        return false;
      }
    } else {
      this.multiRobloxService.disable();
    }

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
  /**
   * Lanza Roblox con una cuenta especÃ­fica
   *
   * **Multi-Roblox:**
   *   Cuando multiRobloxEnabled es true y estamos en Windows, lanza una instancia
   *   directa con perfil temporal en lugar de usar shell.openExternal.
   *
   * **Modo normal:**
   *   Usa el protocolo roblox-player:// con auth ticket.
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

    // 4. Si estÃ¡ en modo Multi-Roblox y soportado, lanzar perfil temporal
    if (this.multiRobloxEnabled && MultiRobloxService.isSupported()) {
      return this.launchRobloxDirect(accountId, placeId, jobId);
    }

    // 5. Modo normal: protocolo roblox-player://
    let authTicket: string;
    try {
      authTicket = await this.getAuthTicket(cookie);
    } catch (error) {
      throw new Error(
        `No se pudo obtener el auth ticket de Roblox: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const encodedPlaceId = encodeURIComponent(placeId);
    let launchUrl = `roblox-player:1+launchmode:play+gameinfo:${authTicket}+placelauncherurl:https://assetgame.roblox.com/game/placelauncher.ashx?request=RequestGame&placeId=${encodedPlaceId}&isPlayTogetherGame=false`;

    if (jobId) {
      launchUrl += `&gameId=${encodeURIComponent(jobId)}`;
    }

    // SEGURIDAD: Validar protocolo antes de abrir con shell.openExternal
    // Defense in depth — la URL se construye internamente pero se valida por si acaso
    if (!isValidRobloxProtocol(launchUrl)) {
      throw new Error('Intento de abrir URL con protocolo no autorizado');
    }

    try {
      await shell.openExternal(launchUrl);
    } catch {
      throw new Error('Roblox no está instalado o el protocolo roblox-player no está registrado en el sistema');
    }

    // 6. Actualizar el campo lastUsed de la cuenta en SQLite
    this.db.updateLastUsed(accountId);

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
   * Lanza Roblox directamente con un perfil temporal (modo Multi-Roblox).
   * Solo funciona en Windows. No usa shell.openExternal para evitar
   * que Windows devuelva un solo PID para todas las cuentas.
   */
  private launchRobloxDirect(accountId: string, placeId: string, jobId?: string): boolean {
    // Encontrar ejecutable
    const { spawn } = require('child_process');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    let robloxPath: string | null = null;

    // Buscar en AppData
    const homeDir = os.homedir();
    const candidate = path.join(homeDir, 'AppData', 'Local', 'Roblox', 'Versions');
    if (fs.existsSync(candidate)) {
      const dirs = fs.readdirSync(candidate).filter((f: string) => f.startsWith('version-'));
      for (const dir of dirs) {
        const launcher = path.join(candidate, dir, 'RobloxPlayerLauncher.exe');
        if (fs.existsSync(launcher)) {
          robloxPath = launcher;
          break;
        }
      }
    }

    if (!robloxPath) {
      throw new Error('No se encontrÃ³ RobloxPlayerLauncher.exe en AppData/Local/Roblox/Versions');
    }

    // Crear perfil temporal
    const profilePath = this.multiRobloxService.createTempProfile(accountId);

    // Argumentos para Roblox
    const args: string[] = [];
    // Usar el --user-data-dir apuntando al perfil temporal
    args.push('--user-data-dir=' + profilePath);

    // Si hay placeId, agregar argumento de juego
    if (placeId) {
      const encodedPlaceId = encodeURIComponent(placeId);
      let gameUrl = `https://www.roblox.com/games/start?placeId=${encodedPlaceId}&launchmode=play`;
      if (jobId) {
        gameUrl += `&gameId=${encodeURIComponent(jobId)}`;
      }
      args.push(`--url=${gameUrl}`);
    }

    // Lanzar proceso con entorno limpio para evitar interferencias entre instancias
    const env = {
      ...process.env,
      // Evitar que Electron o Vite interfieran con Roblox
      ELECTRON_RUN_AS_NODE: undefined,
    };

    try {
      const proc = spawn(robloxPath, args, {
        detached: true,
        stdio: 'ignore',
        env,
        windowsHide: true,
      });

      proc.on('error', (err: Error) => {
        console.error('[AccountManager] Error al lanzar Roblox:', err.message);
      });

      if (!proc.pid) {
        throw new Error('El proceso de Roblox no se iniciÃ³, pid es undefined');
      }

      proc.unref();

      // Actualizar lastUsed despuÃ©s de un lanzamiento exitoso
      this.db.updateLastUsed(accountId);

      return true;
    } catch (error) {
      throw new Error(`Error al lanzar Roblox con Multi-Roblox: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lista todas las cuentas en cache
   */
  getAllAccounts(): Account[] {
    return this.cachedAccounts;
  }

  /**
   * Obtiene una cuenta por su ID
   */
  getAccountById(accountId: string): Account | undefined {
    return this.cachedAccounts.find((a) => a.id === accountId);
  }

  /**
   * Añade un juego reciente a la cuenta
   * @param accountId ID de la cuenta
   * @param recentGame Juego reciente a agregar
   */
  addRecentGame(accountId: string, recentGame: any): void {
    const account = this.cachedAccounts.find((a) => a.id === accountId);
    if (!account) return;
    if (!account.recentGames) {
      account.recentGames = [];
    }
    // Insert at beginning (most recent first)
    account.recentGames.unshift(recentGame);
    // Keep only max 10
    if (account.recentGames.length > 10) {
      account.recentGames = account.recentGames.slice(0, 10);
    }
    // Serialize and store via fields
    const json = JSON.stringify(account.recentGames);
    this.db.updateAccountField(accountId, 'fields', json);
    this.updateCachedAccounts();
  }

  /**
   * Obtiene los juegos recientes de una cuenta
   * @param accountId ID de la cuenta
   * @returns Array de juegos recientes (máximo 10, ordenados por fecha descendente)
   */
  getRecentGames(accountId: string): any[] {
    const account = this.cachedAccounts.find((a) => a.id === accountId);
    if (!account || !account.recentGames) return [];
    return [...account.recentGames]; // Return copy
  }

  /**
   * Añade un juego a favoritos de la cuenta
   * @param accountId ID de la cuenta
   * @param favoriteGame Juego favorito a agregar
   */
  addFavoriteGame(accountId: string, favoriteGame: any): void {
    const account = this.cachedAccounts.find((a) => a.id === accountId);
    if (!account) return;
    if (!account.favoriteGames) {
      account.favoriteGames = [];
    }
    // Check if already exists (by gameId)
    const exists = account.favoriteGames.some((fg: any) => fg.gameId === favoriteGame.gameId);
    if (!exists) {
      account.favoriteGames.push(favoriteGame);
      // Keep only max 20 (remove oldest if exceeded)
      if (account.favoriteGames.length > 20) {
        account.favoriteGames = account.favoriteGames.slice(0, 20);
      }
      // Serialize and store via fields
      const json = JSON.stringify(account.favoriteGames);
      this.db.updateAccountField(accountId, 'fields', json);
      this.updateCachedAccounts();
    }
  }

  /**
   * Elimina un juego de favoritos de la cuenta
   * @param accountId ID de la cuenta
   * @param gameId ID del juego a eliminar
   */
  removeFavoriteGame(accountId: string, gameId: number): void {
    const account = this.cachedAccounts.find((a) => a.id === accountId);
    if (!account || !account.favoriteGames) return;
    account.favoriteGames = account.favoriteGames.filter((fg: any) => fg.gameId !== gameId);
    // Serialize and store via fields
    const json = JSON.stringify(account.favoriteGames);
    this.db.updateAccountField(accountId, 'fields', json);
    this.updateCachedAccounts();
  }

  /**
   * Obtiene los juegos favoritos de una cuenta
   * @param accountId ID de la cuenta
   * @returns Array de juegos favoritos (máximo 20)
   */
  getFavoriteGames(accountId: string): any[] {
    const account = this.cachedAccounts.find((a) => a.id === accountId);
    if (!account || !account.favoriteGames) return [];
    return [...account.favoriteGames]; // Return copy
  }

  /**
   * Actualiza un campo de una cuenta
   * @param accountId ID de la cuenta
   * @param field Nombre del campo (group, description)
   * @param value Nuevo valor
   */
  setAccountField(accountId: string, field: string, value: string): boolean {
    if (!['group', 'description', 'autoRelaunch'].includes(field)) {
      return false;
    }
    this.db.updateAccountField(accountId, field, value);
    this.updateCachedAccounts();
    return true;
  }

  /**
   * Verifica si Multi-Roblox está habilitado
   */
  isMultiRobloxEnabled(): boolean {
    return this.multiRobloxEnabled;
  }

  /**
   * Verifica si Multi-Roblox es compatible con el sistema operativo
   */
  isMultiRobloxSupported(): boolean {
    return MultiRobloxService.isSupported();
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
