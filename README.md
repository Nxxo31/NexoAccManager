# NexoAccManager

[![codecov](https://codecov.io/gh/Nxxo31/NexoAccManager/graph/badge.svg?token=NEXOACC_TOKEN)](https://codecov.io/gh/Nxxo31/NexoAccManager)

Open-source multi-account manager for gaming platforms.
Built for Windows. Modern, secure, 100% local — no servers, no cloud, no tracking.

Inspired by [Roblox Account Manager (RAM)](https://github.com/ic3w0lf22/Roblox-Account-Manager) by ic3w0lf22, rebuilt from scratch with Electron + React + TypeScript.

---

## Features

### Account Management
- **Multi-account support** — Add, organize, and switch between up to 50 accounts
- **AES-256-GCM encryption** — All credentials stored locally with hardware-derived encryption
- **Account groups** — Organize accounts into custom groups with drag-and-drop sorting
- **Save/Copy passwords** — Encrypt and store passwords locally for quick copy
- **Import/Export** — Backup and restore accounts via JSON
- **Auto cookie refresh** — Automatically renews cookies 24h before expiry with retry and notifications
- **Aging alerts** — Visual color-coded dots (green/yellow/red) based on cookie expiry
- **Account aliases** — Set custom aliases and descriptions per account

### Advanced Instance Management (v3.0)
- **Auto Relaunch** — Automatically relaunch accounts that disconnect
- **Connection Watcher** — Monitor active Roblox connections in real-time
- **Prevent Duplicate Instances** — Block launching the same account twice
- **Quick Log In** — Instant login without browser navigation
- **Join Group** — Join Roblox groups with any of your accounts
- **VIP Server Links** — Paste VIP server links to auto-extract Place ID and access code

### Account Control Panel
- **Profile** — View and edit display name, description, and avatar
- **Outfit Viewer** — View account outfit and profile on Roblox
- **Security** — Manage sessions, change password, enable 2FA, logout other sessions
- **Privacy** — Control who can message, invite, and find you
- **Friends** — Manage friends list, send/accept/decline requests
- **Notifications** — Toggle notification types (friend requests, messages, etc.)
- **Utilities** — Quick access to password change, email change, display name change

### Server Browser
- **Server search** — Find servers by PlaceId with real-time data
- **Player Finder** — Search for players by username
- **Filters** — Filter by region, ping, and player count
- **Sort by occupancy** — Find least populated servers instantly
- **Auto-join** — Automatically join the least populated server
- **Multi-distribute** — Split your accounts across multiple servers automatically

### Games Browser
- **Game search** — Search Roblox games by name
- **Recent games** — Track recently played games per account
- **Favorite games** — Bookmark games for quick access
- **3-tab interface** — Search, Recent, and Favorites tabs

### Presence Dashboard
- **Real-time status** — Monitor 5-state presence of all accounts (Offline/Online/In-Game/In-Studio/Invisible)
- **Auto-polling** — Status updates every 30 seconds automatically
- **Animated indicators** — Pulse animation for active states
- **Visual grid** — Clean card-based layout with avatars

### Multi-Instance
- **Multiple game instances** — Run several game instances simultaneously
- **One-click launch** — Launch any account with a single click
- **Kill All** — Close all Roblox instances at once (F7)
- **Roblox protocol** — Uses `roblox-player://` protocol directly

### JoinBar
- **Place ID + Job ID** — Quick join to specific servers
- **Shuffle** — Randomize Job ID for server selection
- **VIP Server link detection** — Paste VIP links to auto-parse access codes
- **Recent games dropdown** — Quick access to recently played games

### Customization
- **4 themes** — Dark (default), Light, Roblox Classic, Custom (all free, no restrictions)
- **Full i18n** — Español, English, Português
- **Dense mode** — Compact layout for power users
- **Custom fonts** — Choose between Inter, JetBrains Mono, and more
- **Hide usernames** — Privacy mode to hide usernames in the grid

### Local Web API (Advanced)
- **REST endpoints** — Optional local API for external control
- **Configurable port** — Custom port assignment
- **Auth tokens** — Secure API access

---

## Installation

### Option 1 — Download the installer (recommended)

1. Go to the [Releases page](https://github.com/Nxxo31/NexoAccManager/releases)
2. Download `NexoAccManager-Setup-x.y.z.exe` — NSIS installer for Windows
3. Run the installer and follow the steps
4. Open NexoAccManager from your Start menu or desktop shortcut

### Option 2 — Portable version

1. Download `NexoAccManager-x.y.z.exe` (portable) from Releases
2. Run it directly — no installation needed

### Option 3 — Build from source (developers)

**Prerequisites:**
- Node.js 18+
- npm 9+
- Git
- Windows: Windows 10/11 with build tools

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install

# Production build (generates installer in /release)
npm run build
```

The installer is generated in `release/`:
- Windows: `.exe` (NSIS installer)

### Option 4 — Development mode

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev
```

Opens Electron with Vite hot-reload for the renderer.

---

## Usage Guide

### Adding an account

1. Open NexoAccManager
2. Click the **Add Account** button
3. Enter a display name (for your reference)
4. Paste your `.ROBLOSECURITY` cookie
5. Click **Save** — the cookie is verified and encrypted locally

### How to get your .ROBLOSECURITY cookie

1. Log in to [roblox.com](https://www.roblox.com)
2. Open browser developer tools (F12)
3. Go to **Application** → **Storage** → **Cookies** → `https://www.roblox.com`
4. Find the cookie named `.ROBLOSECURITY`
5. Copy its value (starts with `_|WARNING:-DO-NOT-SHARE|_`)
6. Paste it into NexoAccManager

> **Warning:** Never share your cookie. It is equivalent to your session password.

### Using the Server Browser

1. Enter a **PlaceId** (found in the game's URL on roblox.com)
2. Click **Search** to fetch available servers
3. Filter by **region**, **ping**, or **player count**
4. Sort by **least players** to find low-population servers
5. Use **Auto-join** to automatically join the least populated server
6. Use **Multi-distribute** to split accounts across different servers

### Using the JoinBar

1. Enter a **Place ID** in the JoinBar at the top
2. Optionally enter a **Job ID** for a specific server
3. Toggle **Shuffle** to randomize server selection
4. Click the **VIP** button to paste a VIP server link
5. Click **Unirse** to launch all selected accounts

### Monitoring with Presence Dashboard

1. Navigate to the **Presence** tab
2. View real-time 5-state status of all accounts (Offline/Online/In-Game/In-Studio/Invisible)
3. Status auto-refreshes every 30 seconds
4. Animated indicators show active states

### Managing Account Settings

From the Account Detail Panel you can:
- **Profile**: Update display name and description
- **Security**: View active sessions, change password, manage 2FA, logout other sessions
- **Privacy**: Control who can message, invite, or find you
- **Friends**: Send, accept, or decline friend requests
- **Utilities**: Quick access to browser profile, outfit viewer, join group, quick login

---

## Tech Stack

| Component       | Technology                     |
|------------------|-------------------------------|
| App              | Electron 30 + React 18 + TypeScript |
| State            | Zustand 5                     |
| Database         | SQLite + better-sqlite3       |
| Encryption       | AES-256-GCM (hardware-derived) |
| IPC Security     | contextBridge + sandbox        |
| i18n             | i18next + react-i18next       |
| Animations       | framer-motion 12              |
| Build            | Vite 5 + electron-builder 24  |
| Testing          | Vitest (122 tests)             |
| Linting          | ESLint                        |

---

## Architecture

```
src/
  main/                        → Electron main process
    main.ts                    → Entry point, IPC handlers
    core/
      AccountManager.ts        → Account CRUD + AES-256-GCM encryption
      CryptoService.ts         → Hardware-derived key, encrypt/decrypt
      ThemeService.ts          → CSS theme system
      AccountSettingsService.ts → Roblox account settings API
      MultiRobloxService.ts    → Multiple Roblox instances
    services/
      CookieExpiryService.ts   → Auto cookie refresh (24h before expiry)
      GamesService.ts          → Game search, server list, join
      PresenceService.ts       → Real-time presence polling (30s, 5 states)
      RobloxAuthService.ts     → Cookie verification
      LoginBrowserService.ts   → BrowserWindow login (captures .ROBLOSECURITY)
    storage/
      DatabaseManager.ts       → SQLite local storage
  renderer/                    → React UI
    App.tsx                    → Root component with 5 views
    components/
      accounts/
        AccountGrid.tsx        → Grid with groups, drag-drop, aging dots
        AccountDetailPanel.tsx → Slide-in panel with utilities
        JoinBar.tsx            → Place ID, Job ID, VIP, Shuffle
      views/
        ServerView.tsx         → Server browser + Player Finder
        GamesView.tsx          → 3-tab games browser
        PresenceView.tsx       → Auto-polling presence dashboard
        SettingsView.tsx       → Security + Advanced + Instance Management
      layout/
        Sidebar.tsx            → Navigation
        TopBar.tsx             → Search, counters, actions
        AppLayout.tsx          → Layout shell
      server-browser/
        ServerBrowser.tsx      → Server search and list
    store/
      useAccountStore.ts       → Zustand account state
      useUIStore.ts            → Zustand UI state (5 global toggles)
    locales/                   → es.json, en.json, pt.json
  preload/
    preload.ts                 → contextBridge with IPC channel whitelist
  types/
    Account.ts                 → Shared types (22+ attributes)
```

### IPC Namespacing

```
account:*         → Account management (CRUD + encryption)
roblox:*          → Platform API calls (launch, search, join, quick-login)
settings:*        → Local preferences, config, Web API
theme:*           → Theme system
advanced:*        → Cache, export, data management
security:*        → Sessions, password, 2FA
privacy:*         → Privacy settings
friends:*         → Friends, requests, blocks
notifications:*   → Notification toggles
presence:*        → Online status polling (5 states)
```

Pattern: `invoke/handle` (Promise-based) — never `send/on` for request-response.
Result pattern: `{ success, data }` or `{ success: false, error }` — never throw without catch.

---

## Security

- **100% Local** — Your data never leaves your device
- **No servers** — No backend, no cloud, no tracking
- **No data collection** — No analytics, no telemetry
- **AES-256-GCM encryption** — Cookies encrypted locally with hardware-derived key
- **Sandbox active** — `contextIsolation: true` + `sandbox: true` + `nodeIntegration: false`
- **CSP enforced** — Content Security Policy restricts connections to `*.roblox.com` only
- **IPC security** — `contextBridge` with explicit channel whitelist, type validation on both sides
- **Auditable code** — All code is public and reviewable

---

## NAM vs RAM — Feature Comparison

| Feature | RAM | NAM |
|---------|-----|-----|
| Multi-account | ✅ | ✅ |
| AES-256-GCM encryption | ❌ | ✅ |
| Cross-platform | ❌ (Windows only) | ✅ (Electron) |
| i18n (ES/EN/PT) | ❌ | ✅ |
| Aging alerts | ❌ | ✅ (color-coded) |
| 5-state presence | ✅ | ✅ |
| Account groups | ✅ (tabs) | ✅ (grid separators) |
| Drag-and-drop sorting | ❌ | ✅ (framer-motion) |
| Recent/Favorite games | ✅ | ✅ |
| VIP server links | ✅ | ✅ |
| Player Finder | ✅ | ✅ |
| Outfit Viewer | ❌ | ✅ |
| Quick Login | ✅ | ✅ |
| Join Group | ✅ | ✅ |
| Local Web API | ✅ | ✅ (configurable) |
| Auto Relaunch | ✅ | ✅ |
| Connection Watcher | ✅ | ✅ |
| Prevent Duplicate Instances | ✅ | ✅ |
| Open source | ✅ | ✅ (MIT) |

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Report bugs in [Issues](https://github.com/Nxxo31/NexoAccManager/issues)
- Submit PRs following the project's style guidelines
- Discuss ideas in [Discussions](https://github.com/Nxxo31/NexoAccManager/discussions)

### Development setup

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev          # Development with hot-reload
npx tsc --noEmit     # Type check
npx vitest run       # Run 122 tests
npm run lint         # ESLint
npm run build        # Production build
```

---

## Troubleshooting

### App won't start
- Run `npx tsc --noEmit` to check for type errors first
- Ensure all dependencies are installed: `npm install`
- If the installer fails, try the portable version
- Check that your Windows version is 10 or later

### Cookie validation fails
- Make sure the cookie starts with `_|WARNING:-DO-NOT-SHARE|_`
- The cookie may have expired — get a fresh one from the browser
- Check your internet connection (validation requires reaching `auth.roblox.com`)

### Build fails
- Run `npx tsc --noEmit` to check for type errors first
- Ensure all dependencies are installed: `npm install`
- For Linux builds, make sure build tools are installed

### Multi-Roblox not working
- On Windows, ensure no other Roblox multi-instance tool is running
- The app uses the `roblox-player://` protocol directly

### Blank screen on launch
- This usually means the renderer failed to load
- Try running from terminal: `npm run dev` to see error output
- Check that your GPU drivers are up to date (Electron uses GPU rendering)

---

## License

MIT License — See [LICENSE](LICENSE) for full details.

This software is provided "as is", without warranty of any kind.
Use of this software is at your own risk.

**Disclaimer:** This project is not affiliated with, endorsed by, or sponsored
by Roblox Corporation or any other company mentioned. The use of this software
is the sole responsibility of the end user, who must ensure compliance with the
terms of service of any platform they interact with.

---

## Acknowledgments

- [ic3w0lf22](https://github.com/ic3w0lf22) — Original Roblox Account Manager inspiration
- [Electron](https://www.electronjs.org/) — Cross-platform desktop framework
- [React](https://react.dev/) — UI library
- [i18next](https://www.i18next.com/) — Internationalization
- [framer-motion](https://www.framer.com/motion/) — Animations
- [Zustand](https://github.com/pmndrs/zustand) — State management