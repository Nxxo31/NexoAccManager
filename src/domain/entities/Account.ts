// Domain Entity: Account
// Pure business type — no framework dependencies, no DB knowledge

import type { EncryptedString } from '../types/EncryptedString';
import { makeEncryptedString } from '../types/EncryptedString';

export interface Account {
  id: string;
  robloxUserId: number;
  username: string;
  displayName: string;
  /**
   * Cookie .ROBLOSECURITY cifrada (AES-256-GCM). El dominio garantiza a nivel
   * de tipos que este campo NUNCA contiene la cookie en texto plano: el
   * CryptoService la cifra antes de persistirse, y la factory solo acepta
   * EncryptedString. La desencripción se hace exclusivamente en el main process.
   */
  encryptedCookie: EncryptedString;
  cookieHash: string;
  group: string;
  description: string;
  lastUsed: Date;
  createdAt: Date;
  avatarUrl: string;
  cookieExpiresAt: Date | null;
  savedPlaceId: string;
  savedJobId: string;
  /**
   * Contraseña de la cuenta Roblox, almacenada CIFRADA. Branded type
   * EncryptedString para tipificar la invariant: el renderer nunca debe ver
   * este valor descifrado (ver AGENTS.md: "Cookies Roblox NUNCA salen
   * descifradas del main process" — misma invariant para credenciales).
   * El handler account:getPassword fue ELIMINADO: el valor solo se procesa
   * internamente para reautenticar/refresh, nunca se envía al renderer.
   */
  password: EncryptedString;
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

// Factory — crea Account con defaults sensatos.
// Valida invariantes de dominio (DT-3):
//   - robloxUserId > 0
//   - username non-empty string
//   - si encryptedCookie non-empty, cookieHash debe ser non-empty (coherente)
//   - encryptedCookie === ''  → permitido (cuenta agregada vía login antes de persistir cookie)
// Nota: no se valida password aquí — el branded type EncryptedString ya asegura
// que llega cifrada desde el boundary de infraestructura.
export function createAccount(partial: Partial<Account> & Pick<Account, 'id' | 'robloxUserId' | 'username' | 'encryptedCookie'>): Account {
  // Invariante: robloxUserId > 0
  if (typeof partial.robloxUserId !== 'number' || !Number.isFinite(partial.robloxUserId) || partial.robloxUserId <= 0) {
    throw new Error(`createAccount: robloxUserId debe ser > 0 (recibido: ${String(partial.robloxUserId)})`);
  }
  // Invariante: username non-empty string
  if (typeof partial.username !== 'string' || partial.username.trim() === '') {
    throw new Error('createAccount: username debe ser un string no vacío');
  }
  // Invariante coherente cookie/cookieHash:
  //   - encryptedCookie non-empty  → cookieHash debe ser non-empty
  //   - encryptedCookie === ''     → permitir (no se valida cookieHash)
  const cookie = partial.encryptedCookie;
  const hash = partial.cookieHash ?? '';
  if (typeof cookie === 'string' && cookie !== '' && hash === '') {
    throw new Error('createAccount: si encryptedCookie es non-empty, cookieHash también debe serlo (invariante coherente)');
  }

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
    password: makeEncryptedString(''),
    autoRelaunch: false,
    isFavorite: false,
    fields: {},
    browserTrackerId: '',
    recentGames: [],
    favoriteGames: [],
    ...partial,
  };
}
