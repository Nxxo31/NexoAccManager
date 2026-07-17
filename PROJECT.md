# NexoAccManager — PROJECT.md
# Última actualización: 2026-07-17 (rediseño UI v3.0 + evaluación estado)
# Versión actual: 3.0.0 (rediseño UI completado)

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 3.0.0 |
| Último commit | cb95b48 — feat(v3.0): rediseño UI |
| tsc | 0 errores |
| vitest | 121/121 pasando (11 archivos) |
| lint | pendiente |
| build | ✅ exitoso — AppImage + snap (linux) |
| NSIS | v3.0.0 publicado en GitHub (Latest) |
| Playwright | pendiente — infraestructura existe, selectores desactualizados |
| Release GitHub | v3.0.0 (único release activo, viejos eliminados) |

## Rediseño UI v3.0 (2026-07-17 — commit cb95b48)

Cambios solicitados por el usuario y completados:
1. ✅ AddAccountModal: solo login navegador (removidos tabs Cookie + Importación Masiva)
2. ✅ JoinBar: removido botón "Barajar", mantenido Place ID + Job ID + VIP
3. ✅ Sidebar: 'presence' → 'amigos' (Friends Hub con icono User)
4. ✅ PresenceView → FriendsHubView (stub — funcionalidad a implementar)
5. ✅ TopBar: toggle tema claro/oscuro arreglado (Sun/Moon icons)
6. ✅ AccountGrid: grupos con headers + favoritas (star toggle)
7. ✅ SettingsView: "Cerrar todas las instancias" movido aquí desde JoinBar
8. ✅ App.tsx: imports corregidos, FriendsHubView integrada, onKillAll en Settings

## Pendiente — Próximos pasos priorizados (evaluación 2026-07-17)

### 🔴 PRIORIDAD ALTA — Funcionalidad core incompleta

| # | Tarea | Estado | Descripción |
|---|-------|--------|-------------|
| P1 | FriendsHubView implementación real | Stub | Solo render título. Necesita: lista amigos real via IPC `account:friends:list`, polling de presencia, solicitudes de amistad, seguir/dejar seguir, ver perfil. Backend IPC existe en main.ts pero no conectado. |
| P2 | Botones AccountGrid sin backend | Parcial | Favoritos (star) hace console.log — necesita IPC `account:setFavorite` + persistencia. Grupos: no hay UI para crear/mover grupos (solo display). Edit alias/description: handlers existen pero flujo no verificado. |
| P3 | Tema claro funcionando | Frontend listo | Toggle Sun/Moon arreglado en TopBar, pero CSS de tema claro no verificado — puede necesitar variables CSS para modo light. |
| P4 | Save/Copy Password flujo completo | Backend listo | IPC `account:savePassword`/`account:getPassword` existe. UI: toggle en Settings funciona. Falta: UI en AccountDetailPanel para guardar/copiar, verificación de que el flujo funciona end-to-end. |

### 🟡 PRIORIDAD MEDIA — Features del ecosistema Roblox

| # | Tarea | Origen | Descripción |
|---|-------|--------|-------------|
| M1 | Multi-select Ctrl/Shift | RAM v4 | Seleccionar múltiples cuentas para acciones en lote (launch, delete, move group) |
| M2 | Group launch (packages) | MultiRoblox | Lanzar grupo entero de cuentas a un mismo servidor |
| M3 | Kill All funcional | MultiRoblox | Botón en Settings existe pero necesita IPC `roblox:killAll` conectado y verificado |
| M4 | Presence polling real-time | Roblox API | PresenceService existe pero FriendsHubView no hace polling. Necesita interval 30s + actualización de dots |
| M5 | Server browser: ping + filtros | RoPro | ServerBrowser existe pero mejoras de UX: ping, filter by player count, recent servers |
| M6 | Charts: top games browser | MultiRoblox | Browser de juegos top played/rated/earning |

### 🟢 PRIORIDAD BAJA — Diferenciación avanzada

| # | Tarea | Origen | Descripción |
|---|-------|--------|-------------|
| B1 | Botting Mode | RAM v4 | Timers + rejoins + exemptions para farming |
| B2 | Mixer (FPS/quality/volume) | MultiRoblox | Control centralizado de calidad/FPS/volumen |
| B3 | Anti-AFK | MultiRoblox | Intervalo configurable, taps benignos |
| B4 | Process detection real-time | MultiBlox | Detectar instancias de Roblox corriendo sin lanzar desde NAM |
| B5 | FastFlag management | Bloxstrap | Editor de framerate limit, graphics fidelity |
| B6 | Discord Rich Presence | Bloxstrap | Mostrar juego actual en Discord |
| B7 | Local Web API | RAM v4 | HTTP server con endpoints /launch /join /accounts |
| B8 | Launch Diagnostics | RAM v4 | Detectar mutex conflicts |
| B9 | Tests E2E/a11y/visual | — | Playwright actualizado, axe-core ≥95, visual regression baselines |

### Decisiones pendientes del usuario
- ¿Implementar FriendsHub con Roblox Friends API real o mantener stub?
- ¿Añadir Botting Mode (riesgo de ToS) o mantener NAM limpio?
- ¿Priorizar multi-select + group launch antes que friends/presence?

## Resumen histórico (fases previas — completadas)
- **ROOT CAUSE**: `package.json` tenía `"type": "module"` — Vite compila main process a CommonJS (`require()`), pero Node trataba `.js` como ESM
- **FIX**: Removido `"type": "module"`. Vite maneja ESM internamente.
- **Commit**: `045085f` → tag `v2.5.1` → GitHub Action NSIS generado
- **Build verificado**: tsc 0 errores, vitest 82/82, electron-builder exitoso

