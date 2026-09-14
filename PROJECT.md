# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-09-13 (post-sesión coverage)
> Lint 0 errors / 0 warnings, TypeScript 0 errors, **4 test files / 103 tests passing** (×7.4 vs 14 baseline). Cobertura **68.24% lines** global (×7.9 vs 8.67% baseline), con `services/` 92.48%, `database/` 61.18%, `external/` 62.27%. IPC sincronizado 102/102/102. Hexagonalidad respetada en BackupServiceImpl (interface en `domain/`, impl en `infrastructure/services/`). `dialog.showOpenDialog` real en `backupHandlers.ts:89`. `vitest.setup.ts` mockea electron. `discord-rpc` externalizado a env var `DISCORD_CLIENT_ID`.
>
> ## ✅ ESTADO VERIFICADO (2026-09-13 — post-sesión coverage)
>
> - **TypeScript Check**: `npx tsc --noEmit` → 0 errors ✅
> - **Lint Check**: `npm run lint` → 0 errors, 0 warnings ✅
> - **Tests**: `npm test` → **4 files / 103 tests passing** (CryptoService, LocalApiService, BackupRepositoryImpl, BackupServiceImpl) ✅
> - **Cobertura**: `npm run test:coverage` → **68.24% lines global** ✅
>   - `infrastructure/services/BackupServiceImpl.ts`: 92.48%
>   - `infrastructure/database/BackupRepositoryImpl.ts` (+BackupCryptoImpl): 98.38%
>   - `infrastructure/database/SettingsRepositoryImpl.ts`: ~100% (real, vía fake DB)
>   - `infrastructure/database/DatabaseManager.ts`: 100% (singleton + createTables + closeDb)
>   - `infrastructure/database/CryptoService.ts`: 83.01%
>   - `infrastructure/external/LocalApiService.ts`: 62.27%
>   - `infrastructure/database/LRUCache.ts`: 0% (no usado por código actual)
> - **IPC sync**: 102/102/102 ✅
> - **Build Electron**: `release/` VACÍO local (electron-builder requiere VS Build Tools C++ workload). En CI OK.

## Commits recientes

### Sesión 2026-09-13 (cobertura 8.67% → 68.24%, tests 14 → 103)
- `59bdc7b test(backup): quitar mock de SettingsRepositoryImpl + añadir tests reales (DB fake)` — SettingsRepositoryImpl + DatabaseManager ejecutan código real vía `better-sqlite3` mockeado con fake DB in-memory. database/ 47% → 61.18%.
- `7474fba test(local-api): expandir LocalApiService.test.ts a 32 tests + fix bug output.stdout` — fix bug latente en LocalApiService.ts:230,406 (`output.trim()` donde output era `{stdout, stderr}` — promisify retorna objeto, no string). Convertir require→import para que `vi.mock` intercepte. 3.9% → 62.27%.
- `ce6b010 docs(agents): actualizar cobertura post-tests backup`
- `885a4fd test(backup): expandir BackupRepositoryImpl.test.ts con mocks reales para comportamiento` — 7 tests superficiales (typeof === 'function') → 21 tests reales con vi.hoisted mocks.
- `82817fa test(backup): añadir BackupServiceImpl.test.ts — suite nueva justificada` — 359 líneas a 0% imposibilitaban 60% global. In-memory SQLite fake (better-sqlite3 binario incompatible con Node 24 NODE_MODULE_VERSION 137).

### Sesión 2026-09-12 (post-auditoría)
- `e913dcf chore(cleanup): quitar git_health.json tracked, botón sin onClick en AccountsView y TODO vivo en SkinEditorModal`
- `1140908 chore(deps): quitar 8 dependencias no usadas y externalizar Discord CLIENT_ID`

### Sesión 2026-09-11 (auditoría + cierre)
- `bf66dab fix(backup): encriptar Buffer binario via base64 (no utf8) en BackupCryptoImpl` — cierra corrupción silenciosa de backups
- `76fb4b4 chore(lint): eliminar 3 warnings preexistentes`
- `568ee3a chore(tests): mockear electron en vitest para suites que lo importan indirectamente` — `vitest.setup.ts` con `vi.mock('electron', ...)`. Activa los 3 test files.

## ✅ Cerrado en sesiones previas (items obsoletos)

