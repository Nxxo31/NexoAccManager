# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 4.1.0 | **Última actualización:** 2026-07-31

---

## 🎯 Objetivo Principal

Gestor de cuentas Roblox de código abierto, 100% local, con encriptación AES-256-GCM y arquitectura hexagonal — sin servidores, sin nube, sin tracking.

## 🎯 Objetivos Secundarios

1. Cementar el modelo de seguridad de cero-confianza (cifrado AES-256-GCM, branded type `EncryptedString`, CSP)
2. Establecer Clean Architecture como base del código (domain / application / infrastructure / preload / renderer)
3. Proveer una superficie IPC segura y auditada para el renderer (nunca exponer cookies ni secretos)
4. Localización completa ES / EN / PT vía el sistema `t(key, vars)` personalizado (247 keys × 3 idiomas)
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
| Testing | Vitest + Playwright | — | 36 unit tests + 6 E2E |
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

## 📊 Matriz de Trazabilidad

| Req ID | Descripción | Componente | Estado | Verificación |
|--------|-------------|------------|--------|--------------|
| R-01 | AES-256-GCM encryption de credenciales con branded type | `CryptoService.ts`, `EncryptedString.ts` | ✅ | 11 unit tests CryptoService / 10 Account factories |
| R-02 | Cookies nunca salen del main process | `accountHandlers.ts`, `RobloxHttp.ts` | ✅ | Auditoría revisión 55 hallazgos → 0 exfiltraciones activas |
| R-03 | CSP bloquea inline + conexiones externas no autorizadas | `src/main.ts` | ✅ | `npm run build` exit 0, verificación manual |
| R-04 | 91 canales IPC con tipos sincronizados性强 | `preload/index.ts`, `window-api.d.ts` | ✅ | Extractor sync → 91 handlers = 91 canales, 0 drift |
| R-05 | i18n completo ES/EN/PT (247 keys cada uno) | `src/config/i18n.ts` | ✅ | Audit programático 247/247/247, 0 missing |
| R-06 | LaunchDock persistente con WebSocket + DIP | `ControlWebSocketService.ts`, `LaunchDock.tsx` | ✅ | `npm run build` exit 0; adapters implement formal ports |
| R-07 | RobloxApiPort segregado en 6 sub-ports (ISP) | `RobloxApiPort.ts`, 6 Source service files | ✅ | `tsc --noEmit` 0 errors |
| R-08 | Logging estructurado rotativo (electron-log) | `src/infrastructure/logging/logger.ts` | ✅ | File transport `userData/logs/`, formato ISO timestamp |
| R-09 | Code splitting + performance (bundle 739KB→412KB) | `vite.config.ts`, `AccountCard.tsx` | ✅ | Build exit 0, bundle size medida |
| R-10 | Mantine v7 locale no relevante (no DateInput) | `renderer.tsx` | ✅ | Audit — solo se usa `t()` custom para all user-facing strings |
| R-11 | B-5 formularios dinámicos i18n (espin en .tsx → t({count})) | `AccountsView.tsx`, `AddAccountModal.tsx` | ⏳ | Issue #3 — forms con interpolación count/vars |
| R-12 | WebSocket real para account:control (reemplazar HTTP bridge) | `ControlWebSocketService.ts` | ⏳ | Interino HTTP bridge, WebSocket real pendiente |

---

## 🏗️ Marcos Conceptuales

### Hexagonal Architecture (Ports & Adapters)
El dominio define interfaces (Ports): `RobloxApiPort` segregado en 6 sub-ports (Auth, Games, Presence, Social, Settings, Cookie), manteniendo ISP. Los adaptadores (Infrastructure) implementan formalmente estos Ports con `implements`, proveyendo singletons para DI. Esto permite testear el dominio aislado y cambiar adaptadores sin tocar el código core.

### Branded Types para seguridad
`EncryptedString` es un branded type con `unique symbol` privado, garantizando a nivel de TypeScript que una cookie/password solo puede provenir de `CryptoService.encrypt()` — el renderer no puede crear un `EncryptedString` por mucho que intente. El password siempre se procesa en el main, nunca se envía descifrado al renderer.

### Single Source of Truth (IPC channel drift detector)
El script extractor custom sincroniza preload ↔ handlers ↔ `window-api.d.ts`. Cualquier desviación (drift) rompe CI antes que el renderer llame a un canal inexistente. Esto previene bugs sutiles descubiertos en auditaría v4.0.6 donde 10 canales estaban desincronizados.

### 3-Layer Verification Gates
1. **Layer 1 (compile)**: `tsc --noEmit` + `lint` + `build` — determinístico
2. **Layer 2 (runtime)**: tests E2E Playwright contra build empaquetado, sin mocks
3. **Layer 3 (adversarial)**: race conditions, idempotencia, boundary cases (vacío, máximo)

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
| i18n | Custom `t(key, vars)` system | react-i18next (legacy en /locales/) | Control total del formato, sin deps extra, 247 keys × 3 idiomas con fallback ES |
| Build splitting | Vite code splitting + lazy load | Single bundle | Bundle 739KB → 412KB (-44%), view/code-splitting natural |

---

## 📦 Estado de Implementación

### Fases Completadas

| Fase | Descripción | Commit | Verificación |
|------|-------------|--------|--------------|
| v4.0.0 | Clean architecture inicial + Mantine v7 UI | 2ccab1 | Build exit 0 |
| v4.0.6 | 55 hallazgos auditados (15 critical / 20 required) | — | Audit completo |
| v4.0.7 | Corrección seguridad crítica — eliminar exfil cookies, CSRF fix | — | tsc/lint/build/test 4-puertas pasar |
| v4.0.8 | IpcResult contract, path-traversal fix, loading states, effect hygiene | — | 36/36 vitest, 6/6 E2E |
| v4.0.9 | Lint cleanup 28 warnings→0, version bump, CSP, memory leak fix | — | tsc 0, lint 0/0, build exit 0 |
| v4.1.0 | DT-1/DT-2/DT-3 refactor domain + B-1 WS + B-2 perf + B-3 i18n + B-4 electron-log | 42d3978, f9bccf2 | 36/36 unit, 6/6 E2E, parity 247 keys |
| Templates | GitHub issue/PR templates + CI 3-layer gates | d57f9e5 | Workflow files committed |

Próximo commit previsto: `docs: estandarizar PROJECT.md (template SophIA con matriz de trazabilidad y justificación de decisiones)`

### Próximos Pasos (Backlog)

| ID | Descripción | Prioridad | Issue |
|----|-------------|-----------|-------|
| B-5 | Formularios dinámicos i18n (interpolación count/vars en .tsx) | Alta | #3 |
| B-1 | WebSocket real para `account:control` (reemplazar HTTP bridge interino) | Media | #1 |
| B-6 | Tests unitarios para `advanced:devmode` y `account:control` handlers | Media | #4 |
| B-7 | P-001/P-002 perf en AccountsView (React.memo en listas grandes) | Baja | #5 |
| B-8 | Tests visuales (regression visual) en 6 E2E flows | Baja | #6 |

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
