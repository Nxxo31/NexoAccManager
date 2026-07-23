# NexoAccManager — PROJECT.md

# Última actualización: 2026-07-23 (v4.0.0 — Migración Mantine v7 + mitigaciones Defender + E2E Electron)

# Versión actual: 4.0.0 (Clean/Hexagonal Architecture — Mantine v7 UI)

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 4.0.0 |
| UI Library | Mantine v7 (reemplaza Tailwind) |
| tsc | ✓ 0 errores |
| Tests | E2E Electron Playwright configurado (smoke + accounts) |
| LSP | 0 errores, 0 warnings |
| Build | AppImage + Snap + NSIS .exe (81MB) con mitigaciones Defender |
| LOC | ~3,900 líneas en 56 archivos |
| Rama activa | main (commit bafdcb1) |
| Release GitHub | v4.0.0 — artifacts subidos |
| Defender | Mitigado: asarUnpack, sign hook (skip elevate.exe), signingHashAlgorithms sha256, signAndEditExecutable false |
| E2E | Playwright Electron fixture + smoke + accounts specs |
| Skill | desktop-ui-professional creado (Mantine v7 patterns + Defender mitigation) |

## Investigación de patrones UI (2026-07-20) — Documentado

**Metodología:** análisis visual directo (vision_analyze) de RAM original + extracción de design systems oficiales + comparativa con herramientas similares.

### Comparativa de herramientas

| Herramienta | Stack | Patrón UI | Layout | Veredicto |
|-------------|-------|-----------|--------|-----------|
| RAM v3.7 (ic3w0lf22) | C# WinForms | Master-Detail + Floating Panels | Sidebar izq (lista cuentas) + centro (detail+actions) + derecha (server list tabs) + bottom flotantes (utilities/login/theme editor) | Demasiado denso; paneles flotantes anti-patrón en Electron |
| RAM v2.6 (older) | C# WinForms | Three-Window Fragmented | 3 ventanas independientes (tabla cuentas / server list / login embebido) | Fragmentación — UX roto |
| Bloxstrap | C# WPF (WPF UI fork) | Sidebar Settings + Content Area | Sidebar izq (categorías) + content area (opciones por categoría) | NO es account manager — es bootstrapper. No aplica para multi-cuenta |

### Patrón canónico documentado (fuentes primarias)

- **Material Design 3 — List-Detail canonical layout**  
  Fuente: https://m3.material.io/foundations/layout/canonical-examples/list-detail  
  "Use when browsing a list of items where each has detailed content (email, file browser, contacts)."
- **Microsoft List/details pattern**  
  Fuente: https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/list-details  
  "The list/detail pattern displays a list of items and the details for the currently selected item. This pattern is suitable for email, contact lists, and account management."
- **Apple HIG — Split View (sidebar + detail)**  
  Fuente: https://developer.apple.com/design/human-interface-guidelines/layout  
  Sidebar navegacional + detail panel estándar macOS.

### Patrón Adoptado por NX-Manager: Master-Detail + Sidebar Navigation (hybrid)

**Justificación:** Material Design 3 y Microsoft List/details canonizan el patrón list-detail para account managers. Discord, VS Code, Slack usan variantes del mismo patrón. RAM original lo usa pero con anti-patrones (paneles flotantes).

**Traducción a componentes React:**

```
┌──────────────────────────────────────────────────────┐
│ TopBar (h-12)  [theme toggle] [settings gear]        │
├─────────────┬────────────────────────────────────────┤
│ Sidebar     │ Content Area (swappable)               │
│ (200-260px) │                                        │
│             │ ┌────────────────────────────────────┐ │
│ [Accounts]  │ │ AccountsView  (hub principal)     │ │
│ [Servers]   │ │  ├─ Toolbar (search + "Iniciar")  │ │
│ [Games]     │ │  ├─ AccountGrid (Master)          │ │
│ [Friends]   │ │  │   └─ AccountRow (detail inline)│ │
│ [Settings]  │ │  └─ JoinBar (Place/Job/Unirse)    │ │
│             │ ├────────────────────────────────────┤ │
│ ───────     │ │ ServersView/GamesView/FriendsView │ │
│ Quick       │ │ /SettingsView según nav           │ │
│ Accounts    │ │                                    │ │
│             │ │                                    │ │
│ Count: 2/50 │ │                                    │ │
└─────────────┴────────────────────────────────────────┘
```

