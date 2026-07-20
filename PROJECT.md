# NexoAccManager — PROJECT.md

# Última actualización: 2026-07-19 (UI rework finalizado + build + release)

# Versión actual: 3.2.0 (UI rework completado + NotificationBar + rename NX-Manager)

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 3.2.0 |
| Último commit | db0026d — refactor(settings): eliminar botón redundante 'Abrir panel' dentro de SettingsView |
| Branch | feature/ui-rework-slice → main (PR #2 open) |
| tsc | 0 errores |
| vitest | 131/131 pasando (12 archivos) |
| lint | 0 errores, 0 warnings |
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