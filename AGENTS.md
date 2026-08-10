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

## UI Architecture — v5.0.0 multi-view with sidebar navigation
- **Sidebar**: `src/application/layout/Sidebar.tsx` — 5-item nav (accounts, friends, games, servers, settings) with collapse/toggle
- **TopBar**: `src/application/layout/TopBar.tsx` — search, theme toggle, add-account button
- **ContentArea**: `src/application/layout/ContentArea.tsx` — lazy-loads views via `React.lazy()` based on `activeView` from `uiStore`
- **Router**: manual state-based routing via `useUIStore.activeView` (no react-router-dom) — `setView()` switches content
- **Views** (5): AccountsView, FriendsView, GamesView, ServersView, SettingsView — each `React.lazy()` loaded on demand
- **Modals**: AddAccountModal (3-tab: login/cookie/bulk), SettingsPanel via SettingsView accordion (12 subcomponents), AccountControlPanel per-account
- **LaunchDock**: Persistent bottom bar — Place ID propagation, shuffle, quick-launch
- **Animations**: framer-motion (Reorder drag-drop, modal transitions, sidebar collapse, dock micro-interactions)
- **Styling**: Mantine v7 + custom CSS variables, Lucide icons
- **Perf**: React.memo on AccountsView + AccountCard (B-7), lazy loading per view, Vite code splitting (bundle 739KB→412KB)

## MCP Tools — MANDATORY for this project

| Task | Tool | NEVER use |
|------|------|-----------|
| Understand IPC structure | `mcp__lsp_intelligence__document_symbols` | `grep` |
| Verify type safety after edit | `mcp__lsp_intelligence__live_diagnostics` | `tsc --noEmit` |
| Find IPC handler implementations | `mcp__lsp_intelligence__find_code` | `grep -rn` |
| Trace IPC channel usage | `mcp__lsp_intelligence__find_references` | `grep` |
| Edit TSX/TS files | `mcp__zenith__edit_file` or `write_file` | `sed`, `patch` for code |
| Search across codebase | `mcp__zenith__search_files` | `grep`, `rg` |
| Commit to GitHub | `mcp__github__push_files` | `git commit` + `git push` |
| List project files | `mcp__filesystem__directory_tree` | `ls`, `find` |
| Code review | `mcp__mcp_code_review_pro__review_diff` | manual inspection only |
| Visual QA | `computer_use` capture or `mcp__playwright__browser_take_screenshot` | guessing UI |

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
3. **LSP gate**: `mcp__lsp_intelligence__document_symbols` en archivos a modificar — entender estructura antes de editar
4. Skills loaded by the agent before writing code: enterprise-dev-workflow, Electron, spec-creation, karpathy-guidelines. The agent loads them automatically.
5. For tasks >1 archivo or UI work: think first about what to build, show mockups if UI, then write code via `mcp__zenith__edit_file` or `write_file`. No intermediate .md files — design lives inline in PROJECT.md.
6. **LSP gate post-edit**: `mcp__lsp_intelligence__live_diagnostics` en archivos modificados — 0 errores
7. **Code review gate**: `mcp__mcp_code_review_pro__review_diff` or `delegate_task` con skill `code-review-and-quality` — todos los findings addressados
8. **Secret scan gate**: `gitleaks` en el staged diff
9. Update PROJECT.md with results BEFORE commit
10. **Atomic commit gate**: `mcp__github__push_files` — commits atómicos, conventional commit
11. Next task immediately

NO vitest, NO jest, NO playwright, NO `tsc --noEmit` directo. Los gates son determinísticos: LSP live_diagnostics + delegate_task review + gitleaks.
NO separate spec files, drift reports, docs/specs/, architecture overviews, or any .md outside PROJECT.md. Everything goes in PROJECT.md.

## Editing code files (TSX/JSX/TS/JS)
- Use `mcp__zenith__edit_file` or `mcp__filesystem__write_file` — NEVER `sed -i`
- For multiline/JSX changes: `mcp__filesystem__read_text_file` full file, apply change, `mcp__filesystem__write_file` whole file
- NEVER create .bak files — git is the versioning system
- After writing: `mcp__lsp_intelligence__live_diagnostics` on modified file before marking complete
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

## Test Strategy — v5.0.0 (Playwright + Electron + smoke)

### Frontend UX/UI Testing — Playwright MCP
- **Playwright MCP** (`mcp__playwright__*`) es la herramienta obligatoria para QA de frontend
- Para NAM (Electron): Playwright puede lanzar el AppImage/electron binary y testar la UI real
- **Flujos a testar automáticamente:**
  1. App launch → Sidebar visible, 5 nav items, TopBar renderiza
  2. Click cada nav item → ContentArea cambia, view carga sin crash
  3. AddAccountModal → abrir, 3 tabs (login/cookie/bulk), validaciones
  4. SettingsView → accordion expande, 12 subcomponentes renderizan
  5. LaunchDock → persistente, Place ID propagation, shuffle button
  6. Theme toggle → dark/light/roblox-classic cambian CSS variables
  7. i18n → cambiar idioma, verificar strings cambian en UI
  8. 50 cuentas → cargar, drag-drop reorder, React.memo perf
- **Visual regression**: `mcp__playwright__browser_take_screenshot` antes/después de cambios UI
- **A11y**: `mcp__playwright__browser_snapshot` captura accessibility tree para verificar roles/labels

### Backend IPC Testing — Smoke + LSP
- `mcp__lsp_intelligence__live_diagnostics` para type safety (0 errores)
- `npm run build` exit 0 para compile
- Smoke test del binario: `xvfb-run` AppImage 10s, exit 0
- IPC handler verification: `mcp__lsp_intelligence__find_code` pattern="ipcMain.handle" → contar canales
- **Flujos backend a testar:**
  1. account:add → SQLite persiste, CryptoService encripta
  2. account:list → retorna cuentas, cookies no se exponen al renderer
  3. roblox:launch → process spawn, mutex en Windows
  4. ControlWebSocketService → ws://connect, resend buffer en reconnect
  5. theme:set/get → CSS variables persisten
  6. settings:language:set → i18n cambia de idioma
  7. ipc drift → extractor script, 0 drift

### Integration Testing — Electron + Playwright
- Playwright soporta Electron nativamente: lanza binario empaquetado, accede al main process
- Testa IPC end-to-end: renderer click → IPC handler → service → response → UI update
- **Flujos integration:**
  1. Add account → verify SQLite row exists (encrypted)
  2. Launch game → verify process spawned
  3. WebSocket control → verify ws://connection + command resend
  4. Cache clean → verify filesystem cleanup
  5. Playtime tracking → verify SQLite playtime entries

## Boundaries 3-tier

**Always:**
- `mcp__lsp_intelligence__live_diagnostics` en archivos modificados — 0 errores antes de commit
- Code review via `mcp__mcp_code_review_pro__review_diff` or `delegate_task` antes de merge
- gitleaks detect antes de commit
- `npm run build` exit 0 (electron-builder + vite)
- Playwright MCP para QA de frontend (screenshots, A11y, flujos automatizados)
- Actualizar PROJECT.md antes de commit
- Commit via `mcp__github__push_files` (GitHub MCP)

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
- Usar vitest, jest, tsc --noEmit directo (Playwright SI se usa para QA frontend+backend)
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
