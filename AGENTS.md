# AGENTS.md — NexoAccManager

> **Versión:** 5.0.0 | **Última actualización:** 2026-10-05 (post-sesión cobertura 74.40%)
> Proyecto: Electron + TypeScript app de gestión de cuentas Roblox.

## Stack real

- **Electron** 30.5.1 (main + preload + renderer)
- **TypeScript** 5.3.0 (strict)
- **React** 18.2.0 + **Mantine** 7.17.8 + **Zustand** 5.0.14 + **framer-motion** 11 (renderer)
- **better-sqlite3** 9.6.0 (DB local)
- **Vite** 5.0.0 (build renderer)
- **electron-builder** 24 (empaquetado Windows portable + Linux AppImage)
- **discord-rpc** 4.0.1 — Rich Presence (ahora `optionalDependencies`, ver §Limitaciones)
- **register-scheme** 0.0.2 — `optionalDependencies` (registrar protocolo custom URI)
- **ws** 8.21.1 — servidor WebSocket en LocalApiService
- **axios** 1.6.0 — HTTP client para Roblox APIs
- **electron-log** 5.4.4 — logging
- **uuid** 14.0.0 — IDs
- **vitest** 4.1.11 + **@vitest/coverage-v8** 4.1.11
- **lucide-react** — iconos UI
- **@mantine/modals**, **@mantine/notifications**, **@mantine/hooks** — UX

## Arquitectura hexagonal

