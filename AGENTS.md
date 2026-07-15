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
- **Testing**: vitest (unit) + Playwright (E2E/a11y/visual browser-mode) + axe-core
- **No backend**: 100% local, no servers, no cloud

## Critical rules — NEVER violate
- Roblox cookies NEVER leave the user's PC
- contextIsolation: true + nodeIntegration: false + sandbox: true — never disable
- 100% local — no backend, no server, no cloud
- Never dangerouslySetInnerHTML with external data
- Never expose raw ipcRenderer — only contextBridge
- Never commit with unresolved tsc errors
- Never weaken tests to make them pass
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
- **Animations**: framer-motion (Reorder drag-drop, modal transitions, dock micro-interactions)
- **Styling**: Tailwind CSS + custom CSS variables, no external UI library except shadcn-ui primitives

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
2. Read only necessary files — do not scan the entire project
3. `npx tsc --noEmit` — must be 0 errors
4. `npx vitest run` — must pass
5. `npm run lint` — must pass
6. Update PROJECT.md with results BEFORE commit
7. `git add -A && git commit -m "tipo(scope): descripcion en español"`
8. `git push` → next task immediately

## Editing code files (TSX/JSX/TS/JS)
- NEVER use `sed -i` with multiline regex or JSX/TSX tag replacements
- For any change involving more than one line or JSX structure,
  read the full file, apply the change in memory, and write the
  entire file at once.
- NEVER create .bak files — git is the versioning system
- After writing, validate: `npx tsc --noEmit` before marking complete
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
      presence/
        PresenceDashboard.tsx → real-time status grid (NOT imported in App.tsx — dead code)
      server-browser/
        ServerBrowser.tsx     → server search and list
      settings/
        SettingsPanel.tsx     → theme + language settings
      AccountControlPanel/    → profile, security, privacy, friends, notifications
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

tests/
  e2e-browser/                → Playwright browser-mode E2E
    smoke.spec.ts             → app loads, elements visible, modals open
    navigation.spec.ts        → modal open/close, aria labels, focus trap
  a11y-browser/               → axe-core accessibility tests
    accessibility.spec.ts     → WCAG compliance on page + modals
  visual/                     → Visual regression
    screenshots.spec.ts       → screenshot comparison
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

## Human intervention — only if
- Risk of permanent data loss
- Product decision missing from PROJECT.md
- Contradiction with "Critical rules" section above
- Missing credentials or external access
- Architectural change affecting more than one core module
