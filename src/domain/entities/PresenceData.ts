// Domain Entity: PresenceData
export interface PresenceData {
  userId: number;
  presenceType: 'Offline' | 'Online' | 'InGame' | 'InStudio';
  lastLocation: string;
  placeId: number | null;
  universeId: number | null;
  lastOnline: Date | null;
  gameId: string | null;
}

export interface RobuxBalance {
  userId: number;
  balance: number;
  pending: number;
  premium: boolean;
  updatedAt: Date;
}

export interface Friend {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  presence: PresenceData | null;
}

export interface FriendRequest {
  id: number;
  requesterId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  sentAt: Date;
  status: 'Pending' | 'Accepted' | 'Declined';
}

export interface BlockedUser {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  blockedAt: Date;
}