### Anti-patrones a evitar

| Anti-patrón | Razón |
|-------------|-------|
| Ventanas flotantes como en RAM v3 | Se pierden detrás del main window; en Electron rompe el workflow |
| Toolbar global con todas las actions | Perder contexto — ¿a qué cuenta aplican? |
| Tabs horizontales para nav principal | No escala con >5 items |
| Grid denso Tipo tabla 3-col con font 12px | Lookup lento; illegible |
| Acciones ocultas en context menu | Discoverability nula |
| Sin empty state | Usuario no sabe qué hacer |

---

## Modelo y Arquitectura Backend v4.0.0 (2026-07-22) — Clean/Hexagonal Architecture

**Decisión:** reescritura completa del backend con Clean/Hexagonal Architecture. El código pasó de 18K+ líneas (v3.5.0 con Facade Pattern) a 3,825 líneas en 54 archivos (−79% main process). Responde al objetivo de tener la app equivalente a RAM v3.7 con arquitectura moderna, código minimalista y separación de responsabilidades clara.

**Patrón:** Clean Architecture / Hexagonal Architecture (Ports & Adapters) — el dominio no depende de nada externo; la infra implementa los ports; la aplicación consume los use-cases.
- Fuente canónica: "Clean Architecture" Robert C. Martin — dependency rule apunta siempre hacia adentro
- Documentación Microsoft: "Clean Architecture in .NET" https://learn.microsoft.com/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/
- Investigación de patrones UI (2026-07-20) documentada arriba — mantiene vigencia

### Engañación actual del código

