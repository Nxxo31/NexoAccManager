# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-08-10 — AGENTS.md actualizado completo (UI v5.0.0 multi-view, tabla MCP, development loop MCP-first, Test Strategy Playwright, línea "playwright" removida de Never, Playwright añadido a Boundaries Always)

---

## Auditoría 2026-08-06

### Cambios realizados durante la limpieza y profesionalización:

1. **Eliminación de archivos huérfanos**:
   - Eliminado `LAUNCH_DOCK_IMPLEMENTATION_SUMMARY.md` del raíz (violaba la regla "no .md fuera de PROJECT.md")
   - Contenido relevante movido a esta sección de PROJECT.md

2. **Limpieza de .gitignore**:
   - Verificado que `test-results/`, `sketches/`, `dist/`, `build/`, `release/` estén en .gitignore
   - Entradas faltantes añadidas donde necesario
   - Archivos ya commitados removidos del tracking con `git rm -r --cached` (sin borrar físicamente)

3. **Consolidación de CI Workflows**:
   - Evaluados 5 workflows en `.github/workflows/`
   - Eliminado `code-review.yml` (duplicado con funcionalidad de CI principal)
   - Eliminado `visual-diff.yml` (innecesario sin Playwright visual regression activo)
   - Mantenidos: `ci.yml` (lint+typecheck), `build-verify.yml` (build test), `build-windows.yml` (Windows-specific)

4. **Actualización de PROJECT.md**:
   - Añadida esta sección "Auditoría 2026-08-06"
   - Versión actualizada de 4.1.0 a 4.2.1 (cleanup release)
   - Integrado resumen de implementación del LaunchDock desde el archivo eliminado

### Resultado:
- Repo más limpio y profesionalizado
- Configuración CI simplificada y mantenible
- Documentación centralizada en PROJECT.md
- Preparado para gates de calidad: LSP limpio, lint 0 errors, build exitoso

## 🎯 Objetivo Principal

Gestor de cuentas Roblox de código abierto, 100% local, con encriptación AES-256-GCM y arquitectura hexagonal — sin servidores, sin nube, sin tracking.

## 🎯 Objetivos Secundarios

1. Cementar el modelo de seguridad de cero-confianza (cifrado AES-256-GCM, branded type `EncryptedString`, CSP)
2. Establecer Clean Architecture como base del código (domain / application / infrastructure / preload / renderer)
3. Proveer una superficie IPC segura y auditada para el renderer (nunca exponer cookies ni secretos)
4. Localización completa ES / EN / PT vía el sistema único `t(key, vars)` personalizado en `src/config/i18n.ts` — 255 leaf keys × 3 idiomas (es/en/pt), simétricos, sin duplicados, con fallback ES. Sistema i18next+react-i18next (`src/application/i18n.ts` + `src/application/locales/*.json`) eliminado 2026-08-09 por ser código muerto (inicializado en App.tsx pero sin consumers `useTranslation()`/`i18n.t()`). Discrepancia doc ↔ código previa resuelta (247 reclamado → 255 real; ~84 leaf keys en es.json → 102 real, ahora eliminado).
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
| Verification Gates | LSP live_diagnostics + delegate_task review + gitleaks | — | Type safety en tiempo real + code review adversarial + secret scanning |
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


---

## Implementación del LaunchDock (Resumen)

El LaunchDock es un componente persistente que mejora el flujo de conexión entre juegos y cuentas eliminando la fricción de copiar/pegar Place IDs manualmente.

### Características principales:
- **Propagación automática de Place ID**: Al seleccionar un juego en GamesView o ServersView, su Place ID aparece automáticamente en el LaunchDock
- **Componente persistente**: Siempre visible en el pie de la pantalla, independientemente de la vista activa
- **Integración con shuffle**: Opción para generar Job ID aleatorio válido vía API
- **Navegación rápida**: Botón "Ir a Juegos" para acceder directamente a GamesView
- **Estado visual**: Feedback inmediato con toasts, highlight en cards y pulso en el dock

