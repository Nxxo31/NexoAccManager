# NexoAccManager — OpenSource Account Manager

## Project
Open-source multi-account manager for gaming platforms.
Modern, secure evolution of RAM (ic3w0lf22) focused on privacy.
Repository: https://github.com/Nxxo31/NexoAccManager
Max accounts: 50 per user
License: MIT

## Stack
- **App**: Electron 30 + React 18 + TypeScript 5 + Zustand 5 + framer-motion 12
- **Main process**: Node.js + better-sqlite3
- **Encryption**: AES-256-GCM hardware-derived
- **IPC**: Typed contextBridge — invoke/handle only, never send/on
- **i18n**: custom flat resolver `t(key, vars)` in `src/config/i18n.ts` — sole system since v5.0.0 (i18next/react-i18next removed; 255 leaf keys × 3 locales with ES fallback, single-brace `{var}` placeholders)
- **Themes**: CSS variables in :root via IPC theme:set
- **Build**: electron-builder (AppImage, snap, NSIS)
- **Verification gates**: `mcp__lsp_intelligence__live_diagnostics` + `delegate_task` review + `gitleaks` (staged diff) — NO vitest, NO jest, NO playwright, NO `tsc --noEmit` directo
- **No backend**: 100% local, no servers, no cloud

## Critical rules — NEVER violate
- Roblox cookies NEVER leave the user's PC
- contextIsolation: true + nodeIntegration: false + sandbox: true — never disable
- 100% local — no backend, no server, no cloud
- Never dangerouslySetInnerHTML with external data
- Never expose raw ipcRenderer — only contextBridge
- Never commit with unresolved type errors — verify via `mcp__lsp_intelligence__live_diagnostics`
- Never weaken gates to make them pass — fix the code, not the gate
- Never create .bak files — use git for versioning
- Never write code without reading PROJECT.md first

## IPC Architecture — mandatory namespacing (v5.0.0 — 21 namespaces, 92 channels in preload)
```
account:*     → account management (CRUD + encryption + login + control)
roblox:*      → platform API (launch, kill, instances, servers, outfits, vip)
settings:*    → local preferences, theme, language (key 'language')
theme:*       → CSS theme system (theme:get / theme:set)
cookie:*      → cookie expiry + refresh
friends:*     → friend list / requests / send / respond
follow:*      → follow / unfollow (companion: unfollow:*)
servers:*     → server list + users by account
games:*       → search + favorites management
advanced:*    → cache, export, devmode, delete-all, local-api start/stop
botting:*     → botting start / stop / status
cache:*       → cache analyze / clean
captcha:*     → captcha solve
discord:*     → Discord RPC initialize / update / clear / shutdown
fflags:*      → FastFlags get/set/delete/import/export
logs:*        → recent logs / clear-old
mods:*       → content mods install/uninstall/list/backup/restore
playtime:*    → session tracking + history + totals
presets:*     → launch presets CRUD + launchPreset
shell:*       → open-external (sandbox-safe)
```
Pattern: invoke/handle (Promise-based) — never send/on for request-response
Result pattern in IPC: `{ success, data }` | `{ success: false, error }` — never throw without catch
`account:control` transport is WebSocket-only since v4.2.0 (smart-polling HTTP fallback removed; v5.0.0 adds resend-on-reconnect buffer). See MIGRATION.md.

## Account limit
- Maximum 50 accounts per user
- Hardcoded in the account counter

## UI Architecture — v2.5.0 single-view (no routing)
- **No sidebar, no router** — react-router-dom removed
- **Layout**: Header (h-12) → main content → Dock (bottom bar)
- **Modals**: SettingsPanel, ServerBrowser open via `activeModal` state in App.tsx
  - SettingsPanel → Dock → Ajustes → `setActiveModal('settings')`
  - ServerBrowser → Dock → Servidores → `setActiveModal('servers')`
  - AccountControlPanel → AccountRow → botón "Control de cuenta" → `setShowAccountControl(true)` (modal independiente)
- **Animations**: framer-motion (Reorder drag-drop, modal transitions, dock micro-interactions)
- **Styling**: Tailwind CSS + custom CSS variables, Mantine v7 + custom CSS variables

