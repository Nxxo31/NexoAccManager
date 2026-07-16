# NexoAccManager — Matriz de Entidades y Relaciones

## Entidades del Sistema

### 1. Account (Cuenta de Roblox)
Entidad principal. Cada cuenta es una identidad de Roblox gestionada localmente.

| Atributo | Tipo | Origen | Descripción |
|----------|------|--------|-------------|
| id | string (UUID) | Local | Identificador único generado localmente |
| robloxUserId | number | Roblox API | UserID de Roblox |
| username | string | Roblox API | Nombre de usuario (sin cifrar) |
| displayName | string? | Roblox API | Nombre visible |
| cookie | string? | Local | Cookie .ROBLOSECURITY (cifrada AES-256-GCM en reposo) |
| group | string | Local | Grupo de organización (ej: "Main", "Alts", "Storage") |
| description | string? | Local | Notas del usuario |
| lastUsed | Date | Local | Última vez que se usó la cuenta |
| createdAt | Date | Local | Fecha de creación en NAM |
| avatarUrl | string? | Roblox API | URL del avatar |
| cookieExpiresAt | Date? | Local | Fecha de expiración de la cookie |
| savedPlaceId | string? | Local | Place ID guardado para esta cuenta |
| savedJobId | string? | Local | Job ID guardado para esta cuenta |
| fields | Record<string,string>? | Local | Campos personalizables |
| password | string? | Local (toggle global) | Contraseña guardada (cifrada, opcional) |
| presence | enum | PresenceService | online / offline / in-game |
| currentGame | string? | PresenceService | Nombre del juego actual |
| currentPlaceId | string? | PresenceService | Place ID del juego actual |
| currentJobId | string? | PresenceService | Job ID del servidor actual |
| friends | Friend[]? | Roblox API | Lista de amigos (cacheada) |
| autoRelaunch | boolean | Local | Relanzar automáticamente si se cae |
| browserTrackerId | number? | Local | ID para detectar instancias duplicadas |

### 2. Friend (Amigo de una cuenta)
Entidad secundaria, pertenece a una Account.

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| userId | number | Roblox UserID del amigo |
| username | string | Nombre de usuario |
| displayName | string? | Nombre visible |
| presence | enum | online / offline / in-game |
| currentGame | string? | Juego actual si está jugando |
| currentPlaceId | string? | Place ID del juego actual |
| isOnline | boolean | Estado online |
| avatarUrl | string? | URL del avatar |

### 3. GameServer (Servidor de un juego)
Entidad de búsqueda, no se persiste.

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| jobId | string | Identificador del servidor |
| playerCount | number | Jugadores actuales |
| maxPlayers | number | Capacidad máxima |
| ping | number | Latencia (ms) |
| region | string | Región geográfica |
| fps | number | FPS del servidor |

### 4. Game (Juego de Roblox)
Entidad de búsqueda, no se persiste (excepto favoritos/recientes).

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| placeId | string | ID del lugar |
| name | string | Nombre del juego |
| description | string? | Descripción |
| playerCount | number | Jugadores activos |
| thumbnailUrl | string? | Imagen del juego |
| universeId | string? | ID del universo |

### 5. RecentGame (Juego reciente)
Entidad persistida localmente, ligada globalmente (no por cuenta).

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| placeId | string | ID del lugar |
| name | string | Nombre |
| lastPlayed | Date | Última vez que se jugó |
| thumbnailUrl | string? | Imagen |

### 6. FavoriteGame (Juego favorito)
Entidad persistida localmente.

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| placeId | string | ID del lugar |
| name | string | Nombre |
| addedAt | Date | Fecha de añadir a favoritos |

### 7. GlobalSettings (Configuración global)
Configuración que aplica a toda la app, no a cuentas individuales.

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| savePasswords | boolean | false | Guardar contraseñas al login |
| autoRelaunch | boolean | false | Relanzar cuentas caídas |
| cookieAutoRefresh | boolean | true | Auto-renovar cookies |
| multiRoblox | boolean | false | Multi-instancia (disabled by default) |
| launchDelay | number | 8 | Delay entre launches (segundos) |
| shuffleLowestServer | boolean | false | Shuffle elige servidor más pequeño |
| maxRecentGames | number | 8 | Máximo de juegos recientes guardados |
| preventDuplicateInstances | boolean | true | Cerrar instancia vieja al lanzar |
| connectionWatcher | boolean | false | Cerrar si no hay conexión |
| connectionTimeout | number | 300 | Segundos sin conexión antes de cerrar |
| devMode | boolean | false | Features de desarrollador |