```
src/
  domain/                          ← núcleo — sin dependencias externas
    entities/
      Account.ts                  ← interface Account + createAccount() factory (69L)
      ServerInfo.ts                ← entidad server Roblox
      PresenceData.ts             ← entidad presencia (45L)
      GameData.ts                  ← entidad juego favorito/reciente
    repositories/
      RepositoryInterfaces.ts      ← AccountRepository, SettingsRepository, CacheRepository (38L)
      RobloxApiPort.ts             ← port de APIs Roblox (58L — 35 métodos)

  infrastructure/                  ← adaptadores externos — implementa ports del domain
    database/
      DatabaseManager.ts           ← SQLite con better-sqlite3 (80L — createTables, getDb, closeDb)
      AccountRepositoryImpl.ts     ← impl AccountRepository (179L — CRUD + mappers rowToAccount)
      SettingsRepositoryImpl.ts     ← impl SettingsRepository (43L — get/set/delete settings)
      CryptoService.ts              ← AES-256-GCM encrypt/decrypt/hashCookie (42L)
      LRUCache.ts                   ← cache con eviction LRU (46L)
    external/
      RobloxHttp.ts                ← shared: httpClient + cookieHeader + getCsrfToken + apiGet/apiPost (69L)
      RobloxAuthService.ts         ← loginBrowser, loginUserPass, verifyCookie, importCookies (163L)
      RobloxGamesService.ts        ← searchGames, getGameServers, getServerUsers, getOutfits, getUniverses, detectVIPServers, shuffleJobId (145L)
      RobloxPresenceService.ts     ← getPresence, getFriends, getFriendRequests, followUser, getBlockedUsers, getRobuxBalance, getRecentGames (130L)
      RobloxSettingsService.ts     ← getProfile, updateProfile, 2FA, sessions, logout, privacy, notifications (60L)
      RobloxCookieService.ts       ← getCookieExpiry, refreshCookie (71L)
      RobloxBottingService.ts      ← killAllRoblox, launchRobloxDirect, startBotting, stopBotting, joinGroup, autoRelaunch, connectionWatcher, FPSUnlock, closeBeta, preventDuplicates (331L)
      MultiRobloxService.ts        ← launchMulti, killInstance, getRunningInstances (42L)
      CaptchaService.ts             ← solveCaptcha (Nopecha API)
      LocalApiService.ts            ← Express HTTP server local
      ThemeService.ts               ← getTheme, setTheme — CSS variables en :root (141L)
    ipc/
      IPCAdapter.ts                ← UN SOLO ARCHIVO con todos los ipcMain.handle (380L — 75 handlers)

  application/                     ← UI — React + Zustand
    App.tsx                        ← root: Sidebar + TopBar + ContentArea + AddAccountModal (62L)
    views/
      AccountsView.tsx             ← hub: grid + Reorder drag-drop + JoinBar + detail panel (168L)
      ServersView.tsx              ← server browser (36L)
      GamesView.tsx                ← search + favorites (39L)
      FriendsView.tsx              ← friends list + presence (stub)
      SettingsView.tsx             ← theme + language (56L)
    layout/
      Sidebar.tsx                  ← nav 5 items + collapsible + counter (57L)
      TopBar.tsx                   ← search + add + theme toggle (35L)
      ContentArea.tsx              ← switch views by activeView (26L)
    components/
      accounts/AccountCard.tsx     ← card con avatar, username, grupo, favorite, aging (62L)
      AccountDetailPanel.tsx      ← slide-in panel con acciones de cuenta (87L)
      AddAccountModal.tsx          ← 3 tabs: browser login, cookie, bulk import (140L)
      ServerBrowser.tsx            ← server list
      NotificationBar.tsx          ← toast system (34L)
      ErrorBoundary.tsx
      ui/                          ← primitivos: button, input, card, badge, badge, ModalShell
    store/
      accountStore.ts              ← Zustand: accounts, selectedId, setAccounts, add, remove, update (33L)
      uiStore.ts                   ← Zustand: activeView, activeModal, notifications + notify/dismiss (37L)
    hooks/
      useAccounts.ts               ← loadAccounts, addAccount, removeAccount, loginBrowser (68L)
    window-api.d.ts                ← tipos de window.api (99L)

  config/
    constants.ts                   ← MAX_ACCOUNTS=50, PAGES, PageKey (17L)
    i18n.ts                        ← i18next setup (102L)

  preload/
    index.ts                       ← contextBridge: account, roblox, presence, settings, botting, games, advanced, cookie, captcha, theme, shell (135L)

  main.ts                          ← Electron: createWindow + registerHandlers + quit (74L)
  renderer.tsx                     ← React root entrypoint
```

---

### Gap Analysis — RAM v3.7 features vs NX-Manager v4.0.0

**Fuente:** README.md del repo ic3w0lf22/Roblox-Account-Manager (features table oficial + código)