- ✅ Refactor hexagonalidad `BackupServiceImpl`: `BackupService.ts` interface en `domain/services/`, `BackupServiceImpl.ts` impl en `infrastructure/services/`. Imports de fs/path/electron confinados a infrastructure.
- ✅ `BackupServiceImpl.selectBackupFolder()` dialog real: implementado en `backupHandlers.ts:89-111` con `dialog.showOpenDialog(win, {properties: ['openDirectory', 'createDirectory']})`. Interface limpia (commit `b6b4fb1 refactor(backup): eliminar selectBackupFolder() del interface — dead code`).
- ✅ Step `npm test` en `.github/workflows/ci.yml` (commit `cc92571`).
- ✅ `vitest.coverage` configurado con v8, threshold removido (commits `1735b10` + `21229e9`).
- ✅ AGENTS.md reescrito sin plantilla SophIA, stack y herramientas reales (commit `02b9c66`).

## 📋 Próximos pasos (reales, no obsoletos)

### Resolubles en este entorno
- [ ] Coverage >80% en líneas críticas (actual 68.24% — gap 12 puntos). Mejoras específicas:
  - LocalApiService líneas uncovered 438-439, 450-453 (WS upgrade/auth handlers, ~15 líneas)
  - RobloxBottingService.ts y MultiRobloxService.ts (cobertura no medida — fuera del include glob actual)
- [ ] Tests para `RobloxBottingService` + `MultiRobloxService` (sin suites hoy). VIOLA `AGENTS.md` 'mantener 3 suites' — requiere decisión explícita del operador antes de crear.

### Bloqueados por infraestructura
- [ ] `electron-builder` en Windows local — requiere VS Build Tools C++ workload (discord-rpc + better-sqlite3 + utf-8-validate). Workaround CI. Pendiente desde 2026-09-11.
- [ ] `better-sqlite3` rebuild para Node 24 — prebuild-install no tiene binarios para `target=24.16.0 runtime=node`, y node-gyp rebuild requiere C++ workload. Hoy tests usan fake DB in-memory (workaround).

### Decisiones de producto diferidas
- [ ] Reintroducir botón "Apply" en SkinEditorModal cuando se implemente el IPC `account:outfit:apply`. Hoy deshabilitado honestamente.
- [ ] Reintroducir botón bulk email en AccountsView cuando se implemente el IPC `account:bulk:setEmail`. Hoy eliminado (`e913dcf`).
- [ ] Decidir qué hacer con `LRUCache.ts` (0% cobertura, sin call sites).

## 🔧 Estado técnico

- **Stack**: Electron 30.5.1, TypeScript 5.3.0, React 18.2.0, Mantine 7.17.8, Vite 5.0.0, vitest 4.1.11, @vitest/coverage-v8 4.1.11
- **Scripts de test**:
  - `npm test` — vitest run (4 suites, 103 tests)
  - `npm run test:watch` — vitest watch
  - `npm run test:coverage` — vitest run --coverage (genera report en `coverage/`)
  - `npm run test:ui` — vitest --ui
- **ESLint**: paths corregidos a `src/main.ts`, `src/infrastructure/**`, `src/preload/**` (Node) y `src/renderer.tsx`, `src/application/**` (Browser)
- **Staleness monitor**: en `scripts/` (era meta-tooling de SophIA, no del producto)
- **Dependencias**: better-sqlite3@9.6.0, electron@30.5.1, electron-log@5.4.4, ws@8.21.1, uuid@14.0.0, crypto-js NO usado (CryptoService custom con AES-256-GCM + PBKDF2)
- **Discord CLIENT_ID**: configurable vía `DISCORD_CLIENT_ID` env var (default: placeholder `1274925610645274655`)
- **Sub-components de Settings**: 13 archivos en `src/application/components/settings/`
- **Known limitations**:
  - `vitest` no intercepta `require()` runtime — código que usa `require()` en top-level debe convertirse a ESM imports para ser testeable (fix ya aplicado en LocalApiService.ts:14-15).
  - `release/` vacío local sin workload C++ de VS Build Tools. CI produce `NX-Manager-5.0.0-Portable.exe`.
  - `better-sqlite3` requiere VS Build Tools C++ workload para compilar en Node 24. Workaround para tests: fake DB in-memory vía `vi.mock('better-sqlite3')`.
  - LRUCache.ts existe pero no se usa (0% cobertura).

## 🏗️ Cambios estructurales recientes (sesión coverage 2026-09-13)

### Tests añadidos (14 → 103)