## PROJECT.md — living document (PRIORITY)
- PROJECT.md is the single source of truth for project state
- Read PROJECT.md FIRST at session start, before any action
- Complete task → mark ✅ with date immediately
- New subtasks discovered → add immediately
- Technical decisions → document with rationale immediately
- Known limitations → document immediately
- PROJECT.md vs code inconsistency → code wins, update PROJECT.md
- Never let PROJECT.md be outdated by more than one commit
- Never claim "done" without verifying with real tool output

## Development loop for this project

1. Read PROJECT.md → check active phase and known limitations
2. `git status` → ver estado del repo
3. Verificar LSP activo: `hermes lsp status` — si no hay clientes: `hermes lsp restart`
   **Nota en WSL**: El servidor LSP de TypeScript está instalado, pero el cliente solo se conecta cuando un editor (VS Code, etc.) abre un archivo `.ts` o `.tsx`. Mientras no haya un archivo abierto, `hermes lsp status` mostrará `active clients: none`; esto es esperado y no indica un problema. La fuente de verdad para tipos es `mcp__lsp_intelligence__live_diagnostics`, que debe dar 0 errores antes de hacer commit.
4. Skills loaded automatically by the agent before writing code: Electron + electron-desktop-dev (Electron stack), spec-creation (multi-file features), sketch (UI mockups). The agent does NOT need a file to remind it — it loads them.
5. For tasks >1 archivo or UI work: the agent thinks first about what it's going to build, shows mockups if UI, and only then writes code. No intermediate .md files — design lives inline in PROJECT.md if needed.
6. **LSP gate**: `mcp__lsp_intelligence__live_diagnostics` en archivos modificados — 0 errores
7. **Code review gate**: `delegate_task` con skill `code-review-and-quality` — todos los findings addressados
8. **Secret scan gate**: `gitleaks` en el staged diff
9. Update PROJECT.md with results BEFORE commit (only project doc allowed)
10. **Atomic commit gate**: `mcp__github__push_files feat scope "descripcion"` — commits atómicos, conventional commit, gitleaks integrado
11. `git push` → next task immediately

NO vitest, NO jest, NO playwright, NO `tsc --noEmit` directo. Los gates son determinísticos: LSP live_diagnostics + delegate_task review + gitleaks.
NO separate spec files, drift reports, docs/specs/, architecture overviews, or any .md outside PROJECT.md. Everything goes in PROJECT.md.

## Editing code files (TSX/JSX/TS/JS)
- NEVER use `sed -i` with multiline regex or JSX/TSX tag replacements
- For any change involving more than one line or JSX structure,
  read the full file, apply the change in memory, and write the
  entire file at once.
- NEVER create .bak files — git is the versioning system
- After writing, validate: `mcp__lsp_intelligence__live_diagnostics` en el archivo modificado before marking complete
- If an edit fails 2 times with the same approach, stop and report

