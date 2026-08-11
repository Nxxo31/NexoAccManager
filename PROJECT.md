# NexoAccManager — PROJECT.md

> **Estado:** Activo | **Versión:** 5.0.0 → 5.1.0 (roadmap) | **Última actualización:** 2026-08-10 — Roadmap paridad RAM/Bloxstrap/Fishstrap/BetterBlox, 22 features auditadas, 3 bugs críticos fixed

---

## Objetivo

Gestor de cuentas Roblox más completo de código abierto: 100% local, AES-256-GCM, arquitectura hexagonal, sin servidores, sin nube, sin tracking. Paridad o superior vs RAM (ic3w0lf22), Bloxstrap, Fishstrap, Voidstrap, BetterBlox, MultiBloxy.

## Objetivos Secundarios

1. Seguridad zero-trust: AES-256-GCM, branded type `EncryptedString`, CSP estricta
2. Clean Architecture: domain / application / infrastructure / preload / renderer
3. IPC segura auditada: 94 canales tipados, cookies nunca en renderer
4. i18n ES/EN/PT vía `t(key, vars)` — 255 keys × 3 idiomas, fallback ES
5. Multi-OS: Windows NSIS + portable, Linux AppImage + Snap
6. App más completa del ecosistema: paridad RAM + features de bootstrappers + UX de BetterBlox

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Lenguaje | TypeScript | 5.x | Tipado estático estricto |
| Framework | Electron | 30.x | Desktop multi-OS, sandbox + contextIsolation |
| UI | React 18 + Mantine v7 | 7.17.8 | Renderer con TSX, componentes accesibles |
| Estado | Zustand | 5.x | Stores reactivos (accountStore, uiStore, launchStore) |
| Animación | framer-motion | 12.x | Reorder, modales, sidebar, micro-interacciones |
| Build | Vite + electron-builder | 5.x / 24.x | Dev server + empaquetado |
| DB | better-sqlite3 | 9.4.0 | SQLite local, sincrónico |
| Seguridad | node-forge | 1.3.1 | AES-256-GCM encryption |
| Logging | electron-log | 5.4.4 | Logger rotativo 5MB en userData/logs/ |
| Verification | LSP + delegate_task + gitleaks | — | Gates determinísticos, sin tests tradicionales |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDERER (React 18 + Mantine v7)          │
│  AccountsView · ServersView · GamesView · FriendsView       │
│  SettingsView (12 subcomponentes) · LaunchDock · Sidebar    │
│  Zustand stores · t() i18n (ES/EN/PT)                       │
├─────────────────────────────────────────────────────────────┤
│                  PRELOAD (contextBridge segura)              │
│  94 canales tipados · 22 namespaces · window-api.d.ts       │
│  contextIsolation:true · nodeIntegration:false · sandbox     │
├─────────────────────────────────────────────────────────────┤
│              MAIN (Electron 30, Node TypeScript)             │
│                                                             │
│  IPC Handlers (94)          External Services                │
│  ├── account:*              ├── RobloxAuthService            │
│  ├── roblox:*               ├── RobloxGamesService           │
│  ├── settings:*             ├── RobloxPresenceService       │
│  ├── friends:*              ├── RobloxCookieService          │
│  ├── servers:*              ├── RobloxSettingsService        │
│  ├── games:*                ├── ControlWebSocketService     │
│  ├── fflags:*               ├── LocalApiService (REST)      │
│  ├── playtime:*             └── RobloxLogService             │
│  ├── presets:*                                              │
│  ├── mods:*          Domain Layer                            │
│  ├── discord:*      ├── Account, FastFlag, LaunchPreset     │
│  ├── botting:*      ├── PlaytimeEntry, PresenceData          │
│  ├── advanced:*     ├── RobloxApiPort (6 sub-ports, ISP)     │
│  ├── cookie:*       ├── EncryptedString (branded type)       │
│  ├── shell:*        └── RepositoryInterfaces                  │
│  └── theme:*                                               │
│                                                             │
│  Database (better-sqlite3)                                  │
│  ├── accounts · settings · fast_flags · launch_presets       │
│  ├── playtime_log · content_mods · log_entries              │
│  └── CryptoService (AES-256-GCM)                             │
└─────────────────────────────────────────────────────────────┘
│              EXTERNO (Roblox API + Discord RPC)              │
│  HTTPS *.roblox.com · WebSocket push · OAuth                │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
[Usuario click UI]
  → [Zustand store.mutate]
  → [window.api.namespace.method (preload contextBridge)]
  → [ipcRenderer.invoke('channel:method', args)]
  → [IPC handler (main) → Repository + Service]
  → [External Service → HTTPS a Roblox API]
  → [Response → IpcResult { success, data } | { success: false, error }]
  → [ipcMain.handle → renderer → store.update → re-render]
