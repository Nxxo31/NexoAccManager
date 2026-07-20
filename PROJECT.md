# NexoAccManager — PROJECT.md

# Última actualización: 2026-07-20 (investigación patrones UI + spec v3.3.0 + protocolo dev anti-sesgo semántico)

# Versión actual: 3.2.0 (UI rework + NotificationBar + rename NX-Manager) | v3.3.0 planificada

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 3.2.0 |
| Último commit | 3f31e0b — feat(ui): añadir menú de navegación lateral en Sidebar para cambiar entre vistas (accounts, servers, games, friends, settings) |
| Branch | feature/ui-rework-slice → main (PR #2 open) |
| tsc | 0 errores |
| vitest | 131/131 pasando (12 archivos) |
| lint | 0 errores, 0 warnings |
| build | ✅ Windows NSIS + Linux AppImage + Linux Snap generados |
| Release GitHub | v3.2.0 publicado — https://github.com/Nxxo31/NexoAccManager/releases/tag/v3.2.0 |

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

## Modelo y Arquitectura Backend v3.4.0 (2026-07-20) — Facade Pattern

**Decisión:** refactor del backend con Facade Pattern sobre todas las APIs Roblox, manteniendo Servicios transversales separados. Responde al problema de "control claro del backend" y "arquitectura idónea".

**Patrón:** Facade (GoF) — un objeto único `RobloxContext` expone API simplificada; internamente orquesta servicios especializados. Los IPC handlers `roblox:*` ya no importan dinámicamente cada servicio; delegan al Facade.
- Fuente canónica: GoF Design Patterns Elements of Reusable Object-Oriented Software (Gamma/Helm/Johnson/Vlissides)
- Documentación Microsoft: "Facade Pattern — provides a simplified interface to a complex subsystem" https://learn.microsoft.com/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/

---

### Matriz de servicios — estado actual vs target

| Archivo | Líneas | Clase | Categoría actual | Categoría target | Roblox API? | Cambio v3.4.0 |
|---------|--------|-------|-------------------|------------------|-------------|---------------|
| services/LoginBrowserService.ts | 185 | LoginBrowserService | Roblox auth | **RobloxContext.auth** | BrowserWindow (no HTTP) | Enveloped by Facade |
| services/RobloxAuthService.ts | 211 | RobloxAuthService | Roblox auth | **RobloxContext.auth** | users.roblox.com/v1/users/authenticated | Enveloped by Facade |
| services/GamesService.ts | 402 | GamesService | Roblox data | **RobloxContext.games** | games.roblox.com/v1/games | Enveloped by Facade |
| services/ServersService.ts | 234 | ServersService | Roblox data | **RobloxContext.servers** | games.roblox.com/v1/games/{id}/servers/Public, presence.roblox.com | Enveloped by Facade |
| services/PresenceService.ts | 540 | PresenceService | Roblox data | **RobloxContext.presence** | presence.roblox.com/v1/presence | Enveloped by Facade |
| services/BottingService.ts | 138 | BottingService | Roblox action | **RobloxContext.botting** | (lanza procesos) | Enveloped by Facade |
| services/CookieExpiryService.ts | 188 | CookieExpiryService | Roblox maintenance | **RobloxContext.cookies** | Valida contra auth endpoint | Enveloped by Facade |
| core/AccountManager.ts | 612 | AccountManager | Account lifecycle | **AccountManager** (sin cambio) | Usa cookie descifrada para launch | Sin refactor |
| core/AccountSettingsService.ts | 984 | AccountSettingsService | Roblox settings | **AccountSettingsService** (sin cambio) | settings.roblox.com via cookie | Sin refactor |
| core/CryptoService.ts | 81 | CryptoService | Cross-cutting | **CryptoService** (sin cambio) | No | Sin refactor |
| core/MultiRobloxService.ts | 182 | MultiRobloxService | Cross-cutting | **MultiRobloxService** (sin cambio) | No (mutex Windows) | Sin refactor |
| core/ThemeService.ts | 180 | ThemeService | Cross-cutting | **ThemeService** (sin cambio) | No | Sin refactor |

**Total sobre Facade:** 7 servicios Roblox (1,798 líneas)  
**Permanecen separados:** 5 servicios transversales (2,039 líneas)

---

### Arquitectura target — Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│  IPC Layer (main.ts handlers)                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  account:*  → AccountManager                                        │
│  roblox:*   → RobloxContext (Facade)  ← UNIFIED POINT               │
│  settings:* → AccountSettingsService                                │
│  theme:*    → ThemeService                                           │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Facade Layer — RobloxContext.ts                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  auth:      login(), loginWithBrowser(), verifyCookie()              │
│  games:     search(placeId, cookie), getFavorites()                  │
│  servers:   listServers(placeId, cookie), getUsersInServer()        │
│  presence:  getRecentGames(), getFriends()                           │
│  botting:   start(placeId), stop(), getStatus()                      │
│  cookies:   refresh(accountId), getExpiry(accountId)                 │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Services Layer (internos del Facade)                                │
│  ─────────────────────────────────────────────────────────────────  │
│  LoginBrowserService  RobloxAuthService  GamesService               │
│  ServersService        PresenceService     BottingService            │
│  CookieExpiryService                                                 │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Cross-cutting Services (separados, no Facade)                       │
│  ─────────────────────────────────────────────────────────────────  │
│  AccountManager (DB)    CryptoService (AES)                           │
│  AccountSettingsService (Roblox settings via cookie)                 │
│  MultiRobloxService (mutex)  ThemeService (CSS)                      │
│  DatabaseManager (SQLite better-sqlite3)                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Justificación capas:**
- **IPC Layer** delega al Facade para todo `roblox:*`. No instancia servicios directamente ni importa dinámicamente.
- **Facade Layer** (RobloxContext) es la capa de orquestación. Recibe dependencias vía constructor (poor-man's DI). Expone API estable a los handlers.
- **Services Layer** sigue existiendo — el Facade los compone, no los elimina. Cada servicio mantiene su single responsibility.
- **Cross-cutting** persiste fuera del Facade: account lifecycle, crypto, DB, theme. AccountSettingsService usa cookies pero es settings, no API Roblox propiamente.

---

### Interfaces TypeScript — RobloxContext (target)

```typescript
// src/main/services/RobloxContext.ts (a crear en v3.4.0)

export interface IRobloxContext {
  // Auth subsystem
  auth: {
    loginWithBrowser(): Promise<{ cookie: string; userId: number; username: string }>;
    login(username: string, password: string): Promise<{ cookie: string; userId: number }>;
    verifyCookie(cookie: string): Promise<{ authenticated: boolean; userId: number }>;
  };
  // Games subsystem
  games: {
    search(query: string, cookie: string): Promise<GameInfo[]>;
  };
  // Servers subsystem
  servers: {
    list(placeId: string, cookie: string, opts?: { sortOrder?: 'Asc'|'Desc'; limit?: number; maxPing?: number }): Promise<RobloxServer[]>;
    getUsersInServer(placeId: string, jobId: string, cookie: string): Promise<RobloxServerUser[]>;
  };
  // Presence subsystem
  presence: {
    getRecentGames(userId: number, cookie: string): Promise<RecentGame[]>;
    getFriends(cookie: string): Promise<Friend[]>;
  };
  // Botting subsystem
  botting: {
    start(accountId: string, placeId: string): Promise<boolean>;
    stop(): boolean;
    getStatus(): { running: boolean; accounts: string[] };
  };
  // Cookie maintenance subsystem
  cookies: {
    refresh(accountId: string): Promise<boolean>;
    getExpiry(accountId: string): Date | null;
  };
}

export class RobloxContext implements IRobloxContext {
  // Constructor — DI manual (poor-man's DI like NexoApp actual)
  constructor(
    private loginBrowser: LoginBrowserService,
    private auth: RobloxAuthService,
    private gamesService: GamesService,
    private serversService: ServersService,
    private presenceService: PresenceService,
    private bottingService: BottingService,
    private cookieExpiryService: CookieExpiryService,
    private accountManager: AccountManager,  // para refresh cookies
  ) {}

  auth: { ... }; games: { ... }; servers: { ... };
  presence: { ... }; botting: { ... }; cookies: { ... };
}
```

---

### Cambios en NexoApp (main.ts)

```typescript
// Antes (v3.2.0) — instanciación dispersa, handler importa dinámicamente
class NexoApp {
  private accountManager = new AccountManager(db, crypto);
  // En cada handler: const { GamesService } = await import('./services/GamesService');
}

// Después (v3.4.0) — Facade compuesto en NexoApp
class NexoApp {
  private roblox: RobloxContext;

  constructor() {
    const loginBrowser = new LoginBrowserService();
    const authService = new RobloxAuthService();
    const gamesService = new GamesService();
    const serversService = new ServersService();
    const presenceService = new PresenceService(db, crypto);
    const bottingService = new BottingService(accountManager, presenceService);
    const cookieExpiryService = new CookieExpiryService(db, crypto);

    this.roblox = new RobloxContext(
      loginBrowser, authService, gamesService,
      serversService, presenceService, bottingService,
      cookieExpiryService, accountManager
    );
  }

  // Handlers antes: const { LoginBrowserService } = await import(...);
  // Después: this.roblox.auth.loginWithBrowser()
}
```

---

### Matriz de rutas Roblox API (inventario consolidado)

| Operación | Endpoint | Servicio actual | En Facade como |
|-----------|----------|-----------------|----------------|
| Login con browser | roblox.com/login (BrowserWindow) | LoginBrowserService | `roblox.auth.loginWithBrowser()` |
| Verificar cookie autenticada | users.roblox.com/v1/users/authenticated | RobloxAuthService + AccountManager | `roblox.auth.verifyCookie()` |
| Login username/password | auth.roblox.com/v2/login | RobloxAuthService | `roblox.auth.login()` |
| Buscar juegos | games.roblox.com/v1/games ( búsqueda) | GamesService.searchGame | `roblox.games.search()` |
| Listar servidores públicos | games.roblox.com/v1/games/{id}/servers/Public | ServersService.getGameServers | `roblox.servers.list()` |
| Usuarios en servidor (friends) | presence.roblox.com/v1/presence/users | ServersService.getServerUsers | `roblox.servers.getUsersInServer()` |
| Presencia / juegos recientes | presence.roblox.com/v1/presence/all | PresenceService | `roblox.presence.getRecentGames()` |
| Lista de amigos | friends.roblox.com/v1/users/{id}/friends | AccountSettingsService | `roblox.presence.getFriends()` |
| Obtener auth ticket | auth.roblox.com/v1/authentication-ticket | AccountManager.getAuthTicket | `roblox.auth.getAuthTicket()` (mover a Facade) |
| Obtener CSRF token | auth.roblox.com/v2/logout | AccountManager.getCsrfToken | `roblox.auth.getCsrfToken()` (mover a Facade) |
| Cambiar settings cuenta | settings.roblox.com/... | AccountSettingsService | `accountSettings.*` (sin cambio) |
| Avatar headshot | thumbnails.roblox.com/v1/users/avatar-headshot | ServersService/AccountSettingsService | `roblox.presence.getAvatar()` |
| Lanzar Roblox (protocolo) | roblox-player:// | AccountManager.launchRoblox | `accountManager.launchRoblox()` (sin cambio) |
| Lanzar Roblox (multi) | spawn RobloxPlayerLauncher.exe | AccountManager.launchRobloxDirect | `accountManager.launchRoblox()` (sin cambio) |

---

### Test Strategy v3.4.0 (TDD plan)

**Tests unitarios RobloxContext** (deben fallar primero — anti-sesgo semántico):

1. `describe('RobloxContext') / it('auth.loginWithBrowser delegates to LoginBrowserService')`
2. `describe('RobloxContext') / it('auth.verifyCookie delegates to RobloxAuthService')`
3. `describe('RobloxContext') / it('games.search delegates to GamesService')`
4. `describe('RobloxContext') / it('servers.list delegates to ServersService with opts')`
5. `describe('RobloxContext') / it('servers.getUsersInServer delegates to ServersService')`
6. `describe('RobloxContext') / it('presence.getRecentGames delegates to PresenceService')`
7. `describe('RobloxContext') / it('botting.start delegates to BottingService')`
8. `describe('RobloxContext') / it('cookies.refresh validates accountId and delegates to CookieExpiryService')`
9. `describe('RobloxContext') / it('throws if dependency not provided in constructor')`

**Tests de integración backend** (validación REAL, no mock):
- `it('verifyCookie returns authenticated=true for valid cookie format')` — usa cookie sintética válida del fixture
- `it('verifyCookie returns authenticated=false for invalid cookie')` — usa cookie inválida
- `it('games.search returns array for valid query')` — usa mock HTTP con axios-mock-adapter
- `it('servers.list returns array for valid placeId')` — axios-mock

**Anti-sesgo semántico (regla documentada):**
- Los tests de delegación verifican que el Facade llama al servicio correcto (mock del servicio subyacente, assert spy llamado con args esperados)
- Los tests de integración verifican comportamiento REAL: con axios-mock-adapter interceptando, NO con mock del servicio completo
- Nunca mockear el servicio end-to-end solo para que el test pase

**Acceptance Criteria v3.4.0:**
- [ ] `RobloxContext.ts` creado con las 6 sub-APIs (auth/games/servers/presence/botting/cookies)
- [ ] main.ts: todos los handlers `roblox:*` delegan a `this.roblox.<sub-api>.<method>()`
- [ ] Cero imports dinámicos en handlers `roblox:*` (lazy imports eliminados)
- [ ] Tests RobloxContext: 9 unitarios (delegación) + 4 integración (REAL behavior via axios-mock-adapter)
- [ ] tsc 0, vitest 131+9+4=144+ pasando, lint 0
- [ ] Build Windows NSIS generado

### Non-goals v3.4.0
- NO introducir contenedor de IoC ni decoradores (se mantiene poor-man's DI)
- NO cambiar el patrón IPC (invoke/handle)
- NO añadir features nuevas — solo reorganización arquitectónica
- NO refactor de AccountManager (sigue con su lógica de lanzar Roblox)
- NO eliminar ningún servicio — el Facade los compone, no los reemplaza
- NO mover AccountSettingsService al Facade (es settings, no API Roblox per se)

### Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Romper cookies existentes al refactor | Media | CryptoService NO se toca. Salt preservada. |
| Imports circulares (Facade ↔ AccountManager) | Baja | Facade inyecta AccountManager solo como dependencia, nunca al revés |
| Latencia adicional por capa | Baja | El Facade solo delega, no hace trabajo extra. Benchmark < 1ms overhead |
| Tests falsos positivos (sesgo semántico) | Media | Tests de integración con axios-mock-adapter, no mocks de servicios completos |
| Regresión en handlers `roblox:*` existentes | Alta | Audit IPC end-to-end después del refactor. Smoke tests E2E de cada namespace. |

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

## Pendiente — Calidad y tests

### 🟢 NINGUNO — todas las tareas de calidad y tests completadas

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


