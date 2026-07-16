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

## Mockup UI v3.0 — Target visual
- Archivo: `docs/mockups/nam-v3-ui-mockup.html`
- HTML interactivo autocontenido (Tailwind CDN + JS inline)
- Define la estructura visual target para desarrollo de Fases 2-4

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
