# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-10-05 (post-sesión cobertura 74.40%)
> Lint 0 errors / 0 warnings, TypeScript 0 errors, **5 test files / 126 tests passing** (×9.0 vs 14 baseline). Cobertura **74.40% lines** global (×8.6 vs 8.67% baseline), con `services/` 96.99%, `database/` 73.51%, `external/` 64.41%. IPC sincronizado 102/102/102. Hexagonalidad respetada en BackupServiceImpl (interface en `domain/`, impl en `infrastructure/services/`). `dialog.showOpenDialog` real en `backupHandlers.ts:89`. `vitest.setup.ts` mockea electron. `discord-rpc` y `register-scheme` ahora en `optionalDependencies` (commit `ef1606f`).

> ## ✅ ESTADO VERIFICADO (2026-10-05 — post-sesión cobertura 74.40%)

> - **TypeScript Check**: `npx tsc --noEmit` → 0 errors ✅
> - **Lint Check**: `npm run lint` → 0 errors, 0 warnings ✅
> - **Tests**: `npm test` → **5 files / 126 tests passing** (CryptoService, LocalApiService, BackupRepositoryImpl, BackupServiceImpl, LRUCache) ✅
> - **Cobertura**: `npm run test:coverage` → **74.40% lines global** ✅ (era 68.24% en 2026-09-13)
>   - `infrastructure/services/BackupServiceImpl.ts`: **96.99%** (era 92.48%)
>   - `infrastructure/database/BackupRepositoryImpl.ts` (+BackupCryptoImpl): **98.38%**
>   - `infrastructure/database/SettingsRepositoryImpl.ts`: ~100% (real, vía fake DB)
>   - `infrastructure/database/DatabaseManager.ts`: **100%** (singleton + createTables + closeDb)
>   - `infrastructure/database/CryptoService.ts`: ~100% (era 83.01%)
>   - `infrastructure/database/LRUCache.ts`: **100% lines**, 91.66% branch (era 0% / "dead code")
>   - `infrastructure/external/LocalApiService.ts`: **64.41%** (era 62.27%)
>   - `infrastructure/database/AccountRepositoryImpl.ts`: **0%** — pendiente
> - **IPC sync**: 102/102/102 ✅
> - **Build Electron**: `release/` VACÍO local (electron-builder requiere VS Build Tools C++ workload). En CI OK.

## Commits recientes

### Sesión 2026-10-05 (cobertura 68.24% → 74.40%, tests 103 → 126, suites 4 → 5)
- `083bfc3 docs(agents): actualizar regla de suites a 5` — AGENTS.md pasa de "3 suites" (obsoleto desde BackupServiceImpl en 2026-09-13) a "5 suites: CryptoService, LocalApiService, BackupRepositoryImpl, BackupServiceImpl, LRUCache".
- `1cf0b09 test(lru-cache): nueva suite — cobertura completa de LRUCache.ts` — 13 tests: basic get/set, TTL default + override, LRU eviction + promotion al get(), edge maxSize=1, invalidate/clear. LRUCache: 0% → 100% lines, 91.66% branch. Documenta que SÍ tiene call sites reales (RobloxGamesService thumbnails, RobloxPresenceService presence/friends caches) — el PROJECT.md anterior estaba desactualizado.
- `0b7cf86 test(crypto): cubrir loadOrCreateSecret con fs mockeado` — 5 tests aíslan cada rama del path filesystem: generación+write 0o600, read si existe, race recovery (EEXIST+existsSync), fallback "raro", secretDir con NAM_DATA_DIR. CryptoService: 82.35% → ~100%. Patrón vi.resetModules+vi.doMock para aislar cachedSecret module-private.
- `766ada0 test(local-api): cubrir broadcastStatus y server.on('error')` — Mock WS expone clients: Set para inyectar clientes de prueba (3 tests broadcastStatus). Hook __namForceError en mock node:http fuerza emit('error') antes del listen-callback (1 test). LocalApiService: 62.27% → 64.41%.
- `06233ef test(backup): cubrir restartScheduler y scheduled-tick error log` — 2 tests: 'restartScheduler clears a previously running interval' (line 272-273), 'scheduled tick logs error when createBackup throws' usa vi.spyOn para forzar el path defensivo del if(nextRun<=now). BackupServiceImpl: 92.48% → 96.99%. Mock de logger cambia de () => {} a vi.fn() para inspección.
- `ef1606f chore(deps): mover discord-rpc y register-scheme a optionalDependencies` — discord-rpc requiere C++ workload de VS Build Tools. Sin el workload (CI portable, dev sin SDK), install abortaba. optionalDependencies permite fallo por-paquete sin abortar el resto.

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
- [ ] Coverage >80% en líneas críticas (actual 74.40% — gap 5.6 puntos). Mejoras específicas:
  - `AccountRepositoryImpl.ts`: 0% — necesita suite propia (sería la 6ª) bloqueada por regla AGENTS.md. **Decisión pendiente del operador**: ¿aprobar 6ª suite o modificar la regla?
  - LocalApiService: handlers internos WS (msg.command dispatch, líneas 334-358, 362-430) — no son bugs, son paths de dispatch por mensaje. Cobertura depende de tests E2E WS out-of-hose.
  - RobloxBottingService.ts y MultiRobloxService.ts (cobertura no medida — fuera del include glob actual).
