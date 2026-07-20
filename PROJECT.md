# NexoAccManager — PROJECT.md
# Última actualización: 2026-07-19 (UI rework + notification bar + rename NX-Manager)
# Versión actual: 3.2.0 (UI rework shell + NotificationBar + botting IPC expuesto + rename NX-Manager)

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 3.2.0 |
| Último commit | 004cfd8 — feat(branding): renombrar app a NX-Manager |
| Branch | feature/ui-rework-slice → main (PR #2 open) |
| tsc | 0 errores |
| vitest | 131/131 pasando (12 archivos) |
| lint | pendiente |
| build | ✅ Windows NSIS + Linux AppImage + Linux Snap generados |
| Release GitHub | v3.2.0 publicado — https://github.com/Nxxo31/NexoAccManager/releases/tag/v3.2.0 |

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

### 🟡 PRIORIDAD MEDIA — Lint y tests finales

| # | Tarea | Estado | Descripción |
|---|-------|--------|-------------|
| L1 | Ejecutar `npm run lint` | Pendiente | Corregir advertencias de ESLint (31 unused-vars, 140 any types — prioridad baja, son patrón establecido). |
| T1 | Actualizar tests E2E/a11y/visual | Pendiente | Selectores desactualizados por cambios de UI — regenerar baselines y actualizar specs de Playwright y axe-core. |
| T2 | Ejecutar suite completa de tests | Pendiente | Incluir unit (vitest), E2E browser, a11y browser, visual regression. |

## Decisiones técnicas validadas

1. **contextIsolation: true + nodeIntegration: false** — Respetado en todo el código base, solo uso de `contextBridge` en `preload.ts`.
2. **Nunca exposición de `ipcRenderer`** — Todas las llamadas usan `window.api` expuesta vía preload, verificado en auditoría.
3. **Cifrado AES-256-GCM** — Cookies y contraseñas nunca quedan en texto plano en disco.
4. **Resultado IPC estandarizado** — Todos los handlers retornan `{ success, data }` o `{ success: false, error }`, nunca lanzan excepciones sin capturar.
5. **Whitelist de canales IPC** — `preload.ts` y `main.ts` usan `Set<string>` con sintaxis literal de template (`'channel:name'`) para evitar errores de unión de tipos.
6. **Patrón de ventana única sin routing** — Modales vía estado `activeModal` en App.tsx, sin react-router-dom.

## Análisis profundo reciente y próximos pasos de refactor

### 🔍 Hallazgos del análisis de subagente profundo (orchestrator deleg_7f1885d5)

Un subagente de nivel orchestrator realizó un análisis exhaustivo de 402 segundos (20 llamadas API) utilizando LSP, codebase-deep-dive y systematic-debugging skills. Sus conclusiones clave:

**Problemas de UI identificados:**
- **Toolbar superior contaminada**: actualmente contiene botones de cuenta (agregar, buscar, ocultar) que deberían ir en la vista de accounts. Solo deben quedar: tuerca (configuración avanzada) y toggle luna/sol (tema).
- **Sublateral mal utilizado**: actualmente muestra vistas secundarias (cuentas, servidores, juegos, amigos, settings) en lugar de ser el hub único para todas las APIs de Roblox (lanzar, matar, amigos, servidores, juegos, presencia, botting, web API).
- **Vista de accounts sobrecargada**: debería contener solo buscador, botón agregar cuenta y toggle ocultar/mostrar. Los botones de configuración deben eliminarse de aquí.

**Problemas de backend identificados:**
- Handlers IPC faltantes o incorrectos para varios namespaces (ver sección de deuda técnica).
- Algunos handlers usan imports dinámicos en lugar de servicios inyectados vía constructor.
- Inconsistencias en el patrón invoke/handle (algunos aún usan send/on).

**Próximos pasos de refactor derivados del análisis:**

Basado en este análisis, el trabajo inmediato debe enfocarse en:

1. **Re-arquitectura UI según especificación:**
   - **Toolbar superior**: reducir a solo dos botones:
     - ⚙️ Tuerca → abre modal de configuración avanzada (agrupa todos los settings globales)
     - 🌙☀️ Toggle luna/sol → cambia tema claro/oscuro
   - **Sublateral izquierdo**: convertir en el **Hub Único de APIs de Roblox** con secciones para:
     - 🚀 Lanzar (lista de cuentas + botón lanzar individual/grupal)
     - ⚔️ Matar (matar individual/grupal, usar kill-all)
     - 👥 Amigos (lista, solicitudes, seguir/dejar de seguir)
     - 🎮 Juegos (favoritos, recientes, unirse a partida)
     - 🌐 Web API (estado del servidor local, configuración)
     - 🤖 Botting (estado, configuración, iniciar/detener)
     - 👁️ Presencia (ver juegos activos de amigos)
   - **Vista de accounts**: reducir a solo:
     - 🔍 Buscador de cuentas
     - ➕ Botón agregar cuenta (abre AddAccountModal)
     - 👁️‍🗨️ Toggle ocultar/mostrar cuentas (para limpiar vista)

2. **Refactor de backend para end-to-end functionality:**
   - Verificar que todos los namespaces IPC tengan handlers completos y correctos
   - Reemplazar imports dinámicos en `main.ts` con servicios inyectados vía constructor
   - Asegurar patrón invoke/handle en todos los lugares (nunca send/on para request-response)
   - Confirmar que el cifrado AES-256-GCM se aplica consistentemente a cookies y contraseñas

3. **Validación rigurosa:**
   - Cada cambio debe pasar por el flujo de desarrollo establecido:
     - Spec técnico (si >1 archivo o UI)
     - Mockup HTML (si toca layout/visual)
     - Implementación siguiendo el spec
     - tsc 0 errores, vitest 121/121, lint limpio
     - Actualizar PROJECT.md con resultados
     - Commit y push

**Nota**: Este análisis no realizó cambios de código (rol de orchestrator: análisis y planificación, no implementación). Los próximos pasos de implementación seguirán el flujo de desarrollo validado en PROJECT.md.

### 📊 Estado técnico actual (post-fix TSC + cleanup mocks — 2026-07-19)

|| Métrica | Valor |
||---------|-------|
|| Versión | 3.1.1 |
|| Último commit | (próximo: fix TSC + cleanup) |
|| Tag | v3.1.1 |
|| tsc | 0 errores ✅ |
|| vitest | 121/121 pasando (11 archivos) ✅ |
|| lint | pendiente (prioridad baja) |
|| build | ✅ Release v3.1.1 publicado (NexoAccManager.Setup.3.1.1.exe) |
|| Release GitHub | v3.1.1 (disponible para descarga) |
|| Residuales | Limpiados mockup-v3.html, mockups/, test-results/, coverage/, release/2.5.0 (~210MB) |

### Fixes aplicados en esta sesión (2026-07-19)

1. **NexoApp.multiRobloxService**: Agregado `private multiRobloxService: MultiRobloxService;` al class declaration — faltaba como miembro aunque se instanciaba en constructor y se usaba en IPC handlers (main.ts:89, 1415).
2. **AccountManager.setMultiRoblox**: `multiRobloxService.enable()` ahora retorna `void` (no boolean). Cambio a `try/catch` + verificación de estado con `isEnabled()` antes/después para detectar fallos silenciosos del registro de Windows.
3. **AccountManager.launchRoblox**: `createTempProfile(accountId)` no existe en MultiRobloxService — reemplazado por `createProfile(index: number)` con hash numérico del accountId (mod 1000) como index de perfil.
4. **Limpieza de residuales**: docs/mockup-v3.html, docs/mockups/, test-results/, coverage/ eliminados. release/ limpiado a solo 3.0.0 (borrado 2.5.0 AppImage + snap). ~210MB liberados.

## Pendiente — Calidad y tests

...

## Próximos pasos inmediatos

### 🔥 REFACTOR UI + BRANDING — ACTIVO (2026-07-18)

**Decisiones confirmadas por Sebastian:**

1. **Renombrar app a "NX-Manager"**
   - Cambiar `package.json` name, `productName` en `electron-builder.yml`
   - Actualizar título de ventana, branding visual, README

2. **Quitar modal de diálogo del botón agregar cuenta**
   - Reemplazar AddAccountModal por acción directa: botón "Iniciar sesión" abre navegador inmediatamente
   - Sin pasos intermedios, sin campo Grupo en el modal
   - Campo Grupo se mueve a la tabla de cuentas (slicer izquierdo de accounts)

3. **Asignación de grupos y orden en el slicer izquierdo de accounts**
   - Edición de grupo inline en cada fila de cuenta
   - Drag-drop para reordenar (framer-motion Reorder ya existe)
   - Orden por defecto: orden de creación

4. **Color personalizable en configuraciones avanzadas (tuerca)**
   - Modal de config avanzada con color picker para acento
   - No solo dark/light hardcodeados — usuario elige color

**Flujo de implementación (confirmado por Sebastian 2026-07-18):**
- Generar 2-3 mockups HTML del layout (toolbar + slicer + accounts) para que Sebastian elija uno
- Implementar siguiendo el mockup elegido
- Validar: tsc 0 errores, vitest pasando, lint limpio
- Actualizar PROJECT.md
- Commit y push
- Tag/release con installer NSIS

**Estado del flujo:** EN ESPERA DE MOCKUPS

---

*Decisiones anteriores archivadas:*
- Lint: `npm run lint` (31 unused-vars, 140 any types — prioridad baja)
- Tests E2E/a11y/visual: selectores desactualizados por cambios de UI
- Release v3.0.0 con changelog detallado
- Docs de usuario con nuevas características

## Notas del análisis profundo

*Este bloque resume el output del subagente orchestrator deleg_7f1885d5 (402s, 20 API calls). Sus hallazgos forman la base técnica para el próximo trabajo de refactor UI/backend. No realizó cambios de código (su rol es análisis y planificación). Los detalles completos de su análisis están disponibles en el historial de delegation si se necesitan para referencia profunda.*
---
*Nota: Este documento es la única fuente de verdad del estado del proyecto. Código gana sobre documentación en caso de conflicto, pero documentación debe actualizarse inmediatamente después de cada cambio significativo.*