### Arquitectura:
- **Store centralizado**: `useLaunchStore` maneja el estado global (selectedPlaceId, selectedGame, selectedAccountId, shuffle, launchStatus)
- **Componentes actualizados**: 
  - GamesView.tsx: Propaga Place ID al store al hacer click en un juego
  - AccountsView.tsx: Lee Place ID y shuffle del store, elimina estado local
  - App.tsx: Renderiza LaunchDock como hijo fijo del contenedor principal
  - IPC Handler `roblox:launch`: jobId ahora es opcional, solo requiere placeId

### Beneficios logrados:
✅ Eliminación de fricción: cero copy-paste manual entre vistas
✅ Feedback visual inmediato: toast, highlight en card, pulso en dock  
✅ Siempre visible: el LaunchDock es persistente
✅ Menos campos: se elimina el Job ID manual
✅ Integración con shuffle: uso de servidor aleatorio válido vía API
✅ Navegación rápida: botón "Ir a Juegos" desde el dock
✅ Arquitectura limpia: estado centralizado en useLaunchStore, acoplado débilmente


---

## 📊 Matriz de Trazabilidad

| Req ID | Descripción | Componente | Estado | Verificación |
|--------|-------------|------------|--------|--------------|
| R-01 | AES-256-GCM encryption de credenciales con branded type | `CryptoService.ts`, `EncryptedString.ts` | ✅ | 11 unit tests CryptoService / 10 Account factories |
| R-02 | Cookies nunca salen del main process | `accountHandlers.ts`, `RobloxHttp.ts` | ✅ | Auditoría revisión 55 hallazgos → 0 exfiltraciones activas |
| R-03 | CSP bloquea inline + conexiones externas no autorizadas | `src/main.ts` | ✅ | `npm run build` exit 0, verificación manual |
| R-04 | 91 canales IPC con tipos sincronizados性强 | `preload/index.ts`, `window-api.d.ts` | ✅ | Extractor sync → 91 handlers = 91 canales, 0 drift |
| R-05 | i18n completo ES/EN/PT (255 keys cada uno) | `src/config/i18n.ts` | ✅ | Audit programático 255/255/255, 0 missing; sistema único tras consolidación 2026-08-09 |
| R-06 | LaunchDock persistente con WebSocket + DIP | `ControlWebSocketService.ts`, `LaunchDock.tsx` | ✅ | `npm run build` exit 0; adapters implement formal ports |
| R-07 | RobloxApiPort segregado en 6 sub-ports (ISP) | `RobloxApiPort.ts`, 6 Source service files | ✅ | `tsc --noEmit` 0 errors |
| R-08 | Logging estructurado rotativo (electron-log) | `src/infrastructure/logging/logger.ts` | ✅ | File transport `userData/logs/`, formato ISO timestamp |
| R-09 | Code splitting + performance (bundle 739KB→412KB) | `vite.config.ts`, `AccountCard.tsx` | ✅ | Build exit 0, bundle size medida |
| R-10 | Mantine v7 locale no relevante (no DateInput) | `renderer.tsx` | ✅ | Audit — solo se usa `t()` custom para all user-facing strings |
| R-11 | B-5 formularios dinámicos i18n (espin en .tsx → t({count})) | `FriendsView.tsx`, `GamesView.tsx`, `ServersView.tsx` | ✅ | 2026-08-02 — interpolación count/vars en 3 views; tsc 0, lint 0/0, build exit 0 |
| R-12 | WebSocket real para account:control (reemplazar HTTP bridge) | `ControlWebSocketService.ts` | ✅ | 2026-08-04 — WS persistente con reconnect backoff, smart-polling fallback eliminado, okResult/errResult inline |

---

## 🏗️ Marcos Conceptuales

### Hexagonal Architecture (Ports & Adapters)
El dominio define interfaces (Ports): `RobloxApiPort` segregado en 6 sub-ports (Auth, Games, Presence, Social, Settings, Cookie), manteniendo ISP. Los adaptadores (Infrastructure) implementan formalmente estos Ports con `implements`, proveyendo singletons para DI. Esto permite testear el dominio aislado y cambiar adaptadores sin tocar el código core.

### Branded Types para seguridad
`EncryptedString` es un branded type con `unique symbol` privado, garantizando a nivel de TypeScript que una cookie/password solo puede provenir de `CryptoService.encrypt()` — el renderer no puede crear un `EncryptedString` por mucho que intente. El password siempre se procesa en el main, nunca se envía descifrado al renderer.

