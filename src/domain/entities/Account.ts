// Domain Entity: Account
// Pure business type — no framework dependencies, no DB knowledge

export interface Account {
  id: string;
  robloxUserId: number;
  username: string;
  displayName: string;
  encryptedCookie: string;
  cookieHash: string;
  group: string;
  description: string;
  lastUsed: Date;
  createdAt: Date;
  avatarUrl: string;
  cookieExpiresAt: Date | null;
  savedPlaceId: string;
  savedJobId: string;
  password: string;
  autoRelaunch: boolean;
  isFavorite: boolean;
  fields: Record<string, string>;
  browserTrackerId: string;
  recentGames: RecentGame[];
  favoriteGames: FavoriteGame[];
}

export interface RecentGame {
  id: string;
  gameId: number;
  name: string;
  icon: string;
  lastPlayed: Date;
  placeId: string;
  placeName: string;
  universeId: number;
}

export interface FavoriteGame {
  id: string;
  gameId: number;
  name: string;
  icon: string;
  addedAt: Date;
}

// Factory — crea Account con defaults sensatos
export function createAccount(partial: Partial<Account> & Pick<Account, 'id' | 'robloxUserId' | 'username' | 'encryptedCookie'>): Account {
  return {
    displayName: partial.username,
    cookieHash: '',
    group: 'Default',
    description: '',
    lastUsed: new Date(),
    createdAt: new Date(),
    avatarUrl: '',
    cookieExpiresAt: null,
    savedPlaceId: '',
    savedJobId: '',
    password: '',
    autoRelaunch: false,
    isFavorite: false,
    fields: {},
    browserTrackerId: '',
    recentGames: [],
    favoriteGames: [],
    ...partial,
  };
}
