// Domain Entity: ServerInfo
export interface ServerInfo {
  id: string;
  placeId: string;
  currentPlayers: number;
  maxPlayers: number;
  ping: number;
  region: string;
  jobId: string;
  fps: number;
}

export interface ServerUser {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  presence: 'Online' | 'InGame' | 'Offline';
}