### 8. ThemeSettings (Configuración de tema)
Configuración visual global.

| Atributo | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| theme | string | "dark" | dark / light / roblox-classic / custom |
| primaryColor | string | "#DE350D" | Color primario |
| accentColor | string | "#6347FF" | Color secundario |
| fontSize | enum | "medium" | small / medium / large |
| uiDensity | enum | "normal" | compact / normal / spacious |
| animationsEnabled | boolean | true | Animaciones on/off |

### 9. LanguageSettings (Idioma)
| Atributo | Tipo | Default |
|----------|------|---------|
| language | string | "es" |

---

## Matriz de Relaciones

```
┌─────────────┐     1:N     ┌──────────┐
│   Account   │────────────>|  Friend  │
│             │             │          │
│ id (PK)     │             │ userId   │
│ robloxUserId│             │ username │
│ username    │             │ presence │
│ group       │             └──────────┘
│ savedPlaceId│
│ savedJobId  │     N:1     ┌──────────────┐
│             │────────────>|  GroupLabel  │
│ presence    │             │ (virtual)    │
│ autoRelaunch│             │ "Main"       │
└──────┬──────┘             │ "Alts"       │
       │                    │ "Storage"    │
       │  uses              └──────────────┘
       v
┌─────────────┐     1:N     ┌──────────────┐
│ GameServer  │             │    Game      │
│             │             │              │
│ jobId (PK)  │             │ placeId (PK) │
│ playerCount │             │ name         │
│ ping        │             │ playerCount  │
│ region      │             │ thumbnailUrl │
│ fps         │             └──────┬───────┘
└─────────────┘                    │
                                   │ favorited
                                   v
                           ┌──────────────┐
                           │ FavoriteGame │
                           │              │
                           │ placeId (PK) │
                           │ name         │
                           │ addedAt      │
                           └──────────────┘

┌──────────────────┐     applies to all
│  GlobalSettings  │──────────────────────> App-wide
│                  │
│ savePasswords    │     per-account attribute:
│ autoRelaunch     │     (account.autoRelaunch)
│ multiRoblox      │
│ launchDelay      │
│ cookieAutoRefresh│
└──────────────────┘

┌──────────────────┐
│  ThemeSettings    │──────────────────────> App-wide
│  LanguageSettings │
└──────────────────┘
```

---

## Configuración: Global vs Per-Account

| Setting | Scope | Justificación |
|---------|-------|----------------|
| savePasswords | GLOBAL | Política de seguridad del usuario |
| autoRelaunch (default) | GLOBAL | Default para nuevas cuentas |
| autoRelaunch (override) | PER-ACCOUNT | Algunas cuentas necesitan relaunch, otras no |
| cookieAutoRefresh | GLOBAL | Comportamiento del servicio |
| multiRoblox | GLOBAL | Afecta el launch de todas las cuentas |
| launchDelay | GLOBAL | Delay entre launches |
| shuffleLowestServer | GLOBAL | Comportamiento del shuffle |
| maxRecentGames | GLOBAL | Límite de historial |
| connectionWatcher | GLOBAL | Servicio de monitoreo |
| preventDuplicateInstances | GLOBAL | Comportamiento del launcher |
| devMode | GLOBAL | Features de desarrollador |
| theme | GLOBAL | Visual |
| language | GLOBAL | Visual |
| savedPlaceId | PER-ACCOUNT | Cada cuenta guarda su propio Place ID |
| savedJobId | PER-ACCOUNT | Cada cuenta guarda su propio Job ID |
| group | PER-ACCOUNT | Organización del usuario |
| description | PER-ACCOUNT | Notas del usuario |
| displayName (alias) | PER-ACCOUNT | Alias visual |
| password | PER-ACCOUNT | Contraseña guardada (si savePasswords=true) |
| browserTrackerId | PER-ACCOUNT | Tracking de instancia activa |
| friends | PER-ACCOUNT | Lista de amigos por cuenta |
| presence | PER-ACCOUNT (read-only) | Estado online via PresenceService |