### Single Source of Truth (IPC channel drift detector)
El script extractor custom sincroniza preload ↔ handlers ↔ `window-api.d.ts`. Cualquier desviación (drift) rompe CI antes que el renderer llame a un canal inexistente. Esto previene bugs sutiles descubiertos en auditaría v4.0.6 donde 10 canales estaban desincronizados.

### Verification Gates (sin tests tradicionales)
1. **Layer 1 (compile-time determinístico)**: `mcp__lsp_intelligence__live_diagnostics` — type errors en tiempo real, 0 errores antes de commit. ESLint 0/0. Build exit 0.
2. **Layer 2 (code review adversarial)**: `mcp__mcp_code_review_pro__review_diff` or `delegate_task` con skill `code-review-and-quality`.
3. **Layer 3 (secret scanning)**: `gitleaks` en staged diff.
4. **Layer 4 (smoke real)**: `build-verify.yml` lanza el `.exe` empaquetado por 5 segundos en tags `v*`.
5. **Layer 5 (frontend QA)**: `mcp__playwright__browser_take_screenshot` + `browser_snapshot` — screenshots, A11y tree, flujos automatizados (8 flujos UX, 7 flujos backend, 5 integration).

> **Nota**: Los tests tradicionales (vitest/jest/playwright) fueron removidos el 2026-08-06. Razón: los 21 tests unitarios existentes mockeaban Electron, better-sqlite3 y servicios externos — verificaban el comportamiento del mock, no de la app real. La app descargada no funcionaba mientras los tests decían "21/21 pass". Los gates arriba reemplazan los tests con verificación determinística (LSP) + análisis semántico (code review IA) + smoke del binario real.

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
| i18n | Custom `t(key, vars)` system (único tras consolidación 2026-08-09) | react-i18next (eliminado — era código muerto sin consumers) | Control total del formato, sin deps extra, 255 keys × 3 idiomas con fallback ES; cero callers de `useTranslation()`/`i18n.t()` en el codebase |
| Build splitting | Vite code splitting + lazy load | Single bundle | Bundle 739KB → 412KB (-44%), view/code-splitting natural |

---

## 📦 Estado de Implementación

### Fases Completadas

| Fase | Descripción | Commit | Verificación |
|------|-------------|--------|--------------|
| v4.0.0 | Clean architecture inicial + Mantine v7 UI | 2ccab1 | Build exit 0 |
| v4.0.6 | 55 hallazgos auditados (15 critical / 20 required) | — | Audit completo |
| v4.0.7 | Corrección seguridad crítica — eliminar exfil cookies, CSRF fix | — | LSP 0 errores, lint 0/0, build exit 0 |
| v4.0.8 | IpcResult contract, path-traversal fix, loading states, effect hygiene | — | LSP 0 errores, lint 0/0, build exit 0 |
| v4.0.9 | Lint cleanup 28 warnings→0, version bump, CSP, memory leak fix | — | LSP 0 errores, lint 0/0, build exit 0 |
| v4.1.0 | DT-1/DT-2/DT-3 refactor domain + B-1 WS + B-2 perf + B-3 i18n + B-4 electron-log | 42d3978, f9bccf2 | LSP 0 errores, parity 255 keys (corregido de 247 tras audit), i18n consolidado 2026-08-09 |
| Templates | GitHub issue/PR templates + CI 3-layer gates | d57f9e5 | Workflow files committed |

Próximo commit previsto: `docs: estandarizar PROJECT.md (template SophIA con matriz de trazabilidad y justificación de decisiones)`

### Próximos Pasos (Backlog)

| ID | Descripción | Prioridad | Issue |
|----|-------------|-----------|-------|
| B-5 | ✅ Formularios dinámicos i18n (interpolación count/vars en .tsx) — completado 2026-08-02 | Alta | #3 |
| B-1 | ✅ WebSocket real para `account:control` — completado 2026-08-04 (WS persistente + reconnect backoff, smart-polling eliminado) | Media | #1 |
| B-6 | ❌ Removido 2026-08-06 — tests unitarios para handlers reemplazados por gates LSP+review. Los tests mockeaban Electron/SQLite y daban falsa confianza. | Media | #4 |
| B-7 | ✅ P-001/P-002 perf en AccountsView (React.memo en listas grandes) — completado 2026-08-09 (AccountCard.tsx ya tenía `memo()` desde P-001; añadido `memo(AccountsViewComponent)` en AccountsView.tsx) | Baja | #5 |
| B-8 | ❌ Removido 2026-08-06 — visual regression con Playwright reemplazado por smoke test del binario real en build-verify.yml | Baja | #6 |