```

El renderer NUNCA manipula cookies ni passwords — el main process las cifra y persiste.

### DB Schema

```sql
-- Tabla: accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId INTEGER,
  name TEXT,
  displayName TEXT,
  cookie TEXT,          -- EncryptedString (AES-256-GCM)
  password TEXT,        -- EncryptedString (nullable)
  group TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cookieExpiresAt INTEGER,
  autoRelaunch INTEGER DEFAULT 0,
  createdAt INTEGER DEFAULT (strftime('%s','now') * 1000),
  updatedAt INTEGER DEFAULT (strftime('%s','now') * 1000)
);

-- Tabla: settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Tabla: fast_flags
CREATE TABLE IF NOT EXISTS fast_flags (
  id TEXT PRIMARY KEY,
  accountId TEXT,
  flags TEXT,  -- JSON
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Tabla: launch_presets
CREATE TABLE IF NOT EXISTS launch_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  placeId TEXT NOT NULL,
  accountIds TEXT NOT NULL,  -- JSON array
  options TEXT,              -- JSON: {multiRoblox, launchDelay, region, etc.}
  createdAt INTEGER DEFAULT (strftime('%s','now') * 1000)
);

-- Tabla: playtime_log
CREATE TABLE IF NOT EXISTS playtime_log (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  placeId TEXT,
  placeName TEXT,
  startedAt INTEGER,
  endedAt INTEGER,
  durationMs INTEGER
);
```

### Frameworks Conceptuales

**Hexagonal (Ports & Adapters):** `RobloxApiPort` segregado en 6 sub-ports (Auth, Games, Presence, Social, Settings, Cookie) — ISP. Adaptadores en Infrastructure implementan formalmente con `implements`.

**Branded Types:** `EncryptedString` con `unique symbol` privado — guarantee compile-time de que cookies/passwords solo provienen de `CryptoService.encrypt()`.

**IPC Drift Detector:** Script extractor sincroniza preload ↔ handlers ↔ `window-api.d.ts`. Drift != 0 rompe CI.

**Verification Gates (sin tests tradicionales):**
1. Layer 1: `mcp__lsp_intelligence__live_diagnostics` — 0 errores en tiempo real
2. Layer 2: Code review adversarial via `delegate_task` o `mcp__mcp_code_review_pro__review_diff`
3. Layer 3: `gitleaks` en staged diff
4. Layer 4: Smoke test del binario real (AppImage + xvfb-run, 10s, exit 0)
5. Layer 5: Visual QA via `computer_use` o `mcp__playwright__browser_take_screenshot`

---

## Estado de Implementación

### v5.0.0 — Completado (2026-08-10)

| Componente | Estado | Verificación |
|-----------|--------|--------------|
| CI reparado (sin continue-on-error) | ✅ | `grep continue-on-error .github/workflows/` → 0 |
| ipc-drift-check en CI | ✅ | Job corre `scripts/extract-ipc-channels.ts` |
| gitleaks en CI | ✅ | Job corre en pull_request |
| Smoke test binario real | ✅ | AppImage + xvfb-run 10s, exit 0 |
| React.memo en AccountsView + AccountCard (B-7) | ✅ | LSP clean |
| i18n consolidado a `t(key, vars)` | ✅ | 255/255/255 keys, react-i18next eliminado |
| CHANGELOG.md + MIGRATION.md | ✅ | Creados |
| WebSocket real para account:control (B-1) | ✅ | WS persistente + reconnect backoff |
| Renderer negro fix (CSP + Vite retry) | ✅ | 2026-08-10 |
| AddAccountModal LSP warning fix | ✅ | 2026-08-10 |
| i18n.ts doble escape bulkPlaceholder fix | ✅ | 2026-08-10 |

### Bugs Críticos Fixed (2026-08-10, commit 46df27a)

| Bug | Archivo | Root Cause | Fix |
|-----|---------|-----------|-----|
| verifyCookie API mismatch | RobloxAuthService.ts:175 | Esperaba `data.data[]` (array), API devuelve `data` directa (objeto) | Cambiado a `apiGet<{ id: number; name: string }>` y `data.id`/`data.name` directo |
| getProfile API mismatch | RobloxSettingsService.ts:10 | Mismo formato incorrecto | Actualizado generic type, eliminado wrapper `data.data` |
| Tabla launch_presets faltante | DatabaseManager.ts:68 | `CREATE TABLE` no existía | Agregado schema completo |

---

## Auditoría de Paridad vs Competidores

### Investigación de Competidores (sesión 2026-07-22)

| Proyecto | Stack | Stars | Enfoque |
|----------|-------|-------|---------|
| RAM (ic3w0lf22) | C# WinForms | — | Account manager reference — multiroblox, presets, cookie management |
| Bloxstrap | C# | 3.1k | Bootstrapper — FastFlags, mod manager, Discord RPC, BloxstrapRPC |
| Fishstrap | C# (fork Bloxstrap) | — | Bootstrapper — player logs, message logs, fast flag profiles, custom themes |
| Voidstrap | C# (fork Bloxstrap) | — | Bootstrapper — teleport fix, auto-updater, multi-instance |
| BetterBlox | Browser ext + Overwolf | 114k users | Extension — last online, 3D avatar, trade tools, region selector, playtime |
| MultiBloxy | C# | 51 | System tray, multi-instance, per-instance process info |
| BTRoblox | Browser ext | — | Website enhancement, trade scam warnings, item values |

### Matriz de Features (30 auditadas)

**✅ Backend + UI completos (4):**

| Feature | Settings UI | Fuente |
|---------|------------|--------|
| LaunchPresets | SettingsLaunchPresets.tsx (7 refs) | RAM |
| DiscordRPC | SettingsDiscordRPC.tsx (26 refs) | Bloxstrap |
| FastFlags editor | SettingsFastFlags.tsx (2 refs) | Bloxstrap, Fishstrap |
| Playtime tracking | SettingsPlaytime.tsx (23 refs) | BetterBlox |

**⚠️ Backend existe, sin UI de settings (6):**

| Feature | Backend | UI faltante |
|---------|---------|-------------|
| MultiRoblox | handler existe | Toggle en SettingsAdvanced |
| PreventDuplicateInstances | handler existe | Toggle en SettingsAdvanced |
| ServerRegion picker | getServerRegion existe | Selector UI en SettingsLaunch |
| SystemTray | tray existe | Toggle en SettingsAdvanced |
| LastOnline tracking | dato en DB | Display en AccountDetailPanel |
| AutoRelaunch | campo en DB | Toggle per-account en AccountCard |

**❌ No implementado (16):**

| # | Feature | Fuente | Descripción |
|---|---------|--------|-------------|
| F1 | LaunchDelay | RAM | Delay configurable entre launches para evitar detección |
| F2 | ShuffleLowestServer toggle | RAM | Backend existe (shuffle handler), falta toggle en settings |
| F3 | FastFlagProfiles | Fishstrap | Múltiples perfiles de FastFlags intercambiables con un clic |
| F4 | PlayerLogs | Fishstrap | Track de join/leave de servidores por cuenta |
| F5 | MessageLogs | Fishstrap | Log de chat in-game parseado desde logs de Roblox |
| F6 | OnlineAlerts | BetterBlox | Notificación cuando un amigo se conecta |
| F7 | PerInstanceProcessInfo | MultiBloxy | PID, CPU/memoria, estado por instancia activa |
| F8 | BloxstrapRPC | Bloxstrap | RPC mechanism para que scripts de Roblox invoquen funciones locales |
| F9 | CrossGameTeleportFix | Voidstrap | Fix para error 772 al teletransportar entre juegos |
| F10 | AutoUpdater | Voidstrap | Auto-update de la app al iniciar |
| F11 | UpdateSkipping | Fishstrap | Saltar updates de Roblox (mantener versión anterior) |
| F12 | CustomBootstrapperThemes | Fishstrap | Temas personalizados para el launcher |
| F13 | Avatar3DRenderer | BetterBlox | Rotar avatar 3D en perfil (Three.js / react-three-fiber) |
| F14 | ItemValueTradeTools | BetterBlox, BTRoblox | Valores de items Rolimons, alerta de trade scams |
| F15 | TradeScamWarnings | BTRoblox | Alerta visual antes de aceptar trades sospechosos |
| F16 | AccountSorting | RAM | Drag-drop para reordenar cuentas (framer-motion Reorder) |

---

## Roadmap v5.0.0 → v6.0.0

> **Meta:** App más completa del ecosistema. Paridad RAM + features de bootstrappers + UX de BetterBlox.

### Fase 1: v5.1.0 — Settings UI para backend existente (6 toggles)

> **Objetivo:** Conectar los 6 backends que existen pero no tienen UI. Cambios mínimos — solo settings components + i18n keys.

| Task | Feature | Archivos | Acceptance Criteria |
|------|---------|----------|---------------------|
| 1.1 | MultiRoblox toggle | SettingsAdvanced.tsx, i18n.ts | Switch visible, persiste en settings, `api.settings.get/set('multiRoblox')` funciona |
| 1.2 | PreventDuplicateInstances toggle | SettingsAdvanced.tsx, i18n.ts | Switch visible, persiste, handler `roblox:launch` consulta el setting antes de lanzar |
| 1.3 | ServerRegion selector | SettingsLaunch.tsx (nuevo), i18n.ts | Combobox con regiones, persiste `preferredRegion`, LaunchDock lo usa al hacer join |
| 1.4 | SystemTray toggle | SettingsAdvanced.tsx, i18n.ts | Switch visible, minimize-to-tray activado/desactivado según setting |
| 1.5 | LastOnline display | AccountDetailPanel.tsx, i18n.ts | Fecha "última vez online" visible en el panel de detalle de cuenta |
| 1.6 | AutoRelaunch toggle per-account | AccountCard.tsx, i18n.ts | Switch en card de cuenta, persiste `autoRelaunch` en DB, handler de control lo respeta |

**Gate Fase 1:** LSP clean en los 6 archivos. Build exit 0. Commit atómico por task.

### Fase 2: v5.2.0 — Features de power user (4 features nuevas)

> **Objetivo:** Features que RAM tiene y NAM no — las que más価en los power users.

| Task | Feature | Backend | UI | Acceptance Criteria |
|------|---------|---------|-----|---------------------|
| 2.1 | F1: LaunchDelay | Settings: `launchDelay` (ms) · Handler `roblox:launch` espera N ms entre launches | SettingsLaunch.tsx slider 0-10000ms | Al lanzar múltiples cuentas, delay aplicado entre cada launch |
| 2.2 | F2: ShuffleLowestServer toggle | Handler shuffle existe · Settings toggle `shuffleLowest` | SettingsLaunch.tsx switch | Al activar, `roblox:launch` selecciona servidor con menor ping automáticamente |
| 2.3 | F3: FastFlagProfiles | Tabla `fast_flag_profiles` (id, name, flags JSON) · Handlers `fflags:profile*` | SettingsFastFlags.tsx — combo de perfiles + botones guardar/cargar/eliminar | Crear, nombrar, switch entre perfiles. Importar/exportar perfiles |
| 2.4 | F16: AccountSorting | accountStore con `order` array · `account:reorder` handler | AccountsView con framer-motion `Reorder.Group` | Drag-drop reordena cuentas, orden persiste en DB, respeta grupos |

**Gate Fase 2:** LSP clean. Build exit 0. Code review subagent. Commit por task.

### Fase 3: v5.3.0 — Monitoring y logs (3 features)

> **Objetivo:** Visibilidad de lo que pasa en las instancias de Roblox.

| Task | Feature | Backend | UI | Acceptance Criteria |
|------|---------|---------|-----|---------------------|
| 3.1 | F4: PlayerLogs | RobloxLogService lee `%localappdata%\Roblox\logs` · Parsea join/leave · Tabla `player_log_entries` | SettingsLogs.tsx — nueva tab "Actividad" con tabla filtrable | Muestra quién entra/sale, por instancia, con timestamp |
| 3.2 | F5: MessageLogs | RobloxLogService parsea chat de logs · Tabla `chat_log_entries` | SettingsLogs.tsx — tab "Chat" con tabla | Muestra mensajes de chat por cuenta/instancia, filtrable |
| 3.3 | F7: PerInstanceProcessInfo | `roblox:instances` handler retorna PID, CPU%, mem MB · Polling cada 2s | AccountControlPanel — panel de monitoreo por instancia | Muestra PID, CPU, memoria en tiempo real por instancia activa |

**Gate Fase 3:** LSP clean. Build exit 0. Commit por task.

### Fase 4: v5.4.0 — Social y alertas (2 features)

> **Objetivo:** Features de BetterBlox que mejoran la experiencia social.

| Task | Feature | Backend | UI | Acceptance Criteria |
|------|---------|---------|-----|---------------------|
| 4.1 | F6: OnlineAlerts | RobloxPresenceService polling cada 30s · Notificación nativa Electron cuando amigo se conecta | SettingsAdvanced.tsx toggle + FriendsView indicator | Notificación del OS al detectar amigo online. Toggle en settings |
| 4.2 | F13: Avatar3DRenderer | react-three-fiber + Roblox thumbnail API → 3D model · `roblox:avatar3D` handler | AccountDetailPanel — canvas 3D interactivo | Avatar rotable 360°, zoom, cambio de outfit visible en 3D |

**Gate Fase 4:** LSP clean. Build exit 0. Visual QA via playwright screenshot. Commit por task.

### Fase 5: v5.5.0 — Bootstrapper features (4 features avanzadas)

> **Objetivo:** Features de Bloxstrap/Voidstrap/Fishstrap que diferencian NAM de un account manager básico.

| Task | Feature | Backend | UI | Acceptance Criteria |
|------|---------|---------|-----|---------------------|
| 5.1 | F8: BloxstrapRPC | WebSocket server local · Scripts de Roblox invocan funciones NAM via `ws://localhost:port` | SettingsAdvanced.tsx toggle + docs integrados | Script Lua puede enviar comando a NAM (ej: `launchAccount`, `switchAccount`) |
| 5.2 | F9: CrossGameTeleportFix | Interceptar error 772 · Re-lanzar con cookie limpia | Automático — sin UI | Error 772 ya no ocurre al teletransportar entre juegos |
| 5.3 | F10: AutoUpdater | electron-updater · Feed GitHub releases · Check al iniciar | SettingsAdvanced.tsx toggle | App se actualiza sola al detectar nueva versión en GitHub releases |
| 5.4 | F12: CustomBootstrapperThemes | CSS themes personalizados importables · `theme:import` handler | SettingsAppearance.tsx — importar/exportar theme JSON | Usuario puede crear, importar y compartir temas personalizados |