---

## Casos de Uso — Presence (Social)

Presence no es un panel de estado de "estoy jugando". Es la capa social de la app:

### Acciones que Presence habilita:
1. **Ver amigos online** — qué amigos están conectados y en qué juego
2. **Añadir amigo** — enviar solicitud de amistad desde una cuenta
3. **Eliminar amigo** — remover de la lista de amigos
4. **Seguir usuario** — follow en Roblox
5. **Dejar de seguir** — unfollow
6. **Unirse a partida de amigo** — si un amigo está jugando, unirse a su servidor
7. **Ver perfil de amigo** — abrir perfil de Roblox del amigo
8. **Ver outfits** — ver el outfit actual de un amigo
9. **Player Finder** — buscar un jugador por username incluso si tiene follows privados

### Flujo de Presence:
```
Account seleccionada → PresenceService.getPresence(robloxUserId)
  → { status: 'online'|'offline'|'in-game',
       currentGame?: string,
       currentPlaceId?: string,
       currentJobId?: string,
       lastOnline?: Date }
  → UI actualiza dot en AccountCard
  → UI muestra info en AccountDetailPanel
  → Si in-game: botón "Unirse" disponible
```

### Flujo de Friends:
```
Account seleccionada → Roblox API getFriends(robloxUserId)
  → Friend[] con presence de cada amigo
  → UI muestra lista en AccountDetailPanel
  → Click en amigo online → opción "Unirse a partida"
  → Click en amigo → "Ver perfil", "Eliminar amigo"
  → Buscar username → "Añadir amigo", "Seguir"
```

---

## Features de RAM clasificadas

### YA IMPLEMENTADAS en NAM v3.0:
- [x] Account encryption (AES-256-GCM, mejor que RAM que usa DPAPI)
- [x] Multi-instance Roblox (MultiRobloxService)
- [x] Add accounts (BrowserWindow login + cookie + bulk import)
- [x] Cookie storage (cifrada, RAM usa plaintext)
- [x] PlaceId/JobId join
- [x] Server browser
- [x] Custom themes (CSS variables vs WinForms limitado)
- [x] i18n (ES/EN/PT, RAM solo EN)
- [x] Cross-platform (Electron vs WinForms Windows-only)
- [x] Open source (MIT vs GPL-3.0)
- [x] Cookie auto-refresh (CookieExpiryService)
- [x] DevMode (rbx-player link)

### FALTAN (priorizadas):
- [ ] **Save/Copy Password** — al login, guardar contraseña, copiar al clipboard
- [ ] **Account Groups UI** — field `group` existe, falta UI para agrupar visualmente
- [ ] **Account Sorting (drag-drop)** — RAM tiene drag-drop en el list
- [ ] **Recent Games** — historial de juegos jugados (savedPlaceId existe)
- [ ] **Favorite Games** — lista de favoritos
- [ ] **Games List/Browser** — buscar juegos por Place ID
- [ ] **Account Control (Nexus)** — control in-game via Lua/websockets
- [ ] **Local Web API** — HTTP server local
- [ ] **Auto Relaunch** — relanzar cuentas caídas
- [ ] **Prevent Duplicate Instances** — cerrar instancia vieja
- [ ] **Connection Watcher** — cerrar si no hay conexión
- [ ] **Presence UI** — friends list, join friend's game, view profile
- [ ] **Player Finder** — buscar jugador por username
- [ ] **Outfit Viewer** — ver outfits de otros jugadores
- [ ] **Universe Viewer** — ver universos de juegos
- [ ] **Join VIP Servers** — soporte para links de VIP servers
- [ ] **Quick Log In** — login en otro PC via código
- [ ] **AI Captcha Assistance** — Nopecha API integration
- [ ] **Join Group** — unirse a grupos con múltiples cuentas
- [ ] **Account Utilities** — cambiar password, email, display name, follow privacy
- [ ] **Account Aging Alert** — dots amarillos/rojos por inactividad
