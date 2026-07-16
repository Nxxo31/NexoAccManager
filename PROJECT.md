# NexoAccManager — PROJECT.md
# Última actualización: 2026-07-16 (consolidación docs)
# Versión actual: 3.0.0 (refactor UI — Fase 1 completada)

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 3.0.0 (refactor UI en progreso) |
| Último commit | 41c5408 — feat(v3.0.0): nueva arquitectura UI |
| tsc | 0 errores |
| vitest | 82/82 pasando |
| lint | pendiente |
| build | ✅ exitoso — AppImage + snap (linux) |
| NSIS | v2.5.1 publicado (fix type:module), v3.0.0 pendiente |
| Playwright | pendiente — selectores actualizados, por verificar |
| Mockup UI | docs/mockups/nam-v3-ui-mockup.html (target visual v3.0) |

## Hotfix v2.5.1 (2026-07-16)
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

### Fase 2 — Conectar views + JoinBar (PRIORIDAD ALTA)
- 2.1 Conectar ServerView, GamesView, SettingsView en App.tsx (existen pero sin wiring)
- 2.2 JoinBar component (Place ID / Job ID / Shuffle / Join) encima de AccountGrid
- 2.3 Búsqueda de cuentas funcional (filtrar por username, displayName, description, group — debounce 200ms)
- 2.4 AccountDetailPanel slide-in derecho (320px): avatar, username, robloxUserId, group dropdown, description, cookie status, saved Place/Job ID, botones Launch/Browser/Copy Password/rbx-player/Quick Login, presence section, friends list

### Fase 3 — Paridad funcional con RAM (PRIORIDAD MEDIA)
- 3.1 Save/Copy Password — toggle global en Settings, cifrar con CryptoService, botón copiar en DetailPanel
- 3.2 Account Groups UI — group field ya existe en Account type; visualizar como separadores en AccountGrid; dropdown en DetailPanel
- 3.3 Account Sorting (drag-drop) — framer-motion Reorder en AccountGrid; persistir orden en store
- 3.4 Recent Games — historial global al hacer Join Server; tab "Recientes" en GamesView; hover en JoinBar → dropdown
- 3.5 Favorite Games — FavoriteGame type; IPC games:addFavorite/removeFavorite/listFavorites; tab "Favoritos" en GamesView; star icon en GameCard
- 3.6 Presence UI — PresenceView dedicada; polling cada 30s; cuentas online → juego actual + Place/Job ID; botón "Unirse"; friends list expandable; search para añadir amigo
- 3.7 Account Utilities — modal o sección en DetailPanel; cambiar password/email/displayName; follow privacy; sign out other sessions
- 3.8 Account Aging Alert — dot amarillo >20 días, rojo >60 días; toggle global disableAgingAlert

### Fase 4 — Features avanzadas / diferenciación (PRIORIDAD BAJA)
- 4.1 Auto Relaunch — toggle global default + override por cuenta; Connection Watcher detecta Roblox cerrado → relanza
- 4.2 Connection Watcher — monitorear proceso Roblox activo; cerrar si no hay conexión por X segundos
- 4.3 Prevent Duplicate Instances — browserTrackerId por cuenta; al lanzar verificar instancia activa; cerrar vieja
- 4.4 Join VIP Servers — detectar VIP link en Place ID input; parsear y extraer access code
- 4.5 Player Finder — buscar jugador por username en ServerBrowser recorriendo servidores
- 4.6 Outfit Viewer — ver outfit actual de jugador; roblox:getAvatar API; modal con visualización
- 4.7 Local Web API — HTTP server local; endpoints /launch /join /accounts /presences; toggle + port en Settings; auth API key local
- 4.8 Join Group — unirse a grupos con múltiples cuentas; input Group ID; seleccionar cuentas → Join Group
- 4.9 Quick Log In — Roblox Quick Log In feature; generar código; display en DetailPanel

### Fase 5 — Tests y calidad (PENDIENTE)
- 5.1 Tests unitarios: AccountGrid, JoinBar, AccountDetailPanel, PresenceView, ServerView, GamesView
- 5.2 Tests E2E/a11y: actualizar selectores v3.0; smoke (sidebar navega, views cambian); navigation (modales, detail panel); a11y (WCAG todas views)
- 5.3 Visual regression: regenerar baselines con nuevo UI; screenshot por view + modales
- 5.4 Lint + tsc + build final

### Fase 6 — Release v3.0.0 (PENDIENTE)
- 6.1 Actualizar README.md con features completas + screenshots
- 6.2 Tag v3.0.0 + NSIS build via GitHub Actions
- 6.3 Release notes con comparativa RAM vs NAM

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

## Análisis UI — Investigación de apps similares (2026-07-16)