**Gate Fase 5:** LSP clean. Build exit 0. Code review subagent. Commit por task.

### Fase 6: v6.0.0 — Trading y economy (2 features opcionales)

> **Objetivo:** Features de BetterBlox/BTRoblox para traders. Menor prioridad — NAM es account manager, no trading tool.

| Task | Feature | Backend | UI | Acceptance Criteria |
|------|---------|---------|-----|---------------------|
| 6.1 | F14: ItemValueTradeTools | Roblox API de inventario + Rolimons API · `roblox:itemValues` handler | AccountDetailPanel — tab "Inventario" con valores | Muestra items del usuario con valor estimado de Rolimons |
| 6.2 | F15: TradeScamWarnings | Heurística de trades desiguales · Comparación de valores | Modal de advertencia antes de aceptar trade | Alerta visual si el trade es desigual (diferencia > 20% valor) |

**Gate Fase 6:** LSP clean. Build exit 0. Release v6.0.0.

### Features descartadas (no aplican a desktop app)

| Feature | Razón |
|---------|-------|
| UpdateSkipping (F11) | NAM no es bootstrapper — no controla updates de Roblox |
| BetterBlox browser extension features | NAM es desktop app, no extensión de navegador |

---

## Matriz de Trazabilidad

| Req ID | Descripción | Componente | Estado |
|--------|-------------|------------|--------|
| R-01 | AES-256-GCM encryption con branded type | CryptoService, EncryptedString | ✅ |
| R-02 | Cookies nunca salen del main process | accountHandlers, RobloxHttp | ✅ |
| R-03 | CSP bloquea inline + conexiones externas | main.ts | ✅ |
| R-04 | 94 canales IPC tipados sincronizados | preload, window-api.d.ts | ✅ |
| R-05 | i18n ES/EN/PT 255 keys cada uno | config/i18n.ts | ✅ |
| R-06 | LaunchDock persistente con WebSocket | ControlWebSocketService, LaunchDock.tsx | ✅ |
| R-07 | RobloxApiPort segregado en 6 sub-ports | RobloxApiPort.ts, 6 services | ✅ |
| R-08 | Logging estructurado rotativo | logger.ts | ✅ |
| R-09 | Code splitting (bundle 739KB→412KB) | vite.config.ts | ✅ |
| R-10 | verifyCookie API response correcto | RobloxAuthService.ts | ✅ (fixed 08-10) |
| R-11 | getProfile API response correcto | RobloxSettingsService.ts | ✅ (fixed 08-10) |
| R-12 | Tabla launch_presets en schema | DatabaseManager.ts | ✅ (fixed 08-10) |
| R-13 | MultiRoblox toggle en settings | SettingsAdvanced.tsx | ⏳ Fase 1.1 |
| R-14 | PreventDuplicateInstances toggle | SettingsAdvanced.tsx | ⏳ Fase 1.2 |
| R-15 | ServerRegion selector UI | SettingsLaunch.tsx | ⏳ Fase 1.3 |
| R-16 | SystemTray toggle | SettingsAdvanced.tsx | ⏳ Fase 1.4 |
| R-17 | LastOnline display | AccountDetailPanel.tsx | ⏳ Fase 1.5 |
| R-18 | AutoRelaunch toggle per-account | AccountCard.tsx | ⏳ Fase 1.6 |
| R-19 | LaunchDelay configurable | SettingsLaunch.tsx | ⏳ Fase 2.1 |
| R-20 | ShuffleLowestServer toggle | SettingsLaunch.tsx | ⏳ Fase 2.2 |
| R-21 | FastFlagProfiles | SettingsFastFlags.tsx | ⏳ Fase 2.3 |
| R-22 | AccountSorting drag-drop | AccountsView.tsx | ⏳ Fase 2.4 |
| R-23 | PlayerLogs | SettingsLogs.tsx | ⏳ Fase 3.1 |
| R-24 | MessageLogs | SettingsLogs.tsx | ⏳ Fase 3.2 |
| R-25 | PerInstanceProcessInfo | AccountControlPanel.tsx | ⏳ Fase 3.3 |
| R-26 | OnlineAlerts | SettingsAdvanced.tsx | ⏳ Fase 4.1 |
| R-27 | Avatar3DRenderer | AccountDetailPanel.tsx | ⏳ Fase 4.2 |
| R-28 | BloxstrapRPC | SettingsAdvanced.tsx | ⏳ Fase 5.1 |
| R-29 | CrossGameTeleportFix | RobloxLaunchService | ⏳ Fase 5.2 |
| R-30 | AutoUpdater | SettingsAdvanced.tsx | ⏳ Fase 5.3 |
| R-31 | CustomBootstrapperThemes | SettingsAppearance.tsx | ⏳ Fase 5.4 |
| R-32 | ItemValueTradeTools | AccountDetailPanel.tsx | ⏳ Fase 6.1 |
| R-33 | TradeScamWarnings | TradeModal.tsx | ⏳ Fase 6.2 |

