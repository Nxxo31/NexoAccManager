import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── LRU Cache ──────────────────────────────────────────────────────────────

class LRUCache<T> {
  private cache = new Map<string, { data: T; ts: number }>();
  constructor(private ttl = 60_000) {}

  get(key: string): T | null {
    const e = this.cache.get(key);
    if (!e) return null;
    if (Date.now() - e.ts > this.ttl) { this.cache.delete(key); return null; }
    return e.data;
  }

  set(key: string, data: T) { this.cache.set(key, { data, ts: Date.now() }); }
  clear() { this.cache.clear(); }
}

// ─── Shared API helpers ─────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function cookieHeader(cookie: string) {
  return { Cookie: `.ROBLOSECURITY=${cookie.trim()}` };
}

function getHeaders(cookie: string) {
  return { ...cookieHeader(cookie), 'User-Agent': UA };
}

async function getCsrfToken(cookie: string): Promise<string> {
  try {
    const r = await axios.post('https://auth.roblox.com/v2/logout', {}, {
      headers: cookieHeader(cookie),
      validateStatus: () => true,
    });
    return r.headers['x-csrf-token'] || '';
  } catch { return ''; }
}

async function postHeaders(cookie: string) {
  const csrf = await getCsrfToken(cookie);
  if (!csrf) throw new Error('No se pudo obtener el X-CSRF-Token');
  return {
    'Content-Type': 'application/json',
    'x-csrf-token': csrf,
    'User-Agent': UA,
    Referer: 'https://www.roblox.com/',
    ...cookieHeader(cookie),
  };
}

/** Wrapper para peticiones POST/PATCH/DELETE que necesitan CSRF */
async function mutate(
  cookie: string,
  fn: (headers: Record<string, string>) => Promise<any>
): Promise<boolean> {
  try {
    const headers = await postHeaders(cookie);
    await fn(headers);
    return true;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403)
      throw new Error('Cookie inválida o expirada');
    if (error.response?.data?.errors)
      throw new Error(error.response.data.errors[0]?.message || 'Error');
    throw error;
  }
}

/** Wrapper para GET — extrae error 401/403 */
async function apiGet<T>(cookie: string, url: string, fallback?: T): Promise<T> {
  try {
    const r = await axios.get(url, { headers: getHeaders(cookie) });
    return r.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403)
      throw new Error('Cookie inválida o expirada');
    if (fallback !== undefined) return fallback;
    throw new Error(error.message || 'Error en petición');
  }
}

// ─── AccountSettingsService ──────────────────────────────────────────────────

const friendsCache = new LRUCache<Friend[]>(60_000);

export class AccountSettingsService {
  private base = 'https://accountinformation.roblox.com';

  // ─── Perfil ───────────────────────────────────────────────────────────

  async getProfile(cookie: string): Promise<UserProfile | null> {
    const data = await apiGet<any>(cookie, `${this.base}/v1/users/authenticated`);
    return {
      displayName: data?.displayName || data?.name || '',
      description: data?.description || '',
      username: data?.name || '',
      userId: data?.id || 0,
    } as UserProfile;
  }

