# AGENTS.md — NexoAccManager

> **Versión:** 5.0.0 | **Última actualización:** 2026-09-13
> Proyecto: Electron + TypeScript app de gestión de cuentas Roblox.

## Stack real

- **Electron** 30.5.1 (main + preload + renderer)
- **TypeScript** 5.3.0 (strict)
- **React** 18.2.0 + **Mantine** 7.17.8 + **Zustand** 5.0.14 (renderer)
- **better-sqlite3** 9.6.0 (DB local)
- **Vite** 5.0.0 (build renderer)
- **electron-builder** 24 (empaquetado Windows portable + Linux AppImage)
- **discord-rpc** 4.0.1 (Rich Presence)
- **vitest** 4.1.11 + **@vitest/coverage-v8**

## Arquitectura hexagonal

- **domain/** — entities (Account, BackupMetadata, ...) + repositories (interfaces) + services (interfaces puras). Sin imports de infrastructure/electron/fs.
- **application/** — React components, hooks, layout, store, views. Sin imports de infrastructure/electron.
- **infrastructure/** — database (SQLite via better-sqlite3) + external (Discord, Roblox, Captcha, WS, LocalApi) + ipc/handlers + logging + monitoring.
- **preload/** — `contextBridge.exposeInMainWorld('api', api)` mapea 1:1 a `ipcRenderer.invoke`. 102 canales sincronizados (ipcMain.handle = ipcRenderer.invoke = window.api.*).

Flujo: Renderer → `window.api.X.Y()` → preload → main → Repository/Service → SQLite / APIs externas.

## Reglas del proyecto

- **NO** commits a `main` sin pasar gates: lint 0 errors, tsc 0 errors, tests 14+ passing.
- **NO** crear `*.test.ts` nuevos sin necesidad crítica (DoD: código REAL funcionando > tests). Mantener 3 suites: CryptoService, LocalApiService, BackupRepositoryImpl.
- **NO** commitear secrets (.env, .env.local, NAM_SECRET, DISCORD_CLIENT_ID — usar env vars).
- **NO** usar `tsc --noEmit` directo si `agent-lsp` está disponible — preferir `agent-lsp_get_diagnostics`.
- **NO** hardcodear tenant IDs / user IDs / Roblox IDs en código.
- **SÍ** commits atómicos en español (scope único).
- **SÍ** `npx tsc --noEmit` como verificación rápida en CI (no `tsc --noEmit` directo que cambia config).
- **SÍ** atomic writes para archivos críticos (backup-metadata.json, .nam-secret).

## Herramientas del agente (sustituyen SophIA)

| Tarea | Herramienta instalada | NO usar |
|---|---|---|
| Estructura de archivo | `agent-lsp_list_symbols` / `find_symbol` | cat, head |
| Definición / usos | `agent-lsp_go_to_definition` / `find_references` | grep -rn |
| Type check | `agent-lsp_get_diagnostics` o `npx tsc --noEmit` | tsc --noEmit con flags custom |
| Editar código | Edit / Write tools | sed, patch manual |
| Buscar cross-repo | Grep / Glob | rg |
| Memory persistente | `dark-memory` MCP (57 tools) | re-leer archivos |
| Investigación web | `dark-research` MCP | curl |
| GitHub | `github` MCP (si funciona) o fallback inline | gh CLI (no instalado) |
| Build / lint / test | Bash (npm run ...) | - |

## Comandos frecuentes

```bash
# Verificación rápida (gates)
npx tsc --noEmit && npm run lint && npm test

# Build
npm run build         # tsc + vite build + electron-builder (falla sin C++ workload en este entorno)
npm run electron:dev  # Vite + Electron en dev

# Tests
npm test                    # vitest run
npm run test:watch          # vitest watch
npm run test:coverage       # vitest run --coverage (target 60% líneas críticas)
npm run test:ui             # vitest --ui
```

## Variables de entorno (.env)

| Var | Requerida | Default | Notas |
|---|---|---|---|
| `NAM_SECRET` | prod | (generada) | Clave AES-256 para `.nam-secret` |
| `NAM_DATA_DIR` | no | `%APPDATA%/NexoAccManager` | Override directorio de datos |
| `DISCORD_CLIENT_ID` | no | `1274925610645274655` (placeholder) | Discord Rich Presence |
| `BROWSER_ONLY` | no | 0 | Si 1, corre solo Vite (sin Electron) |

## Estado actual (2026-09-13)

- Lint: 0 errors, 0 warnings
- tsc: 0 errors
- Tests: 4 files, 103 tests passing (CryptoService, LocalApiService, BackupRepositoryImpl, BackupServiceImpl)
- IPC sync: 102/102/102 ✅
- Build Electron: `release/` vacío local (requiere VS Build Tools C++ workload). En CI OK.
- Cobertura: **68.24% global**. Por directorio:
  - `infrastructure/services/BackupServiceImpl.ts`: **92.48%** ✅ (target 60%)
  - `infrastructure/database/BackupRepositoryImpl.ts` (+BackupCryptoImpl): 98.38% ✅
  - `infrastructure/database/SettingsRepositoryImpl.ts`: ~100% (ejecutado vía fake DB)
  - `infrastructure/database/DatabaseManager.ts`: 100% (singleton getDb + createTables + closeDb)
  - `infrastructure/database/CryptoService.ts`: 83.01% ✅
  - `external/LocalApiService.ts`: **62.27%** ✅ (target 60%)
  - `infrastructure/database/LRUCache.ts`: 0% (no usado por el código actual)

## Pendientes estructurales

- `electron-builder` Windows release local requiere VS Build Tools C++ workload (discord-rpc + better-sqlite3 + utf-8-validate). Workaround CI.
- `selectBackupFolder()` removido del interface — era dead code (solo `getBackupFolder()` real + dialog en `backupHandlers.ts:89`).
- `electron-store` ya no está en asarUnpack (removido en `1140908`).
- `SkinEditorModal`: botón "Apply" deshabilitado honestamente hasta que `account:outfit:apply` IPC se implemente.
- `AccountsView.tsx`: botón "setBulkEmail" eliminado en `e913dcf`.

## Out-of-scope

- **No** tests E2E con Playwright (no instalado, no crítico para MVP).
- **No** documentación JSDoc exhaustiva — comentarios sólo donde la lógica no es obvia.
- **No** internacionalización (i18n) más allá de los strings que ya están en `config/i18n.ts`.

## Definition of Done

Un entregable está Done si:
1. `npx tsc --noEmit` → 0 errors
2. `npm run lint` → 0 errors
3. `npm test` → 14+ tests passing (no nuevas suites sin justificación)
4. `git status --porcelain` limpio
5. PROJECT.md actualizado si cambia R-XX o se cierra pendiente

El DoD es un ESTADO observable. Si no puedes demostrarlo con un comando, no está Done.
