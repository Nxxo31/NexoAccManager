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
- **i18n**: i18next + react-i18next (ES/EN/PT)
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

## IPC Architecture — mandatory namespacing
```
account:*   → account management (CRUD + encryption)
roblox:*    → platform API calls
settings:*  → local preferences and config
theme:*     → theme system
i18n:*      → internationalization
advanced:*  → cache, export, data
```
Pattern: invoke/handle (Promise-based) — never send/on for request-response
Result pattern in IPC: `{ success, data }` | `{ success: false, error }` — never throw without catch

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

## Key file structure — ACTUAL v2.5.0
```
src/
  main/
    main.ts                   → Electron main process
    core/
      AccountManager.ts       → account management + encryption
      CryptoService.ts        → AES-256-GCM encryption
      ThemeService.ts         → CSS theme system
      AccountSettingsService.ts → Roblox account settings
      MultiRobloxService.ts   → multiple instances
    services/
      CookieExpiryService.ts → auto-refresh cookies
      GamesService.ts         → game and server search
      PresenceService.ts      → real-time online status
      LoginBrowserService.ts  → BrowserWindow login (captures .ROBLOSECURITY)
      RobloxAuthService.ts     → cookie verification
    storage/
      DatabaseManager.ts      → local SQLite
  renderer/
    App.tsx                   → renderer root (single-view, no routing)
    context/
      ThemeContext.tsx        → React context for themes
    hooks/
      useFocusTrap.ts         → focus-trap for modals
    animations/
      variants.ts             → framer-motion variants
    components/
      accounts/
        AccountTable.tsx      → 3-column table (Usuario|Alias|Descripción)
        AccountRow.tsx        → draggable row with framer-motion Reorder
        AddAccountModal.tsx   → login/cookie/bulk import tabs
      layout/
        Header.tsx            → logo + counter + checkbox + theme toggle
        Dock.tsx              → Place ID + Job ID + action buttons + Servidores + Ajustes
      modal/
        ModalShell.tsx        → overlay modal with focus-trap + ARIA
      server-browser/
        ServerBrowser.tsx     → server search and list (accessible via Dock → Servidores)
      settings/
        SettingsPanel.tsx     → theme + language settings (accessible via Dock → Ajustes)
      AccountControlPanel/    → profile, security, privacy, friends, notifications
                              → accessible via AccountRow botón "Control de cuenta" (Settings2 icon)
                              → abre como modal con setShowAccountControl(true) en App.tsx
      ErrorBoundary.tsx       → React error boundary wrapper
      ui/                     → shadcn-ui primitives (button, input, card, badge)
    store/
      useAccountStore.ts      → Zustand account state
      useUIStore.ts           → Zustand UI state
    lib/
      utils.ts                → cn() helper for Tailwind merge
    locales/                  → es.json, en.json, pt.json
    themeDefinitions.ts
    index.css
    main.tsx
  preload/
    preload.ts                → contextBridge — channel whitelist
  types/
    Account.ts
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
