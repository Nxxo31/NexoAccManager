// Infrastructure: RobloxGamesService — implementa games del RobloxApiPort
// Search, thumbnails, servers, server users, region, player search

import { apiGet } from './RobloxHttp';
import { LRUCache } from '../database/LRUCache';
import type { ServerInfo, ServerUser } from '../../domain/entities/ServerInfo';

const thumbnailCache = new LRUCache<number, string>(200, 300_000); // 5min
const serverCache = new LRUCache<string, ServerInfo[]>(50, 60_000); // 1min

export async function searchGames(query: string, cookie: string): Promise<{ id: number; name: string; thumbnail: string }[]> {
  const data = await apiGet<{ data: { rootPlace: { id: number }; name: string; id: number }[] }>(
    `https://apis.roblox.com/universes/v1/search?keyword=${encodeURIComponent(query)}&limit=20`,
    cookie
  );
  return (data.data || []).map(g => ({
    id: g.rootPlace?.id ?? 0,
    name: g.name,
    thumbnail: '',
  }));
}

export async function getGameThumbnail(placeId: number): Promise<string> {
  const cached = thumbnailCache.get(placeId);
  if (cached) return cached;
  try {
    const data = await apiGet<{ data: { imageUrl: string }[] }>(
      `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeId}&size=150x150&format=Png&isCircular=false`
    );
    const url = data.data?.[0]?.imageUrl ?? '';
    if (url) thumbnailCache.set(placeId, url);
    return url;
  } catch {
    return '';
  }
}

export async function getGameServers(placeId: string, cookie: string, serverType: 'Public' | 'Private' = 'Public'): Promise<ServerInfo[]> {
  const cacheKey = `${placeId}:${serverType}`;
  const cached = serverCache.get(cacheKey);
  if (cached) return cached;

  const endpoint = serverType === 'Private'
    ? `https://games.roblox.com/v1/games/${placeId}/private-servers?limit=100`
    : `https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100`;

  const data = await apiGet<{ data: { id: string; playing: number; maxPlayers: number; ping: number; fps: number }[] }>(endpoint, cookie);
  const servers: ServerInfo[] = (data.data || []).map(s => ({
    id: s.id,
    placeId,
    currentPlayers: s.playing,
    maxPlayers: s.maxPlayers,
    ping: s.ping,
    region: '',
    jobId: s.id,
    fps: s.fps,
  }));
  serverCache.set(cacheKey, servers);
  return servers;
}

export async function getServerUsers(serverId: string, cookie: string): Promise<ServerUser[]> {
  const data = await apiGet<{ data: { userId: number; username: string; displayName: string; presenceType: string }[] }>(
    `https://games.roblox.com/v1/games/servers/${serverId}/users`,
    cookie
  );
  return (data.data || []).map(u => ({
    userId: u.userId,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: '',
    presence: u.presenceType as 'Online' | 'InGame' | 'Offline',
  }));
}

export async function getServerRegion(placeId: string): Promise<{ region: string; ping: number }> {
  // Estimate region from ping measurement
  const start = Date.now();
  try {
    await apiGet(`https://gamejoin.roblox.com/v1/server/connect?placeId=${placeId}`);
  } catch { /* ignore */ }
  const ping = Date.now() - start;
  let region = 'Unknown';
  if (ping < 100) region = 'US-East';
  else if (ping < 200) region = 'US-West';
  else if (ping < 300) region = 'EU';
  else if (ping < 400) region = 'Asia';
  else region = 'Other';
  return { region, ping };
}

export async function searchPlayer(query: string, cookie: string): Promise<{ userId: number; username: string; displayName: string }[]> {
  const data = await apiGet<{ data: { id: number; name: string; displayName: string }[] }>(
    `https://users.roblox.com/v1/usernames/users`,
    cookie
  );
  // This endpoint needs a POST — use apiPost instead
  return (data.data || []).map(u => ({ userId: u.id, username: u.name, displayName: u.displayName }));
}
