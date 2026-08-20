# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-08-20 — AGENTS.md actualizado completo (UI v5.0.0 multi-view, tabla MCP, development loop MCP-first), AGENTS.md añadido al repo, auditoría de features

> **Fuente de verdad:** PROJECT.md es la única fuente de verdad por proyecto. MUST read antes de cualquier acción.

---

## Auditoría 2026-08-20
### State of features: 39/39 completed (vs RAM v3.7)

- **39/39 features** completadas — tracking actualizado
- **2 "stubs"** que aparecían como pendientes estaban ya implementados desde julio:
  1. `advanced:devmode` — handler persiste en settings DB vía `settingsRepo.set('devmode', enable)` (commit b566530, julio 2026)
  2. `Account Control` — WebSocket real implementado en `ControlWebSocketService.ts` (248 líneas), forward push events al renderer, lifecycle enlazado a `advanced:local-api:start`/`stop` (commits c04e646 → a0fa40a → 4e65a86 → merge 7954103)
- **PROJECT.md** es la única fuente de verdad — leer ANTES de cualquier acción
- **AGENTS.md** ahora está en el repo (añadido 2026-08-20) — protocolo memoria cross-session, no cron-based

### Gates verificados (con tool output real):
| Gate | Resultado |
|------|-----------|
| `live_diagnostics` en `advancedHandlers.ts` | ✅ 0 errores |
| `live_diagnostics` en `ControlWebSocketService.ts` | ✅ 0 errores |
| `live_diagnostics` en `SettingsRepositoryImpl.ts` | ✅ 0 errores |
| `npm run build` | ✅ exit 0 — vite renderer+main+preload + electron-builder snap+AppImage finalizados |

### Acciones tomadas:
- `AGENTS.md` creado y commiteado: `e85e134` "feat(agents): add AGENTS.md — protocolo memoria cross-session"
- `PROJECT.md` actualizado: tracking 39/39 (no 37/39), nueva sección Auditoría 2026-08-20
- `npm run build` exit 0 confirmado
- Working tree clean, empujado a `origin/main`

---

## 📋 Sprint — Siguientes Pasos Pendientes
- [ ] Verificar dark-mode toggle en electrón
- [ ] Continuar con Synthetic Trader backend
- [ ] Avanzar E-14 Fraud Detector capa 3

---

## 🎯 Objetivo Principal
Gestor de cuentas Roblox de código abierto, 100% local, con encriptación AES-256-GCM y arquitectura hexagonal — sin servidores, sin nube, sin tracking.

## 🎯 Objetivos Secundarios
1. Cementar el modelo de seguridad de cero-confianza (cifrado AES-256-GCM, branded type `EncryptedString`, CSP)
2. Establecer Clean Architecture como base del código (domain / application / infrastructure / preload / renderer)
3. Proveer una superficie IPC segura y auditada para el renderer (nunca exponer cookies ni secretos)
4. Localización completa ES / EN / PT vía el sistema único `t(key, vars)` personalizado en `src/config/i18n.ts` — 255 leaf keys × 3 idiomas (es/en/pt), simétricos, sin duplicados, con fallback ES
5. Soporte multi-OS (Windows NSIS + MSIX, Linux AppImage + Snap)

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
└─────────────────────────────────────────────────────────────┘
```

## 📦 Distribución
- **Electron**: empaquetado NSIS (Windows) + AppImage (Linux) + Snap (Linux)
- **Fuentes**: TypeScript compilado a JavaScript, fuentes incrustadas
- **Recursos**: ICNS (macOS), PNGs, configuraciones de build

## ⚠️ Límites y Conocimientos
- Sin servidores externos — todo es local/offline
- Sin tracking de telemetría — privacidad por diseño
- Electron sandbox mode con contextIsolation — sin nodeIntegration en renderer
- 91 canales IPC tipados — documentación en `window-api.d.ts`

## 📝 Registro de Commits Recientes
- `e85e134` feat(agents): add AGENTS.md — protocolo memoria cross-session basado en .hermes/AGENTS.md global
- `b566530` completar stubs devmode persistencia (julio 2026)
- `7954103` merge B-1 cleanup smart-polling eliminado, okResult/errResult inline
- `a0fa40a` B-1 real WebSocket inicial
- `c04e646` B-1 inicial WebSocket

## 🔑 API Keys & Secrets — NUNCA EN CODE
- Roblox Auth: usar .env variables (nunca commiteadas)
- AES-256-GCM clave: derivada hardware, nunca en source code
- Settings DB: encrypted at rest, nunca plain text en commits

## 📞 Soporte
- Issue Tracker:GitHub Issues
- Discord Community: branded community server
- Documentation: PROJECT.md (siempre actualizada)