- **domain/** — entities (Account, BackupMetadata, FavoriteGame, RecentGame, FastFlag, GameData, LaunchPreset, PlaytimeEntry, PresenceData, ServerInfo) + repositories (interfaces puras en `RepositoryInterfaces.ts` + `RobloxApiPort.ts`) + services (interfaces puras). **Sin imports de infrastructure/electron/fs**.
- **application/** — React components + hooks + layout + store + views (Zustand + Mantine + framer-motion). Sin imports de infrastructure/electron.
- **infrastructure/** — `database/` (SQLite via better-sqlite3 + CryptoService + LRUCache) + `external/` (24 servicios: Discord RPC, Roblox auth/botting/cookie/games/presence/http/logs/settings, LocalApi, Captcha, LaunchPreset, Playtime, ContentMod, FastFlags, Theme, CacheCleaner, ControlWS, MultiRoblox) + `ipc/handlers/` (5 archivos, 102 canales) + `services/` (BackupServiceImpl) + `logging/` + `monitoring/`.
- **preload/** — `contextBridge.exposeInMainWorld('api', api)` expone 102 canales en `window.api.*`. Mapea 1:1 con `ipcRenderer.invoke` y, en el main, con `ipcMain.handle`.

Flujo: Renderer → `window.api.X.Y()` → preload → main (`ipcMain.handle`) → Repository/Service → SQLite / APIs externas.

### Capas de seguridad

- **Renderer**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, CSP `default-src 'self'`.
- **Cookies Roblox**: NUNCA viajan descifradas al renderer. Los handlers `byAccount.*` (54 métodos) las resuelven server-side. Los handlers legacy que recibían cookie cruda (`gamesSearch`, `serversList`, `multiLaunch`, `joinGroup`, `outfits`, `universes`) fueron ELIMINADOS — audit F-002.
- **Cuentas Roblox**: el renderer solo ve versiones cifradas (`EncryptedString` branded type en `domain/types/EncryptedString.ts`). La desencripción ocurre exclusivamente en el main.
- **CryptoService**: AES-256-GCM + PBKDF2 100k iteraciones. Secret en disco con permisos 0o600. Sin key pública por defecto.

## Reglas del proyecto

- **NO** commits a `main` sin pasar gates: `npm run lint` 0 errors, `npx tsc --noEmit` 0 errors, `npm test` todo verde.
- **NO** crear `*.test.ts` nuevos sin necesidad crítica (DoD: código REAL funcionando > tests). Mantener **5 suites**: `CryptoService`, `LocalApiService`, `BackupRepositoryImpl`, `BackupServiceImpl`, `LRUCache`. Suite nueva requiere justificación basada en call sites reales, no cobertura "porque sí".
- **NO** commitear secrets (.env, .env.local, NAM_SECRET, DISCORD_CLIENT_ID — usar env vars).
- **NO** hardcodear tenant IDs / user IDs / Roblox IDs en código.
- **NO** reintroducir UI con handlers muertos (botones sin `onClick`, modales sin IPC destino). Si el handler no existe, la UI tampoco.
- **SÍ** commits atómicos en español (scope único).
- **SÍ** `npx tsc --noEmit` como verificación rápida en CI (no `tsc --noEmit` directo que cambia config).
- **SÍ** atomic writes para archivos críticos (backup-metadata.json, .nam-secret).
- **SÍ** mantener `PROJECT.md` actualizado cuando se cierra un pendiente o cambia R-XX.

## Herramientas del agente (sustituyen SophIA)

| Tarea | Herramienta instalada | NO usar |
|---|---|---|
| Estructura de archivo | `search_files` / `read_file` | cat, head |
| Type check | `npx tsc --noEmit` | tsc --noEmit con flags custom |
| Editar código | `patch` / `write_file` | sed, patch manual |
| Buscar cross-repo | `search_files` | rg |
| Memory persistente | `dark-memory` MCP (57 tools) | re-leer archivos |
| Investigación web | `web_search` / `web_extract` | curl |
| GitHub | `gh` CLI (no instalado) | - |
| Build / lint / test | `terminal` con `npm run ...` | - |

## Comandos frecuentes

```bash
# Verificación rápida (gates)
npx tsc --noEmit && npm run lint && npm test

# Build
npm run build         # tsc + vite build + electron-builder (falla sin C++ workload en este entorno)
npm run electron:dev  # Vite + Electron en dev

# Tests
npm test                    # vitest run — 5 suites, 126 tests
npm run test:watch          # vitest watch
npm run test:coverage       # vitest run --coverage (74.40% lines)
npm run test:ui             # vitest --ui
```

## Variables de entorno (.env)

| Var | Requerida | Default | Notas |
|---|---|---|---|
| `NAM_SECRET` | no | (generada y persistida en `.nam-secret` con 0o600) | Clave AES-256 |
| `NAM_DATA_DIR` | no | `%APPDATA%/NexoAccManager` | Override directorio de datos |
| `DISCORD_CLIENT_ID` | no | `1274925610645274655` (placeholder) | Discord Rich Presence |
| `BROWSER_ONLY` | no | 0 | Si 1, corre solo Vite (sin Electron) |

## Estado actual (2026-10-05)

- Lint: 0 errors, 0 warnings ✅
- tsc: 0 errors ✅
- Tests: **5 files / 126 tests passing** ✅ (era 4/103 en 2026-09-13)
- IPC sync: 102/102/102 ✅
- Build Electron: `release/` vacío local (requiere VS Build Tools C++ workload). En CI OK.
- Cobertura global: **74.40% lines** (era 68.24% en 2026-09-13). Por archivo:
  - `infrastructure/services/BackupServiceImpl.ts`: **96.99%** ✅
  - `infrastructure/database/BackupRepositoryImpl.ts` (+BackupCryptoImpl): **98.38%** ✅
  - `infrastructure/database/SettingsRepositoryImpl.ts`: ~100% (ejecutado vía fake DB)
  - `infrastructure/database/DatabaseManager.ts`: **100%** (singleton getDb + createTables + closeDb)
  - `infrastructure/database/CryptoService.ts`: ~100% ✅
  - `infrastructure/database/LRUCache.ts`: **100% lines**, 91.66% branch ✅
  - `infrastructure/external/LocalApiService.ts`: **64.41%** ✅
  - `infrastructure/database/AccountRepositoryImpl.ts`: **0%** — pendiente suite AccountRepository

## Pendientes estructurales

- `[ ]` **`electron-builder` Windows release local** requiere VS Build Tools C++ workload (discord-rpc + better-sqlite3 + utf-8-validate). Workaround CI. Pendiente desde 2026-09-11. Mitigación parcial: `discord-rpc` y `register-scheme` movidos a `optionalDependencies` (commit `ef1606f`) para que la install no aborte sin el workload.
- `[ ]` **`better-sqlite3` rebuild para Node 24** — prebuild-install no tiene binarios para `target=24.16.0 runtime=node`, y node-gyp rebuild requiere C++ workload. Hoy tests usan fake DB in-memory vía `vi.mock('better-sqlite3')` (workaround activo).
- `[ ]` **`AccountRepositoryImpl.ts`** sigue en 0% cobertura. Necesita suite propia (sería la 6ª) — bloqueado por regla de 5 suites. Pendiente decisión.
- `[ ]` **IPC `account:outfit:apply`** pendiente. Hoy `SkinEditorModal` tiene el botón deshabilitado honestamente.
- `[ ]` **IPC `account:bulk:setEmail`** pendiente. El botón bulk email en `AccountsView` fue eliminado en `e913dcf`.
- `[ ]` **`RobloxBottingService.ts` + `MultiRobloxService.ts`** sin suite. Verificado 2026-09-13 que NO tienen el bug latente `output.trim()`/`{stdout}` que sí tenía LocalApiService.

## Out-of-scope

- **No** tests E2E con Playwright (no instalado, no crítico para MVP).
- **No** documentación JSDoc exhaustiva — comentarios sólo donde la lógica no es obvia.
- **No** internacionalización (i18n) más allá de los strings que ya están en `config/i18n.ts`.

## Definition of Done

Un entregable está Done si:

1. `npx tsc --noEmit` → 0 errors
2. `npm run lint` → 0 errors
3. `npm test` → todo verde (5 suites, 126 tests)
4. `git status --porcelain` limpio
5. `PROJECT.md` actualizado si cambia R-XX, cobertura, suites, o se cierra pendiente
6. `AGENTS.md` actualizado si cambia regla estructural (suites permitidas, gates, etc.)

El DoD es un ESTADO observable. Si no puedes demostrarlo con un comando, no está Done.