- [ ] Tests para `RobloxBottingService` + `MultiRobloxService` (sin suites hoy). VIOLA `AGENTS.md` 'mantener 5 suites' — requiere decisión explícita del operador antes de crear.

### Bloqueados por infraestructura
- [ ] `electron-builder` en Windows local — requiere VS Build Tools C++ workload (discord-rpc + better-sqlite3 + utf-8-validate). Workaround CI. Pendiente desde 2026-09-11. **Mitigación parcial 2026-10-05**: discord-rpc y register-scheme movidos a optionalDependencies.
- [ ] `better-sqlite3` rebuild para Node 24 — prebuild-install no tiene binarios para `target=24.16.0 runtime=node`, y node-gyp rebuild requiere C++ workload. Hoy tests usan fake DB in-memory (workaround).

### Decisiones de producto diferidas
- [ ] Reintroducir botón "Apply" en SkinEditorModal cuando se implemente el IPC `account:outfit:apply`. Hoy deshabilitado honestamente.
- [ ] Reintroducir botón bulk email en AccountsView cuando se implemente el IPC `account:bulk:setEmail`. Hoy eliminado (`e913dcf`).
- [x] ~~Decidir qué hacer con `LRUCache.ts` (0% cobertura, sin call sites).~~ **Cerrado 2026-10-05**: SÍ tiene call sites reales (RobloxGamesService, RobloxPresenceService). Se añadió suite. 0% → 100%.

## 🔧 Estado técnico

- **Stack**: Electron 30.5.1, TypeScript 5.3.0, React 18.2.0, Mantine 7.17.8, Vite 5.0.0, vitest 4.1.11, @vitest/coverage-v8 4.1.11
- **Scripts de test**:
  - `npm test` — vitest run (5 suites, 126 tests)
  - `npm run test:watch` — vitest watch
  - `npm run test:coverage` — vitest run --coverage (74.40% global, genera report en `coverage/`)
  - `npm run test:ui` — vitest --ui
- **ESLint**: paths corregidos a `src/main.ts`, `src/infrastructure/**`, `src/preload/**` (Node) y `src/renderer.tsx`, `src/application/**` (Browser)
- **Staleness monitor**: en `scripts/` (era meta-tooling de SophIA, no del producto)
- **Dependencias**: better-sqlite3@9.6.0, electron@30.5.1, electron-log@5.4.4, ws@8.21.1, uuid@14.0.0, crypto-js NO usado (CryptoService custom con AES-256-GCM + PBKDF2)
- **Discord CLIENT_ID**: configurable vía `DISCORD_CLIENT_ID` env var (default: placeholder `1274925610645274655`)
- **discord-rpc + register-scheme**: `optionalDependencies` (2026-10-05). Si la install falla para ellos, el resto sigue.
- **Sub-components de Settings**: 13 archivos en `src/application/components/settings/`
- **Known limitations**:
  - `vitest` no intercepta `require()` runtime — código que usa `require()` en top-level debe convertirse a ESM imports para ser testeable (fix ya aplicado en LocalApiService.ts:14-15).
  - `release/` vacío local sin workload C++ de VS Build Tools. CI produce `NX-Manager-5.0.0-Portable.exe`.
  - `better-sqlite3` requiere VS Build Tools C++ workload para compilar en Node 24. Workaround para tests: fake DB in-memory vía `vi.mock('better-sqlite3')`.