| # | Feature RAM | Estado NX-Manager v4 | Implementación |
|---|-------------|---------------------|----------------|
| 1 | Account Encryption (local) | ✅ | `CryptoService.ts` — AES-256-GCM (42L) |
| 2 | Add Account (browser login) | ✅ | `RobloxAuthService.loginBrowser()` — BrowserWindow polling cookies |
| 3 | Add Account (user:pass) | ✅ | `RobloxAuthService.loginUserPass()` — BrowserWindow + form injection |
| 4 | Import Cookies | ✅ | `RobloxAuthService.importCookies()` |
| 5 | Bulk User Importing | ✅ | `IPCAdapter.ts` handler `account:bulk-import` — loop loginUserPass |
| 6 | Multi Roblox | ✅ | `MultiRobloxService.ts` — launchMulti, killInstance, getRunningInstances (42L) |
| 7 | Server List | ✅ | `RobloxGamesService.getGameServers()` |
| 8 | Join Small Servers | ✅ | `IPCAdapter.ts` handler `roblox:launch` — placeId + jobId |
| 9 | Join VIP Servers | ✅ | `RobloxGamesService.detectVIPServers()` |
| 10 | Load Region | ✅ | `RobloxGamesService.getServerRegion()` |
| 11 | Player Finder | ✅ | `RobloxGamesService.getServerUsers()` |
| 12 | Games List | ✅ | `RobloxGamesService.searchGames()` |
| 13 | Favorite Games | ✅ | `AccountRepositoryImpl.saveFavoriteGame/getFavoriteGames/removeFavoriteGame` |
| 14 | Recent Games | ✅ | `RobloxPresenceService.getRecentGames()` + `AccountRepositoryImpl.saveRecentGame` |
| 15 | Save PlaceId & JobId | ✅ | `Account.savedPlaceId/savedJobId` + `account:field:set` handler |
| 16 | Shuffle JobId | ✅ | `RobloxGamesService.shuffleJobId()` |
| 17 | Open Browser | ✅ | `roblox:launch` con placeId opcional |
| 18 | Account Utilities | ✅ | `RobloxSettingsService` — profile, privacy, security, notifications |
| 19 | Account Sorting | ✅ | `AccountsView` — Reorder.Group drag-drop framer-motion |
| 20 | Account Grouping | ✅ | `Account.group` + `AccountsView` group map |
| 21 | Group Sorting | ✅ | `account:move` handler |
| 22 | Password Encryption | ✅ | `account:savePassword` → `encrypt(password)` |
| 23 | Cookie Refresh | ✅ | `RobloxCookieService.refreshCookie()` + `cookie:refresh` handler |
| 24 | Quick Log In | ✅ | `roblox:launch` directo desde AccountCard |
| 25 | Join Group | ✅ | `RobloxBottingService.joinGroup()` |
| 26 | Auto Relaunch | ✅ | `RobloxBottingService.setAutoRelaunch()` — interval + presence check |
| 27 | Prevent Duplicates | ✅ | `RobloxBottingService.setPreventDuplicates()` + `canLaunchWithCookieHash()` |
| 28 | Connection Loss Detection | ✅ | `RobloxBottingService.setConnectionWatcher()` — presence polling |
| 29 | Close Roblox Beta | ✅ | `RobloxBottingService.setCloseBeta()` |
| 30 | FPS Unlocker | ✅ | `RobloxBottingService.setFPSUnlock()` — ClientAppSettings.json |
| 31 | Sort by Usage Date | ✅ | `Account.lastUsed` + `agingDays()` en AccountsView |
| 32 | Themes | ✅ | `ThemeService.ts` — getTheme/setTheme (141L) |
| 33 | Developer Mode | ⚠️ Stub | `advanced:devmode` handler — TODO: persistir en settings DB |
| 34 | Local Web API | ✅ | `LocalApiService.ts` — Express server start/stop |
| 35 | Account Control | ⚠️ Stub | Sin WebSocket implementado — solo handler vacío |
| 36 | Rbx-player Link | ✅ | `RobloxBottingService.launchRobloxDirect()` — roblox-player:// protocol |
| 37 | Outfit Viewer | ✅ | `RobloxGamesService.getOutfits()` |
| 38 | Universe Viewer | ✅ | `RobloxGamesService.getUniverses()` |
| 39 | AI Captcha Assistance | ✅ | `CaptchaService.ts` — solveCaptcha vía Nopecha API |

---