## Key file structure — ACTUAL v5.0.0 (Hexagonal Architecture)
```
src/
  main.ts                       → Electron main process entry (single file since v4.0.0 split)
  renderer.tsx                  → React renderer entry (MantineProvider + Modals + Notifications)
  theme.ts                      → Mantine v7 theme export
  config/
    constants.ts                → app-wide constants (ports, paths, limits)
    i18n.ts                     → SOLE i18n system: custom t(key, vars) — 255 leaf keys × 3 locales (ES/EN/PT), ES fallback, single-brace {var} interpolation
  domain/                       → pure business logic, zero Electron/React/Side-effect imports
    entities/
      Account.ts                → Account entity + value objects
      FastFlag.ts               → FastFlag entity
      GameData.ts               → Game/search result entity
      LaunchPreset.ts           → preset entity
      PlaytimeEntry.ts          → playtime tracking entry
      PresenceData.ts           → presence/online-state entity
      ServerInfo.ts             → server list entry entity
    repositories/
      RepositoryInterfaces.ts   → AccountRepository / SettingsRepository port contracts
      RobloxApiPort.ts          → Roblox API port — segregated into 6 capability sub-ports (Auth, Games, Presence, Social, Settings, Cookie) since v4.1.0
    types/
      EncryptedString.ts        → branded type — runtime guard against plaintext credentials (invariant-validated factory)
  application/                  → React/UX layer (renderer-side state, views, components)
    App.tsx                     → app root
    ErrorBoundary.tsx           → React error boundary
    components/
      AddAccountModal.tsx       → login/cookie/bulk-import 3-tab modal (uses t() interpolation: modal.accountsAdded)
      AccountDetailPanel.tsx   → expandable per-account detail panel
      LaunchDock.tsx            → persistent launch dock (Place ID via launchStore)
      accounts/
        AccountCard.tsx          → inline-editable account card
      settings/
        SettingsGeneral.tsx      → General settings (language picker → settings:set key='language')
        SettingsAppearance.tsx   → theme selection
        SettingsBotting.tsx     → botting toggles
        SettingsCache.tsx       → cache analyze/clean
        SettingsContentMods.tsx → content mods install/uninstall
        SettingsData.tsx        → export/delete-all
        SettingsDiscordRPC.tsx  → Discord RPC on/off
        SettingsFastFlags.tsx   → FastFlags editor
        SettingsLaunchPresets.tsx → preset manager
        SettingsLogs.tsx        → recent logs viewer
        SettingsPlaytime.tsx    → playtime history + clear
        SettingsWebServer.tsx   → advanced: local-api start/stop
    hooks/
      useAccounts.ts            → Zustand-bound selectors hook
    layout/
      Sidebar.tsx               → navigation sidebar
      TopBar.tsx                → top bar
      ContentArea.tsx           → active-view switcher
    store/
      accountStore.ts           → Zustand account state
      launchStore.ts            → Zustand persistent launch state (last Place ID)
      uiStore.ts                → Zustand ephemeral UI state
    views/
      AccountsView.tsx          → main hub (uses t() interpolation: accounts.launched, accounts.deleteConfirmBody)
      ServersView.tsx           → server search (t() interpolation: servers.count/region/players/fps)
      FriendsView.tsx           → friends list (t() interpolation: friends.onlineCount)
      GamesView.tsx             → games search & favorites (t() interpolation: games.count)
      SettingsView.tsx          → accordion wrapper routing to 12 settings/ subcomponents (SRP since v4.1.0)
    window-api.d.ts             → typed preloaded window.api (preload bridge contract)
  infrastructure/               → adapters/implementations (side-effects live here)
    database/
      DatabaseManager.ts        → better-sqlite3 init, 4 tables (accounts, recent_games, favorite_games, settings) — schema unchanged since v4.0.0 (CREATE TABLE IF NOT EXISTS, no ALTER)
      AccountRepositoryImpl.ts  → AccountRepository impl
      SettingsRepositoryImpl.ts  → SettingsRepository impl
      CryptoService.ts          → AES-256-GCM encryption (hardware-derived salt)
      LRUCache.ts               → in-process 60s LRU for Roblox API rate-limit respect
    external/
      RobloxAuthService.ts       → RobloxAuthPort: cookie verification, CSRF, login
      RobloxCookieService.ts    → RobloxCookiePort: cookie expiry + refresh (<24h)
      RobloxGamesService.ts     → RobloxGamesPort: search, servers, users, outfits, universes
      RobloxPresenceService.ts   → RobloxPresencePort: presence, recent games, Robux
      RobloxSettingsService.ts   → RobloxSettingsPort: profile, 2FA, sessions, password, privacy, notifications
      RobloxBottingService.ts   → botting start/stop/status executor
      RobloxHttp.ts              → shared HTTPS client + cookie-forwarding helpers
      RobloxLogService.ts        → pulled Roblox client log reader
      ControlWebSocketService.ts → account:control transport, WS-only since v4.2.0 (ws://127.0.0.1:<port>/control); pending-command resend-on-reconnect added v5.0.0 — see MIGRATION.md
      LocalApiService.ts        → local control surface host (loopback)
      MultiRobloxService.ts     → multi-instance launcher (Windows mutex/profiles)
      CaptchaService.ts          → captcha solver
      CacheCleanerService.ts    → cache filesystem cleanup
      ContentModService.ts      → mods install/restore
      FastFlagsService.ts       → FastFlags persistence
      DiscordRPCService.ts      → Discord RPC integration
      LaunchPresetService.ts    → preset persistence (SQLite)
      PlaytimeService.ts        → playtime session tracking (SQLite)
      ThemeService.ts           → CSS-variable theme system
    ipc/
      IPCAdapter.ts              → registers all 92 channels by namespace (single entry-point called from main.ts)
      handlers/
        accountHandlers.ts       → account:* namespace
        robloxHandlers.ts        → roblox:* namespace
        settingsHandlers.ts     → settings:* + theme:* namespace
        advancedHandlers.ts      → advanced:* + botting:* + cache:* + discord:* + fflags:* + logs:* + mods:* + playtime:* + presets:* namespaces
        shared.ts                → shared IPC result-shaping helpers (okResult/errResult) + validation
    logging/
      logger.ts                 → electron-log wrapper (structured, request IDs; B-4)
  preload/
    index.ts                    → contextBridge — channel whitelist (all 92 invoke channels exposed via window.api.*; never send/on)
  types/
    ws.d.ts                     → WebSocket message type declarations (account:control payload shapes)
```

