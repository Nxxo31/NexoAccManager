# NexoAccManager

## Descripción
Clon moderno de Roblox Account Manager (RAM) — gestor de cuentas Roblox con cifrado local, 
Multi-Roblox, API REST interna y UI en Electron + React. Inspirado en:
https://github.com/ic3w0lf22/Roblox-Account-Manager

## Stack
- Framework: Electron 30
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + TypeScript
- Base de datos: SQLite (better-sqlite3)
- Cifrado: AES-256-GCM derivado del hardware
- API interna: Fastify + @fastify/cors
- Build: Vite + electron-builder

## Funcionalidades objetivo (basadas en RAM original)

### Core — MVP v1.0
- [ ] Agregar cuentas por cookie .ROBLOSECURITY
- [ ] Verificación de cookie contra auth.roblox.com
- [ ] Cifrado AES-256-GCM local (no portable entre PCs)
- [ ] Lista de cuentas con grupos drag & drop
- [ ] Lanzar cuenta a un PlaceId específico
- [ ] Multi-Roblox (múltiples instancias simultáneas)
- [ ] Import/Export JSON de cuentas
- [ ] API REST local en puerto 8080

### API REST endpoints a implementar (basados en documentación oficial)
- GET /LaunchAccount — lanzar cuenta a un juego
- GET /GetAccounts — lista de cuentas
- GET /GetCookie — obtener cookie (requiere password)
- GET /ImportCookie — importar cuenta por cookie
- GET /SetServer — unirse a servidor específico por JobId
- GET /FollowUser — seguir a un usuario a su juego
- GET /GetField / SetField — campos personalizados por cuenta
- GET /GetCSRFToken — token CSRF de la cuenta

### Avanzado — v2.0
- [ ] Server List con ping y player count
- [ ] Account Control (WebSocket para control en-game)
- [ ] Auto Cookie Refresh (evitar logout por inactividad)
- [ ] Player Finder (buscar jugador en servidores)
- [ ] Themes/skins personalizables
- [ ] FPS Unlocker integrado
- [ ] BrowserTrackerID para prevenir instancias duplicadas
- [ ] Quick Log In

## Estado actual del cÃ³digo
- **Build**: âœ… corregido (ruta relativa en index.html)
- **Backend Electron**: âœ… completo
- **Preload**: âœ… corregido (ipcRenderer importado)
- **Dependencias**: âœ… corregidas (better-sqlite3, @fastify/cors)
- **Renderer React**: âœ… estructura base con 4 componentes
- **launchRoblox()**: âœ… implementado (ver formato de URL abajo)
- **Import/Export**: âœ… implementado con soporte para cookies (JSON)
- **Multi-Roblox**: ✅ implementado con detección de Windows, perfiles temporales y manejo de mutex.
- **API endpoints**: ✅ completamente implementados (ver lista abajo)

### Endpoints API REST implementados
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check (sin auth) |
| GET | `/api/v1/GetAccounts` | Lista completa de cuentas |
| GET | `/api/v1/LaunchAccount?accountId=X&placeId=Y&jobId=Z` | Lanzar cuenta a juego |
| GET | `/api/v1/ImportCookie?cookie=X` | Importar cuenta por cookie |
| GET | `/api/v1/SetServer?accountId=X&placeId=Y&jobId=Z` | Unirse a servidor específico |
| GET | `/api/v1/FollowUser?accountId=X&userId=Y` | Seguir usuario a su juego |
| GET | `/api/v1/GetCookie/:accountId` | ⚠️ Bloqueado por seguridad |
| GET | `/api/v1/GetCSRFToken/:accountId` | Obtener CSRF token de cuenta |
| GET | `/api/v1/GetField/:accountId/:field` | Obtener campo de cuenta |
| GET | `/api/v1/SetField/:accountId/:field?value=X` | Establecer campo de cuenta |
| GET | `/api/v1/GetSettings` | Obtener configuración |
| GET | `/api/v1/SetSettings?multiRoblox=true/false` | Cambiar configuración |
| GET | `/api/v1/DeleteAccount/:accountId` | Eliminar cuenta |
| POST | `/api/v1/accounts/add` | Agregar cuenta (compatibilidad) |

**Auth**: Todos los endpoints (excepto `/health`) requieren header `Authorization: Bearer <API_KEY>`

### Formato de URL usado para launchRoblox()
`roblox-player:1+launchmode:play+gameinfo:<authTicket>+placelauncherurl:https://assetgame.roblox.com/game/placelauncher.ashx?request=RequestGame&placeId=<placeId>&isPlayTogetherGame=false[&gameId=<jobId>]`

### Formato de archivo Import/Export
```json
{
  "version": "1.0",
  "app": "NexoAccManager",
  "exportDate": "2024-01-01T00:00:00.000Z",
  "accounts": [
    {
      "cookie": "_|WARNING:-DO-NOT-SHARE|_...",
      "username": "User123",
      "robloxUserId": 123456,
      "displayName": "User Display",
      "group": "Grupo1",
      "description": "Notas",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsed": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```
**Nota**: El archivo exportado contiene cookies en texto plano. GuÃ¡rdalo en lugar seguro.

## Commits realizados
- 9a1138b — Estructura inicial: backend Electron + crypto + DB + API REST
- 1695243 — fix: importar ipcRenderer y contextBridge desde electron en preload
- 7d2ae79 — deps: agregar better-sqlite3 y @fastify/cors, eliminar sqlite3 obsoleto
- b95b247 — feat: crear renderer React con estructura base y componentes UI
- ac4c3b8 — fix: usar @fastify/cors en lugar de fastify-cors (deprecado)

## Decisiones técnicas importantes
- Cifrado NO portable entre PCs — intencional por seguridad (igual que RAM original)
- API REST en puerto 8080 con auth Bearer token
- cookie en Account.ts es opcional — nunca se expone públicamente
- Multi-Roblox requiere modificar mutex de Roblox en Windows

## Lo que NO cambiar sin aprobación de Sebastián
- Algoritmo de cifrado en CryptoService.ts
- Estructura de tablas SQLite
- Puerto de la API REST (8080)

## Repositorio
https://github.com/Nxxo31/NexoAccManager

## Referencia
https://github.com/ic3w0lf22/Roblox-Account-Manager
https://ic3w0lf22.gitbook.io/roblox-account-manager/