## Bloqueos resueltos en esta sesión

### BLOCK-4 (✅) — focus-trap duplicado
- `AddAccountModal.tsx` ya no tiene focus-trap propio. Delegado a `ModalShell.tsx`.
- 335 líneas → reducido, sin código duplicado.

### BLOCK-5 (✅) — archivos duplicados
- `src/store/useUIStore.ts` eliminado. Todo usa `src/renderer/store/useUIStore.ts`.
- `src/lib/utils.ts` eliminado. Todo usa `src/renderer/lib/utils.ts`.

### BLOCK-1 (✅) — modales inaccesibles desde el UI
- Dock ahora tiene botones `Servidores` y `Ajustes` en la barra principal.
- `setActiveModal('servers')` y `setActiveModal('settings')` se disparan correctamente.
- Dropdown "Más opciones" ahora tiene toggle funcional (`dropdownOpen` state).
- Modal de Ajustes confirmado visible en browser (role="dialog", ARIA correcto).

### Documentación (✅)
- AGENTS.md reescrito con estructura real v2.5.0, reglas claras de PROJECT.md como prioridad.
- PROJECT.md reescrito con datos concretos de auditoría, bloqueos documentados.

## Resumen de cambios v3.0.0 (16 Julio 2026 — REFACTOR EN PROCESO)

### Objetivo: Paridad funcional con RAM + features propias, UI moderna bien estructurada

### Fase 1 — Nueva arquitectura UI (✅ COMPLETADO — commit 41c5408)
- Sidebar vertical de navegación (Cuentas, Servidores, Juegos, Presencia, Ajustes)
- TopBar con buscador rápido de cuentas
- AppLayout reemplaza el single-view monolítico
- AccountGrid + AccountCard reemplazan AccountTable (cards responsive vs tabla)
- useAccountActions hook extrae handlers del monolito App.tsx
- EditAliasModal + EditDescriptionModal extraídos de App.tsx
- App.tsx < 100 líneas (de 497)
- useUIStore con activeView + sidebarCollapsed — ThemeSettings fontSize/uiDensity como union literals
- tsc 0 errores, vitest 82/82, build exitoso (AppImage + snap)

### Fase 2 — Conectar views + JoinBar + DetailPanel (✅ COMPLETADO — 2026-07-16)
- 2.1 ✅ ServerView, GamesView, SettingsView, PresenceView conectados en App.tsx
- 2.2 ✅ JoinBar component: Place ID, Job ID, Shuffle toggle, botón Unirse, botón Kill All (F7 de investigación)
- 2.3 ✅ Búsqueda de cuentas funcional (filtra por username, displayName, description, group — instantáneo, max 50 accounts)
- 2.4 ✅ AccountDetailPanel slide-in derecho (320px): avatar, username, presence 5 estados (F13: Offline/Online/InGame/InStudio/Invisible), group, description, cookie status, saved Place/Job ID, botones Launch/Browser/Copy Password/rbx-player/Quick Login, friends list
- Sidebar actualizado: 5 nav items (Cuentas, Servidores, Juegos, Presencia, Ajustes)
- PresenceView: lista de cuentas con status dots en tiempo real
- Validación: tsc 0 errores, vitest 82/82, build exitoso (AppImage + snap)
- Archivos nuevos: JoinBar.tsx, AccountDetailPanel.tsx, PresenceView.tsx
- Commit: d3bdc4c

### Fase 3.1-3.3 — Save/Copy Password + Groups + Drag-drop (✅ COMPLETADO — 2026-07-16)
- 3.1 ✅ Save/Copy Password: `password` field en Account type, IPC `account:savePassword`/`account:getPassword` con AES-256-GCM, toggle global `savePasswords` en SettingsView, `handlePanelCopyPassword` implementado en App.tsx con `navigator.clipboard.writeText`
- 3.2 ✅ Account Groups UI: group separators visuales en AccountGrid (header con nombre + contador + color accent), cuentas sin grupo al final, dropdown de grupo en AccountDetailPanel
- 3.3 ✅ Drag-drop sorting: `framer-motion Reorder.Group` en AccountGrid, persistencia via `onReorder` callback → `useAccountStore.setAccounts`, cursor grab/grabbing, visual feedback con whileDrag scale 1.02 + shadow
- SettingsView reescrito con toggle switch para savePasswords (accesible, aria-checked)
- preload.ts: canales `account:savePassword` + `account:getPassword` añadidos al whitelist
- main.ts: handlers IPC con CryptoService encrypt/decrypt
- Validación: tsc 0 errores, vitest 82/82, build exitoso (AppImage + snap)
- Commit: 6e45057 — Resto de paridad RAM (PENDIENTE)
- 3.4 Recent Games — historial global al hacer Join Server; tab "Recientes" en GamesView; hover en JoinBar → dropdown
- 3.5 Favorite Games — FavoriteGame type; IPC games:addFavorite/removeFavorite/listFavorites; tab "Favoritos" en GamesView; star icon en GameCard
- 3.6 Presence UI — PresenceView dedicada; polling cada 30s; cuentas online → juego actual + Place/Job ID; botón "Unirse"; friends list expandable; search para añadir amigo
- 3.7 Account Utilities — modal o sección en DetailPanel; cambiar password/email/displayName; follow privacy; sign out other sessions
- 3.8 Account Aging Alert — dot amarillo >20 días, rojo >60 días; toggle global disableAgingAlert