## Design system — do not improvise
```css
--primary:        #DE350D;  /* Roblox Red — CTAs */
--accent:         #6347FF;  /* Purple — secondaries */
--bg-dark:        #0D0D0D;  /* Main background */
--bg-card:        #161616;  /* Cards */
--bg-surface:     #1E1E1E;  /* Elevated surfaces */
--success:        #2ED573;
--warning:        #FFA502;
--error:          #FF4757;
--border:         #2A2A2A;
```
- Typography: Inter (UI) + JetBrains Mono (data)
- Border radius: 8px cards / 4px inputs
- Animations: framer-motion (200ms transitions)
- Icons: Lucide Icons

## Themes
```
Dark (default)  → bg: #0D0D0D
Light           → bg: #F5F5F5, dark text
Roblox Classic  → dominant red #DE350D with black
Custom          → primary + accent color picker
```

## i18n
- Default language: Spanish (es)
- IPC: `settings:language:get` / `settings:language:set`
- Persistence: SQLite `settings` table, key `language`
- Detection: navigator.language on first launch, then stored preference

## Roblox APIs used
```
auth.roblox.com               → verify cookie, auth ticket
accountsettings.roblox.com    → privacy, notifications
accountinformation.roblox.com → profile
users.roblox.com              → user info
friends.roblox.com            → friends, requests
presence.roblox.com           → online status (polling 30s)
games.roblox.com              → servers, player count
thumbnails.roblox.com         → avatars
economy.roblox.com            → Robux balance
```
LRU cache 60s in main process — respect rate limits

## Boundaries 3-tier

**Always:**
- LSP live_diagnostics en archivos modificados — 0 errores antes de commit
- Code review via delegate_task antes de merge
- gitleaks detect antes de commit
- `npm run build` exit 0 (electron-builder + vite)
- Actualizar PROJECT.md antes de commit
- Commit via GitHub MCP (push_files)

**Ask first:**
- Agregar nuevas dependencias npm
- Cambiar el design system (paleta, tipografia, border-radius)
- Modificar IPC channel structure (breaking para revisores)
- Cambiar arquitectura de encryption (AES-256-GCM es contrato de seguridad)
- Agregar nuevos namespaces IPC

**Never:**
- Exponer cookies Roblox al renderer (contextBridge solo)
- Commitear secrets, API keys, .env
- Commitear dist/, build/, release/, node_modules
- Modificar package-lock.json manualmente
- Usar vitest, jest, playwright, tsc --noEmit directo
- Deshabilitar contextIsolation, sandbox, o nodeIntegration:false
- Exponer ipcRenderer.send/on (solo invoke/handle)

## Definition of Done (estado observable)
- `npm run build` exit 0
- LSP live_diagnostics 0 errores en archivos modificados
- gitleaks detect 0 findings
- Code review PASS
- PROJECT.md actualizado

## Human intervention — only if
- Risk of permanent data loss
- Product decision missing from PROJECT.md
- Contradiction with "Critical rules" section above
- Missing credentials or external access
- Architectural change affecting more than one core module
