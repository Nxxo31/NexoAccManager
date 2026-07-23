// Domain: Roblox API port (interface for external Roblox services)
// Los use-cases dependen de esta interfaz, no de axios ni de servicios concretos

import type { ServerInfo, ServerUser } from '../entities/ServerInfo';
import type { PresenceData, RobuxBalance, Friend, FriendRequest, BlockedUser } from '../entities/PresenceData';
import type { OutfitData, UniverseData } from '../entities/GameData';

export interface RobloxApiPort {
  // Auth
  loginBrowser(): Promise<{ cookie: string; userId: number; username: string }>;
  loginUserPass(username: string, password: string): Promise<{ cookie: string; userId: number; username: string }>;
  verifyCookie(cookie: string): Promise<{ valid: boolean; userId: number; username: string }>;
  importCookies(cookies: string[]): Promise<{ added: number; skipped: number }>;
  getCsrfToken(cookie: string): Promise<string>;

  // Games
  searchGames(query: string, cookie: string): Promise<{ id: number; name: string; thumbnail: string }[]>;
  getGameThumbnail(placeId: number): Promise<string>;
  getGameServers(placeId: string, cookie: string, serverType?: 'Public' | 'Private'): Promise<ServerInfo[]>;
  getServerUsers(serverId: string, cookie: string): Promise<ServerUser[]>;
  getServerRegion(placeId: string): Promise<{ region: string; ping: number }>;
  searchPlayer(query: string, cookie: string): Promise<{ userId: number; username: string; displayName: string }[]>;

  // Presence + Social
  getPresence(userIds: number[], cookie: string): Promise<PresenceData[]>;
  getFriends(userId: number, cookie: string): Promise<Friend[]>;
  getFriendRequests(cookie: string): Promise<FriendRequest[]>;
  respondFriendRequest(requestId: number, accept: boolean, cookie: string): Promise<void>;
  getBlockedUsers(cookie: string): Promise<BlockedUser[]>;
  blockUser(userId: number, cookie: string): Promise<void>;
  unblockUser(userId: number, cookie: string): Promise<void>;
  followUser(userId: number, cookie: string): Promise<void>;
  unfollowUser(userId: number, cookie: string): Promise<void>;
  getRobuxBalance(userId: number, cookie: string): Promise<RobuxBalance>;
  getRecentGames(userId: number, cookie: string): Promise<{ gameId: number; name: string; icon: string; lastPlayed: Date; placeId: string; universeId: number }[]>;

  // Account Settings
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

  // Cookie Management
  getCookieExpiry(cookie: string): Promise<Date | null>;
  refreshCookie(cookie: string): Promise<string>;

  // Outfits + Universes
  getOutfits(userId: number, cookie: string): Promise<OutfitData[]>;
  getUniverses(gameId: number, cookie: string): Promise<UniverseData[]>;
}