### Metodología
Análisis visual de screenshots reales + documentación de design decisions de 5 apps
relevantes para NAM. Fuentes citadas por cada hallazgo.

### 1. Playnite (open-source game library manager)
**Fuente:** github.com/JG00SE/GridViewCards, github.com/sakasakaking/FusionX — screenshots analizados con vision_analyze

**Layout:** Sidebar vertical izquierdo (icon toolbar con view modes: list/grid/cover-flow) + grid responsive central + detail panel derecho (~30% width)
**Cards:** Cover art rellena el card, overlay translúcido oscuro (~70% opacity), título superpuesto, icono de plataforma bottom-left, tiempo jugado bottom-right, star icon para favoritos top-right
**Detail panel:** Banner image + título + botones Install/Play + metadata tabular (time played, last played, platform, publisher, developer, release date) + achievements con progress bar + news feed scrolleable
**Grouping:** Filter-driven, no tree hierarchy. Collections/tags como iconos en cards. Filter bar con "Filter Active" toggle
**Dark theme:** Near-black #121212 background, text white #EEEEEE, accent colors brillantes para logros/estados. Detail panel ligeramente #1E1E1E para elevarlo del grid
**Lección para NAM:** Detail panel derecho con scroll, cards con overlay translúcido sobre avatar, filter-driven grouping (no tree), view modes intercambiables

### 2. Discord (multi-server, presence, navigation)
**Fuente:** discord.com/blog/you-bar, designbyroka.com/work/discord-mobile-redesign

**Layout:** Triple sidebar: server list (ultra-narrow icon rail) → channel list (medium sidebar) → main content → optional member list (right panel)
**Presence:** Status dot en avatar (online/idle/dnd/offline), activity display ("Playing X"), color-coded roles
**Navigation:** Server icons como pill-shaped buttons con tooltip, hover = highlight blanco, selected = badge izquierda. Canales agrupados por categorías colapsables
**Settings:** User settings vía gear icon bottom-left, organization settings separadas del server settings
**Dark theme:** #36393f background (menos extremo que #0D0D0D), text blanco, hover states sutiles
**Lección para NAM:** Presence dots standardizados (online/offline/in-game), sidebar con iconos + labels colapsable, settings globales vs per-entity claramente separadas, hover states sutiles no saturados

### 3. Steam Library (game grid, friends, social)
**Fuente:** anthonyjasper.co.uk/steam.html, blog.parrot9.com/steam-case-study

**Layout:** Sidebar izquierdo (library navigation + collections + friends) + grid central de game cards + detail view inline (no panel separado, expande el content area)
**Cards:** Cover art grande, título superpuesto bottom, tiempo jugado, "last played" timestamp. Hover revela actions (Play/Install) sin necesidad de click
**Detail view:** Full-page takeover con hero banner, news section, friends who play, achievements, screenshots. Información densa pero modular
**Friends/Presence:** Sidebar derecho con friends list, status dots, "in-game" indicators con icon del juego. Click en friend → perfil expandible
**Empty states:** "Your Steam Library is empty. Add games from the store." con CTA claro
**Lección para NAM:** Hover-to-reveal actions en cards (no llenar el card de botones), friends list con presencia en sidebar, empty states con CTA específico, news/info modular en detail view

### 4. Bitwarden (account/credential manager)
**Fuente:** bitwarden.com/blog/bitwarden-design-updating-the-web-vault-experience, github.com/bitwarden/clients/pull/6957

**Layout:** Vertical vault navigation (sidebar) + item list + detail panel. PR #6957 migró a vertical nav unificado
**Cards/Items:** Lista densa con icono + nombre + username + folder badge. NO grid — usa lista compacta para maximizar items visibles
**Grouping:** Vault filter (All / My Vault / Organization) + folder tags + type filters (logins/cards/notes)
**Search:** Top bar search con filtros combinables. Filter bar siempre visible
**Settings:** Clear separation: Account Settings (security, subscription) vs Organization (admin tools). Solo admin ve org tools
**Lección para NAM:** Lista compacta para muchas cuentas (50 max — considerar toggle grid/list), grouping con filter chips (All / Group1 / Group2), settings globales vs per-account en paneles claramente separados, search bar always-visible con debounce

### 5. Linear (dev tool, sidebar + grid + detail)
**Fuente:** linear.app/now/behind-the-latest-design-refresh, linear.app/blog/how-we-redesigned-the-linear-ui, designsystems.one/design-systems/linear