### Flujo de información — Clean Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Application Layer (React + Zustand)                    │
│  App.tsx → Sidebar + TopBar + ContentArea → Views       │
│  useAccounts hook → window.api.* → preload contextBridge │
└────────────────────────┬────────────────────────────────┘
                         │ invoke/handle (IPC)
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Infrastructure: IPCAdapter.ts (380L — 75 handlers)     │
│  Valida input → llama servicio/infra → retorna IpcResult│
│  ok(data) / err(message) — nunca throw                  │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│ Repositories │ │ RobloxHttp   │ │ Roblox Services      │
│ (database/)  │ │ apiGet/apiPost│ │ (external/)         │
│ Account/     │ │ csrfCookie   │ │ Auth, Games, Servers │
│ Settings/    │ │ 401/403 catch │ │ Presence, Settings  │
│ Crypto/LRU   │ │              │ │ Botting, Cookie, etc │
└──────────────┘ └──────────────┘ └──────────────────────┘
              │          │          │
              ▼          ▼          ▼
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (sin dependencias externas)               │
│  entities: Account, ServerInfo, PresenceData, GameData   │
│  repositories: AccountRepository, SettingsRepository    │
│  ports: RobloxApiPort (35 métodos de API Roblox)        │
└─────────────────────────────────────────────────────────┘
```

**Dependency rule:** el dominio no importa nada de infra o aplicación. La infraestructura implementa los interfaces del dominio (AccountRepositoryImpl implementa AccountRepository). Los servicios externos implementan RobloxApiPort implícitamente (duck typing via exports de funciones).

**Shared HTTP:** `RobloxHttp.ts` centraliza CSRF token, cookie header construction, y 401/403 error handling — elimina la duplicación que tenía el código anterior (6 copias de CSRF, 22+ de cookie header).

---


## Spec v3.3.0 — UI coherente y minimalista (Basado en investigación)
### Objetivo
Alinear la UI actual con el patrón Master-Detail + Sidebar Navigation canonizado, aplicando design tokens consistentes y uni-form visual minimalista.

### Interfaces
- Mantener APIs actuales (sin cambios backend)
- AccountsView como hub principal con toolbar inline
- AccountGrid + AccountRow preservados (ya funcionan)
- Sidebar como pura navegación + lista rápida + contador

### State Flow
1. Usuario abre app → default view `accounts` → AccountsView renderiza
2. Si `accounts.length === 0` → Empty state hero centrado con botón "Iniciar sesión"
3. Si hay cuentas → Toolbar con buscador + botón "Iniciar sesión" + AccountGrid abajo
4. Click en nav item (Servers/Games/Friends/Settings) → cambia `activeView` en useUIStore
5. ContentArea renderiza vista correspondiente

### Error Cases
- Empty state: hero con ícono + "No hay cuentas agregadas" + botón CTA "Iniciar sesión"
- Loading state: AccountRow muestra spinner en actions
- Error login: NotificationBar toast con tipo `error`
- Error join: NotificationBar toast con tipo `error`
- Cuenta seleccionada inválida: toast warning + reset selección

### Non-Functional Requirements
- Performance: Render 50 cuentas < 50ms
- Animaciones: 200ms ease-in-out para view transitions (framer-motion)
- Accesibilidad: WCAG AA, keyboard nav entre nav items (Tab), focus visible
- Tipografía: 3 niveles — display 18px, body 14px, mono-data 12px
- Espaciado: base 4px (Tailwind scale)

### Design Tokens (CSS variables existentes en index.css)
- `--bg-card`, `--bg-surface`, `--bg-elevated` — backgrounds
- `--text-primary`, `--text-secondary`, `--text-tertiary` — text hierarchy
- `--primary` (configurable accent), `--border` — accents
- `--font-size-base: 14px`, `--font-size-sm: 12px`, `--font-size-xs: 11px`

### Test Cases (TDD plan — deben fallar primero)
1. `describe('AccountsView') / it('shows empty state hero when accounts is empty')`
2. `describe('AccountsView') / it('renders toolbar with search and login button when accounts exist')`
3. `describe('AccountsView') / it('filters accounts by search query')`
4. `describe('AccountsView') / it('shows JoinBar with Place ID, Job ID, account select and Unirse button')`
5. `describe('Sidebar') / it('shows 5 nav items: Accounts, Servers, Games, Friends, Settings')`
6. `describe('Sidebar') / it('sets activeView when clicking a nav item')`
7. `describe('Sidebar') / it('shows quick accounts list when showAccounts is true')`
8. `describe('Sidebar') / it('shows account count 2/50 in footer')`
9. `describe('AppLayout') / it('renders sidebar + topbar + content area')`
10. `describe('AppLayout') / it('swaps content area based on activeView from useUIStore')`

### Non-goals (explícito)
- NO mover search a la sidebar (vive en AccountsView)
- NO agregar tabs horizontales
- NO crear ventanas flotantes como RAM original
- NO refactor del backend en esta fase (Facade Pattern va en v3.4.0)
- NO añadir nuevas features — solo coherencia visual

### Acceptance Criteria
- [ ] Sidebar tiene 5 nav items claramente visibles
- [ ] AccountsView muestra empty state hero cuando no hay cuentas
- [ ] AccountsView muestra toolbar (search + "Iniciar sesión" + join) cuando hay cuentas
- [ ] Cambio de vista ocurre en <200ms con framer-motion transition
- [ ] tsc 0 errores, vitest 131+ pasando, lint 0 errors
- [ ] Build Windows NSIS generado y funcional

---

## Protocolo de desarrollo anti-sesgo semántico (aplicable a todo proyecto)

**Problema resuelto:** los tests pueden pasar porque validan comportamiento semántico (el handler existe, no falla) sin validar comportamiento real del backend (la cookie se trimea, el dominio se valida, el endpoint responde 401 vs 403).

**Ciclo obligatorio (8 fases del dev profile + systematic-debugging):**

0. **Análisis** — Lee PROJECT.md + tarea + código afectado. Si ambiguo: PIDE ACLARACIÓN.
1. **Diseño técnico** — Estructura + interfaces + dependencias + plan de testing.
1.5. **Spec + TDD plan** — Spec en PROJECT.md (no SPEC.md separado). Enumera tests que DEBEN fallar antes de implementar. Escribe tests ROJOS primero.
2. **Implementación** — Cambio mínimo, explícito sobre astuto. `write_file` > `sed` multilínea. LSP se ejecuta en cada escritura.
3. **LSP + Code review gate** — `hermes lsp status` + arregla diagnostics ≥ error. Despacha subagente revisor con SOLO el diff (sin contexto compartido). Veredicto JSON. Si rechaza: max 2 ciclos de auto-fix, luego escala.
3.5. **Spec validation (drift check)** — Compara código vs spec en PROJECT.md. Drift crítico → DETÉNTE.
4. **Auto-revisión** — Carga `verification-before-completion`. Verifica con salida real, no suposiciones.
5. **Validación + preview visual** — LSP clean + typecheck + lint + tests + browser_vision si tocaste UI.
6. **Documentación + trazabilidad** — Actualiza PROJECT.md + escribe Dev Handoff section.
7. **Commit + push + preview deploy** — `git commit -m "tipo(scope): descripcion"` + push + URL preview en PROJECT.md.

**Punto crítico:** Fase 5 valida con SALIDA REAL. Si es login flow: prueba con cookie real de Roblox, no mock. Si es UI: captura con browser_vision y compara con spec. Si es backend: ejecuta el handler y verifica el response shape.

---

## v3.2.0 — UI rework + NotificationBar + branding

- **UI shell nuevo**: Sidebar lateral (accounts slicer con búsqueda, login directo, inline group edit, drag-drop, collapse), TopBar mínima (theme + settings), AppLayout con NotificationBar fuera del flujo. JoinBar eliminado. Tests: Sidebar (11), TopBar (7).
- **NotificationBar toast system**: useUIStore con AppNotification + add/dismiss/clear. Component con framer-motion, 5 tipos (info/success/warning/error/loading), auto-dismiss configurable. Login flow integrado con notificaciones loading/success/error.
- **GamesView reescrito limpio (159 líneas)**: búsqueda via IPC roblox:games:search, selección de cuenta, ServerView reuse al seleccionar juego.
- **Botting IPC expuesto**: botting:start/stop/getStatus/setInterval añadidos a IpcChannel union, ALLOWED_CHANNELS y Api interface en preload.ts. Handlers ya existían en main.ts.
- **settings:notifications:\* añadidos al IpcChannel union** (faltaban; causaban error TS2769).
- **Renombrado NX-Manager**: main.ts (window title + tray label), LoginBrowserService.ts (login window title), package.json (nsis.shortcutName), locales es/en/pt (header.title). CryptoService salt PRESERVADA (rompería cookies existentes).
- **tsconfig.json**: moduleResolution: bundler, paths only (sin baseUrl) — requerido para TypeScript 5.9.3.
- **AGENTS.md**: documentado LSP en WSL (cliente solo conecta con editor abierto; tsc como source of truth).
- **.github/workflows/code-review.yml**: PR checks (tsc, lint, vitest, coverage, build).

## Resumen de características completadas

### ✅ Fase 1 — Reparar y conectar frontend a backend (PRIORIDAD ALTA)

- **FriendsHubView**: Conectado al backend real vía IPC `account:friends:list`, `account:friends:requests`, `account:friends:respond`, `account:follow:user`, `account:unfollow:user`, presencia polling cada 30s, botón de perfil. Muestra amigos, solicitudes de seguidores y seguidores con estados de presencia en tiempo real.
- **Tema claro**: Funcionando correctamente. Toggle en TopBar cambia entre oscuro y claro con variables CSS definidas en `themeDefinitions.ts` y aplicadas por `ThemeService`.
- **Save/Copy Password**: Flujo completo end-to-end:
  - Backend: IPC `account:savePassword` y `account:getPassword` con cifrado AES-256-GCM.
  - UI: Toggle global en SettingsView (`savePasswords`).
  - Detalle de cuenta: Sección de contraseña en AccountDetailPanel que aparece cuando `savePasswords=true`, permite guardar y copiar contraseña.
  - Verificado: tsc 0 errores, vitest 121/121.
- **Multi-selección en AccountGrid**: Ctrl+click para toggle individual, Shift+click para rango, selección visual con anillo azul. Acciones grupales:
  - Lanzamiento grupal: pide Place ID/Job ID opcional.
  - Cierre grupal: usa `roblox:kill-all` con confirmación.
  - Favoritos: toggle de estrella por cuenta persiste en base de datos vía IPC `account:setFavorite`.
- **Kill All funcional**: IPC `roblox:kill-all` conectado a `MultiRobloxService.killAll()` que usa `taskkill`/`pkill` para terminar todos los procesos de Roblox.
- **Persistencia de favoritos**: IPC `account:setFavorite` conectado a `AccountManager.setAccountField(accountId, 'isFavorite', boolean)`, almacena en base de datos SQLite.

### ✅ Fase 2 — Características del ecosistema Roblox (PRIORIDAD MEDIA)

- **Botting Mode**: Servicio completo con disclaimer explícito de riesgo de ban de ToS.
  - Backend: `BottingService.ts` con timers configurables, verificación de presencia para evitar relanzar cuentas ya en juego, IPC handlers (`botting:start`, `botting:stop`, `botting:getStatus`, `botting:setInterval`).
  - UI: Toggle en SettingsView con campo de intervalo (minutos) y modal de disclaimer que requiere aceptación explícita ("Usuario asume riesgo de ban").
  - Estado: Servicio iniciable desde UI, visible en barra de estado cuando activo.

### ✅ Características adicionales completadas

- **Groups UI**: Separadores visuales en AccountGrid con nombre de grupo y contador, dropdown en AccountDetailPanel para mover cuenta entre grupos.
- **Drag-drop sorting**: Cuentas reordenables con persistencia en store.
- **Recent Games**: Historial de juegos jugados accesible desde JoinBar y GamesView.
- **Favorite Games**: Marcado con estrella en GamesView, persistente en base de datos.
- **Presence UI**: Detalle de juego actual (Place ID, Job ID, nombre) en AccountDetailPanel y FriendsHubView.
- **Auto Relaunch / Connection Watcher / Prevent Duplicate Instances**: Toggles globales en SettingsView con persistencia.
- **Outfit Viewer**: Modal en DetailPanel que muestra el outfit actual del avatar mediante `roblox:getAvatar` API.
- **Local Web API**: Servidor HTTP local con endpoints `/launch`, `/join`, `/accounts`, `/presences`, configurable en SettingsView.
- **Join Group**: Unirse a grupos de Roblox con múltiples cuentas simultáneamente.

## Pendiente

### 🟡 Stubs a completar
- **Developer Mode** (`advanced:devmode`): handler existe pero no persiste el state en settings DB
- **Account Control**: WebSocket para remote control de cuentas in-game — solo handler vacío

### 🔵 Próximos pasos
- Build Windows NSIS
- Release v4.0.0 en GitHub
- Merge `refactor/clean-architecture-v4` a `main`

## Decisiones técnicas validadas

1. **contextIsolation: true + nodeIntegration: false** — Respetado en todo el código base, solo uso de `contextBridge` en `preload.ts`.
2. **Nunca exposición de `ipcRenderer`** — Todas las llamadas usan `window.api` expuesta vía preload, verificado en auditoría.
3. **Cifrado AES-256-GCM** — Cookies y contraseñas nunca quedan en texto plano en disco.
4. **Resultado IPC estandarizado** — Todos los handlers retornan `{ success, data }` o `{ success: false, error }`, nunca lanzan excepciones sin capturar.
5. **Whitelist de canales IPC** — `preload.ts` y `main.ts` usan `Set<string>` con sintaxis literal de template (`'channel:name'`) para evitar errores de unión de tipos.
6. **Patrón de ventana única sin routing** — Modales vía estado `activeModal` en App.tsx, sin react-router-dom.

## Nota
Este documento es la única fuente de verdad del estado del proyecto. Código gana sobre documentación en caso de conflicto, pero documentación debe actualizarse inmediatamente después de cada cambio significativo.
## Spec: Fix cookie validation in LoginBrowserService

### Objective
Fix intermittent 'Cookie inválido o expirada' error during login by ensuring the captured cookie is properly trimmed and validated for domain.

### Interfaces
- No interface changes; internal method adjustments only.

### State Flow
1. User logs in via browser window.
2. Cookie change event fires for .ROBLOSECURITY cookie.
3. Trim cookie value and verify domain ends with '.roblox.com'.
4. If valid, proceed to validate cookie with Roblox auth endpoint.
5. If validation succeeds, return cookie and user info.
6. If validation fails, reject with appropriate error.

### Error Cases
- Cookie value is empty after trimming → reject with 'Formato de cookie inválido' (handled later in AccountManager).
- Cookie domain does not end with '.roblox.com' → ignore this cookie change (wait for correct cookie).
- Cookie validation fails (401/403 from auth endpoint) → reject with 'Cookie inválida o expirada'.

### Non-Functional Requirements
- Performance: Minimal overhead; trim and domain check are O(1).
- Reliability: Should not miss valid cookies due to whitespace or domain mismatch.

### Expected Test Cases
- Should trim whitespace from cookie value before use.
- Should ignore cookie changes from non-roblox.com domains.
- Should still accept valid .roblox.com cookies with leading/trailing spaces.
- Should not break existing functionality for correctly formatted cookies.




## v4.0.0 — Clean/Hexagonal Architecture (2026-07-22)

### Cambios en este paso
- **Reescritura completa**: 18K+ líneas → 3,825 líneas en 54 archivos (−79%)
- **Estructura Clean Architecture**: domain/ (entities + repositories + ports), infrastructure/ (database + external services + ipc), application/ (views + components + stores + hooks)
- **main.ts**: 1,576 → 74 líneas — solo createWindow + registerHandlers + quit
- **IPCAdapter.ts**: 380 líneas — UN solo archivo con los 75 ipcMain.handle
- **RobloxHttp.ts**: shared CSRF + cookie header + 401/403 — elimina la duplicación del código anterior
- **Tests eliminados**: generaban ruido y confusiones — análisis vía LSP + code review
- **Resultado**: tsc 0 errores, LSP 0 errores/0 warnings

### Historial de versiones
- v3.5.0 (2026-07-21): Clean Architecture refactor Step 1 — main.ts split + AccountSettingsService reduce
- v3.4.0 (2026-07-20): Facade Pattern + 14 handlers migrados + auditoría LSP (reemplazado por v4)
- v3.2.0 (2026-07-20): UI rework + NotificationBar + branding NX-Manager
- v3.0.0 (2026-07-16): Release completo — 122 tests, 5 views, tag v3.0.0
