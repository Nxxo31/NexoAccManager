# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 4.1.0 | **Última actualización:** 2026-07-31

---

## 🎯 Objetivo Principal

Gestor de cuentas Roblox de código abierto, 100% local, con encriptación AES-256-GCM y arquitectura hexagonal — sin servidores, sin nube, sin tracking.

## 🎯 Objetivos Secundarios

1. Cementar el modelo de seguridad de cero-confianza (cifrado AES-256-GCM, branded type `EncryptedString`, CSP)
2. Establecer Clean Architecture como base del código (domain / application / infrastructure / preload / renderer)
3. Proveer una superficie IPC segura y auditada para el renderer (nunca exponer cookies ni secretos)
4. Localización completa ES / EN / PT vía el sistema `t(key, vars)` personalizado (247 keys × 3 idiomas)
5. Soporte multi-OS (Windows NSIS + MSIX, Linux AppImage + Snap)

---

## 📐 Arquitectura

### Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Lenguaje | TypeScript | 5.x | Tipado estático estricto across main + renderer |
| Framework | Electron | 30.x | Runtime desktop multi-OS con sandbox + contextIsolation |
| UI Framework | React | 18.x | Renderer (Mantine v7) con TSX components |
| Estado | Zustand | 5.x | Stores globales reactivos (accountStore, uiStore, launchStore) |
| UI Kit | Mantine | 7.17.8 | Componentes accesibles (Modal, Notification, etc.) |
| Build | Vite + electron-builder | 5.x / 24.x | Vite dev/build + empaquetado NSIS/AppImage/Snap |
| Testing | Vitest + Playwright | — | 36 unit tests + 6 E2E |
| Logging | electron-log | 5.4.4 | Logger estructurado rotativo en `userData/logs/` |
| Seguridad | node-forge | 1.3.1 | AES-256-GCM encryption con clave derivada hardware |
| DB | better-sqlite3 | 9.4.0 | SQLite local para cuentas + settings (sin servidor DB) |
| Lint | ESLint + typescript-eslint | 10.x / 8.x | 0 errors, 0 warnings baseline |

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA RENDERER (React 18)                │
│  AccountsView · ServersView · GamesView · FriendsView       │
│  SettingsView · LaunchDock · TopBar · Sidebar · Modal       │
│  Mantine v7 · Zustand stores · t() i18n (ES/EN/PT)          │
├─────────────────────────────────────────────────────────────┤
│                  PRELOAD (contextBridge segura)             │
│  ipcRenderer.invoke → 91 canales tipados (window-api.d.ts)   │
│  Sin nodeIntegration · sin require expuesto al renderer    │
├─────────────────────────────────────────────────────────────┤
│              CAPA MAIN (Electron 30, Node TypeScript)        │
│                                                             │
│  ┌── IPC Handlers (91) ──┐  ┌── External Services ──────┐   │
│  │ accountHandlers        │  │ RobloxAuthService          │   │
│  │ robloxHandlers         │  │ RobloxGamesService         │   │
│  │ settingsHandlers       │  │ RobloxPresenceService      │   │
│  │ advancedHandlers       │  │ RobloxCookieService       │   │
│  │ shared (IpcResult)     │  │ RobloxLogService           │   │
│  └────────────────────────┘  │ ControlWebSocketService    │   │
│                              │ LocalApiService (REST)     │   │
│  ┌── Domain Layer ────────┐  └────────────────────────────┘   │
│  │ Entities                │                                   │
│  │  • Account              │  ┌── Database (better-sqlite3) ┐  │
│  │  • FastFlag             │  │ AccountRepositoryImpl        │  │
│  │  • LaunchPreset         │  │ SettingsRepositoryImpl       │  │
│  │  • PlaytimeEntry        │  │ CryptoService (AES-256-GCM)  │  │
│  │  • PresenceData         │  │ DatabaseManager (singleton)  │  │
│  │ Repositories (Ports)    │  └──────────────────────────────┘  │
│  │  • RobloxApiPort (6 sob)│                                   │
│  │  • RepositoryInterfaces │  ┌── Logging ────────────────┐  │
│  │ EncryptedString (brand)│  │ electron-log (rotativo 5MB)│  │
│  └────────────────────────┘  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
│              EXTERNO (Roblox API + Discord RPC)              │
│  HTTPS a *.roblox.com · WebSocket push (roblox.com) · OAuth   │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
[Usuario click UI]
  → [Zustand store.mutate]
  → [window.api.roblox.* (preload contextBridge)]
  → [ipcRenderer.invoke(channel, args)]
  → [IPC handler (main, AccountRepository + Service)]
  → [External Service implements Roblox Port → HTTPS a Roblox]
  → [Response → IpcResult {ok, error?}]
  → [ipcMain.handle → renderer → store.update → re-render]