  async updateDisplayName(cookie: string, name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 20)
      throw new Error('El nombre debe tener entre 3 y 20 caracteres');
    return mutate(cookie, async (h) => {
      const r = await axios.post(`${this.base}/v1/displayname/validate`, { displayName: trimmed }, { headers: h });
      if (!r.data?.valid) throw new Error(r.data?.errorMessage || 'Nombre no válido');
      await axios.post(`${this.base}/v1/displayname`, { displayName: trimmed }, { headers: h });
    });
  }

  async updateDescription(cookie: string, desc: string): Promise<boolean> {
    if (desc.length > 1000) throw new Error('La descripción no puede superar los 1000 caracteres');
    return mutate(cookie, (h) =>
      axios.post(`${this.base}/v1/description`, { description: desc.trim() }, { headers: h })
    );
  }

  async getAvatarThumbnail(userId: number): Promise<string | null> {
    try {
      const r = await axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
        { headers: { 'User-Agent': UA } }
      );
      const d = r.data?.data?.[0];
      return d?.state === 'Completed' ? d.imageUrl : null;
    } catch { return null; }
  }

  // ─── Seguridad ────────────────────────────────────────────────────────

  async getActiveSessions(cookie: string): Promise<ActiveSession[]> {
    try {
      const data = await apiGet<any>(cookie, 'https://auth.roblox.com/v2/sessions');
      return (data?.sessions || []).map((s: any) => ({
        id: s.id || s.sessionId || '',
        deviceName: s.deviceName || s.device || 'Desconocido',
        os: s.os || 'Desconocido',
        browser: s.browser || 'Desconocido',
        location: s.location || 'Desconocido',
        createdAt: s.createdAt || '',
        lastSeen: s.lastSeen || s.lastActive || s.createdAt || '',
      }));
    } catch (error: any) {
      if (Array.isArray(error.response?.data))
        return error.response.data.map((s: any) => ({
          id: s.id || '', deviceName: s.deviceName || 'Desconocido',
          os: s.os || 'Desconocido', browser: s.browser || 'Desconocido',
          location: s.location || 'Desconocido', createdAt: s.createdAt || '',
          lastSeen: s.lastSeen || '',
        }));
      throw error;
    }
  }

  async logoutSession(cookie: string, sessionId: string): Promise<boolean> {
    if (!sessionId?.trim()) throw new Error('ID de sesión inválido');
    return mutate(cookie, (h) =>
      axios.delete(`https://auth.roblox.com/v2/sessions/${sessionId.trim()}`, { headers: h })
    );
  }

  async logoutAllSessions(cookie: string): Promise<boolean> {
    return mutate(cookie, (h) =>
      axios.post('https://auth.roblox.com/v2/sessions/logout-all', {}, { headers: h })
    );
  }

  async changePassword(cookie: string, current: string, next: string): Promise<boolean> {
    if (!current) throw new Error('La contraseña actual es requerida');
    if (next.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
    if (next === current) throw new Error('La nueva contraseña debe ser diferente');
    return mutate(cookie, (h) =>
      axios.post('https://auth.roblox.com/v2/password/change',
        { currentPassword: current.trim(), newPassword: next.trim() }, { headers: h })
    );
  }

  async get2FAStatus(cookie: string): Promise<TwoFAStatus> {
    try {
      const data = await apiGet<any>(cookie, 'https://auth.roblox.com/v2/security/twostep');
      const methods = data?.twoStepVerificationMethods || [];
      const method = methods.includes('authenticator') ? 'authenticator'
        : methods.includes('email') ? 'email'
        : methods.includes('sms') ? 'sms' : undefined;
      return { enabled: !!data?.twoStepEnabled, method };
    } catch { return { enabled: false }; }
  }

  async toggle2FA(cookie: string, enable: boolean): Promise<boolean> {
    return mutate(cookie, async (h) => {
      const url = enable
        ? 'https://auth.roblox.com/v2/security/twostep/enroll'
        : 'https://auth.roblox.com/v2/security/twostep/disable';
      const r = await axios.post(url, enable ? { method: 'authenticator' } : {}, { headers: h });
      return !!r.data?.success;
    });
  }

  // ─── Privacidad ──────────────────────────────────────────────────────

  async getPrivacySettings(cookie: string): Promise<PrivacySettings> {
    const defaults: PrivacySettings = {
      privateMessages: 'friends', chatInGame: 'friends', inventoryPrivacy: 'private',
      groupPrivacy: 'private', lastSeenPrivacy: 'friends', followPrivacy: 'friends',
    };
    try {
      const data = await apiGet<any>(cookie, 'https://accountsettings.roblox.com/v1/privacy');
      return {
        privateMessages: data?.privateMessages || 'all',
        chatInGame: data?.chatInGame || 'all',
        inventoryPrivacy: data?.inventoryPrivacy || 'private',
        groupPrivacy: data?.groupPrivacy || 'private',
        lastSeenPrivacy: data?.lastSeenPrivacy || 'friends',
        followPrivacy: data?.followPrivacy || 'friends',
      };
    } catch { return defaults; }
  }

  async updatePrivacySetting(cookie: string, key: string, value: string): Promise<boolean> {
    const valid = ['privateMessages', 'chatInGame', 'lastSeenPrivacy', 'followPrivacy', 'inventoryPrivacy', 'groupPrivacy'];
    if (!valid.includes(key)) throw new Error(`Setting inválido: ${key}`);
    return mutate(cookie, (h) =>
      axios.post(`https://accountsettings.roblox.com/v1/privacy/${key}`, { value }, { headers: h })
    );
  }

  // ─── Amigos ───────────────────────────────────────────────────────────

  async getFriendsList(cookie: string): Promise<Friend[]> {
    const cacheKey = `friends_${cookie.slice(0, 20)}`;
    const cached = friendsCache.get(cacheKey);
    if (cached) return cached;

    const data = await apiGet<any>(cookie, 'https://friends.roblox.com/v1/my/friendships/friends', { data: [] });
    const arr: any[] = data?.data || [];
    if (arr.length === 0) { friendsCache.set(cacheKey, []); return []; }

    // Presencias en chunks de 20
    const userIds = arr.map((f) => f.id).filter(Boolean);
    const presences = new Map<number, any>();
    for (let i = 0; i < userIds.length; i += 20) {
      const chunk = userIds.slice(i, i + 20);
      try {
        const r = await axios.post('https://presence.roblox.com/v1/presence/users',
          { userIds: chunk }, { headers: { 'Content-Type': 'application/json', 'User-Agent': UA } });
        for (const p of r.data?.userPresences || []) presences.set(p.userId, p);
      } catch { /* continuar */ }
    }

    const friends: Friend[] = arr.map((f) => {
      const p = presences.get(f.id)?.userPresence;
      return {
        id: f.id, username: f.username || '', displayName: f.displayName || f.username || '',
        isOnline: p?.userPresenceType === 1 || p?.userPresenceType === 2,
        isInGame: p?.userPresenceType === 2, isInStudio: p?.userPresenceType === 3,
        lastOnline: p?.lastLocation || '', avatarUrl: f.avatar?.avatarUrl || null,
        friendshipStatus: f.friendshipStatus || 'Friend',
      };
    });
    friendsCache.set(cacheKey, friends);
    return friends;
  }

  async getFriendRequests(cookie: string): Promise<FriendRequest[]> {
    const data = await apiGet<any>(cookie, 'https://friends.roblox.com/v1/friend-requests', { data: [] });
    return (data?.data || []).map((r: any) => ({
      id: r.id || r.requester?.id || 0,
      username: r.requester?.name || r.requester?.username || '',
      displayName: r.requester?.displayName || r.requester?.name || '',
      avatarUrl: r.requester?.avatar?.avatarUrl || null,
      sentAt: r.created || r.sentAt || '',
    }));
  }

  async respondFriendRequest(cookie: string, userId: number, accept: boolean): Promise<boolean> {
    const r = await mutate(cookie, (h) =>
      axios.post(`https://friends.roblox.com/v1/friend-requests/${userId}`, { accept }, { headers: h })
    );
    friendsCache.clear();
    return r;
  }

  // ─── Bloqueos ────────────────────────────────────────────────────────

  async getBlockedUsers(cookie: string): Promise<BlockedUser[]> {
    const data = await apiGet<any>(cookie, 'https://accountsettings.roblox.com/v1/users/blocked', { blockedUsers: [] });
    return (data?.blockedUsers || data?.data || []).map((u: any) => ({
      id: u.id || u.userId || 0, username: u.username || '',
      displayName: u.displayName || u.username || '', avatarUrl: u.avatar?.avatarUrl || null,
    }));
  }

  async blockUser(cookie: string, userId: number): Promise<boolean> {
    return mutate(cookie, (h) =>
      axios.post(`https://accountsettings.roblox.com/v1/users/${userId}/block`, {}, { headers: h })
    );
  }

  async unblockUser(cookie: string, userId: number): Promise<boolean> {
    return mutate(cookie, (h) =>
      axios.post(`https://accountsettings.roblox.com/v1/users/${userId}/unblock`, {}, { headers: h })
    );
  }

  // ─── Follow / Unfollow ───────────────────────────────────────────────

  async followUser(cookie: string, userId: number): Promise<boolean> {
    return mutate(cookie, (h) =>
      axios.post(`https://friends.roblox.com/v1/users/${userId}/follow`, {}, { headers: h })
    );
  }

  async unfollowUser(cookie: string, userId: number): Promise<boolean> {
    return mutate(cookie, (h) =>
      axios.post(`https://friends.roblox.com/v1/users/${userId}/unfollow`, {}, { headers: h })
    );
  }

  // ─── Notificaciones ──────────────────────────────────────────────────

  async getNotificationSettings(cookie: string): Promise<NotificationSettings> {
    try {
      const data = await apiGet<any>(cookie, 'https://accountsettings.roblox.com/v1/notifications');
      return {
        friendRequestNotifications: data?.friendRequestNotifications !== false,
        messageNotifications: data?.messageNotifications !== false,
      };
    } catch { return { friendRequestNotifications: true, messageNotifications: true }; }
  }

  async updateNotificationSetting(cookie: string, key: string, value: boolean): Promise<boolean> {
    const valid = ['friendRequestNotifications', 'messageNotifications'];
    if (!valid.includes(key)) throw new Error(`Setting inválido: ${key}`);
    return mutate(cookie, (h) =>
      axios.post(`https://accountsettings.roblox.com/v1/notifications/${key}`, { value }, { headers: h })
    );
  }
}

export default AccountSettingsService;
