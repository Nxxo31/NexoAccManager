// Infrastructure: RobloxPresenceService — presencia, amigos, robux, recent games

import { apiGet, apiPost } from './RobloxHttp';
import { LRUCache } from '../database/LRUCache';
import type { PresenceData, RobuxBalance, Friend, FriendRequest, BlockedUser } from '../../domain/entities/PresenceData';

const presenceCache = new LRUCache<string, PresenceData[]>(100, 30_000); // 30s
const friendCache = new LRUCache<number, Friend[]>(50, 60_000); // 1min

export async function getPresence(userIds: number[], cookie: string): Promise<PresenceData[]> {
  const cacheKey = userIds.join(',');
  const cached = presenceCache.get(cacheKey);
  if (cached) return cached;

  const data = await apiPost<{ userPresences: { userId: number; presenceType: string; lastLocation: string; placeId: number | null; universeId: number | null; lastOnline: string | null; gameId: string | null }[] }>(
    'https://presence.roblox.com/v1/presence/users',
    cookie,
    { userIds }
  );
  const result: PresenceData[] = (data.userPresences || []).map(p => ({
    userId: p.userId,
    presenceType: p.presenceType as 'Offline' | 'Online' | 'InGame' | 'InStudio',
    lastLocation: p.lastLocation,
    placeId: p.placeId,
    universeId: p.universeId,
    lastOnline: p.lastOnline ? new Date(p.lastOnline) : null,
    gameId: p.gameId,
  }));
  presenceCache.set(cacheKey, result);
  return result;
}

export async function getFriends(userId: number, cookie: string): Promise<Friend[]> {
  const cached = friendCache.get(userId);
  if (cached) return cached;

  const data = await apiGet<{ data: { id: number; name: string; displayName: string; isOnline: boolean }[] }>(
    `https://friends.roblox.com/v1/users/${userId}/friends`,
    cookie
  );
  const friends: Friend[] = (data.data || []).map(f => ({
    userId: f.id,
    username: f.name,
    displayName: f.displayName,
    avatarUrl: '',
    isOnline: f.isOnline,
    presence: null,
  }));
  friendCache.set(userId, friends);
  return friends;
}

export async function getFriendRequests(cookie: string): Promise<FriendRequest[]> {
  const data = await apiGet<{ data: { id: number; requester: { id: number; name: string; displayName: string } }[] }>(
    'https://friends.roblox.com/v1/my/friends/requests',
    cookie
  );
  return (data.data || []).map(r => ({
    id: r.id,
    requesterId: r.requester.id,
    username: r.requester.name,
    displayName: r.requester.displayName,
    avatarUrl: '',
    sentAt: new Date(),
    status: 'Pending' as const,
  }));
}

export async function respondFriendRequest(requestId: number, accept: boolean, cookie: string): Promise<void> {
  await apiPost(`https://friends.roblox.com/v1/user/friend-requests/${requestId}/${accept ? 'accept' : 'decline'}`, cookie);
}

export async function getBlockedUsers(cookie: string): Promise<BlockedUser[]> {
  const data = await apiGet<{ data: { userId: number; name: string; displayName: string }[] }>(
    'https://accountsettings.roblox.com/v1/users/get-blocked-users',
    cookie
  );
  return (data.data || []).map(u => ({
    userId: u.userId,
    username: u.name,
    displayName: u.displayName,
    avatarUrl: '',
    blockedAt: new Date(),
  }));
}

export async function blockUser(userId: number, cookie: string): Promise<void> {
  await apiPost('https://api.roblox.com/userblock/block', cookie, { userId });
}

export async function unblockUser(userId: number, cookie: string): Promise<void> {
  await apiPost('https://api.roblox.com/userblock/unblock', cookie, { userId });
}

export async function followUser(userId: number, cookie: string): Promise<void> {
  await apiPost('https://api.roblox.com/user/follow', cookie, { userId });
}

export async function unfollowUser(userId: number, cookie: string): Promise<void> {
  await apiPost('https://api.roblox.com/user/unfollow', cookie, { userId });
}

export async function getRobuxBalance(userId: number, cookie: string): Promise<RobuxBalance> {
  const data = await apiGet<{ robux: number; pendingRobux: number }>(
    `https://economy.roblox.com/v1/users/${userId}/currency`,
    cookie
  );
  return {
    userId,
    balance: data.robux ?? 0,
    pending: data.pendingRobux ?? 0,
    premium: false,
    updatedAt: new Date(),
  };
}

export async function getRecentGames(userId: number, cookie: string): Promise<{ gameId: number; name: string; icon: string; lastPlayed: Date; placeId: string; universeId: number }[]> {
  const data = await apiGet<{ data: { rootPlace: { id: number }; name: string; universeId: number; lastPlayDate: string }[] }>(
    `https://games.roblox.com/v2/users/${userId}/games/recently-played?limit=10`,
    cookie
  );
  return (data.data || []).map(g => ({
    gameId: g.rootPlace?.id ?? 0,
    name: g.name,
    icon: '',
    lastPlayed: g.lastPlayDate ? new Date(g.lastPlayDate) : new Date(),
    placeId: String(g.rootPlace?.id ?? ''),
    universeId: g.universeId,
  }));
}