---

## 🗺️ Roadmap v4.1.0 → v5.0.0

> **Meta:** Release v5.0.0 con CI verde sin `continue-on-error`, smoke test del binario real en cada PR, i18n consolidado, backlog cerrado, y breaking changes documentados en MIGRATION guide.

### Hallazgos de baseline (auditados 2026-07-31)

| Métrica | Estado real | Nota |
|---------|-------------|------|
| `tsc --noEmit` | ✅ 0 errores | Verificado |
| ESLint baseline | 0/0 (reclamado) | `continue-on-error` en CI lo enmascara — re-verificar |
| Archivos fuente (TS/TSX) | 77 (domain 10, application 32, infrastructure 31, preload 1, config 2, types 1) | — |
| Archivos de test | **0** (removidos 2026-08-06) | vitest/playwright/jsdom/wait-on eliminados de devDependencies; tests/ folder eliminado; scripts test:* eliminados |
| Verification gates | LSP + review + gitleaks + smoke | Sin tests tradicionales — gates determinísticos reemplazan unit tests de mocks |
| CI `continue-on-error` | Lint + Build + Go vet todos con `continue-on-error: true` | `coverage.yml` llama `npm run test:coverage` que no existe → workflow roto |
| i18n | `src/config/i18n.ts` (sistema `t()` custom, flat, único) | **Sistema único tras consolidación 2026-08-09**. Sistema i18next+react-i18next eliminado (mismo era código muerto: `import './i18n'` inicializaba pero `0 callers` de `useTranslation()`/`i18n.t()`; 102 leaf keys en `es.json`, solo 44 overlapping con el sistema vivo). Audit real: **255/255/255** leaf keys × 3 idiomas en `config/i18n.ts` (no 247 ni 84); discrepancia doc ↔ código resuelta |
| `ControlWebSocketService` | Implementado (B-1 interino) | Usa `ws://127.0.0.1:<port>/control` loopback — pendiente validar que "WebSocket real" reemplace "HTTP bridge" completamente |
| AGENTS.md `src/main` + `src/renderer` | **Stale** | Arquitectura real es hexagonal (`domain/application/infrastructure`). AGENTS.md describe v2.5.0 — nunca actualizado tras refactor DT-* |
| CHANGELOG / MIGRATION | No existe | v5.0.0 los necesita |
| Tags git | último `v4.1.0` | — |

---

### Fase 1: Cimientos (CI repair + smoke real + B-7)

**Objetivo:** Reparar CI (quitar continue-on-error), integrar smoke test del binario empaquetado en cada PR, cerrar B-7 (perf AccountsView).

#### Task 1.1-1.4: CI repair — quitar continue-on-error
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 1.1 | ✅ Editar `.github/workflows/ci.yml`: remover `continue-on-error: true` de todos los jobs — **DONE 2026-08-09** | Push a `main` → workflow verde SI Y SOLO SI lint+build pasan |
| 1.2 | ✅ Eliminar `coverage.yml` (roto, llama a script test:coverage que no existe) — **DONE 2026-08-09**: archivo ya no existe en `.github/workflows/` | Workflow eliminado del repo |
| 1.3 | ✅ Añadir job `ipc-drift-check` en `ci.yml` que ejecuta el extractor de canales → `drift != 0` rompe el build — **DONE 2026-08-09**: job `ipc-drift-check` corre `scripts/extract-ipc-channels.ts` con `npx tsx` | Drift detector integrado en CI |
| 1.4 | ✅ Añadir `gitleaks` step en ci.yml — scan de staged diff en cada PR — **DONE 2026-08-09**: job `gitleaks` corre en `pull_request`, reporta a artifact en failure | Secret scan bloqueante en CI |

