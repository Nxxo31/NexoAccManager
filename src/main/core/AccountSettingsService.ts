import axios from 'axios';

/**
 * =====================================================
 * AccountSettingsService — API para perfil y seguridad
 * =====================================================
 * Hace peticiones a Roblox usando cookies locales.
 * Nunca almacena datos sensibles.
 */

export interface UserProfile {
  displayName: string;
  description: string;
  username: string;
  userId: number;
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  os: string;
  browser: string;
  location: string;
  createdAt: string;
  lastSeen: string;
}

export interface TwoFAStatus {
  enabled: boolean;
  method?: 'authenticator' | 'email' | 'sms';
}

export interface SecurityStatus {
  hasPin: boolean;
  twoStep: TwoFAStatus;
  emailVerified: boolean;
}

class AccountSettingsService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://accountinformation.roblox.com';
  }

  // =====================================================
  // Helpers privados
  // =====================================================

  private getCookieHeader(cookie: string): { Cookie: string } {
    return {
      Cookie: `.ROBLOSECURITY=${cookie.trim()}`,
    };
  }

  private getPostHeaders(cookie: string, csrfToken: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://www.roblox.com/',
      ...this.getCookieHeader(cookie),
    };
  }

  /**
   * Obtiene el X-CSRF-Token necesario para POST/DELETE/PATCH
   */
  private async getCsrfToken(cookie: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://auth.roblox.com/v2/logout',
        {},
        {
          headers: this.getCookieHeader(cookie),
          validateStatus: () => true,
        }
      );
      return response.headers['x-csrf-token'] || '';
    } catch {
      return '';
    }
  }

  // =====================================================
  // PERFIL
  // =====================================================

  /**
   * Obtiene el perfil del usuario autenticado
   * accountinformation.roblox.com
   */
  async getProfile(cookie: string): Promise<UserProfile | null> {
    try {
      const response = await axios.get(`${this.baseURL}/v1/users/authenticated`, {
        headers: this.getCookieHeader(cookie),
      });
      return {
        displayName: response.data?.displayName || response.data?.name || '',
        description: response.data?.description || '',
        username: response.data?.name || '',
        userId: response.data?.id || 0,
      };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      throw new Error(`Error obteniendo perfil: ${error.message}`);
    }
  }

  /**
   * Actualiza el display name del usuario
   * POST /v1/displayname/validate + POST /v1/displayname
   */
  async updateDisplayName(cookie: string, newName: string): Promise<boolean> {
    if (!newName || newName.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }
    if (newName.trim().length < 3 || newName.trim().length > 20) {
      throw new Error('El nombre debe tener entre 3 y 20 caracteres');
    }

    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      const headers = this.getPostHeaders(cookie, csrfToken);

      const validatePayload = { displayName: newName.trim() };
      const validateResponse = await axios.post(
        `${this.baseURL}/v1/displayname/validate`,
        validatePayload,
        { headers }
      );

      if (!validateResponse.data?.valid) {
        throw new Error(validateResponse.data?.errorMessage || 'Nombre no válido');
      }

      await axios.post(
        `${this.baseURL}/v1/displayname`,
        validatePayload,
        { headers }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Demasiadas solicitudes. Intenta de nuevo más tarde.');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error al actualizar nombre';
        throw new Error(msg);
      }
      throw error;
    }
  }

  /**
   * Actualiza la descripción del perfil
   * POST /v1/description
   */
  async updateDescription(cookie: string, newDescription: string): Promise<boolean> {
    if (!newDescription || newDescription.trim().length === 0) {
      throw new Error('La descripción no puede estar vacía');
    }
    if (newDescription.length > 1000) {
      throw new Error('La descripción no puede superar los 1000 caracteres');
    }

    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `${this.baseURL}/v1/description`,
        { description: newDescription.trim() },
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Demasiadas solicitudes. Intenta de nuevo más tarde.');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error al actualizar descripción';
        throw new Error(msg);
      }
      throw error;
    }
  }

  /**
   * Obtiene la URL del thumbnail del avatar
   * thumbnails.roblox.com
   */
  async getAvatarThumbnail(userId: number): Promise<string | null> {
    try {
      const response = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      const data = response.data?.data?.[0];
      if (data?.state === 'Completed' && data?.imageUrl) {
        return data.imageUrl;
      }
      return null;
    } catch (error: any) {
      throw new Error(`Error obteniendo avatar: ${error.message}`);
    }
  }

  // =====================================================
  // SEGURIDAD — Sesiones
  // =====================================================

  /**
   * Obtiene las sesiones activas del usuario
   * auth.roblox.com
   */
  async getActiveSessions(cookie: string): Promise<ActiveSession[]> {
    try {
      const response = await axios.get('https://auth.roblox.com/v2/sessions', {
        headers: this.getCookieHeader(cookie),
      });

      const sessions = response.data?.sessions || [];
      return sessions.map((s: any) => ({
        id: s.id || s.sessionId || '',
        deviceName: s.deviceName || s.device || 'Desconocido',
        os: s.os || 'Desconocido',
        browser: s.browser || 'Desconocido',
        location: s.location || 'Desconocido',
        createdAt: s.createdAt || '',
        lastSeen: s.lastSeen || s.lastActive || s.createdAt || '',
      }));
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      // Fallback: Roblox a veces retorna sesiones en formato diferente
      if (Array.isArray(error.response?.data)) {
        return error.response.data.map((s: any) => ({
          id: s.id || '',
          deviceName: s.deviceName || 'Desconocido',
          os: s.os || 'Desconocido',
          browser: s.browser || 'Desconocido',
          location: s.location || 'Desconocido',
          createdAt: s.createdAt || '',
          lastSeen: s.lastSeen || '',
        }));
      }
      throw new Error(`Error obteniendo sesiones: ${error.message}`);
    }
  }

  /**
   * Cierra una sesión específica por su ID
   * DELETE /v2/sessions/:sessionId
   */
  async logoutSession(cookie: string, sessionId: string): Promise<boolean> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('ID de sesión inválido');
    }

    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.delete(`https://auth.roblox.com/v2/sessions/${sessionId.trim()}`, {
        headers: this.getPostHeaders(cookie, csrfToken),
      });

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      throw new Error(`Error cerrando sesión: ${error.message}`);
    }
  }

  /**
   * Cierra todas las sesiones menos la actual
   * POST /v2/sessions/logout-all
   */
  async logoutAllSessions(cookie: string): Promise<boolean> {
    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        'https://auth.roblox.com/v2/sessions/logout-all',
        {},
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      throw new Error(`Error cerrando todas las sesiones: ${error.message}`);
    }
  }

  // =====================================================
  // SEGURIDAD — Contraseña
  // =====================================================

  /**
   * Cambia la contraseña de la cuenta
   * POST /v2/password/change
   */
  async changePassword(
    cookie: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    if (!currentPassword || currentPassword.length === 0) {
      throw new Error('La contraseña actual es requerida');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
    }
    if (newPassword === currentPassword) {
      throw new Error('La nueva contraseña debe ser diferente a la actual');
    }

    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        'https://auth.roblox.com/v2/password/change',
        {
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        },
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Contraseña actual incorrecta o cookie inválida');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error al cambiar contraseña';
        throw new Error(msg);
      }
      throw error;
    }
  }

  // =====================================================
  // SEGURIDAD — 2FA
  // =====================================================

  /**
   * Obtiene el estado de verificación en dos pasos
   */
  async get2FAStatus(cookie: string): Promise<TwoFAStatus> {
    try {
      const response = await axios.get('https://auth.roblox.com/v2/security/twostep', {
        headers: this.getCookieHeader(cookie),
      });

      const enabled = !!response.data?.twoStepEnabled;
      const methods = response.data?.twoStepVerificationMethods || [];
      let method: 'authenticator' | 'email' | 'sms' | undefined;

      if (methods.includes('authenticator')) method = 'authenticator';
      else if (methods.includes('email')) method = 'email';
      else if (methods.includes('sms')) method = 'sms';

      return { enabled, method };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      // Fallback: si no puede obtener, asumir desactivado
      return { enabled: false };
    }
  }

  /**
   * Habilita o deshabilita 2FA
   * Nota: Solo puede habilitar, no deshabilitar sin verificación adicional
   */
  async toggle2FA(cookie: string, enable: boolean): Promise<boolean> {
    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      const headers = this.getPostHeaders(cookie, csrfToken);

      if (enable) {
        // Solicitar setup de 2FA (Authenticator)
        const response = await axios.post(
          'https://auth.roblox.com/v2/security/twostep/enroll',
          { method: 'authenticator' },
          { headers }
        );
        // El usuario debe escanear el QR y confirmar el código
        return !!response.data?.success;
      } else {
        // Deshabilitar 2FA requiere verificación adicional
        const response = await axios.post(
          'https://auth.roblox.com/v2/security/twostep/disable',
          {},
          { headers }
        );
        return !!response.data?.success;
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error al cambiar 2FA';
        throw new Error(msg);
      }
      throw error;
    }
  }
}

export { AccountSettingsService };
export default AccountSettingsService;
