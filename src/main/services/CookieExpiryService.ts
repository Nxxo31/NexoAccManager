/**
 * CookieExpiryService - Servicio para verificar y renovar cookies próximas a expirar
 */
import { DatabaseManager } from '../storage/DatabaseManager';
import { CryptoService } from '../core/CryptoService';
import axios from 'axios';

interface AccountLite {
  id: string;
  roblox_user_id: string;
  encrypted_cookie?: string;
  cookie_expires_at?: string;
  username?: string;
}

export interface CookieExpiryResult {
  accountId: string;
  isExpired: boolean;
  expiresInHours: number;
  isValid: boolean;
}

export class CookieExpiryService {
  private db: DatabaseManager;
  private crypto: CryptoService;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
  private readonly RENEWAL_THRESHOLD_HOURS = 24; // Renovar 24h antes de expirar

  constructor(db: DatabaseManager, crypto: CryptoService) {
    this.db = db;
    this.crypto = crypto;
  }

  /**
   * Inicia el servicio de verificación de expiración de cookies
   */
  start(): void {
    this.stop(); // Asegurar que no haya intervalos previos
    
    console.log('[CookieExpiryService] Servicio iniciado');
    
    // Ejecución inicial inmediata
    this.checkExpiringCookies().catch(err => 
      console.error('[CookieExpiryService] Error en verificación inicial:', err)
    );
    
    // Programa verificaciones periódicas
    this.checkInterval = setInterval(() => {
      this.checkExpiringCookies().catch(err =>
        console.error('[CookieExpiryService] Error en verificación periódica:', err)
      );
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Detiene el servicio
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[CookieExpiryService] Servicio detenido');
    }
  }

  /**
   * Verifica todas las cuentas para cookies próximas a expirar
   */
  async checkExpiringCookies(): Promise<CookieExpiryResult[]> {
    try {
      const accounts = this.db.getAllAccounts() as unknown as AccountLite[];
      const results: CookieExpiryResult[] = [];
      
      for (const account of accounts) {
        if (!account.encrypted_cookie || !account.cookie_expires_at) {
          continue;
        }
        
        const result = await this.checkAccountCookieExpiry(account);
        results.push(result);
        
        // Si la cookie está expirada o es inválida, notificar
        if (result.isExpired || !result.isValid) {
          // Enviar notificación vía IPC al renderer
          // Esto se haría a través del main.ts o un event emitter
          // Por ahora, solo loggeamos
          console.warn(`[CookieExpiryService] Cuenta ${account.id} tiene cookie expirada o inválida`);
        }
      }
      
      return results;
    } catch (error: any) {
      console.error('[CookieExpiryService] Error verificando expiración de cookies:', error);
      return [];
    }
  }

  /**
   * Verifica la expiración y validez de la cookie de una cuenta específica
   */
  async checkAccountCookieExpiry(account: AccountLite): Promise<CookieExpiryResult> {
    if (!account.encrypted_cookie || !account.cookie_expires_at) {
      return {
        accountId: account.id,
        isExpired: true,
        expiresInHours: 0,
        isValid: false
      };
    }
    
    try {
      const expiryDate = new Date(account.cookie_expires_at);
      const now = new Date();
      const timeDiff = expiryDate.getTime() - now.getTime();
      const expiresInHours = Math.max(0, timeDiff / (1000 * 60 * 60));
      
      // Verificar si está expirada
      const isExpired = expiresInHours <= 0;
      
      // Si está próxima a expirar (dentro del umbral) o ya expirada, validar
      const needsValidation = expiresInHours <= this.RENEWAL_THRESHOLD_HOURS;
      let isValid = true; // Asumimos válida si no necesita validación
      
      if (needsValidation) {
        const cookie = this.crypto.decrypt(account.encrypted_cookie);
        if (cookie) {
          isValid = await this.validateCookie(cookie);
        } else {
          isValid = false; // No se pudo descifrar
        }
      }
      
      return {
        accountId: account.id,
        isExpired,
        expiresInHours,
        isValid
      };
    } catch (error: any) {
      console.error(`[CookieExpiryService] Error verificando cuenta ${account.id}:`, error);
      return {
        accountId: account.id,
        isExpired: true,
        expiresInHours: 0,
        isValid: false
      };
    }
  }

  /**
   * Valida una cookie haciendo petición a Roblox
   */
  private async validateCookie(cookie: string): Promise<boolean> {
    try {
      const response = await axios.get(
        'https://users.roblox.com/v1/users/authenticated',
        {
          headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
          validateStatus: (status) => status === 200,
          timeout: 10000
        }
      );
      return response.status === 200;
    } catch (error: any) {
      // Si es 401 o 403, la cookie es inválida
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return false;
      }
      // Otros errores de red, asumimos que podría ser temporal pero por seguridad decimos inválida
      return false;
    }
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getStatus(): { isRunning: boolean; checkIntervalMs: number; renewalThresholdHours: number } {
    return {
      isRunning: !!this.checkInterval,
      checkIntervalMs: this.CHECK_INTERVAL_MS,
      renewalThresholdHours: this.RENEWAL_THRESHOLD_HOURS
    };
  }
}

export default CookieExpiryService;