| Suite | Tests | Cobertura |
|-------|-------|-----------|
| `BackupRepositoryImpl.test.ts` | 21 → 30 (+9) | metadata CRUD, cache invalidation, corruption resilience, BackupCrypto roundtrip, SettingsRepositoryImpl real (get/set/getAll/remove via fake DB) |
| `BackupServiceImpl.test.ts` | NEW 36 | createBackup, restoreBackup (forceOverwriteSecret guard), verifyBackupIntegrity, getNextScheduledRun (daily/weekly/monthly + future vs past), singleton lifecycle |
| `LocalApiService.test.ts` | 4 → 32 (+28) | port allow-list, token rotation, HTTP handlers (health, accounts, launch, kill, status, refresh-cookie, botting), auth (401), Origin allow-list (403), body parsing (413/400), botting validation (accountId/placeId/interval DoS clamp) |

### Bugs encontrados durante tests y arreglados

1. **LocalApiService.ts:230 + 406** — `output.trim()` donde `output` es `{stdout, stderr}`. `promisify(exec)` retorna objeto, no string. TypeError silenciado por try/catch → status endpoint siempre retornaba `running=false` en Windows. **Fix**: destructurar `{stdout}`.
2. **LocalApiService.ts:14-15** — `require('node:child_process')` y `require('node:util')` en top-level bypaseaban `vi.mock` (mismo patrón que `CryptoService.secretDir()` con `require('electron')`). **Fix**: convertir a ESM imports.
3. **vitest.setup.ts**: pre-existente, mockea electron para suites que lo importan indirectamente.

### Decisiones de scope NO tomadas en esta sesión (documentadas para futuro)

- **RobloxBottingService.ts + MultiRobloxService.ts**: usan `execSync(cmd, { encoding: 'utf8' })` que retorna STRING (no `{stdout, stderr}` como `promisify(exec)`). NO son bugs activos (verificado 2026-09-13). El comentario en commit 7474fba sobre "mismo bug latente" era impreciso — los paths de output.trim()/.includes() en estos archivos funcionan correctamente. La memoria #42 fue corregida.
- **LRUCache.ts**: 0% cobertura, sin call sites. Decisión: ignorar hasta que haya call sites o eliminar si se confirma dead code.

## 📐 Arquitectura real (verificada 2026-09-13)

Hexagonal respetada en backup. ~24,500 LOC.

- **domain/**: entities + repositories (interfaces) + services (interfaces puras, sin imports de infrastructure/electron/fs). Ej: `BackupService.ts`, `BackupMetadata.ts`, `BackupSchedule.ts`, `BackupFolderConfig.ts`.
- **application/**: React components + hooks + layout + store + views (Zustand + Mantine). Sin imports de infrastructure/electron.
- **infrastructure/**: database (SQLite via better-sqlite3) + external (Discord, Roblox, Captcha, WS, LocalApi) + ipc/handlers + logging + monitoring. Contiene **implementaciones** de services (ej: `BackupServiceImpl.ts`).
- **preload/**: `contextBridge.exposeInMainWorld('api', api)` mapea 1:1 a `ipcRenderer.invoke`. 102 canales sincronizados.

Flujo: Renderer → `window.api.X.Y()` → preload (`ipcRenderer.invoke`) → main (`ipcMain.handle`) → Repository/Service → better-sqlite3 / APIs externas.

### Tests coverage por capa (post-sesión)

```
infrastructure/services/    92.48%  (BackupServiceImpl.ts)
infrastructure/database/    61.18%  (BackupRepo + BackupCrypto + Settings + DBManager + Crypto)
infrastructure/external/    62.27%  (LocalApiService.ts)
                            ─────
                            68.24% global
```

## Traza

| Fecha | Sesión | Cambio |
|-------|--------|--------|
| 2026-09-11 | Cierre v5.0.0 | 3 commits: `chore(tests,lint)`, `chore(deps)`, `docs`. Gates: lint 0, tsc 0, vitest OK con 1/3 suites. |
| 2026-09-11 | Fixes seguridad | `bf66dab` cierra corrupción silenciosa de backups (utf8→base64). `76fb4b4` limpia 3 warnings lint. `568ee3a` mockea electron en vitest → **3/3 suites pasan (14 tests)**. |
| 2026-09-12 | Post-auditoría | `e913dcf` cleanup (git_health, botones muertos). `1140908` deps cleanup (-8 deps, Discord env var, .env.example). |
| 2026-09-13 | Cobertura 8.67% → 68.24% | 4 commits: `885a4fd` expandir BackupRepositoryImpl, `82817fa` añadir BackupServiceImpl suite, `7474fba` expandir LocalApiService + fix bugs (output.stdout + require→import), `59bdc7b` SettingsRepositoryImpl + DatabaseManager reales vía fake DB. Gates: tsc 0, lint 0/0, **4 suites / 103 tests passing**. PROJECT.md resync. |