```

Nota: el renderer NUNCA manipula cookies ni passwords — solo el main process las cifra y persiste.

---

## 📊 Matriz de Trazabilidad

| Req ID | Descripción | Componente | Estado | Verificación |
|--------|-------------|------------|--------|--------------|
| R-01 | AES-256-GCM encryption de credenciales con branded type | `CryptoService.ts`, `EncryptedString.ts` | ✅ | 11 unit tests CryptoService / 10 Account factories |
| R-02 | Cookies nunca salen del main process | `accountHandlers.ts`, `RobloxHttp.ts` | ✅ | Auditoría revisión 55 hallazgos → 0 exfiltraciones activas |
| R-03 | CSP bloquea inline + conexiones externas no autorizadas | `src/main.ts` | ✅ | `npm run build` exit 0, verificación manual |
| R-04 | 91 canales IPC con tipos sincronizados性强 | `preload/index.ts`, `window-api.d.ts` | ✅ | Extractor sync → 91 handlers = 91 canales, 0 drift |
| R-05 | i18n completo ES/EN/PT (247 keys cada uno) | `src/config/i18n.ts` | ✅ | Audit programático 247/247/247, 0 missing |
| R-06 | LaunchDock persistente con WebSocket + DIP | `ControlWebSocketService.ts`, `LaunchDock.tsx` | ✅ | `npm run build` exit 0; adapters implement formal ports |
| R-07 | RobloxApiPort segregado en 6 sub-ports (ISP) | `RobloxApiPort.ts`, 6 Source service files | ✅ | `tsc --noEmit` 0 errors |
| R-08 | Logging estructurado rotativo (electron-log) | `src/infrastructure/logging/logger.ts` | ✅ | File transport `userData/logs/`, formato ISO timestamp |
| R-09 | Code splitting + performance (bundle 739KB→412KB) | `vite.config.ts`, `AccountCard.tsx` | ✅ | Build exit 0, bundle size medida |
| R-10 | Mantine v7 locale no relevante (no DateInput) | `renderer.tsx` | ✅ | Audit — solo se usa `t()` custom para all user-facing strings |
| R-11 | B-5 formularios dinámicos i18n (espin en .tsx → t({count})) | `AccountsView.tsx`, `AddAccountModal.tsx` | ⏳ | Issue #3 — forms con interpolación count/vars |
| R-12 | WebSocket real para account:control (reemplazar HTTP bridge) | `ControlWebSocketService.ts` | ⏳ | Interino HTTP bridge, WebSocket real pendiente |

---

## 🏗️ Marcos Conceptuales

### Hexagonal Architecture (Ports & Adapters)
El dominio define interfaces (Ports): `RobloxApiPort` segregado en 6 sub-ports (Auth, Games, Presence, Social, Settings, Cookie), manteniendo ISP. Los adaptadores (Infrastructure) implementan formalmente estos Ports con `implements`, proveyendo singletons para DI. Esto permite testear el dominio aislado y cambiar adaptadores sin tocar el código core.

### Branded Types para seguridad
`EncryptedString` es un branded type con `unique symbol` privado, garantizando a nivel de TypeScript que una cookie/password solo puede provenir de `CryptoService.encrypt()` — el renderer no puede crear un `EncryptedString` por mucho que intente. El password siempre se procesa en el main, nunca se envía descifrado al renderer.

### Single Source of Truth (IPC channel drift detector)
El script extractor custom sincroniza preload ↔ handlers ↔ `window-api.d.ts`. Cualquier desviación (drift) rompe CI antes que el renderer llame a un canal inexistente. Esto previene bugs sutiles descubiertos en auditaría v4.0.6 donde 10 canales estaban desincronizados.

### 3-Layer Verification Gates
1. **Layer 1 (compile)**: `tsc --noEmit` + `lint` + `build` — determinístico
2. **Layer 2 (runtime)**: tests E2E Playwright contra build empaquetado, sin mocks
3. **Layer 3 (adversarial)**: race conditions, idempotencia, boundary cases (vacío, máximo)

---

## ✅ Justificación de Decisiones Técnicas

| Decisión | Opción elegida | Alternativas evaluadas | Razón |
|----------|---------------|----------------------|-------|
| State management | Zustand | Redux, MobX, React Context | Mejor DX, sin boilerplate, reactivity óptima para el tamaño del proyecto |
| UI Library | Mantine v7 | shadcn/ui, Ant Design | Componentes accesibles out-of-the-box, Soporte TypeScript estricto,.forms con validation built-in |
| Branded type crypto | `EncryptedString` (unique symbol) | string, object wrapper | Garantía en compile-time de que todo `password` viene cifrado — fracasa el build si un dev olvida cifrar |
| DB local | better-sqlite3 | lowdb, SQLite3 native, electron-store | Sincrónico y simple, mejor perflectronic-store para settings separados |
| God interface split | 6 sub-ports (ISP) | RobloxApiPort monolítico | NAM_td_2:违反 ISP — segregado para obligar adaptadores específicos |
| IPC pattern | `IpcResult {ok: T, error?}` retorno assync | throw + try/catch en renderer | Prevención de errores silenciosos, fallback seguro, trazabilidad |
| Logging | electron-log (rotativo 5MB) | console.log, winston, pino | Persiste entre reinicios, formato ISO timestamp, override global de console |
| i18n | Custom `t(key, vars)` system | react-i18next (legacy en /locales/) | Control total del formato, sin deps extra, 247 keys × 3 idiomas con fallback ES |
| Build splitting | Vite code splitting + lazy load | Single bundle | Bundle 739KB → 412KB (-44%), view/code-splitting natural |

---

## 📦 Estado de Implementación

### Fases Completadas

| Fase | Descripción | Commit | Verificación |
|------|-------------|--------|--------------|
| v4.0.0 | Clean architecture inicial + Mantine v7 UI | 2ccab1 | Build exit 0 |
| v4.0.6 | 55 hallazgos auditados (15 critical / 20 required) | — | Audit completo |
| v4.0.7 | Corrección seguridad crítica — eliminar exfil cookies, CSRF fix | — | tsc/lint/build/test 4-puertas pasar |
| v4.0.8 | IpcResult contract, path-traversal fix, loading states, effect hygiene | — | 36/36 vitest, 6/6 E2E |
| v4.0.9 | Lint cleanup 28 warnings→0, version bump, CSP, memory leak fix | — | tsc 0, lint 0/0, build exit 0 |
| v4.1.0 | DT-1/DT-2/DT-3 refactor domain + B-1 WS + B-2 perf + B-3 i18n + B-4 electron-log | 42d3978, f9bccf2 | 36/36 unit, 6/6 E2E, parity 247 keys |
| Templates | GitHub issue/PR templates + CI 3-layer gates | d57f9e5 | Workflow files committed |

Próximo commit previsto: `docs: estandarizar PROJECT.md (template SophIA con matriz de trazabilidad y justificación de decisiones)`

### Próximos Pasos (Backlog)

| ID | Descripción | Prioridad | Issue |
|----|-------------|-----------|-------|
| B-5 | Formularios dinámicos i18n (interpolación count/vars en .tsx) | Alta | #3 |
| B-1 | WebSocket real para `account:control` (reemplazar HTTP bridge interino) | Media | #1 |
| B-6 | Tests unitarios para `advanced:devmode` y `account:control` handlers | Media | #4 |
| B-7 | P-001/P-002 perf en AccountsView (React.memo en listas grandes) | Baja | #5 |
| B-8 | Tests visuales (regression visual) en 6 E2E flows | Baja | #6 |

---

## 🗺️ Roadmap v4.1.0 → v5.0.0 (3 meses)

> **Ventana:** 2026-08-01 → 2026-10-31 | **Meta:** Release v5.0.0 con coverage ≥90%, CI verde sin `continue-on-error`, backlog alta/media cerrado, y breaking changes documentados en MIGRATION guide.

### Hallazgos de baseline (auditados 2026-07-31)

| Métrica | Estado real | Nota |
|---------|-------------|------|
| `tsc --noEmit` | ✅ 0 errores | Verificado |
| ESLint baseline | 0/0 (reclamado) | `continue-on-error` en CI lo enmascara — re-verificar |
| Archivos fuente (TS/TSX) | 77 (domain 10, application 32, infrastructure 31, preload 1, config 2, types 1) | — |
| Archivos de test | **0** | Commit `d4753d0` purgó todos los tests; `vitest` no está en devDependencies; sin `playwright.config.ts` |
| Coverage | 0% | Sin tests ejecutables, `test:coverage` script no existe |
| CI `continue-on-error` | Lint + Build + Go vet todos con `continue-on-error: true` | `coverage.yml` llama `npm run test:coverage` que no existe → workflow roto |
| i18n | `src/config/i18n.ts` (sistema `t()` custom, flat) + `src/application/locales/*.json` + `src/application/i18n.ts` (i18next) | **Dos sistemas de i18n activos simultáneamente**; PROJECT.md reclama 247 keys pero `es.json` tiene ~84 leaf keys. Discrepancia documentada = deuda técnica a resolver |
| `ControlWebSocketService` | Implementado (B-1 interino) | Usa `ws://127.0.0.1:<port>/control` loopback — pendiente validar que "WebSocket real" reemplace "HTTP bridge" completamente |
| AGENTS.md `src/main` + `src/renderer` | **Stale** | Arquitectura real es hexagonal (`domain/application/infrastructure`). AGENTS.md describe v2.5.0 — nunca actualizado tras refactor DT-* |
| CHANGELOG / MIGRATION | No existe | v5.0.0 los necesita |
| Tags git | último `v4.1.0` | — |

---

### Mes 1 — Agosto 2026: Cimientos (tests + CI + B-6)

**Objetivo del mes:** Restaurar el test runner, alcanzar ~40% coverage, reparar CI, y cerrar B-6 (unit tests para advanced/devmode + control handlers).

#### Semana 1 (Aug 1–7): Restaurar el harness de testing
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 1.1 | Re-añadir `vitest` a devDependencies; crear `vitest.config.ts` + `vitest.setup.ts` (mocks de `window.api`, electron `ipcMain`, `better-sqlite3`) | `npx vitest run` ejecuta 0 tests pero `命中率` reporta infra activa, exit 0 |
| 1.2 | Crear `test:unit`, `test:coverage`, `test:watch` scripts en `package.json` | `npm run test:coverage` genera `coverage/lcov.info` |
| 1.3 | Re-añadir Playwright: `playwright.config.ts` (browser-mode, `BROWSER_ONLY=1 vite` dev server en CI) + `test:e2e` script | `npx playwright test --config playwright.config.ts` arranca y pasa smoke mínimo |
| 1.4 | Smoke test E2E `tests/e2e/smoke.spec.ts` (app carga, Header/Dock/AccountTable visibles, abrir modal AddAccount y Settings) | 1/1 E2E green |

**Gate al final Semana 1:** `npm run test:coverage` produce un reporte (aunque sea 0%); Playwright smoke green.

#### Semana 2 (Aug 8–14): B-6 — unit tests para handlers advanced + control
| # | Entregable | Criterio de éxito | Archivos objetivo |
|---|------------|-------------------|-------------------|
| 2.1 | Unit tests `advancedHandlers.ts` — exportData, deleteAllAccounts, cache:*, fflags:*, mods:*, logs:*, presets:*, playtime:* | Cada handler tiene ≥1 test happy path + ≥1 test error path (mock lanza) | `src/infrastructure/ipc/handlers/advancedHandlers.ts` |
| 2.2 | Unit tests para devmode handlers (advanced:devmode toggle + settings persistence) | Toggle persiste en SQLite `settings` table; round-trip get/set devuelve IpcResult correcto | `advancedHandlers.ts`, `SettingsRepositoryImpl` |
| 2.3 | Tests del WS control path (B-1 interino): `controlWs.sendCommand` happy/error/timeout/reconnect-backoff | Mock `ws` server; cubre cola pendientes + timeout 8s + reconnect 500ms→15s | `src/infrastructure/external/ControlWebSocketService.ts` |
| 2.4 | Unit tests `shared.ts` (`ok`/`err`/`errMsg` helpers) | 100% branch coverage del módulo | `handlers/shared.ts` |

**Gate al final Semana 2:** B-6 cerrado (mark ✅ en PROJECT.md R/B-6). Coverage de `src/infrastructure/ipc/handlers/**` ≥ 70%. Total coverage ~15-20%.

#### Semana 3 (Aug 15–21): Reparar CI — quitar `continue-on-error`, arreglar coverage.yml
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 3.1 | Editar `.github/workflows/ci.yml`: remover `continue-on-error: true` de jobs `compile-node` Lint y Build. Job de Node separado en `lint` + `typecheck` + `build` + `test:coverage` steps, fallando en cualquier error | Push a `main` → workflow verde SI Y SOLO SI tsc+lint+build+coverage pasan |
| 3.2 | Repair `coverage.yml`: el `npm run test:coverage` ahora existe (Semana 1); añadir `coverage/lcov.info` upload a Codecov con `fail_ci_if_error: true` (no `false`) | Coverage report sube a Codecov en cada PR |
| 3.3 | Añadir job `ipc-drift-check` en `ci.yml` que ejecuta el extractor de canales → `drift != 0` rompe el build | Drift detector integrado en CI (no solo local) |
| 3.4 | Editar `build-verify.yml`: añadir step de smoke test que ya existe (Windows) + matriz Linux AppImage | Windows NSIS + Linux AppImage artifacts verificados |

**Gate al final Semana 3:** CI `green` en `main` sin flags `continue-on-error` en ningún job de Node. PR-status checks bloqueantes.

#### Semana 4 (Aug 22–31): Tests del dominio + infra core (crypto, repos, LRU cache)
| # | Entregable | Criterio de éxito | Archivos objetivo |
|---|------------|-------------------|-------------------|
| 4.1 | Tests `CryptoService.ts` (AES-256-GCM encrypt/decrypt round-trip, clave derivada, error tamper) | 11+ unit tests (re-clamar los de v4.0.9), 100% líneas | `src/infrastructure/database/CryptoService.ts` |
| 4.2 | Tests `EncryptedString` branded type (no instanciable fuera de `makeEncryptedString`) | tsc compila intentos ilegales → error; legal pasa | `src/domain/types/EncryptedString.ts` |
| 4.3 | Tests `AccountRepositoryImpl` (CRUD, getAll, getById, limpiar al desinstalar) + factories de `Account` con invariantes | 10+ factories, happy + invalid-arg paths | `AccountRepositoryImpl.ts`, `domain/entities/Account.ts` |
| 4.4 | Tests `LRUCache` (60s TTL, evicción, hit/miss) | Boundary: vacío, máximo, expiración | `src/infrastructure/database/LRUCache.ts` |

**Gate final Mes 1 (Aug 31):** Coverage total ≥ 35%. CI green sin flags. B-6 ✅. Vitest + Playwright operativos. `vitest` y `playwright.config.ts` commiteados.

---

### Mes 2 — Septiembre 2026: Backlog alta/media (B-5, B-1) + coverage 70%

**Objetivo del mes:** Cerrar B-5 (i18n forms dinámicos) y B-1 (WebSocket real para account:control). Coverage al 70%.

#### Semana 5 (Sep 1–7): B-5 Parte 1 — consolidar i18n
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 5.1 | Eliminar `src/config/i18n.ts` (sistema `t()` custom flat) y migrar TODO el renderer a `react-i18next` (que ya está inicializado en `src/application/i18n.ts`) | grep `\bt(` custom → 0 usos; todo usa `useTranslation()` hook |
| 5.2 | Re-auditar `es.json`/`en.json`/`pt.json`: contar leaf keys reales, añadir las faltantes usadas en `.tsx` pero no definidas en JSON | `npm run i18n:audit` script (nuevo) → 0 missing keys × 3 idiomas |
| 5.3 | Actualizar PROJECT.md matriz R-05 con conteo real (reemplazar "247" con número verificado) | Sin discrepancia doc ↔ código |

**Gate:** Sistema i18n único (i18next). Cero keys hardcoded en TSX. Sin orphan keys.

#### Semana 6 (Sep 8–14): B-5 Parte 2 — forms dinámicos con interpolación
| # | Entregable | Criterio de éxito | Archivos objetivo |
|---|------------|-------------------|-------------------|
| 6.1 | `AddAccountModal.tsx`: reemplazar strings hardcoded con `t('accounts.add.*', {{name, count}})` — pluralización ES/EN/PT | `BROWSER_ONLY=1 vite` → modal muestra string interpolado correcto en los 3 langs |
| 6.2 | `AccountsView.tsx`: `deleteConfirmBody`, `launched`, `updated`, `shuffle` notificaciones con `{{name}}`, `{{count}}/50` | Alternar `settings:language:set` es/en/pt → todos los strings interpolados |
| 6.3 | `ServersView.tsx`, `FriendsView.tsx`, `GamesView.tsx`: `{{current}}/{{max}}`, `{{region}}`, `{{fps}}` ya usan `t()` — validar que las keys existan en JSON | Sin warnings `missing key` en consola del renderer |
| 6.4 | Tests unit para interpolación: render `AccountsView` con 25 cuentas → `{{count}}/50` se resuelve a "25 / 50 cuentas" | Vitest snapshot comparando output por idioma |

**Gate al final Semana 6:** B-5 ✅. R-11 matriz marcada ✅ con fecha. Sin strings hardcoded en forms/views principales.

#### Semana 7 (Sep 15–21): B-1 — WebSocket real para account:control
| # | Entregable | Criterio de éxito | Archivos objetivo |
|---|------------|-------------------|-------------------|
| 7.1 | Auditar `ControlWebSocketService` vs `RobloxHttp` HTTP bridge: confirmar cuáles calls aún usan HTTP una-por-uno | Documentar en PROJECT.md la lista residual de calls HTTP |
| 7.2 | Migrar `account:control` (launch/kill/status/refresh-cookie) a enviar por WS exclusivamente; eliminar el fallback HTTP | `advancedHandlers.ts` solo usa `controlWs.sendCommand`; sin import `axios` para control |
| 7.3 | Implementar `onStatus` push subscription en renderer (stores Zustand actualizan estado de cuenta en tiempo real sin polling) | Store recibe `ControlStatusListener` → `updateAccountStatus(id, status)` acción |
| 7.4 | Tests E2E: iniciar LocalApiService (CI), abrir app, lanzar cuenta, verificar status cambia via WS (no polling) | Playwright intercepta socket frames → status "launched" en <2s |

**Gate al final Semana 7:** B-1 ✅. R-12 matriz ✅. Sin polling 30s en `account:control` — solo push WS.

#### Semana 8 (Sep 22–30): Tests del renderer + servicios externos Roblox
| # | Entregable | Criterio de éxito | Archivos objetivo |
|---|------------|-------------------|-------------------|
| 8.1 | Tests del renderer: `AccountCard`, `LaunchDock`, `AddAccountModal`, `SettingsPanel` — Mockito de `window.api.*` | 20+ componentes cubiertos; Events: click, submit, error display | `src/application/components/**` |
| 8.2 | Tests Zustand stores: `accountStore`, `uiStore` — acciones, selectors, persistencia | Acciones mutan state y persisten a SQLite (mock db) | `src/application/store/**` |
| 8.3 | Tests de servicios Roblox (con mocks HTTP via MSW o `nock`): `RobloxAuthService`, `RobloxGamesService`, `RobloxPresenceService`, `RobloxCookieService` | Happy path + 401/403/429/timeout → IpcResult {success:false, error} correcto | `src/infrastructure/external/Roblox*Service.ts` |
| 8.4 | Tests de `ContextModService` (`safeResolve` path-traversal block), `CacheCleanerService`, `PlaytimeService` | Boundary: path `../`, valu bajo/máximo | `src/infrastructure/external/**` |

**Gate final Mes 2 (Sep 30):** Coverage total ≥ 70%. B-5 ✅. B-1 ✅. Backlog alta/media (B-5, B-1, B-6) cerrado al 100%.

---

### Mes 3 — Octubre 2026: v5.0.0 — coverage 90% + breaking changes + release

**Objetivo del mes:** Coverage 90%, CI enhacements finales, documentación de breaking changes, tag `v5.0.0`, release multi-OS.

#### Semana 9 (Oct 1–7): Tests E2E + a11y + visual regression (B-8 parcial)
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 9.1 | Reescribir/open tests E2E browser-mode desde el plan existente `docs/plans/2026-07-16-v2.5.0-cleanup-restructure.md` Tareas 5–7: smoke, navigation, a11y axe-core | 6+ E2E specs green en CI (`BROWSER_ONLY=1` dev server Playwright) |
| 9.2 | Tests de accesibilidad axe-core: WCAG 2.1 AA en Header/Dock/AccountTable/mudales/focus-traps | `axe` violations = 0 en todos los flows |
| 9.3 | Visual regression `tests/visual/screenshots.spec.ts` con baselines de los 3 temas (dark/light/roblox-classic) | `playwright test --update-snapshots` genera baselines; diffs <1% |
| 9.4 | Mover config Playwright a `playwright.config.ts` (faltante); añadir job separado `e2e-browser` en CI con cache de screenshots | E2E job bloqueante en PRs |

**Gate al final Semana 9:** Coverage ≥ 80% con E2E incluidos. a11y 0 violaciones.

#### Semana 10 (Oct 8–14): Coverage 90% + edge cases adversariales (Layer 3)
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 10.1 | Tests adversariales (Layer 3 del framework): race conditions en launches concurrentes, idempotencia `killAll`, boundary 0 y 50 cuentas (límite hardcoded AGENTS.md) | Tests reproducen condiciones e idempotencia; 50 cuentas = bloqueo correcto |
| 10.2 | Tests `DatabaseManager` (singleton, migrations, schema integrity) + `SettingsRepositoryImpl` | Reopen DB persiste state; migrations idempotentes | `src/infrastructure/database/**` |
| 10.3 | Tests `ThemeService` (CSS vars vía IPC `theme:set`), `MultiRobloxService`, `DiscordRPCService` | Mocks de electron `BrowserWindow`; RPC mock devuelto | `src/infrastructure/external/**` |
| 10.4 | Cobertura final — re-auditar todos los archivos ≥85% líneas; añadir tests en gaps hasta ≥90% total | `coverage/lcov.info`: statements/branches/functions/lines ≥90% |

**Gate al final Semana 10:** Coverage ≥ 90%. Sin statements/archivos críticos sin cubrir.

#### Semana 11 (Oct 15–21): Documentación de breaking changes + AGENTS.md sync
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 11.1 | Crear `CHANGELOG.md` con todos los cambios v4.0.0→v5.0.0 (commits `git log v4.1.0..HEAD --oneline`) | Entrada `[5.0.0] - 2026-10-XX` con sections Added/Changed/Deprecated/Removed/Fixed/Security |
| 11.2 | Crear `MIGRATION.md` (v4.x → v5.0.0): breaking changes documentados — (a) migración i18n a i18next (usuarios custom legacy strings necesitan actualizar), (b) `account:control` ahora solo WS (LocalApiService debe estar corriendo), (c) schema SQLite migrations | Lista de hooks de migración con ejemplos de código before/after |
| 11.3 | Actualizar AGENTS.md "Key file structure" de `src/main`+`src/renderer` (v2.5.0) al actual hexagonal `src/domain`+`src/application`+`src/infrastructure` | Estructura documentada 1:1 con `find src/` |
| 11.4 | Actualizar PROJECT.md: fase v5.0.0 en tabla "Fases Completadas", backlog B-5/B-1/B-6 marcados ✅, matriz R-11/R-12 ✅, hallazgos de auditoría resueltos | Sin reclamos "247 keys" si el conteo real difiere (documentar número real) |

**Gate al final Semana 11:** `CHANGELOG.md` + `MIGRATION.md` existiendo y referenciados en README. AGENTS.md sin descriptores v2.5.0.

#### Semana 12 (Oct 22–31): Release v5.0.0 — version bump, tag, multi-OS builds, smoke visual
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 12.1 | `package.json` version → `5.0.0`; README badges actualizados (coverage 90%+, CI green) | `npm run build` exit 0 |
| 12.2 | Verification gates Layer 1+2+3 completos: `tsc 0`, `lint 0/0`, `vitest run` 100%, `playwright test` 6+ specs green, IPC drift 0 | Reporte firmado en PROJECT.md con capturas de salida |
| 12.3 | Release multi-OS: `git tag v5.0.0` → trigger `build-verify.yml` (Windows NSIS) + añadir job Linux AppImage/Snap | Artifacts `.exe` + `.AppImage` publicados en GitHub Release `v5.0.0` |
| 12.4 | Smoke test visual final via computer-use: abrir app en cada tema, AddAccount + Settings modales, screenshot analysis con vision | Hallazgos en PROJECT.md sección "Validación visual final v5.0.0" |
| 12.5 | Cerrar issues GitHub #1, #3, #4 (B-1, B-5, B-6) con PRs merged | Issues cerrados con link a PR |

**Gate final Mes 3 (Oct 31 / v5.0.0):** Coverage ≥90%. CI green sin flags. B-5, B-1, B-6 ✅. CHANGELOG + MIGRATION docs publicados. Tag `v5.0.0` + releases multi-OS. Sin discrepancias PROJECT.md ↔ código.

---

### Resumen de Milestones y Gates

| Hito | Fecha | Entregable principal | Criterio de salida |
|------|-------|----------------------|--------------------|
| **M1: Cimientos** | 2026-08-31 | Vitest+Playwright restaurados, CI reparado, B-6 ✅, coverage 35% | `npm run test:coverage` funciona; CI green sin `continue-on-error`; handlers advanced/devmode probados |
| **M2: Backlog** | 2026-09-30 | B-5 ✅, B-1 ✅, coverage 70% | i18n único; forms con interpolación; `account:control` 100% WS; backlog alta/media cerrado |
| **M3: Release v5.0.0** | 2026-10-31 | Coverage 90%, CHANGELOG+MIGRATION docs, tag `v5.0.0` multi-OS | Layer 1+2+3 gates green; release `.exe`+`.AppImage`; issues #1/#3/#4 cerrados |

### Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Playwright en CI Linux no arranca `BROWSER_ONLY=1 vite` (Wayland/Xvfb) | Media | Alto | Usar `xvfb-run` en CI job; fallback: Playwright `--browser=chromium` headless |
| `better-sqlite3` native binding recompila en Windows/Linux runner | Baja | Medio | Pre-built binaries; `asarUnpack` ya configurado en `package.json` build.win |
| Migración i18n rompe strings de usuarios custom | Media | Alto | `MIGRATION.md` con script de migración; mantener compat keys legacy 1 release |
| Coverage 90% inviable por servicios con dependencias externas (Roblox API) | Media | Medio | Usar MSW/nock para mockar HTTP; los servicios Roblox son los candidatos harder |
| `continue-on-error` enmascaraba errores reales (lint spider, drift)` → al quitarlo, CI queda rojo | Alta | Alto (visible) | Semana 3 es EXPLÍCITAMENTE para esto; si falla, priorizar fijar antes que re-encubrir |

### Out of scope (explícito)
- B-7 (perf AccountsView React.memo) y B-8 (visual regression 6 flows) son prioridad baja — B-8 se cubre parcialmente en Semana 9, B-7 queda post-v5.0.0.
- MSIX packaging (documentado en PROJECT.md obj. secundario 5 pero no en `build.msi` block completo) — queda para v5.1.0.
- DiscordRPC Application ID auto-config (limitación conocida #5) — anti-feature candidata, queda post-release.

---

## ⚠️ Limitaciones Conocidas

1. **Wayland**: Sin soporte oficial, Electron puede tener glitches en Linux Wayland (X11 funciona perfecto).
2. **Wayland para MultiRoblox**: `ws://` para multi-instancia puede fallar en entornos headless.
3. **Sin OS-level testing**: CI corre Linux pero NAM tiene multi-OS (Windows NSIS/MSIX, Linux AppImage/Snap).
4. **Captcha**: CaptchaService está integrado pero NO bypass-ea garantizado — puede requerir intervención manual del usuario.
5. **DiscordRPC**: Configuración manual del Application ID en Settings.
6. **Renderer never sees decrypted secrets**: por diseño — visto como limitación solo si el usuario wants enviar credenciales a un tercer proceso (anti-feature).

---

## 🔐 Seguridad

- **AES-256-GCM** con clave derivada de hardware (PBKDF2 + salt). Branded type `EncryptedString` garantiza a compile-time.
- **Cookies nunca salen del main process**: Auditoría 55 hallazgos detectó exfil, corregida en v4.0.7. Los handlers que necesitan cookies reciben `accountId` y resuelven internamente.
- **CSP**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.roblox.com;`
- **`contextIsolation=true`**, `nodeIntegration=false`, `sandbox=true` — hard constraints
- **Path traversal blocked**: `safeResolve()` antes de cualquier `fs` operation en `ContentModService`
- **IPC drift detector**: script extractor sincroniza 91 canales → rompe CI si drift != 0
- **Sin files `.env`**: credenciales en SQLite cifrado, nunca en plaintext

---

## 📚 Referencias

- Electron 30 security best practices: https://www.electronjs.org/docs/latest/tutorial/security
- Roblox API documentation: https://create.roblox.com/docs
- Mantine v7 docs: https://mantine.dev/
- Vite plugin Electron: https://vite-plugin-electron.org/
- Better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- Architecture reference: RAM (Roblox Account Manager) by ic3w0lf22
- Repo: https://github.com/Nxxo31/NexoAccManager

---

*Generado por SophIA — Sebastian Velasco's autonomous operating system*