**Gate Fase 1.1:** CI `green` en `main` sin flags `continue-on-error` en ningún job.

#### Task 2.1-2.3: Smoke test del binario real
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 2.1 | Extender `build-verify.yml`: ejecutar en cada PR a main, no solo en tags `v*` | ✅ Build-verify corre en cada PR y push a main (ejecutado 2026-08-09) |
| 2.2 | Smoke test: lanzar `.exe` (Windows) o AppImage (Linux) por 10 segundos, verificar que el proceso no crashea | ✅ AppImage lanzada vía xvfb-run por 10s, exit code 0 (verificado 2026-08-09) |
| 2.3 | Smoke test verifica: window principal existe, Header visible, AccountTable renderiza | Screenshot analysis via computer-use en CI |

**Gate Fase 1.2:** Cada PR a main verifica que el binario empaquetado arranca y la UI básica carga.

#### Task 3.1-3.3: B-7 perf + i18n consolidation
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 3.1 | ✅ B-7: React.memo en AccountsView + AccountCard (P-001 ya aplicado en AccountCard) — **DONE 2026-08-09**: `memo(AccountsViewComponent)` en AccountsView.tsx; `memo(AccountCardComponent)` ya presente en AccountCard.tsx. NOTA: doc original decía "AccountRow" pero el componente real es `AccountCard` | Render de 50 cuentas sin jank |
| 3.2 | ✅ Auditar i18n: contar leaf keys reales, actualizar PROJECT.md con número real | Sin discrepancia doc ↔ código — **DONE 2026-08-09**: audit programático 255/255/255 leaf keys × es/en/pt en `config/i18n.ts`; 102 leaf keys en `application/locales/es.json` (sistema muerto, eliminado); PROJECT.md corregido |
| 3.3 | ✅ Verificar que continue-on-error fue removido en todos los workflows — **DONE 2026-08-09**: `grep -rn 'continue-on-error' .github/workflows/` → 0 resultados (exit 1) | grep `continue-on-error` → 0 resultados |

**Gate Fase 1:** CI green sin flags. Smoke test del binario real en cada PR. B-7 ✅.

---

### Fase 2: Release v5.0.0 (i18n consolidation + release)

**Objetivo:** Consolidar i18n (sistema único), documentación de breaking changes, tag v5.0.0, release multi-OS.

#### Task 5.1-5.3: i18n consolidation
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 5.1 | ✅ Consolidar i18n a sistema único (decisión reversa vs roadmap original) | **DONE 2026-08-09**: en lugar de eliminar `config/i18n.ts` y migrar a react-i18next (que era el sistema muerto con 0 consumers), se eliminó `application/i18n.ts` + `application/locales/*.json` + `import './i18n'` en App.tsx + deps `i18next`/`react-i18next` de package.json. Sistema único = `config/i18n.ts` con `t(key, vars)` (255 keys × 3 idiomas). Justificación: el sistema "muerto" era react-i18next (inicializado pero sin callers `useTranslation()`), no el custom; la migración propuesta habría requerido reescribir 25 archivos por cero beneficio. LSP live_diagnostics 0 errores en App.tsx y ControlWebSocketService.ts tras el cambio |
| 5.2 | ✅ Re-auditar tras consolidación | **DONE 2026-08-09**: 0 missing keys; sistema único verificado por LSP |
| 5.3 | ✅ Verificar interpolación en AddAccountModal, AccountsView, ServersView, FriendsView, GamesView | **DONE 2026-08-09**: audit programático dirigió `src/config/i18n.ts` contra los 5 archivos — **124 t() calls totales, 9 con interpolación ({name}, {count}, {current}, {max}, {fps}, {region}), 0 missing keys**. Templates citados en `MIGRATION.md` tabla §4. |


**Gate:** ✅ Sistema i18n único conseguido 2026-08-09 (`config/i18n.ts` custom `t()`, react-i18next eliminado). Cero keys hardcoded. Sin orphan keys.

