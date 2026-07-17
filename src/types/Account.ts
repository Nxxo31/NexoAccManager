/**
 * Modelo de datos para una cuenta de Roblox
 */
export interface Account {
  id: string;                   // UUID Ãºnico generado localmente
  robloxUserId: number;         // UserID de Roblox
  username: string;             // Nombre de usuario (sin cifrar)
  displayName?: string;         // Nombre visible
  cookie?: string;               // Cookie .ROBLOSECURITY (cifrada en reposo) — nunca expuesta pÃºblicamente
  group: string;                // Grupo de organizaciÃ³n
  description?: string;         // Notas del usuario
  lastUsed: Date;               // Ãšltima vez que se usÃ³
  createdAt: Date;              // Fecha de creaciÃ³n en NexoAccManager
  avatarUrl?: string;           // URL del avatar (opcional)
  fields?: Record<string, string>; // Campos personalizables
  cookieExpiresAt?: Date;       // Fecha de expiración de la cookie
  savedPlaceId?: string;        // Place ID guardado para esta cuenta
  savedJobId?: string;          // Job ID guardado para esta cuenta
  password?: string;              // Contraseña (cifrada, si savePasswords=true)
  /** Relanzar automáticamente si el proceso se cae */
  autoRelaunch?: boolean;
  /** Marca esta cuenta como favorita */
  isFavorite?: boolean;
  /** Juegos jugados recientemente (máximo 10 por cuenta) */
  recentGames?: RecentGame[];
  /** Juegos favoritos (máximo 20 por cuenta) */
  favoriteGames?: FavoriteGame[];
}

/**
 * Juego jugado recientemente
 */
export interface RecentGame {
  id: string;                   // UUID único generado localmente para el registro
  gameId: number;               // ID del juego en Roblox (rootPlaceId)
  name: string;                 // Nombre del juego
  icon?: string;                // URL del ícono del juego (thumbnail)
  lastPlayed: Date;             // Fecha y hora de la última vez jugado
  placeId: string;              // Place ID específico del servidor (rootPlaceId)
  placeName: string;            // Nombre del lugar (opcional, puede ser igual a name)
  universeId: number;           // ID del universo del juego
}

/**
 * Juego marcado como favorito
 */
export interface FavoriteGame {
  id: string;                   // UUID único generado localmente para el favorito
  gameId: number;               // ID del juego en Roblox (rootPlaceId)
  name: string;                 // Nombre del juego
  icon?: string;                // URL del ícono del juego (thumbnail)
  addedAt: Date;                // Fecha y hora en que se agregó a favoritos
}

/**
 * Estado de autenticaciÃ³n de una cuenta
 */
export interface AccountAuth {
  accountId: string;
  csrfToken: string;
  authenticated: boolean;
  lastRefresh: Date;
}
