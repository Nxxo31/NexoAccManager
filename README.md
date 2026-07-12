# NexoAccManager

Open-source tool for managing multiple gaming platform accounts and instances.
Modern, secure, 100% local — no servers, no cloud, no tracking.

Inspired by [Roblox Account Manager (RAM)](https://github.com/ic3w0lf22/Roblox-Account-Manager) by ic3w0lf22, rebuilt from scratch with Electron + React + TypeScript.

---

## Features

- **Multi-account management** — Add, organize, and switch between up to 50 accounts
- **AES-256-GCM encryption** — All credentials stored locally with hardware-derived encryption
- **Account Control Panel** — Profile, security, privacy, friends, and notifications management
- **Server Browser** — Search servers by region, ping, and player count
- **Presence Dashboard** — Real-time monitoring of all your accounts' status
- **Multi-instance** — Run multiple game instances simultaneously
- **Customizable themes** — Dark, Light, Roblox Classic, and Custom (all free)
- **Full i18n** — Español, English, Português
- **No backend** — 100% local, no servers, no cloud, no tracking
- **Auto cookie refresh** — Automatically renews cookies 24h before expiry with retry and notifications
- **Import/Export** — Backup and restore accounts via JSON

---

## Installation

### Option 1 — Download the executable (end users)

1. Go to the [Releases page](https://github.com/Nxxo31/NexoAccManager/releases)
2. Download the installer for your OS:
   - **Windows**: `NexoAccManager-Setup-x.y.z.exe` (NSIS installer)
   - **Linux**: `NexoAccManager-x.y.z.AppImage` (portable) or `.snap`
3. Run the installer and follow the steps
4. Open NexoAccManager from your start menu or desktop shortcut

### Option 2 — Build from source (developers)

**Prerequisites:**
- Node.js 18+
- npm 9+
- Git
- For Linux builds: `libgtk-3-dev`, `libnotify-dev`, `libnss3`, `libxss1`, `libasound2`

```bash
# Clone the repository
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager

# Install dependencies
npm install

# Build for production (generates installer in /release)
npm run build
```

The installer is generated in `release/`:
- Windows: `.exe` (NSIS)
- Linux: `.AppImage` and `.snap`

### Option 3 — Run in development mode

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev
```

This opens Electron with Vite hot-reload for the renderer.

---

## Usage

1. **Open the app**
2. **Add an account** — Paste your `.ROBLOSECURITY` cookie in the form (max 50 accounts)
3. **Organize in groups** — Assign groups to keep your accounts organized
4. **Launch instances** — Use the Play button to open the game with the selected account
5. **Monitor status** — The Presence Dashboard shows real-time online status of all accounts
6. **Browse servers** — Search servers by PlaceId, filter by region/occupancy, distribute your accounts
7. **Account Control Panel** — Manage profile, security, privacy, friends, and notifications

### How to get your .ROBLOSECURITY cookie

1. Log in to [roblox.com](https://www.roblox.com)
2. Open browser developer tools (F12)
3. Go to Application -> Storage -> Cookies -> `https://www.roblox.com`
4. Find the cookie named `.ROBLOSECURITY`
5. Copy its value (starts with `_|WARNING:-DO-NOT-SHARE|_`)
6. Paste it into NexoAccManager

**Important:** Never share your cookie. It is equivalent to your session password.

---

## Security

- **100% Local** — Your data never leaves your device
- **No servers** — No backend, no cloud, no tracking
- **No data collection** — No analytics, no telemetry
- **AES-256-GCM encryption** — Cookies encrypted locally, hardware-derived key
- **Sandbox active** — contextIsolation + sandbox + nodeIntegration disabled
- **Auditable code** — All code is public and reviewable
- **IPC security** — contextBridge with explicit channel whitelist, type validation on both sides
- **CSP enforced** — Content Security Policy restricts connections to `*.roblox.com` only

---

## Tech Stack

| Component       | Technology                     |
|------------------|-------------------------------|
| App              | Electron + React + TypeScript |
| State            | Zustand                       |
| Database         | SQLite + better-sqlite3       |
| Encryption       | AES-256-GCM                   |
| IPC Security     | contextBridge + sandbox       |
| i18n             | i18next + react-i18next       |
| Build            | electron-builder               |

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
      PresenceService.ts       → Real-time presence polling (30s)
    storage/
      DatabaseManager.ts       → SQLite local storage
  renderer/                    → React UI
    App.tsx                    → Root component with view routing
    main.tsx                   → React + i18next initialization
    context/
      ThemeContext.tsx         → Theme provider with CSS variable injection
    components/
      AccountList.tsx          → Account list with groups
      AddAccountForm.tsx       → Cookie input form with validation
      Header.tsx               → Navigation + language selector
      SettingsPanel.tsx        → Appearance, language, advanced settings
      AccountControlPanel/     → Profile, Security, Privacy, Friends, Notifications
      ServerBrowser/           → Server search, filter, auto-join, multi-distribute
      PresenceDashboard/       → Real-time status grid with Robux balance
    locales/                   → es.json, en.json, pt.json
    themeDefinitions.ts        → CSS variable definitions for 4 themes
  preload/
    preload.ts                 → contextBridge with IPC channel whitelist
  types/
    Account.ts                 → Shared types
```

### IPC Namespacing

```
account:*    → Account management (CRUD + encryption)
roblox:*     → Platform API calls
settings:*   → Local preferences and config
theme:*      → Theme system
advanced:*   → Cache, export, data management
shell:*      → External URL handling
security:*   → Sessions, password, 2FA
privacy:*    → Privacy settings
friends:*    → Friends, requests, blocks
notifications:* → Notification toggles
presence:*   → Online status polling
```

Pattern: `invoke/handle` (Promise-based) — never `send/on` for request-response.
Result pattern: `{ success, data }` or `{ success: false, error }` — never throw without catch.

---

## Contributing

You are welcome to contribute. See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines.

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
npm run lint         # ESLint
npm run build        # Production build
```

---

## Troubleshooting

### App won't start on Linux
- Ensure you have the required libraries: `sudo apt install libgtk-3-dev libnotify-dev libnss3 libxss1 libasound2`
- AppImage needs FUSE: `sudo apt install lib fuse2`

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
