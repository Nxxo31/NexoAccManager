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
  cookieExpiresAt?: Date;       // Fecha de expiraciÃ³n de la cookie
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
