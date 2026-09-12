# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-09-12 (post-auditoría)
> Lint 0 errors, TypeScript 0 errors, **3 test files / 14 tests passing**. IPC totalmente sincronizado (102/102/102). 8 dependencias muertas removidas. `git_health.json` ya no está tracked. Discord CLIENT_ID externalizado a env. `.env.example` creado.
>
> ## ✅ ESTADO VERIFICADO (2026-09-12 — post-auditoría)
>
> - **TypeScript Check**: `npx tsc --noEmit` → 0 errors ✅
> - **Lint Check**: `npm run lint` → 0 errors ✅
> - **Tests**: `npm test` → 3 files / 14 tests passing (CryptoService, LocalApiService, BackupRepositoryImpl) ✅
> - **IPC sync**: `ipcMain.handle` (102) = `ipcRenderer.invoke` (102) = `window.api.*` (expuesto vía `contextBridge.exposeInMainWorld('api', api)`) ✅
> - **Build Electron**: `release/` VACÍO en este entorno (electron-builder requiere node-gyp sin C++ workload). En CI con VS Build Tools produce `NX-Manager-5.0.0-Portable.exe`.
>
> ## Commits recientes
>
> - `bf66dab fix(backup): encriptar Buffer binario via base64 (no utf8) en BackupCryptoImpl` — cierra corrupción silenciosa de backups
> - `76fb4b4 chore(lint): eliminar 3 warnings preexistentes`
> - `568ee3a chore(tests): mockear electron en vitest para suites que lo importan indirectamente` — `vitest.setup.ts` con `vi.mock('electron', ...)`. Activa los 3 test files.
> - `e913dcf chore(cleanup): quitar git_health.json tracked, botón sin onClick en AccountsView y TODO vivo en SkinEditorModal`
> - `1140908 chore(deps): quitar 8 dependencias no usadas y externalizar Discord CLIENT_ID`
>
> ## 📋 Próximos pasos
>
> - [ ] Resolver `electron-builder` en Windows (mover `discord-rpc` a dep opcional o quitar `register-scheme` que requiere node-gyp)
> - [ ] Implementar `BackupServiceImpl.selectBackupFolder()` con `dialog.showOpenDialog` real (actualmente stub que devuelve la carpeta actual)
> - [ ] Refactor hexagonalidad: `BackupServiceImpl.ts` (domain) importa `getDb`, `BackupRepositoryImpl`, `encrypt/decrypt`, `app` de electron — viola la capa. Mover dependencias de infrastructure a un puerto (interface) en domain.
> - [ ] Añadir step `npm test` a `.github/workflows/ci.yml`
> - [ ] Cuando se implemente el IPC `account:outfit:apply`, reintroducir el botón Apply en SkinEditorModal (ahora deshabilitado honestamente)
> - [ ] Cuando se implemente el IPC `account:bulk:setEmail`, reintroducir el botón en AccountsView
> - [ ] Revisar cobertura de tests (target >80% en líneas críticas) — `npm run test:coverage`
>
> ## 🔧 Estado técnico
>
> - Stack: Electron 30.5.1, TypeScript 5.3.0, React 18.2.0, Mantine 7.17.8, Vite 5.0.0
> - Scripts de test: `npm test` (vitest run), `npm run test:watch`, `npm run test:coverage`, `npm run test:ui`
> - ESLint: paths corregidos a `src/main.ts`, `src/infrastructure/**`, `src/preload/**` (Node) y `src/renderer.tsx`, `src/application/**` (Browser)
> - Staleness monitor: movido de `src/infrastructure/` a `scripts/` (era meta-tooling de SophIA, no del producto)
> - Dependencias actualizadas: better-sqlite3@9.6.0, electron@30.5.1
> - Discord CLIENT_ID: configurable vía `DISCORD_CLIENT_ID` env var (default: placeholder `1274925610645274655`)
> - Sub-components de Settings: 13 archivos en `src/application/components/settings/`
> - Known limitations:
>   - Tests de integración requieren entorno Electron completo (electron-rebuild tras cambios en deps nativas)
>   - `BackupServiceImpl.selectBackupFolder()` es stub; el dialog vive en `backupHandlers.ts:89`
>   - `release/` vacío en este entorno sin workload C++ de VS Build Tools
>   - `BackupServiceImpl` viola hexagonalidad (imports de infrastructure/electron desde domain) — refactor pendiente
> - Notas:
>   - Feature Set 6.0 incluye: backup encriptado, programación automática, verificación de integridad
>   - Los backups incluyen el archivo `.nam-secret` cuando se activa la opción
>   - El monitor de cookies ahora actualiza cada 24h si es necesario
>   - IPC completamente sincronizado entre preload, main y renderer (102/102/102)
>
> ## 🗑️ Cambios estructurales recientes (post-auditoría 2026-09-12)
>
> ### Dependencias removidas (verificado grep en `src/`):
>
> | Dependencia | Tipo | Razón |
> |-------------|------|-------|
> | `node-forge` | runtime | Sin uso |
> | `electron-store` | runtime | Sin uso (se usa `SettingsRepositoryImpl` propio) |
> | `@mantine/form` | runtime | Sin uso (formularios con state local) |
> | `@radix-ui/react-dialog` | dev | Sin uso (Mantine Modal) |
> | `class-variance-authority` | dev | Sin uso |
> | `tailwind-merge` | dev | Sin uso |
> | `@tailwindcss/postcss` | dev | Sin uso (postcss.config usa tailwindcss directo) |
> | `react-beautiful-dnd` + `@types/react-beautiful-dnd` | dev | Sin uso + tiene advisory de seguridad upstream |
>
> ### Botones muertos quitados:
>
> - `AccountsView.tsx:289` — botón "setBulkEmail" sin onClick (placeholder muerto). Eliminado.
> - `SkinEditorModal.tsx` — botón "Apply" con `setTimeout(1000) + nada` (TODO vivo). Reemplazado por input disabled + alert prominente.
>
> ### Limpieza:
>
> - `git_health.json` removido del index (estaba tracked antes de .gitignore)
> - Import dead `Mail` de lucide-react removido tras quitar el botón
>
> ## 📐 Arquitectura real
>
> Hexagonal con gap en `BackupServiceImpl`. ~24,500 LOC.
>
> - **domain/**: entities + repositories (interfaces) + services (implementations parcialmente hexagonales)
> - **application/**: components + hooks + layout + store + views (React + Zustand + Mantine)
> - **infrastructure/**: database (SQLite via better-sqlite3) + external (Discord, captcha, etc.) + ipc/handlers + logging + monitoring
> - **preload/**: contextBridge expone `window.api.*` mapeado 1:1 a `ipcRenderer.invoke`
>
> Flujo: Renderer → `window.api.X.Y()` → preload (`ipcRenderer.invoke`) → main (`ipcMain.handle`) → Repository/Service → better-sqlite3 / APIs externas.
>
> ## Traza
>
> | Fecha | Sesión | Cambio |
> |-------|--------|--------|
> | 2026-09-11 | Cierre v5.0.0 | 3 commits: `chore(tests,lint)`, `chore(deps)`, `docs`. Gates: lint 0, tsc 0, vitest OK con 1/3 suites. |
> | 2026-09-11 | Fixes seguridad | `bf66dab` cierra corrupción silenciosa de backups (utf8→base64). `76fb4b4` limpia 3 warnings lint. `568ee3a` mockea electron en vitest → **3/3 suites pasan (14 tests)**. |
> | 2026-09-12 | Post-auditoría | `e913dcf` cleanup (git_health, botones muertos). `1140908` deps cleanup (-8 deps, Discord env var, .env.example). Pendientes: refactor hexagonalidad BackupServiceImpl, electron-builder en Windows, dialog real en selectBackupFolder. |