**Layout:** Sidebar izquierda (navigation) + tabs top (views) + content (list/board/timeline) + detail panel derecha (properties)
**Design tokens:** color-background #08090A, color-text-primary #F7F8F8, color-text-tertiary #8A8F98, color-accent #5E6AD2, color-border #23252A, font Inter, motion 180ms
**Sidebar:** Dimmer que content area — navigation recedes, content takes precedence. Iconos reducidos, no fondos coloreados
**Command palette:** ⌘K abre navigation + action + search unificado. Pattern copiado por toda la industria de dev tools
**Motion:** 120-180ms eased transitions para state changes. List reorders, modal entrances, view transitions
**Empty states:** Una frase, ilustración hairline, zero marketing copy
**Density:** 32px o 40px row rhythm consistente. Menos densidades que competidores, usadas deliberadamente
**Lección para NAM:** Sidebar dimmer que content (recedes), comando palette ⌘K, motion 180ms, empty states minimalistas (frase + ilustración simple), row rhythm consistente 32/40px, single accent color como puntuación (no saturar)

### Patrones transversales aplicables a NAM

1. **Sidebar dimmer que content** (Linear, Discord) — navigation recede, accounts gridbright. NAM sidebar actual too bright
2. **Hover-to-reveal actions** (Steam, Playnite) — no llenar AccountCard de botones. Mostrar actions on hover o en detail panel
3. **Detail panel derecho** (Playnite, Linear, Bitwarden) — slide-in, no modal. Scrollable. NAM ya tiene esto en mockup ✓
4. **Filter-driven grouping** (Playnite, Bitwarden) — chips/filters, no tree hierarchy. Group dropdown + filter by group
5. **Presence dots standardizados** (Discord) — verde=online, gris=offline, azul=in-game. Ya en NAM mockup ✓
6. **Command palette ⌘K** (Linear, VS Code) — search + action + navigation unificado. Fase 4 feature
7. **Empty states con CTA** (Steam, Linear) — "No hay cuentas. Agregar cuenta" con botón, no solo texto
8. **Settings globales vs per-account separadas** (Bitwarden, Discord) — SettingsView global, AccountDetailPanel per-account
9. **Motion 120-180ms** (Linear) — view transitions, panel slide-in, card hover. NAM ya usa framer-motion 200ms
10. **Single accent como puntuación** (Linear) — no saturar con color. Roblox red solo para CTAs primarios

### Anti-patrones de RAM a evitar

1. **Ventanas flotantes superpuestas** — RAM usa WinForms floating windows que se tapan entre sí. NAM usa views unificadas + modales
2. **Tabla sin jerarquía visual** — RAM muestra cuentas en表格 plana sin grouping visual. NAM usa cards con group separators
3. **Settings mezclados** — RAM mezcla global settings con per-account en misma vista. NAM separa: SettingsView global, DetailPanel per-account
4. **Sin search** — RAM no tiene search bar. NAM tiene TopBar search con debounce
5. **WinForms look** — RAM parece aplicación de Windows 7. NAM usa dark theme moderno, Inter, framer-motion, Lucide icons
6. **Sin empty states** — RAM muestra ventana vacía sin guía. NAM tiene empty state con CTA

### Recomendaciones concretas para NAM v3.0 UI

| # | Recomendación | Origen | Fase |
|---|---------------|--------|------|
| R1 | Dim sidebar background a #0F0F0F (un notch arriba de #0D0D0D content) | Linear | 2.1 |
| R2 | Hover-to-reveal actions en AccountCard (hide default, show on hover) | Steam, Playnite | 2.4 |
| R3 | Filter chips para groups en TopBar (All / Principal / Altas / ... editable) | Playnite, Bitwarden | 2.3 |
| R4 | Empty state en AccountGrid: "No hay cuentas. [Agregar cuenta]" con ilustración simple | Steam, Linear | 2.1 |
| R5 | Row rhythm 40px en AccountCard (consistente con grid) | Linear | 2.2 |
| R6 | Command palette ⌘K (search + nav + actions) | Linear, VS Code | 4.x |
| R7 | Friends list en AccountDetailPanel con presence dots (no en sidebar) | Discord, Steam | 3.6 |
| R8 | Toggle grid/list view en Accounts (icon toggle en TopBar como Playnite) | Playnite | 3.x |
| R9 | Motion 180ms todos los transitions (reducir de 200ms actuales) | Linear | 2.x |
| R10 | Single accent: Roblox red solo para CTAs primarios, no para todo | Linear | 2.x |

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
| Auto Relaunch | ✅ | ❌ | 4.1 |
| Connection Watcher | ✅ | ❌ | 4.2 |
| Prevent Duplicate Instances | ✅ | ❌ | 4.3 |
| Join VIP Servers | ✅ | ❌ | 4.4 |
| Player Finder | ✅ | ❌ | 4.5 |
| Outfit Viewer | ✅ | ❌ | 4.6 |
| Local Web API | ✅ | ❌ | 4.7 |
| Join Group | ✅ | ❌ | 4.8 |
| Quick Log In | ✅ | ❌ | 4.9 |

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