---

## Seguridad

- **AES-256-GCM** con clave derivada de hardware (PBKDF2 + salt). Branded type `EncryptedString`.
- **Cookies nunca en renderer**: handlers reciben `accountId`, resuelven internamente.
- **CSP**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.roblox.com;`
- **contextIsolation:true, nodeIntegration:false, sandbox:true** — hard constraints
- **Path traversal blocked**: `safeResolve()` antes de cualquier fs operation en ContentModService
- **IPC drift detector**: script extractor sincroniza 94 canales → CI rompe si drift != 0
- **Sin files .env**: credenciales en SQLite cifrado

---

## Limitaciones Conocidas

1. **Wayland**: Sin soporte oficial. Electron puede tener glitches en Linux Wayland (X11 funciona).
2. **MultiRoblox en Wayland**: `ws://` para multi-instancia puede fallar en entornos headless.
3. **Sin OS-level testing**: CI corre Linux pero NAM tiene multi-OS (Windows NSIS, Linux AppImage/Snap).
4. **Captcha**: CaptchaService integrado pero bypass no garantizado — puede requerir intervención manual.
5. **DiscordRPC**: Application ID configurado manualmente en Settings.
6. **Avatar3DRenderer (F13)**: Requiere react-three-fiber — dependencia nueva. Evaluar bundle size impact.