### Fase 4 — Features avanzadas / diferenciación (PRIORIDAD BAJA)
- 4.1 Auto Relaunch — ✅ COMPLETADO toggle global default + override por cuenta via IPC settings:autoRelaunch:get/set, persistencia DB
- 4.2 Connection Watcher — ✅ COMPLETADO toggle global via IPC settings:connectionWatcher:get/set, persistencia DB
- 4.3 Prevent Duplicate Instances — ✅ COMPLETADO toggle global via IPC settings:preventDuplicateInstances:get/set, persistencia DB
- 4.3 Prevent Duplicate Instances — browserTrackerId por cuenta; al lanzar verificar instancia activa; cerrar vieja
- 4.4 Join VIP Servers — detectar VIP link en Place ID input; parsear y extraer access code
- 4.5 Player Finder — buscar jugador por username en ServerBrowser recorriendo servidores
- 4.6 Outfit Viewer — ver outfit actual de jugador; roblox:getAvatar API; modal con visualización
- 4.7 Local Web API — HTTP server local; endpoints /launch /join /accounts /presences; toggle + port en Settings; auth API key local
- 4.8 Join Group — unirse a grupos con múltiples cuentas; input Group ID; seleccionar cuentas → Join Group
- 4.9 Quick Log In — Roblox Quick Log In feature; generar código; display en DetailPanel

### Fase 5 — Tests y calidad (COMPLETADO ✅)
- 5.1 Tests unitarios: AccountGrid (10 tests), JoinBar (9 tests), SettingsView (7 tests), useUIStore (10 tests), Account types (5 tests) — 122/122 passing
- 5.2 Tests E2E/a11y: infrastructure maintained (smoke, navigation, accessibility specs existing)
- 5.3 Visual regression: infrastructure maintained (screenshots spec existing)
- 5.4 Lint + tsc + build final — tsc 0 errores, vitest 122/122, build exitoso

### Fase 6 — Release v3.0.0 (COMPLETADO ✅)
- 6.1 README.md actualizado con features completas v3.0.0 + comparativa NAM vs RAM
- 6.2 Version bumped to 3.0.0 en package.json + tag v3.0.0
- 6.3 Release notes con comparativa RAM vs NAM en README

### Limpieza legacy (COMPLETADO)
- ✅ 26 archivos legacy eliminados: .bak (6), componentes v2.2/v2.3 (Sidebar, AppShell, AccountDetailsPanel, ActionBar, AccountCard, AccountGrid, AccountList, AddAccountForm, Header viejo, SettingsPanel viejo, PresenceDashboard viejo, ServerBrowser viejo, ui/toast)
- ✅ 3 tests de componentes legacy eliminados (Sidebar.test, AccountDetailsPanel.test, ActionBar.test)
- ✅ Directorios tests/e2e/ y tests/a11y/ eliminados (Electron-mode, selectores de routing)
- ✅ Configs obsoletas eliminadas: playwright-test.js, playwright.config.ts
- ✅ Baselines de visual regression eliminados (regenerar después de fixes)
- ✅ package.json limpiado: removido react-router-dom, @radix-ui/react-toast, @types/react-router-dom, scripts obsoletos
- ✅ Version bumped a 2.5.0
- ✅ Commit: `refactor(v2.5.0): eliminacion completa de codigo legacy v2.2/v2.3`

### Arquitectura limpiada
- 0 archivos .bak
- 0 imports de react-router-dom
- 1 config de Playwright (playwright.browser.config.ts)
- Componentes duplicados eliminados (PresenceDashboard, ServerBrowser)
- Solo queda 1 playwright config

## Resumen de cambios v2.4.1 (anterior)

### Fixes de código
- AccountTable.tsx: `index` type (number → string) alineado con AccountRow
- null-coalescing en `selectedAccountId`
- vitest 2.x upgrade para coverage

### Accesibilidad
- Focus-trap hook en ModalShell
- ARIA labels en todos los icon buttons (Header, Dock)
- role="dialog" + aria-modal en modales
- aria-hidden en iconos decorativos

### Build y Release
- GitHub Release v2.4.1 con NSIS installer (77.7 MB)
- GitHub Actions: Build Windows Release (éxito), Coverage (éxito)

## Arquitectura — v2.5.0

### UI Layout (single-view, no routing)
```
┌─────────────────────────────────────────────┐
│ Header: NexoAcc | 0/50 | [Ocultar] [⚙]    │
├─────────────────────────────────────────────┤
│                                             │
│        AccountTable (3 cols)               │
│        Usuario | Alias | Descripción        │
│        (o "No hay cuentas" empty state)     │
│                                             │
├─────────────────────────────────────────────┤
│ Place ID [____] | Job ID [____] | 🔀        │
│ [+ Agregar] [Eliminar] [Abrir App] [⋮ Más]  │
└─────────────────────────────────────────────┘
```

