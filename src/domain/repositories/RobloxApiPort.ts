// Domain: Roblox API port (interface for external Roblox services)
// Los use-cases dependen de esta interfaz, no de axios ni de servicios concretos
//
// DT-2 (ISP): RobloxApiPort era una god-interface con 35+ métodos mezclando
// capacidades distintas. Segregada en sub-ports por capacidad (Auth, Games,
// Presence, Social, Settings, Cookie) para que un caller que solo necesita
// `getPresence` pueda depender de RobloxPresencePort y no de todo el port.
// La interface compuesta RobloxApiPort se mantiene vacía (extiende todos los
// sub-ports) para preservar backward compat — la infraestructura implementa
// los sub-ports implícitamente vía duck typing de exports de funciones.

import type { ServerInfo, ServerUser } from '../entities/ServerInfo';
import type { PresenceData, RobuxBalance, Friend, FriendRequest, BlockedUser } from '../entities/PresenceData';
import type { OutfitData, UniverseData } from '../entities/GameData';

// ─────────────────────────────────────────────────────────────────────────────
// Auth — login, verificación de cookies e importación
// ─────────────────────────────────────────────────────────────────────────────
export interface RobloxAuthPort {
  loginBrowser(): Promise<{ cookie: string; userId: number; username: string }>;
  loginUserPass(username: string, password: string): Promise<{ cookie: string; userId: number; username: string }>;
  verifyCookie(cookie: string): Promise<{ valid: boolean; userId: number; username: string }>;
  importCookies(cookies: string[]): Promise<{ added: number; skipped: number }>;
  getCsrfToken(cookie: string): Promise<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Games — búsqueda, servidores, players, outfits, universes
// ─────────────────────────────────────────────────────────────────────────────
export interface RobloxGamesPort {
  searchGames(query: string, cookie: string): Promise<{ id: number; name: string; thumbnail: string }[]>;
  getGameThumbnail(placeId: number): Promise<string>;
  getGameServers(placeId: string, cookie: string, serverType?: 'Public' | 'Private'): Promise<ServerInfo[]>;
  getServerUsers(serverId: string, cookie: string): Promise<ServerUser[]>;
  getServerRegion(placeId: string): Promise<{ region: string; ping: number }>;
  searchPlayer(query: string, cookie: string): Promise<{ userId: number; username: string; displayName: string }[]>;
  getOutfits(userId: number, cookie: string): Promise<OutfitData[]>;
  getUniverses(gameId: number, cookie: string): Promise<UniverseData[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Presence — estado online, juegos recientes, balance Robux
// ─────────────────────────────────────────────────────────────────────────────
export interface RobloxPresencePort {
  getPresence(userIds: number[], cookie: string): Promise<PresenceData[]>;
  getRecentGames(userId: number, cookie: string): Promise<{ gameId: number; name: string; icon: string; lastPlayed: Date; placeId: string; universeId: number }[]>;
  getRobuxBalance(userId: number, cookie: string): Promise<RobuxBalance>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Social — amigos, requests, bloqueos, follow/unfollow
// ─────────────────────────────────────────────────────────────────────────────
export interface RobloxSocialPort {
  getFriends(userId: number, cookie: string): Promise<Friend[]>;
  getFriendRequests(cookie: string): Promise<FriendRequest[]>;
  respondFriendRequest(requestId: number, accept: boolean, cookie: string): Promise<void>;
  getBlockedUsers(cookie: string): Promise<BlockedUser[]>;
  blockUser(userId: number, cookie: string): Promise<void>;
  unblockUser(userId: number, cookie: string): Promise<void>;
  followUser(userId: number, cookie: string): Promise<void>;
  unfollowUser(userId: number, cookie: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings — profile, 2FA, sessions, password, privacy, notifications
// ─────────────────────────────────────────────────────────────────────────────
export interface RobloxSettingsPort {
  getProfile(cookie: string): Promise<{ displayName: string; description: string }>;
  updateProfile(cookie: string, updates: { displayName?: string; description?: string }): Promise<void>;
  get2FAStatus(cookie: string): Promise<{ enabled: boolean; method: string }>;
  toggle2FA(cookie: string, enable: boolean): Promise<void>;
  getActiveSessions(cookie: string): Promise<{ id: string; device: string; lastActive: Date }[]>;
  logoutSession(cookie: string, sessionId: string): Promise<void>;
  logoutAllSessions(cookie: string): Promise<void>;
  changePassword(cookie: string, current: string, next: string): Promise<void>;
  getPrivacySettings(cookie: string): Promise<Record<string, string | boolean>>;
  updatePrivacySetting(cookie: string, key: string, value: string | boolean): Promise<void>;
  getNotificationSettings(cookie: string): Promise<Record<string, boolean>>;
  updateNotificationSetting(cookie: string, key: string, value: boolean): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cookie Management — expiración y refresh de .ROBLOSECURITY
// ─────────────────────────────────────────────────────────────────────────────
export interface RobloxCookiePort {
  getCookieExpiry(cookie: string): Promise<Date | null>;
  refreshCookie(cookie: string): Promise<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite — backward compat
// Se mantiene para no romper imports que referencien la interface original.
// La infraestructura implementa los sub-ports implícitamente vía duck typing.
// ─────────────────────────────────────────────────────────────────────────────
export interface RobloxApiPort
  extends RobloxAuthPort,
    RobloxGamesPort,
    RobloxPresencePort,
    RobloxSocialPort,
    RobloxSettingsPort,
    RobloxCookiePort {}
