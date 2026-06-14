import axios from 'axios';

/**
 * =====================================================
 * AccountSettingsService — API para perfil y seguridad
 * =====================================================
 * Hace peticiones a Roblox usando cookies locales.
 * Nunca almacena datos sensibles.
 *
 * LRUCache: 60s para friends.roblox.com y presence.roblox.com
 * (respeta rate limits de Roblox)
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

export interface PrivacySettings {
  privateMessages: 'none' | 'friends' | 'all';
  chatInGame: 'none' | 'friends' | 'all';
  inventoryPrivacy: 'private' | 'public';
  groupPrivacy: 'private' | 'public';
  lastSeenPrivacy: 'none' | 'friends' | 'all';
  followPrivacy: 'none' | 'friends' | 'all';
}

export interface Friend {
  id: number;
  username: string;
  displayName: string;
  isOnline: boolean;
  isInGame: boolean;
  isInStudio: boolean;
  lastOnline: string;
  avatarUrl: string | null;
  friendshipStatus: string;
}

export interface FriendRequest {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  sentAt: string;
}

export interface BlockedUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationSettings {
  friendRequestNotifications: boolean;
  messageNotifications: boolean;
}

// =============================================================================
// LRU Cache — 60s para friends/presence (respeta rate limits de Roblox)
// =============================================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;

  constructor(ttlMs = 60_000) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

class AccountSettingsService {
  private baseURL: string;
  private friendsCache: LRUCache<any>;

  constructor() {
    this.baseURL = 'https://accountinformation.roblox.com';
    this.friendsCache = new LRUCache(60_000);
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

  // =====================================================
  // PRIVACIDAD
  // =====================================================

  /**
   * Obtiene la configuración de privacidad actual
   * accountsettings.roblox.com
   */
  async getPrivacySettings(cookie: string): Promise<PrivacySettings> {
    try {
      const response = await axios.get(
        'https://accountsettings.roblox.com/v1/privacy',
        { headers: this.getCookieHeader(cookie) }
      );
      const data = response.data || {};
      return {
        privateMessages: data.privateMessages || 'all',
        chatInGame: data.chatInGame || 'all',
        inventoryPrivacy: data.inventoryPrivacy || 'private',
        groupPrivacy: data.groupPrivacy || 'private',
        lastSeenPrivacy: data.lastSeenPrivacy || 'friends',
        followPrivacy: data.followPrivacy || 'friends',
      };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      // Valores por defecto seguros si falla la llamada
      return {
        privateMessages: 'friends',
        chatInGame: 'friends',
        inventoryPrivacy: 'private',
        groupPrivacy: 'private',
        lastSeenPrivacy: 'friends',
        followPrivacy: 'friends',
      };
    }
  }

  /**
   * Actualiza un setting de privacidad individual
   * POST /v1/privacy/{settingKey}
   */
  async updatePrivacySetting(
    cookie: string,
    settingKey: string,
    value: string
  ): Promise<boolean> {
    const validKeys = [
      'privateMessages',
      'chatInGame',
      'lastSeenPrivacy',
      'followPrivacy',
      'inventoryPrivacy',
      'groupPrivacy',
    ];
    if (!validKeys.includes(settingKey)) {
      throw new Error(`Setting de privacidad inválido: ${settingKey}`);
    }

    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `https://accountsettings.roblox.com/v1/privacy/${settingKey}`,
        { value },
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error actualizando privacidad';
        throw new Error(msg);
      }
      throw error;
    }
  }

  // =====================================================
  // AMIGOS
  // =====================================================

  /**
   * Obtiene la lista de amigos con presencia — usa cache LRU de 60s
   * friends.roblox.com + presence.roblox.com
   */
  async getFriendsList(cookie: string): Promise<Friend[]> {
    const cacheKey = `friends_${cookie.slice(0, 20)}`;
    const cached = this.friendsCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Obtener IDs de amigos
      const friendsResponse = await axios.get(
        'https://friends.roblox.com/v1/my/friendships/friends',
        { headers: this.getCookieHeader(cookie) }
      );

      const friendArray: any[] = friendsResponse.data?.data || [];

      if (friendArray.length === 0) {
        const empty: Friend[] = [];
        this.friendsCache.set(cacheKey, empty);
        return empty;
      }

      // Obtener presencias en paralelo en chunks de 20
      const userIds = friendArray.map((f: any) => f.id).filter(Boolean);
      const presences = await this.fetchPresencesInChunks(userIds);

      const friends: Friend[] = friendArray.map((f: any) => {
        const presence = presences.get(f.id);
        return {
          id: f.id,
          username: f.username || '',
          displayName: f.displayName || f.username || '',
          isOnline: presence?.userPresence?.userPresenceType === 1 || presence?.userPresence?.userPresenceType === 2,
          isInGame: presence?.userPresence?.userPresenceType === 2,
          isInStudio: presence?.userPresence?.userPresenceType === 3,
          lastOnline: presence?.userPresence?.lastLocation || '',
          avatarUrl: f.avatar?.avatarUrl || null,
          friendshipStatus: f.friendshipStatus || 'Friend',
        };
      });

      this.friendsCache.set(cacheKey, friends);
      return friends;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      throw new Error(`Error obteniendo amigos: ${error.message}`);
    }
  }

  /**
   * Obtiene presencias en chunks de 20 (límite de presence.roblox.com)
   */
  private async fetchPresencesInChunks(
    userIds: number[]
  ): Promise<Map<number, any>> {
    const result = new Map<number, any>();
    const chunkSize = 20;
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      try {
        const resp = await axios.post(
          'https://presence.roblox.com/v1/presence/users',
          { userIds: chunk },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );
        const presences = resp.data?.userPresences || [];
        for (const p of presences) {
          result.set(p.userId, p);
        }
      } catch {
        // Si falla el chunk, continuar con los demás
      }
    }
    return result;
  }

  /**
   * Obtiene las solicitudes de amistad pendientes
   */
  async getFriendRequests(cookie: string): Promise<FriendRequest[]> {
    try {
      const response = await axios.get(
        'https://friends.roblox.com/v1/friend-requests',
        { headers: this.getCookieHeader(cookie) }
      );

      const requests: FriendRequest[] = (response.data?.data || []).map((r: any) => ({
        id: r.id || r.requester?.id || 0,
        username: r.requester?.name || r.requester?.username || '',
        displayName: r.requester?.displayName || r.requester?.name || '',
        avatarUrl: r.requester?.avatar?.avatarUrl || null,
        sentAt: r.created || r.sentAt || '',
      }));

      return requests;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      return [];
    }
  }

  /**
   * Responde a una solicitud de amistad (aceptar o rechazar)
   */
  async respondFriendRequest(
    cookie: string,
    userId: number,
    accept: boolean
  ): Promise<boolean> {
    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `https://friends.roblox.com/v1/friend-requests/${userId}`,
        { accept },
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      this.friendsCache.clear();
      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error respondiendo solicitud';
        throw new Error(msg);
      }
      throw error;
    }
  }

  // =====================================================
  // BLOQUEOS
  // =====================================================

  /**
   * Obtiene la lista de usuarios bloqueados
   */
  async getBlockedUsers(cookie: string): Promise<BlockedUser[]> {
    try {
      const response = await axios.get(
        'https://accountsettings.roblox.com/v1/users/blocked',
        { headers: this.getCookieHeader(cookie) }
      );

      return (response.data?.blockedUsers || response.data?.data || []).map((u: any) => ({
        id: u.id || u.userId || 0,
        username: u.username || '',
        displayName: u.displayName || u.username || '',
        avatarUrl: u.avatar?.avatarUrl || null,
      }));
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      return [];
    }
  }

  /**
   * Bloquea a un usuario por ID
   */
  async blockUser(cookie: string, userId: number): Promise<boolean> {
    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `https://accountsettings.roblox.com/v1/users/${userId}/block`,
        {},
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error bloqueando usuario';
        throw new Error(msg);
      }
      throw error;
    }
  }

  /**
   * Desbloqueea a un usuario por ID
   */
  async unblockUser(cookie: string, userId: number): Promise<boolean> {
    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `https://accountsettings.roblox.com/v1/users/${userId}/unblock`,
        {},
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error desbloqueando usuario';
        throw new Error(msg);
      }
      throw error;
    }
  }

  // =====================================================
  // SEGUIR / DEJAR DE SEGUIR
  // =====================================================

  /**
   * Sigue a un usuario
   */
  async followUser(cookie: string, userId: number): Promise<boolean> {
    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `https://friends.roblox.com/v1/users/${userId}/follow`,
        {},
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error siguiendo usuario';
        throw new Error(msg);
      }
      throw error;
    }
  }

  /**
   * Deja de seguir a un usuario
   */
  async unfollowUser(cookie: string, userId: number): Promise<boolean> {
    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `https://friends.roblox.com/v1/users/${userId}/unfollow`,
        {},
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error dejando de seguir';
        throw new Error(msg);
      }
      throw error;
    }
  }

  // =====================================================
  // NOTIFICACIONES
  // =====================================================

  /**
   * Obtiene la configuración de notificaciones
   */
  async getNotificationSettings(cookie: string): Promise<NotificationSettings> {
    try {
      const response = await axios.get(
        'https://accountsettings.roblox.com/v1/notifications',
        { headers: this.getCookieHeader(cookie) }
      );
      return {
        friendRequestNotifications:
          response.data?.friendRequestNotifications !== false,
        messageNotifications: response.data?.messageNotifications !== false,
      };
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      return {
        friendRequestNotifications: true,
        messageNotifications: true,
      };
    }
  }

  /**
   * Actualiza un setting de notificación individual
   */
  async updateNotificationSetting(
    cookie: string,
    key: string,
    value: boolean
  ): Promise<boolean> {
    const validKeys = ['friendRequestNotifications', 'messageNotifications'];
    if (!validKeys.includes(key)) {
      throw new Error(`Setting de notificación inválido: ${key}`);
    }

    try {
      const csrfToken = await this.getCsrfToken(cookie);
      if (!csrfToken) {
        throw new Error('No se pudo obtener el X-CSRF-Token');
      }

      await axios.post(
        `https://accountsettings.roblox.com/v1/notifications/${key}`,
        { value },
        { headers: this.getPostHeaders(cookie, csrfToken) }
      );

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }
      if (error.response?.data?.errors) {
        const msg = error.response.data.errors[0]?.message || 'Error actualizando notificación';
        throw new Error(msg);
      }
      throw error;
    }
  }
}

export { AccountSettingsService };
export default AccountSettingsService;