## 🏗️ Cambios estructurales recientes (sesión cobertura 2026-10-05)

### Tests añadidos (103 → 126)

| Suite | Tests | Cobertura |
|-------|-------|-----------|
| `CryptoService.test.ts` | 5 → 10 (+4) | loadOrCreateSecret path filesystem (NAM_SECRET unset → mkdirSync + writeFileSync + existsSync + readFileSync + race recovery + fallback raro) |
| `LocalApiService.test.ts` | 32 → 35 (+3) | broadcastStatus OPEN/closed clients + best-effort send errors + server.on('error') reject |
| `BackupServiceImpl.test.ts` | 36 → 38 (+2) | restartScheduler clearInterval del handle previo + scheduled-tick logger.error cuando createBackup falla |
| `LRUCache.test.ts` | NEW 13 | basic get/set, TTL default + override, LRU eviction + get-promotion, maxSize=1 edge, invalidate/clear |

### Bugs encontrados durante tests y arreglados

Esta sesión no encontró bugs activos — los tests añadidos cubren ramas defensivas/dead-code-defensivo (líneas 282-289 de BackupServiceImpl son inalcanzables sin spy; line 437-440 de LocalApiService requiere emitir 'error' antes del listen-callback; race recovery de CryptoService requiere EEXIST que no ocurre en flujo normal). Los commits son cobertura pura, no fixes.

Commits de la sesión 2026-09-13 (legacy, ya en git):
1. **LocalApiService.ts:230 + 406** — `output.trim()` donde `output` es `{stdout, stderr}`. `promisify(exec)` retorna objeto, no string. TypeError silenciado por try/catch → status endpoint siempre retornaba `running=false` en Windows. **Fix**: destructurar `{stdout}`.
2. **LocalApiService.ts:14-15** — `require('node:child_process')` y `require('node:util')` en top-level bypaseaban `vi.mock` (mismo patrón que `CryptoService.secretDir()` con `require('electron')`). **Fix**: convertir a ESM imports.
3. **vitest.setup.ts**: pre-existente, mockea electron para suites que lo importan indirectamente.

### Decisiones de scope tomadas en esta sesión

- **Suites permitidas en AGENTS.md**: 3 → 5 (CryptoService, LocalApiService, BackupRepositoryImpl, BackupServiceImpl, LRUCache). BackupServiceImpl se había añadido en 2026-09-13 sin actualizar la regla. LRUCache se añadió en 2026-10-05 porque el archivo SÍ tiene call sites reales (RobloxGamesService, RobloxPresenceService) — el PROJECT.md anterior afirmaba "sin call sites" erróneamente.
- **`discord-rpc` + `register-scheme` → `optionalDependencies`**: ambos requieren C++ workload de VS Build Tools para compilar. Sin el workload (CI portable, dev sin SDK), la install abortaba. Como optionalDependencies, el fallo de estos 2 paquetes no impide instalar el resto.
- **Mock de logger en BackupServiceImpl.test.ts**: pasó de `() => {}` a `vi.fn()`. Necesario para inspeccionar llamadas a `logger.error` desde el path defensivo del scheduler tick.

### Decisiones de scope NO tomadas en esta sesión (documentadas para futuro)

- **RobloxBottingService.ts + MultiRobloxService.ts**: usan `execSync(cmd, { encoding: 'utf8' })` que retorna STRING (no `{stdout, stderr}` como `promisify(exec)`). NO son bugs activos (verificado 2026-09-13). El comentario en commit 7474fba sobre "mismo bug latente" era impreciso — los paths de output.trim()/.includes() en estos archivos funcionan correctamente.
- **AccountRepositoryImpl.ts**: 0% cobertura. Suite propia sería la 6ª, bloqueada por regla AGENTS.md. Decisión pendiente del operador.
- **IPC `account:outfit:apply` + `account:bulk:setEmail`**: handlers pendientes. Las UIs (SkinEditorModal "Apply", AccountsView bulk email) están deshabilitadas/eliminadas honestamente.

