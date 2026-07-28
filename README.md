<div align="center">

# 🎮 NexoAccManager

### Open-source multi-account manager for gaming platforms

Built for privacy. Modern, secure, 100% local — no servers, no cloud, no tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-30-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**[Features](#-features) · [Install](#-installation) · [Architecture](#-architecture) · [Security](#-security) · [Contributing](#-contributing)**

</div>

---

Inspired by [Roblox Account Manager (RAM)](https://github.com/ic3w0lf22/Roblox-Account-Manager) by ic3w0lf22, rebuilt from scratch with **Clean Architecture** — Electron + React + TypeScript + Zustand.

## 📦 Features

### Account Management
- **Multi-account support** — Add, organize, and switch between up to 50 accounts
- **AES-256-GCM encryption** — All credentials stored locally with hardware-derived encryption
- **Account groups** — Organize accounts into custom groups with drag-and-drop sorting
- **Save/Copy passwords** — Encrypt and store passwords locally for quick copy
- **Import/Export** — Backup and restore accounts via JSON
- **Auto cookie refresh** — Automatically renews cookies 24h before expiry with retry and notifications
- **Aging alerts** — Visual color-coded dots (green/yellow/red) based on cookie expiry
- **Account aliases** — Set custom aliases and descriptions per account

### Advanced Instance Management
- **Auto Relaunch** — Automatically relaunch accounts that disconnect
- **Connection Watcher** — Monitor active Roblox connections in real-time
- **Prevent Duplicate Instances** — Block launching the same account twice
- **Quick Log In** — Instant login without browser navigation
- **Join Group** — Join Roblox groups with any of your accounts
- **VIP Server Links** — Paste VIP server links to auto-extract Place ID and access code
- **FPS Unlocker** — Unlock FPS via ClientAppSettings.json
- **Close Roblox Beta** — Automatically close beta client

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
- **External account control** — Launch, kill, status, refresh-cookie via HTTP

---

## 🚀 Installation

### Option 1 — Download the installer (recommended)

1. Go to the [Releases page](https://github.com/Nxxo31/NexoAccManager/releases)
2. Download the installer for your platform:
   - **Windows**: `NexoAccManager-Setup-x.y.z.exe` (NSIS installer)
   - **Linux**: `NX-Manager-x.y.z.AppImage` or `.snap`
3. Run the installer and follow the steps
4. Open NexoAccManager from your Start menu or desktop shortcut

### Option 2 — Portable version

1. Download the portable version from Releases
2. Run it directly — no installation needed

### Option 3 — Build from source (developers)

**Prerequisites:** Node.js 18+, npm 9+, Git

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install

# Production build (generates installer in /release)
npm run build
```

### Option 4 — Development mode

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev
```

Opens Electron with Vite hot-reload for the renderer.

---

## 📖 Usage Guide

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

> ⚠️ **Warning:** Never share your cookie. It is equivalent to your session password.

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
2. View real-time 5-state status of all accounts
3. Status auto-refreshes every 30 seconds
4. Animated indicators show active states

---

## 🏗️ Architecture

NAM v4.0.9 uses **Clean Architecture / Hexagonal Architecture** (Ports & Adapters). The codebase went from 18K+ lines (v3.5.0 Facade Pattern) to ~3,900 lines in 56 files (−79%). The dependency rule points always inward — the domain knows nothing about infrastructure or UI.

```
src/
  domain/                          ← Core — no external dependencies
    entities/
      Account.ts                   ← createAccount() factory + Account interface
      ServerInfo.ts                ← Roblox server entity
      PresenceData.ts             ← Presence entity (5 states)
      GameData.ts                  ← Favorite/recent game entity
    repositories/
      RepositoryInterfaces.ts      ← AccountRepository, SettingsRepository, CacheRepository
      RobloxApiPort.ts             ← Port with 35 Roblox API methods
    types/
      EncryptedString.ts           ← Branded type — encryption invariant

  infrastructure/                  ← External adapters — implements domain ports
    database/
      DatabaseManager.ts           ← SQLite with better-sqlite3
      AccountRepositoryImpl.ts     ← AccountRepository implementation (CRUD + mappers)
      SettingsRepositoryImpl.ts    ← SettingsRepository implementation
      CryptoService               ← AES-256-GCM encrypt/decrypt/hashCookie
      LRUCache.ts                  ← LRU cache with eviction
    external/
      RobloxHttp.ts                ← Shared HTTP: CSRF, cookie header, 401/403 handling
      RobloxAuthService.ts         ← loginBrowser, loginUserPass, verifyCookie, importCookies
      RobloxGamesService.ts        ← searchGames, getGameServers, getServerUsers, detectVIPServers
      RobloxPresenceService.ts     ← getPresence, getFriends, getRobuxBalance, getRecentGames
      RobloxSettingsService.ts     ← getProfile, updateProfile, 2FA, sessions, privacy, notifications
      RobloxCookieService.ts       ← getCookieExpiry, refreshCookie
      RobloxBottingService.ts      ← launchRobloxDirect, startBotting, autoRelaunch, connectionWatcher, FPSUnlock
      MultiRobloxService.ts        ← launchMulti, killInstance, getRunningInstances
      CaptchaService.ts            ← solveCaptcha (Nopecha API)
      LocalApiService.ts           ← Express HTTP server (local Web API)
      ThemeService.ts              ← getTheme, setTheme — CSS variables
      CacheCleanerService.ts        ← Cache and log cleanup
      ContentModService.ts         ← Content mod backup/restore
      FastFlagsService.ts          ← FastFlags read/write
      PlaytimeService.ts           ← Playtime tracking
    ipc/
      IPCAdapter.ts                ← All ipcMain.handle (75+ handlers)
      handlers/
        accountHandlers.ts         ← account:* handlers
        advancedHandlers.ts        ← advanced:* handlers

  application/                     ← UI — React + Zustand
    App.tsx                        ← Root: Sidebar + TopBar + ContentArea
    views/
      AccountsView.tsx             ← Hub: grid + Reorder drag-drop + JoinBar
      ServersView.tsx              ← Server browser
      GamesView.tsx                ← Search + favorites
      FriendsView.tsx              ← Friends list + presence
      SettingsView.tsx             ← 12 settings sub-components (Accordion)
    components/
      accounts/                    ← AccountCard, AccountDetailPanel, AddAccountModal
      settings/                     ← 12 settings sub-components
      layout/                       ← Sidebar, TopBar, ContentArea
      ui/                           ← shadcn-ui primitives
    store/
      accountStore.ts              ← Zustand: accounts, selectedId, CRUD
      uiStore.ts                   ← Zustand: activeView, activeModal, notifications
    hooks/
      useAccounts.ts               ← loadAccounts, addAccount, removeAccount, loginBrowser

  config/
    constants.ts                   ← MAX_ACCOUNTS=50, PAGES, PageKey
    i18n.ts                        ← i18next setup (ES/EN/PT)

  preload/
    index.ts                       ← contextBridge: account, roblox, settings, botting, games, advanced, theme

  main.ts                          ← Electron: createWindow + registerHandlers + quit
  renderer.tsx                     ← React root entrypoint
```

### Information Flow (Clean Architecture)

```
┌─────────────────────────────────────────────────────┐
│  Application Layer (React + Zustand)                │
│  App.tsx → Sidebar/TopBar/ContentArea → Views      │
│  useAccounts hook → window.api.* → preload          │
└──────────────────────┬──────────────────────────────┘
                       │ invoke/handle (IPC)
                       ▼
┌─────────────────────────────────────────────────────┐
│  Infrastructure: IPCAdapter.ts                      │
│  Validates input → calls service → returns IpcResult │
│  ok(data) / err(message) — never throws             │
└──────────────────────┬──────────────────────────────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
┌──────────────┐ ┌──────────┐ ┌──────────────────┐
│ Repositories │ │ RobloxHttp│ │ Roblox Services  │
│ (database/)  │ │ apiGet/   │ │ (external/)       │
│ Account/     │ │ apiPost   │ │ Auth, Games,     │
│ Settings/    │ │ CSRF      │ │ Presence, Botting│
│ Crypto/LRU   │ │           │ │ Cookie, etc.     │
└──────────────┘ └──────────┘ └──────────────────┘
            │          │          │
            ▼          ▼          ▼
┌─────────────────────────────────────────────────────┐
│  Domain Layer (pure — no external dependencies)      │
│  entities: Account, ServerInfo, PresenceData, GameData│
│  repositories: AccountRepository, SettingsRepository  │
│  ports: RobloxApiPort (35 Roblox API methods)        │
└─────────────────────────────────────────────────────┘
```

### IPC Namespacing

```
account:*         → Account management (CRUD + encryption)
roblox:*          → Platform API calls (launch, search, join, quick-login)
settings:*        → Local preferences, config, Web API
theme:*           → Theme system
advanced:*        → Cache, export, data management
```

Pattern: `invoke/handle` (Promise-based) — never `send/on` for request-response.
Result pattern: `{ success, data }` or `{ success: false, error }` — never throw without catch.

---

## 🔒 Security

- **100% Local** — Your data never leaves your device
- **No servers** — No backend, no cloud, no tracking
- **No data collection** — No analytics, no telemetry
- **AES-256-GCM encryption** — Cookies encrypted locally with hardware-derived key
- **Branded type invariant** — `EncryptedString` branded type ensures only `CryptoService` can create encrypted values
- **Sandbox active** — `contextIsolation: true` + `sandbox: true` + `nodeIntegration: false`
- **CSP enforced** — Content Security Policy restricts connections to `*.roblox.com` only
- **IPC security** — `contextBridge` with explicit channel whitelist, type validation on both sides
- **Auditable code** — All code is public and reviewable

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 📊 NAM vs RAM — Feature Comparison

| Feature | RAM | NAM |
|---------|-----|-----|
| Multi-account | ✅ | ✅ |
| AES-256-GCM encryption | ❌ | ✅ |
| Cross-platform | ❌ (Windows only) | ✅ (Electron) |
| Clean Architecture | ❌ | ✅ (Hexagonal) |
| i18n (ES/EN/PT) | ❌ | ✅ |
| Aging alerts | ❌ | ✅ (color-coded) |
| 5-state presence | ✅ | ✅ |
| Account groups | ✅ (tabs) | ✅ (grid separators) |
| Drag-and-drop sorting | ❌ | ✅ (framer-motion) |
| Recent/Favorite games | ✅ | ✅ |
| VIP server links | ✅ | ✅ |
| Player Finder | ✅ | ✅ |
| Outfit Viewer | ❌ | ✅ |
| FPS Unlocker | ✅ | ✅ |
| Local Web API | ✅ | ✅ (configurable) |
| Auto Relaunch | ✅ | ✅ |
| Connection Watcher | ✅ | ✅ |
| Open source | ✅ | ✅ (MIT) |

---

## 🛠️ Tech Stack

| Component       | Technology                     |
|------------------|-------------------------------|
| App              | Electron 30 + React 18 + TypeScript 5 |
| State            | Zustand 5                     |
| UI               | Mantine v7 + Tailwind CSS     |
| Database         | SQLite + better-sqlite3       |
| Encryption       | AES-256-GCM (hardware-derived) |
| IPC Security     | contextBridge + sandbox        |
| i18n             | i18next + react-i18next       |
| Animations       | framer-motion 12              |
| Build            | Vite 5 + electron-builder 24  |
| Testing          | Vitest + Playwright + axe-core|
| Linting          | ESLint                        |
| Architecture     | Clean / Hexagonal (Ports & Adapters) |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Report bugs in [Issues](https://github.com/Nxxo31/NexoAccManager/issues)
- Submit PRs following the project's style guidelines
- Discuss ideas in [Discussions](https://github.com/Nxxo31/NexoAccManager/discussions)

### Development setup

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev          # Development with hot-reload
npx tsc --noEmit     # Type check (0 errors required)
npx vitest run       # Run unit tests
npm run lint         # ESLint (0 warnings required)
npm run build        # Production build
```

---

## 🔍 Troubleshooting

### App won't start
- Run `npx tsc --noEmit` to check for type errors first
- Ensure all dependencies are installed: `npm install`
- If the installer fails, try the portable version

### Cookie validation fails
- Make sure the cookie starts with `_|WARNING:-DO-NOT-SHARE|_`
- The cookie may have expired — get a fresh one from the browser
- Check your internet connection (validation requires reaching `auth.roblox.com`)

### Build fails
- Run `npx tsc --noEmit` to check for type errors first
- Ensure all dependencies are installed: `npm install`
- For Linux builds, make sure build tools are installed

### Multi-Roblox not working
- Ensure no other Roblox multi-instance tool is running
- The app uses the `roblox-player://` protocol directly

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for full details.

This software is provided "as is", without warranty of any kind.

**Disclaimer:** This project is not affiliated with, endorsed by, or sponsored by Roblox Corporation or any other company mentioned. The use of this software is the sole responsibility of the end user, who must ensure compliance with the terms of service of any platform they interact with.

---

## 🙏 Acknowledgments

- [ic3w0lf22](https://github.com/ic3w0lf22) — Original Roblox Account Manager inspiration
- [Electron](https://www.electronjs.org/) — Cross-platform desktop framework
- [React](https://react.dev/) — UI library
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [framer-motion](https://www.framer.com/motion/) — Animations
- [i18next](https://www.i18next.com/) — Internationalization
- [Mantine](https://mantine.dev/) — UI components

---

<div align="center">

**[⬆ Back to top](#-nexoaccmanager)**

Made with 🔒 for privacy.

</div>