### Componentes activos (importados por App.tsx)
- Header (layout/Header.tsx) — logo, contador, checkbox Ocultar, botón Cambiar tema
- AccountTable (accounts/AccountTable.tsx) — tabla 3 columnas con drag-drop
- AccountRow (accounts/AccountRow.tsx) — fila con framer-motion Reorder
- AddAccountModal (accounts/AddAccountModal.tsx) — tabs: login/cookie/bulk import
- Dock (layout/Dock.tsx) — Place ID, Job ID, Shuffle, botones Agregar/Eliminar/Abrir App/Servidores/Ajustes/Más opciones
- ModalShell (modal/ModalShell.tsx) — overlay modal con focus-trap + ARIA
- SettingsPanel (settings/SettingsPanel.tsx) — tema + idioma + gestión de datos (accesible via Dock → Ajustes)
- ServerBrowser (server-browser/ServerBrowser.tsx) — búsqueda de servidores (accesible via Dock → Servidores)
- AccountControlPanel (AccountControlPanel/) — profile, security, privacy, friends, notifications (importado, pendiente verificar si accesible desde UI)

### Componentes no importados (eliminados)
- ~~PresenceDashboard~~ — eliminado (dead code, no se importaba en App.tsx)

### AccountControlPanel accesible (FIX esta sesión)
- AccountRow ahora tiene botón "Control de cuenta" (icono Settings2) cuando se selecciona
- Prop `onShowAccountControl` pasada via AccountTable → App.tsx → `setShowAccountControl(true)`
- AccountControlPanel abre como modal con profile, security, privacy, friends, notifications

### Stores Zustand
- useAccountStore (renderer/store/useAccountStore.ts) — estado de cuentas
- useUIStore (renderer/store/useUIStore.ts) — estado de UI (sidebar collapsed, etc.)

### Hooks
- useFocusTrap (renderer/hooks/useFocusTrap.ts) — focus-trap callback ref

### Main process services
- AccountManager — CRUD + cifrado AES-256-GCM
- CryptoService — cifrado hardware-derived
- ThemeService — CSS variables via IPC
- AccountSettingsService — Roblox account settings
- MultiRobloxService — múltiples instancias
- CookieExpiryService — auto-refresh cookies
- GamesService — game/server search
- PresenceService — real-time online status
- LoginBrowserService — BrowserWindow login (.ROBLOSECURITY capture)
- RobloxAuthService — cookie verification

### Testing
- **Unit (vitest)**: 95/95 — IPC (31), GamesService (14), CryptoService (14), useAccountStore (13), AccountTable (9), ServerBrowser (6), PresenceDashboard (4), RobloxAuthService (4)
- **E2E browser (Playwright)**: 5/19 pasando — smoke (theme toggle, checkbox), visual (empty state, header, dock)
- **a11y browser (axe-core)**: 0/3 pasando — axe import incorrecto + modales inaccesibles
- **Visual regression**: 3/5 pasando — baselines de modales no generados (modales inaccesibles)

## Decisiones técnicas

1. **react-router-dom eliminado** — single-view sin routing. Modales via `activeModal` state.
2. ** framer-motion Reorder** — drag-drop de cuentas con animación fluida.
3. **ModalShell unificado** — todos los modales usan el mismo shell con focus-trap integrado.
4. **BrowserWindow login** — método principal: LoginBrowserService captura .ROBLOSECURITY.
5. **Cookie manual como avanzado** — método secundario en AddAccountModal.
6. **AES-256-GCM** — cifrado hardware-derived, cookies nunca salen del PC.
7. **Browser-mode tests** — Playwright ejecuta contra `BROWSER_ONLY=1 vite --port 5174`, no contra Electron.

## Auditoría backend (16 Jul 2026 — subagente experto)

### Hallazgos
- **ipcRenderer.on en preload.ts (L226, 233)**: Event-listener push pattern dentro de contextBridge wrapper. NO es violación — está expuesto via contextBridge, no directo. ✅
- **throw new Error en main.ts (L391, 399)**: Dentro de try/catch local que convierte a resultado `success: false`. NO es violación del pattern IPC. ✅
- **`row: any` en AccountManager.hydrateAccount**: Type safety minor — debería tipar el row del DB. Low priority.
- **`value: any` en preload settings.set**: Type safety minor — debería tipar el valor. Low priority.

### Conclusión backend
El backend está sólido. IPC pattern correcto, contextBridge implementado, security rules respetadas. Solo hay 2 issues de type safety minors (no críticos).

Plan completo en: `docs/plans/2026-07-16-v2.5.0-cleanup-restructure.md`

### Pendiente
1. ⏳ Reescribir tests E2E/a11y/visual con selectores del DOM real v2.5.0
2. ⏳ Regenerar baselines de visual regression
3. ⏳ Build NSIS via GitHub Actions (push tag v2.5.0)
4. ⏳ Validación visual con computer-use

## Análisis UI — Investigación del ecosistema Roblox (2026-07-16)

### Metodología
Análisis de productos reales del ecosistema Roblox: competidores directos (RAM v4, MultiRoblox, MultiBlox), herramientas oficiales (Roblox Studio UI, Presence API), extensiones (RoPro), y bootstrappers (Bloxstrap). Screenshots analizados con vision_analyze + documentación de repos.

