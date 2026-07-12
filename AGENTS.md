# NexoAccManager — OpenSource Account Manager

## Project
Open-source multi-account manager for gaming platforms.
Modern, secure evolution of RAM (ic3w0lf22) focused on privacy.
Repository: https://github.com/Nxxo31/NexoAccManager
Max accounts: 50 per user

## Stack
- **App**: Electron + React + TypeScript + Zustand
- **Main process**: Node.js + better-sqlite3
- **Encryption**: AES-256-GCM hardware-derived
- **IPC**:Typed contextBridge — invoke/handle only
- **i18n**: i18next + react-i18next (ES/EN/PT)
- **Themes**: CSS variables in :root via IPC theme:set
- **Build**: electron-builder
- **No backend**: 100% local, no servers, no cloud

## Critical rules — NEVER violate
- Roblox cookies NEVER leave the user's PC
- contextIsolation: true + nodeIntegration: false + sandbox: true — never disable
- 100% local — no backend, no server, no cloud
- Never dangerouslySetInnerHTML with external data
- Never expose raw ipcRenderer — only contextBridge
- Never commit with unresolved tsc errors
- Never weaken tests to make them pass

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

## Current status — July 2026 (OpenSource migration COMPLETED)
```
✅ OpenSource migration — SaaS backend and licenses removed
✅ MIT License — established with legal disclaimers
✅ PROJECT.md, README.md, CONTRIBUTING.md — updated
✅ LICENSE — created
✅ Code cleanup — AuthService, LicenseService, WebServer removed
✅ Locales cleaned — auth/license/plan keys removed (es/en/pt)
✅ tsc compiles clean — 0 errors
✅ Successful build — AppImage + .snap generated
✅ README.md — complete installation guide
✅ Residual SaaS references removed from locales and code comments
❌ UI testing with Playwright — IN PROGRESS
❌ Upload to GitHub releases
```

## Development loop for this project
1. `cat PROJECT.md` → check active phase
2. Read only necessary files — do not scan the entire project
3. `npm run typecheck && npm run lint && npm run build`
4. Update `PROJECT.md` first — mark ✅ with date
5. `git add -A && git commit -m "tipo(scope): descripcion en español"`
6. `git push` → next task immediately
7. Check `PROJECT.md` only to see what's next or on ambiguity

## Editing code files (TSX/JSX/TS/JS)
- NEVER use `sed -i` with multiline regex or JSX/TSX tag replacements
  (e.g. <Link> -> <button>) in .tsx, .jsx, .ts, .js files.
- For any change involving more than one line or JSX structure,
  read the full file, apply the change in memory, and write the
  entire file at once.
- Before writing, make a backup (.bak) only if a recent one doesn't exist.
- After writing, validate syntax (build or linter) before marking
  the task as complete.
- If an edit fails 2 times with the same approach, stop and report
  instead of retrying variations of the same command.

## PROJECT.md — living document
- Complete task → ✅ with date immediately
- New subtasks discovered → add them immediately
- Technical decisions → document immediately
- PROJECT.md vs code inconsistency → code wins, update PROJECT.md
- Never outdated by more than one commit

## Key file structure
```
src/
  main/
    main.ts                    → Electron main process
    core/
      AccountManager.ts        → account management + encryption
      CryptoService.ts         → AES-256-GCM encryption
      ThemeService.ts          → CSS theme system
      AccountSettingsService.ts → Roblox account settings
      MultiRobloxService.ts    → multiple instances
    services/
      CookieExpiryService.ts   → auto-refresh cookies
      GamesService.ts          → game and server search
      PresenceService.ts       → real-time online status
    storage/
      DatabaseManager.ts       → local SQLite
  renderer/
    App.tsx                    → renderer root
    context/
      ThemeContext.tsx         → React context for themes
    components/
      AccountList.tsx
      AddAccountForm.tsx
      Header.tsx
      SettingsPanel.tsx
      AccountControlPanel/     → profile, security, privacy, friends, notifications
      PresenceDashboard/       → real-time status grid
      ServerBrowser/           → server search and list
    locales/                   → es.json, en.json, pt.json
    themeDefinitions.ts
    index.css
    main.tsx
  preload/
    preload.ts                 → contextBridge — channel whitelist
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
- Glassmorphism: `backdrop-filter: blur(12px)` on cards
- Typography: Inter (UI) + JetBrains Mono (data)
- Border radius: 8px cards / 4px inputs
- Animations: 200ms ease-in-out
- Icons: Lucide Icons

## Themes — all available (no restrictions)
```
Dark (default)  → bg: #0D0D0D
Light           → bg: #F5F5F5, dark text
Roblox Classic  → dominant red #DE350D with black
Custom          → primary + accent color picker (all users)
```

## i18n — implemented in E6
- Default language: Spanish (es)
- IPC: `settings:language:get` / `settings:language:set`
- Persistence: SQLite `settings` table, key `language`
- Detection: i18next-browser-languagedetector on first launch

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
- Contradiction with "Global technical decisions" section of PROJECT.md
- Missing credentials or external access
- Architectural change affecting more than one core module