---

## Decisiones Técnicas

| Decisión | Elegido | Alternativas | Razón |
|----------|---------|-------------|-------|
| State | Zustand | Redux, MobX | Mejor DX, sin boilerplate |
| UI | Mantine v7 | shadcn/ui, Ant Design | Accesible out-of-the-box, TS estricto |
| Crypto | EncryptedString branded type | string, object wrapper | Guarantee compile-time |
| DB | better-sqlite3 | lowdb, electron-store | Sincrónico, mejor perf |
| IPC | IpcResult {success, data} | throw + try/catch | Previene errores silenciosos |
| i18n | Custom `t(key, vars)` | react-i18next (eliminado) | Control total, 0 deps extra |
| Verification | LSP + review + gitleaks | vitest, jest | Tests mockeaban Electron — falsa confianza |
| 3D Avatar (F13) | react-three-fiber | Three.js directo | React-friendly, reusabilidad de componentes |

---

## Referencias

- RAM (ic3w0lf22): github.com/ic3w0lf22/RoAccManager — reference architecture
- Bloxstrap: github.com/bloxstraplabs/bloxstrap — FastFlags, mod manager, Discord RPC
- Fishstrap: fishstrap.com — player logs, message logs, flag profiles
- Voidstrap: voidstrap.net — teleport fix, auto-updater
- BetterBlox: betterroblox.com — last online, 3D avatar, trade tools, region selector
- MultiBloxy: github.com/Zgoly/MultiBloxy — system tray, per-instance info
- Repo: github.com/Nxxo31/NexoAccManager

---

*Generado por SophIA — Sebastian Velasco's autonomous operating system*