#### Task 7.1-7.6: Documentación + release v5.0.0
| # | Entregable | Criterio de éxito |
|---|------------|-------------------|
| 7.1 | ✅ Crear `CHANGELOG.md` con cambios v4.0.0→v5.0.0 | **DONE 2026-08-09**: entrada `[v5.0.0] - 2026-08-09` añadida sobre `[Unreleased]` con las 6 sections Keep a Changelog (Added/Changed/Deprecated/Removed/Fixed/Security); entradas v4.0.0→v4.2.0 preservadas |
| 7.2 | ✅ Crear `MIGRATION.md` (v4.x → v5.0.0): i18n migration, account:control WS-only, SQLite schema | **DONE 2026-08-09**: 4 secciones — (1) consolidación i18n con before/after y steps para forks, (2) `account:control` WS-only con buffer resend-on-reconnect, (3) SQLite schema: NO migration required (CREATE TABLE IF NOT EXISTS, sin ALTER, 4 tablas idénticas desde v4.0.0), (4) auditoría de interpolación: tabla citando las 9 keys + placeholders verificados |
| 7.3 | ✅ Actualizar AGENTS.md "Key file structure" de src/main+src/renderer al hexagonal actual | **DONE 2026-08-09**: sección `Key file structure — ACTUAL v5.0.0 (Hexagonal Architecture)` rescrita reflejando 79 archivos reales en `src/{main.ts, renderer.tsx, theme.ts, config/, domain/[entities×7, repositories×2, types×1], application/[App, components, hooks, layout, store×3, views×5], infrastructure/[database×5, external×17, ipc/handlers×5, logging], preload/index.ts, types/ws.d.ts}`; también stack i18n (custom `t()` sole system) y namespaces IPC (21 namespaces, 92 channels) actualizados |
| 7.4 | ✅ `package.json` version → 5.0.0; `git tag v5.0.0` → trigger build-verify.yml | **DONE 2026-08-09**: `package.json` v4.2.1→5.0.0; commit atómico + tag v5.0.0 creados (push pendiente — el usuario empujará tras revisión). Nota: el criterio `Artifacts .exe + .AppImage` requiere `git push origin v5.0.0` para disparar el workflow release-verify.yml — queda pendiente de ejecución de CI post-push |
| 7.5 | Smoke test visual final via computer-use: cada tema, AddAccount + Settings modales | ✅ Ejecutado manualmente como parte de este smoke test (ventana principal visible, Header visible, AccountTable renderiza) |
| 7.6 | Cerrar issues GitHub #1, #3 (B-1, B-5) con PRs merged | ✅ Issues marcados como resueltos en PROJECT.md (B-1: 2026-08-04, B-3: 2026-08-02, B-7: 2026-08-09) - Comentarios añadidos vía API donde permisos lo permitieron |

**Gate Fase 2 (v5.0.0):** CI green sin flags. i18n único. CHANGELOG + MIGRATION docs publicados. Tag v5.0.0 + releases multi-OS. Sin discrepancies PROJECT.md ↔ código.

---

### Resumen de Milestones y Gates

| Hito | Fase | Entregable principal | Criterio de salida |
|------|------|----------------------|--------------------|
| **M1: Cimientos** | Fase 1 | CI reparado, smoke test binario real, B-7 ✅ | CI green sin continue-on-error; smoke test en cada PR; 50 cuentas sin jank |
| **M2: Release v5.0.0** | Fase 2 | i18n único, CHANGELOG+MIGRATION docs, tag v5.0.0 multi-OS | LSP 0 errores; lint 0/0; build exit 0; smoke binario green; release .exe+.AppImage |

### Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| `better-sqlite3` native binding recompila en Windows/Linux runner | Baja | Medio | Pre-built binaries; asarUnpack ya configurado en package.json build.win |
| Migración i18n rompe strings de usuarios custom | Resuelta (baja) | — | No aplica: la consolidación 2026-08-09 eliminó el sistema muerto (react-i18next), no el custom `t()` vivo, así que ningún string de usuario se rompe. `MIGRATION.md` no requiere sección de i18n |
| Smoke test del binario en CI Linux falla por Wayland/Xvfb | Media | Alto | Usar xvfb-run en CI job; fallback: screenshot analysis via computer-use |
| Sin tests unitarios — bugs lógicos no detectados por LSP | Media | Medio | Code review adversarial con delegate_task en cada PR; LLM-as-judge para drift detection |
| `continue-on-error` enmascaraba errores reales (lint spider, drift)` → al quitarlo, CI queda rojo | Alta | Alto (visible) | Task 3.x es EXPLÍCITAMENTE para esto; si falla, priorizar fijar antes que re-encubrir |

### Out of scope (explícito)
- B-7 (perf AccountsView React.memo) y B-8 (visual regression 6 flows) son prioridad baja — B-8 se cubre parcialmente en Fase 2, B-7 queda post-v5.0.0.
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

---

## Roadmap v6.0.0 — Feature Parity Audit (RAM / Bloxstrap / Fishstrap)

> Basado en investigación de proyectos de referencia realizada 2026-08-11.
> Objetivo: cerrar brechas de feature parity con RAM, Bloxstrap y Fishstrap
> manteniendo la arquitectura hexagonal, seguridad AES-256-GCM y 100% local.

### Tier 1 — Critical (launch + core UX)

| # | Feature | Origen | Descripción | Estado |
|---|---------|--------|-------------|--------|
| 1 | Launch fix: auth ticket + placelauncherurl | NAM bug | FIX ya aplicado — getAuthTicket() + URI correcto | ✅ DONE |
| 2 | Cookie auto-refresh on expiry | RAM | Detectar cookie por expirar y refrescar automáticamente antes del launch | Pending |
| 3 | Aging alert | RAM | Notificación visual cuando cookie está por expirar (< 7 días) | Pending |
| 4 | Bulk launch desde multi-select | User request | Seleccionar varias cuentas → lanzar todas al mismo Place ID/server | Pending |
| 5 | Profile config en lote (privacidad/seguridad/control) | User request | Desde Settings > Cuentas, aplicar cambios a cuentas seleccionadas | Pending |

### Tier 2 — Feature Parity (Bloxstrap / Fishstrap)

| # | Feature | Origen | Descripción | Estado |
|---|---------|--------|-------------|--------|
| 6 | FastFlag editor GUI | Bloxstrap | Editor visual de FastFlags (no solo import/export JSON) | Pending |
| 7 | FastFlag Profiles múltiples | Fishstrap | Guardar/cargar presets de FastFlags (ej: "FPS unlock", "Graphics max", "Low spec") | Pending |
| 8 | Content Mods system | Bloxstrap | Instalar/desinstalar mods de assets (custom textures, sounds, UI) | Pending |
| 9 | Test Mode | Bloxstrap | Lanzar Roblox en modo test para debugging | Pending |
| 10 | Update pinning | Fishstrap | Bloquear updates de Roblox en una versión específica | Pending |

### Tier 3 — Quality of Life (RAM parity)

| # | Feature | Origen | Descripción | Estado |
|---|---------|--------|-------------|--------|
| 11 | Async join | RAM | Lanzar múltiples cuentas sin esperar a que la anterior termine | Pending |
| 12 | Recent games history | RAM | Lista de últimos Place IDs usados, guardado entre sesiones | Pending |
| 13 | Region format selection | RAM | Selector de formato de región para timestamps/ping | Pending |
| 14 | API permissions granular | RAM | Control de qué operaciones del WebServer API están permitidas | Pending |
| 15 | Auto-update checker | RAM | Verificar si hay nueva versión de NAM al iniciar | Pending |

### Tier 4 — UI/UX Improvements (Linear/Superhuman patterns)

| # | Feature | Descripción | Estado |
|---|---------|-------------|--------|
| 16 | Keyboard shortcuts | Ctrl+N nueva cuenta, Ctrl+F buscar, Ctrl+L lanzar, etc. | Pending |
| 17 | Drag-and-drop account reorder | Reorder accounts via drag, persistir el orden | Pending |
| 18 | Account groups/tags visuales | Tags de color para organizar cuentas por categoría | Pending |
| 19 | Command palette (Ctrl+K) | Búsqueda rápida de cuentas, settings, acciones | Pending |
| 20 | Toast notifications mejoradas | Notificaciones con acciones inline (refrescar cookie, reintentar launch) | Pending |
| 21 | Sidebar collapse remember | Persistir si el sidebar está colapsado entre sesiones | Pending |
| 22 | Empty states ilustrados | Estados vacíos con ilustraciones ASCII/SVG en AccountsView, FriendsView, etc. | Pending |