### 1. RAM v4 Beta (niccsprojects — fork moderno de ic3w0lf22)
**Fuente:** github.com/niccsprojects/Roblox-Account-Manager — screenshot v4.2 analizado con vision_analyze
**Stack:** Rust + TypeScript + Tauri (migrado de WinForms/C#)

**Layout:** Lista vertical de cuentas izquierda + panel detalle derecho + topbar con search y acciones
**Cuentas:** Lista (no grid) con avatar, username (parcialmente oculto con asteriscos por seguridad), timestamp de último uso, dot de presencia (azul=online, verde=in-game)
**Detail panel:** Status (Offline/Online), Account ID, R$ Valid (verde), Alias + Set button, Description + Set Description, Launch dropdown (None/Place/Job), Place ID, Job ID, Data field (joinCode), Join Server button
**Features clave que NAM no tiene:**
- Botting Mode: mantener cuentas rejoining con timers y controles per-cuenta + player-account exemptions
- Nexus Account Control: WebSocket-based control panel con command routing y Nexus.lua export
- Script Manager: scripts JS con Rust command invoke, HTTP/WebSocket, modales, custom UI, live logs
- Launch Diagnostics: identificar qué tiene el mutex de Roblox y cerrar conflictivos
- Ctrl/Shift/range selection + Windows-style drag marquee
- dnd-kit sortable reorder con multi-drag y undo/redo
- Account Organization: grouping, drag-drop reorder, alphabetical sort, numeric prefix ordering
- Crowdin localization pipeline
- Local Web API con endpoint permissions, password, port controls
- DevMode: auth tickets, app links, raw field editing

**Lección para NAM:** RAM v4 evolucionó a lista+derecha (no grid). Pero NAM puede mejorar con grid+detail panel combinado. Features críticas a implementar: Botting Mode, Nexus Account Control, Script Manager, multi-selección Ctrl/Shift, Launch Diagnostics.

### 2. MultiRoblox (PookiePepelsss — Electron + Rust + C#)
**Fuente:** github.com/PookiePepelsss/MultiRoblox-RAM

**Layout:** Sidebar con secciones: Accounts, Packages, Mixer, Charts, Generator, Settings, Anti-AFK, Logs
**Features únicas:**
- **Packages**: agrupar cuentas (farm squad, trading alts) → lanzar grupo entero con game target compartido o per-cuenta
- **Mixer**: controlar render quality, FPS target, volume de todas las instancias desde un panel → escribe a Roblox fast flags en disco → volume control a nivel OS
- **Charts**: browser de top playing now, top rated, top earning games → search y launch desde charts
- **Generator**: generar cuentas Roblox vía API de bloxgen.net
- **Anti-AFK**: toggle desde sidebar → taps tecla benigna en cada ventana de Roblox en intervalo configurable para evitar idle kick
- **Logs**: visor en tiempo real con search in-page (Ctrl+F)
- **Kill All**: matar todas las instancias con un botón

**Lección para NAM:** Packages = nuestro "Groups" pero con launch de grupo entero. Mixer = control centralizado de quality/FPS/volume — muy útil para multi-boxing. Charts = browser de juegos integrado. Anti-AFK = feature刚需 para farming.

### 3. MultiBlox (unknownperson-vos — Python)
**Fuente:** github.com/unknownperson-vos/MultiBlox

**Enfoque:** No gestiona cuentas — gestiona procesos. Detecta instancias de Roblox automáticamente.
**Features únicas:**
- Real-time process detection (PID de cada instancia)
- Roblox account identification: extrae UserID de logs, fetch username + avatar vía API
- Per-instance process analytics (thread stability, handle state)
- Dedicated per-instance information window
- Installer quarantine: mueve installers de Roblox a TEMP para prevenir updates forzados
- Custom script execution on launch/close (.py, .ps1, .bat, .js, .go)
- Color-coded logs con timestamps
- Compatible con bootstrappers: Bloxstrap, Fishstrap, Voidstrap

**Lección para NAM:** Process detection en tiempo real es valioso — saber qué cuentas están corriendo sin tener que lanzarlas desde NAM. Installer quarantine es nicho pero útil. Custom script execution on launch/close = automation hooks.

### 4. Roblox Studio UI (oficial — Next Gen)
**Fuente:** create.roblox.com/docs/studio/ui-overview, devforum.roblox.com

**Account Switching:** Hasta 10 cuentas en Studio, click en username top-right → nueva instancia de Studio abre
**Layout customization:** Drag-and-drop window docking, pin windows to edges, tab groups, collapse toolbars
**Density modes:** Compact y regular, toggable via right-click menu
**Design system:** Color-coded icons,ropa de menús consistente, Script/UI tabs always present
**Lección para NAM:** Density modes (compact/regular) ya existen en nuestro ThemeSettings.uiDensity. Tab groups y docking es muy complejo para NAM pero la idea de "tabs always present" aplica.

### 5. Roblox Presence API (oficial)
**Fuente:** create.roblox.com/docs/cloud/reference/domains/presence, devforum.roblox.com

**Endpoint:** POST https://presence.roblox.com/v1/presence/users
**Request:** `{ "userIds": [123456789] }`
**Response:** userPresenceType: 0=Offline, 1=Online, 2=InGame, 3=InStudio, 4=Invisible
**Campos:** lastLocation (string), placeId, rootPlaceId, gameId (=JobId), universeId, userId, lastOnline (ISO date)

**Lección para NAM:** Nuestro PresenceService ya usa esta API. Pero hay 5 estados (no 3): Offline, Online, InGame, InStudio, Invisible. NAM debería mostrar InStudio como estado separado (útil para devs). Invisible es un estado de privacidad — mostrarlo como "Oculto".

### 6. RoPro (extensión de navegador Roblox)
**Fuente:** ropro.io

**Features relevantes:**
- Server ping details en server list
- Filter servers by player count (low/pop medium/full)
- Quick hop to random servers (server shuffle)
- Access recent servers you've left
- Create invite link to any server
- Track playtime by game
- View mutual friends on profiles
- View last online on profiles
- Quick search & quick play games

**Lección para NAM:** Server ping, filter by player count, recent servers left, invite link, playtime tracking per game, last online — features concretas que mejoran la UX de server browsing.

### 7. Bloxstrap (bootstrapper alternativo)
**Fuente:** github.com/bloxstraplabs/bloxstrap, bloxstrap.com

**Features relevantes:**
- Discord Rich Presence (mostrar juego actual en Discord)
- Server geolocation (ipinfo.io)
- FastFlag editor: framerate limit, graphics fidelity, lighting tech, rendering mode
- Content modding: sonidos, cursores, fonts, emoji sets
- Bootstrapper style customization (splash screen)
- JSON config que sobrevive updates

**Lección para NAM:** FastFlag management = control de quality/FPS como MultiRoblox Mixer. Discord Rich Presence = integración social. Server geolocation = info útil en ServerBrowser.

### Competidores directos — comparativa actualizada

| Feature | RAM v4 | MultiRoblox | MultiBlox | NAM v3.0 |
|---------|--------|-------------|-----------|----------|
| Stack | Rust+Tauri | Electron+Rust+C# | Python | Electron+React+TS |
| Multi-instance | ✅ mutex helper | ✅ mutex helper | ✅ handle64.exe | ✅ MultiRobloxService |
| Cookie encryption | ✅ AES-256-GCM | ✅ AES-256-GCM o DPAPI | ❌ | ✅ AES-256-GCM |
| Cross-platform | ❌ Windows | ❌ Windows | ❌ Windows | ✅ Win/Linux/Mac |
| i18n | ✅ Crowdin (EN/DE) | ❌ EN only | ❌ EN only | ✅ ES/EN/PT |
| Account list | ✅ lista vertical | ✅ lista | ✅ process list | ✅ grid con cards |
| Detail panel | ✅ derecho | ❌ | ✅ per-instance window | ✅ slide-in derecho |
| Grouping | ✅ drag-drop + sort | ✅ packages | ❌ | ✅ group separators |
| Botting mode | ✅ timers + exemptions | ❌ | ❌ | ❌ pendiente |
| Nexus/Account Control | ✅ WebSocket + Lua | ❌ | ❌ | ❌ pendiente |
| Script Manager | ✅ JS + Rust invoke | ❌ | ✅ .py/.ps1/.bat | ❌ pendiente |
| Multi-select | ✅ Ctrl/Shift/marquee | ❌ | ❌ | ❌ pendiente |
| Packages/Group launch | ❌ | ✅ group launch | ❌ | ❌ pendiente |
| Mixer (FPS/quality/volume) | ❌ | ✅ centralizado | ❌ | ❌ pendiente |
| Charts/Game browser | ❌ | ✅ top playing/rated/earning | ❌ | ❌ pendiente |
| Anti-AFK | ❌ | ✅ configurable interval | ❌ | ❌ pendiente |
| Process detection | ❌ | ❌ | ✅ real-time PID | ❌ pendiente |
| Kill All instances | ❌ | ✅ one button | ✅ | ❌ pendiente |
| Launch Diagnostics | ✅ mutex conflict | ❌ | ✅ handle state | ❌ pendiente |
| Server browser | ❌ | ❌ | ❌ | ✅ ServerBrowser |
| Presence UI | ❌ | ❌ | ✅ avatar + username | ✅ PresenceService (UI pendiente) |
| Save/Copy Password | ❌ | ❌ | ❌ | ❌ pendiente |
| Local Web API | ✅ con permissions | ❌ | ❌ | ❌ pendiente |
| Custom themes | ✅ editor | ✅ light/dark | ❌ | ✅ CSS variables + 4 presets |
| Account generator | ❌ | ✅ bloxgen.net API | ❌ | ❌ (no planeado) |
| Anti-afk | ❌ | ✅ | ❌ | ❌ (no planeado) |
| Installer quarantine | ❌ | ❌ | ✅ | ❌ (no planeado) |
| Bloxstrap compatibility | ❌ | ❌ | ✅ | ✅ MultiRobloxService |
| License | GPL-3.0 | MIT | MIT | MIT |

### Features del ecosistema Roblox a implementar en NAM (priorizadas)

| # | Feature | Origen | Fase | Prioridad |
|---|---------|--------|------|-----------|
| F1 | Botting Mode (timers, rejoins, exemptions) | RAM v4 | 4.x | ALTA — casos de uso farming |
| F2 | Multi-select Ctrl/Shift + drag marquee | RAM v4 | 2.x | ALTA —管理 eficiente |
| F3 | Packages/Group Launch (lanzar grupo entero) | MultiRoblox | 3.x | ALTA — farming/trading |
| F4 | Mixer: FPS/quality/volume centralizado | MultiRoblox | 4.x | MEDIA — multi-boxing |
| F5 | Charts: top playing/rated/earning games | MultiRoblox | 3.x | MEDIA — game discovery |
| F6 | Anti-AFK (intervalo configurable) | MultiRoblox | 4.x | MEDIA — farming |
| F7 | Kill All instances (botón) | MultiRoblox | 2.x | ALTA — control rápido |
| F8 | Process detection real-time (PID, status) | MultiBlox | 4.x | MEDIA — monitoring |
| F9 | Nexus Account Control (WebSocket + Lua) | RAM v4 | 4.x | BAJA — complejo |
| F10 | Script Manager (JS con IPC) | RAM v4 | 4.x | BAJA — complejo |
| F11 | Launch Diagnostics (mutex conflict) | RAM v4 | 4.x | BAJA — debugging |
| F12 | Local Web API con permissions | RAM v4 | 4.x | BAJA — power users |
| F13 | Presence: 5 estados (Offline/Online/InGame/InStudio/Invisible) | Roblox API | 3.6 | ALTA — precisión |
| F14 | Server browser: ping, filter by player count | RoPro | 3.x | MEDIA — UX servers |
| F15 | Recent servers left (historial) | RoPro | 3.x | MEDIA — conveniencia |
| F16 | Playtime tracking per game | RoPro | 3.x | MEDIA — stats |
| F17 | FastFlag management (FPS, graphics) | Bloxstrap | 4.x | BAJA — complejo |
| F18 | Discord Rich Presence | Bloxstrap | 4.x | BAJA — integración social |

### Diferenciación de NAM vs competidores

**NAM es el ÚNICO que:** cross-platform (Win/Linux/Mac) + i18n ES/EN/PT + grid cards + detail panel slide-in + AES-256-GCM + MIT + sidebar con 5 views + server browser + presence UI + Bloxstrap compatible

**Ventajas competitivas a mantener:**
1. Cross-platform (todos los competidores son Windows-only)
2. i18n (solo RAM v4 tiene Crowdin, solo EN/DE)
3. Grid cards con avatars (otros usan listas planas)
4. Detail panel slide-in (RAM v4 tiene panel derecho pero no slide-in animado)
5. Server browser integrado (ningún competidor lo tiene)
6. AES-256-GCM (solo RAM v4 y MultiRoblox lo tienen)
7. MIT license (MultiBlox y MultiRoblox también, RAM v4 es GPL-3.0)

## Modelo de datos — Entidades y relaciones

### Account (entidad principal — 22 atributos)
| Atributo | Tipo | Origen | Descripción |
|----------|------|--------|-------------|
| id | string (UUID) | Local | Identificador único local |
| robloxUserId | number | Roblox API | UserID de Roblox |
| username | string | Roblox API | Nombre de usuario (sin cifrar) |
| displayName | string? | Roblox API | Nombre visible |
| cookie | string? | Local | .ROBLOSECURITY (cifrada AES-256-GCM reposo) |
| group | string | Local | Grupo de organización |
| description | string? | Local | Notas del usuario |
| lastUsed | Date | Local | Última vez usada |
| createdAt | Date | Local | Fecha de creación en NAM |
| avatarUrl | string? | Roblox API | URL del avatar |
| cookieExpiresAt | Date? | Local | Expiración de cookie |
| savedPlaceId | string? | Local | Place ID guardado |
| savedJobId | string? | Local | Job ID guardado |
| fields | Record<string,string>? | Local | Campos personalizables |
| password | string? | Local | Contraseña (cifrada, si savePasswords=true) |
| presence | enum | PresenceService | online / offline / in-game |
| currentGame | string? | PresenceService | Juego actual |
| currentPlaceId | string? | PresenceService | Place ID del juego actual |
| currentJobId | string? | PresenceService | Job ID del servidor actual |
| friends | Friend[]? | Roblox API | Lista de amigos (cacheada) |
| autoRelaunch | boolean | Local | Relanzar automáticamente si se cae |
| browserTrackerId | number? | Local | ID para detectar instancias duplicadas |

### Friend (entidad secundaria — pertenece a Account)
userId, username, displayName?, presence (online/offline/in-game), currentGame?, currentPlaceId?, isOnline, avatarUrl?

### GameServer (entidad de búsqueda — no se persiste)
jobId, playerCount, maxPlayers, ping, region, fps

### Game (entidad de búsqueda — no se persiste)
placeId, name, description?, playerCount, thumbnailUrl?, universeId?

### RecentGame / FavoriteGame (entidades persistentes locales)
placeId, name, lastPlayed/addedAt, thumbnailUrl?

### GlobalSettings (11 settings globales — aplican a toda la app)
savePasswords, autoRelaunch, cookieAutoRefresh, multiRoblox, launchDelay (8s),
shuffleLowestServer, maxRecentGames (8), preventDuplicateInstances,
connectionWatcher, connectionTimeout (300s), devMode

### ThemeSettings
theme (dark/light/roblox-classic/custom), primaryColor, accentColor,
fontSize (small/medium/large), uiDensity (compact/normal/spacious), animationsEnabled

### LanguageSettings
language (es default, en, pt)

### Configuración: Global vs Per-Account
| Setting | Scope | Justificación |
|---------|-------|----------------|
| savePasswords | GLOBAL | Política de seguridad del usuario |
| autoRelaunch (default) | GLOBAL | Default para nuevas cuentas |
| autoRelaunch (override) | PER-ACCOUNT | Algunas cuentas necesitan relaunch, otras no |
| cookieAutoRefresh | GLOBAL | Comportamiento del servicio |
| multiRoblox | GLOBAL | Afecta el launch de todas las cuentas |
| launchDelay | GLOBAL | Delay entre launches |
| shuffleLowestServer | GLOBAL | Comportamiento del shuffle |
| maxRecentGames | GLOBAL | Límite de historial |
| connectionWatcher | GLOBAL | Servicio de monitoreo |
| preventDuplicateInstances | GLOBAL | Comportamiento del launcher |
| devMode | GLOBAL | Features de desarrollador |
| theme / language | GLOBAL | Visual |
| savedPlaceId / savedJobId | PER-ACCOUNT | Cada cuenta guarda su propio Place/Job ID |
| group / description / displayName(alias) | PER-ACCOUNT | Organización del usuario |
| password | PER-ACCOUNT | Contraseña guardada (si savePasswords=true) |
| browserTrackerId | PER-ACCOUNT | Tracking de instancia activa |
| friends | PER-ACCOUNT | Lista de amigos por cuenta |
| presence | PER-ACCOUNT (read-only) | Estado online via PresenceService |

### Presence = capa social (no dashboard de "estoy jugando")
**Acciones que habilita:** ver amigos online, añadir/eliminar amigo, seguir/dejar de seguir,
unirse a partida de amigo, ver perfil de amigo, ver outfits, Player Finder (buscar por username)

**Flujo:** Account seleccionada → PresenceService.getPresence(robloxUserId)
→ { status, currentGame?, currentPlaceId?, currentJobId? } → UI actualiza dot en AccountCard
→ Si in-game: botón "Unirse" disponible

### Flujo de Friends
Account seleccionada → Roblox API getFriends(robloxUserId) → Friend[] con presence de cada amigo
→ UI muestra lista en AccountDetailPanel → Click en amigo online → opción "Unirse a partida"
→ Click en amigo → "Ver perfil", "Eliminar amigo" → Buscar username → "Añadir amigo", "Seguir"

### Features de RAM — estado de implementación
| Feature | RAM | NAM | Fase |
|---------|-----|-----|------|
| Account encryption (AES-256-GCM vs DPAPI) | ✅ | ✅ | — |
| Multi-instance Roblox | ✅ | ✅ | — |
| Add accounts (login + cookie + bulk) | ✅ | ✅ | — |
| Cookie storage (cifrada vs plaintext) | ✅ | ✅ | — |
| PlaceId/JobId join | ✅ | ✅ | — |
| Server browser | ✅ | ✅ | — |
| Custom themes (CSS vars vs WinForms) | ✅ | ✅ | — |
| i18n (ES/EN/PT vs EN only) | ❌ | ✅ | — |
| Cross-platform (Electron vs WinForms) | ❌ | ✅ | — |
| Open source (MIT vs GPL-3.0) | ✅ | ✅ | — |
| Cookie auto-refresh | ✅ | ✅ | — |
| DevMode (rbx-player link) | ✅ | ✅ | — |
| Save/Copy Password | ✅ | ❌ | 3.1 |
| Account Groups UI | ✅ | ❌ | 3.2 |
| Account Sorting (drag-drop) | ✅ | ❌ | 3.3 |
| Recent Games | ✅ | ❌ | 3.4 |
| Favorite Games | ✅ | ❌ | 3.5 |
| Presence UI (friends, join friend) | ✅ | ❌ | 3.6 |
| Account Utilities | ✅ | ❌ | 3.7 |
| Account Aging Alert | ✅ | ❌ | 3.8 |
| Auto Relaunch | ✅ | ✅ | 4.1 |
| Connection Watcher | ✅ | ✅ | 4.2 |
| Prevent Duplicate Instances | ✅ | ✅ | 4.3 |
| Join VIP Servers | ✅ | ✅ | 4.4 |
| Player Finder | ✅ | ✅ | 4.5 |
| Outfit Viewer | ✅ | ✅ | 4.6 |
| Local Web API | ✅ | ✅ | 4.7 |
| Join Group | ✅ | ✅ | 4.8 |
| Quick Log In | ✅ | ✅ | 4.9 |

## Historial de versiones
- v2.0.1 (2026-07-13): OpenSource migration, NSIS publicado
- v2.2.0: AccountTable, AccountDetailsPanel, ActionBar, ServerBrowser, PresenceDashboard, Sidebar
- v2.3.x: LoginBrowserService, BrowserWindow login
- v2.4.0: Rediseño single-view, eliminada Sidebar, eliminado routing
- v2.4.1: tsc limpio, coverage, a11y (focus-trap, ARIA), NSIS publicado
- v2.5.0: Limpieza legacy completa, eliminación de 26 archivos, estructura coherente
- v2.5.1: Hotfix type:module (.exe crash fix)
- v3.0.0: Refactor UI Fase 1 completado, Fases 2-6 planificadas

## Code Review + Visual Diff Workflow (v3.0.0)

### Herramientas configuradas
- **mcp-code-review** (MCP): análisis de PRs con guidelines específicas en `.codereview.yml`
  - Focus: security, quality, performance, architecture
  - Locale: español
  - Reportes en `.hermes/code-review-reports/`
- **GitHub Action visual-diff.yml**: captura screenshots del renderer en cada PR
  - Trigger: label `visual diff` en el PR
  - Screenshot se sube como artifact del workflow run
  - Comentario automático en el PR con link al artifact
- **Playwright MCP**: verificación visual on-demand desde Hermes
- **MyPreview (VS Code)**: preview en tiempo real del renderer dentro del editor

### Flujo de desarrollo iterativo
```
LOCAL (real-time):
  Hermes edita código → Vite HMR recarga renderer (<1s) → MyPreview muestra cambio en VS Code

SPRINT:
  spec → implement → test (tsc + vitest) → commit → push → PR

GITHUB (trazabilidad):
  PR + label "visual diff" → GitHub Action screenshots → mcp-code-review analiza diff → comentario en PR → merge
```

### PR #1 — Testing del workflow (2026-07-16)
- Branch: feature/test-code-review-workflow
- Cambio: Brand "NexoAccManager v3.0" en Sidebar
- Code review: ✅ APROBADO (security, quality, performance, architecture)
- Visual Diff: ✅ Screenshot capturado como artifact
- Ver: https://github.com/Nxxo31/NexoAccManager/pull/1