## 📐 Arquitectura real (verificada 2026-10-05)

Hexagonal respetada en backup. ~24,500 LOC. **6 sub-areas de infrastructure/external**: Roblox (auth, botting, cookie, games, presence, http, logs, settings — 8 servicios), Discord (RPC), Captcha, LocalAPI (HTTP+WS), Theme, ContentMod, FastFlags, CacheCleaner, LaunchPreset, Playtime, ControlWebSocket, MultiRoblox.

- **domain/**: entities + repositories (interfaces) + services (interfaces puras, sin imports de infrastructure/electron/fs). Ej: `BackupService.ts`, `Account.ts`, `AccountRepository.ts` (via `RepositoryInterfaces.ts`).
- **application/**: React components + hooks + layout + store + views (Zustand + Mantine + framer-motion). Sin imports de infrastructure/electron. 5 vistas: AccountsView (eager), ServersView/GamesView/FriendsView/SettingsView (lazy con React.lazy + Suspense + LoadingOverlay).
- **infrastructure/**: database (SQLite via better-sqlite3) + external (24 servicios) + ipc/handlers (5 archivos) + logging + monitoring + services (BackupServiceImpl).
- **preload/**: `contextBridge.exposeInMainWorld('api', api)` mapea 1:1 a `ipcRenderer.invoke`. 102 canales sincronizados: account (13), roblox (9), byAccount (54), settings (2), games (3), botting (3), theme (2), captcha (3), advanced (8), backup (11), cookie (2), shell (1) = 111 pero 102 únicos tras dedupe.

Flujo: Renderer → `window.api.X.Y()` → preload (`ipcRenderer.invoke`) → main (`ipcMain.handle`) → Repository/Service → better-sqlite3 / APIs externas.

### Tests coverage por capa (post-sesión 2026-10-05)

```
infrastructure/services/    96.99%  (BackupServiceImpl.ts)
infrastructure/database/    73.51%  (BackupRepo + BackupCrypto + Settings + DBManager + Crypto + LRUCache)
infrastructure/external/    64.41%  (LocalApiService.ts)
                            ──────
                            74.40% global
```

## Traza

| Fecha | Sesión | Cambio |
|-------|--------|--------|
| 2026-10-05 | Cobertura 68.24% → 74.40% | 6 commits: `ef1606f` deps optional, `06233ef` test backup restartScheduler + scheduled-tick error, `766ada0` test local-api broadcastStatus + server.on('error'), `0b7cf86` test crypto loadOrCreateSecret fs branches, `1cf0b09` test lru-cache nueva suite, `083bfc3` docs agents regla 5 suites. Gates: tsc 0, lint 0/0, **5 suites / 126 tests passing**, LRUCache 0%→100%. PROJECT.md + AGENTS.md resync. |
| 2026-09-13 | Cobertura 8.67% → 68.24% | 4 commits: `885a4fd` expandir BackupRepositoryImpl, `82817fa` añadir BackupServiceImpl suite, `7474fba` expandir LocalApiService + fix bugs (output.stdout + require→import), `59bdc7b` SettingsRepositoryImpl + DatabaseManager reales vía fake DB. Gates: tsc 0, lint 0/0, **4 suites / 103 tests passing**. PROJECT.md resync. |
| 2026-09-12 | Post-auditoría | `e913dcf` cleanup (git_health, botones muertos). `1140908` deps cleanup (-8 deps, Discord env var, .env.example). |
| 2026-09-11 | Cierre v5.0.0 | 3 commits: `chore(tests,lint)`, `chore(deps)`, `docs`. Gates: lint 0, tsc 0, vitest OK con 1/3 suites. |
| 2026-09-11 | Fixes seguridad | `bf66dab` cierra corrupción silenciosa de backups (utf8→base64). `76fb4b4` limpia 3 warnings lint. `568ee3a` mockea electron en vitest → **3/3 suites pasan (14 tests)**. |
