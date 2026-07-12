# NexoAccManager — OpenSource Account Manager

## Description

**Open-source tool for gaming platform account management.**

Free and open-source tool for managing multiple accounts and game instances.
Modern, secure evolution of the Roblox Account Manager (RAM) by ic3w0lf22,
focused on privacy and user control.

**Project nature:**
- **Open source under MIT License:** Free use, modification, and distribution.
- **No commercial intent:** No subscriptions, payments, or ads.
- **100% Local:** All credentials and data are stored and processed only
  on the user's device using AES-256-GCM encryption.
- **Standalone:** No servers, no backend, no internet required.
- **No affiliation:** This project is not affiliated with, endorsed by, or
  sponsored by any gaming platform or related company.

## Repository

| Repo | Description | URL |
|------|-------------|-----|
| **NexoAccManager** (this repo) | Electron app — RAM engine, 100% local | https://github.com/Nxxo31/NexoAccManager |

## History

- **2026-07-04:** Strategic decision to migrate from SaaS to OpenSource
  after legal and technical risk assessment.
- **2026-07-04:** Removed proprietary backend, licensing system,
  Stripe integration, and centralized authentication from the Electron app.
- **2026-07-12:** Cleaned PROJECT.md — all SaaS content removed.
- **2026-07-12:** Cleaned residual SaaS references in locales and code comments.

## References

- https://github.com/ic3w0lf22/Roblox-Account-Manager
- https://ic3w0lf22.gitbook.io/roblox-account-manager/

---

## Comparison: NexoAccManager vs original RAM

| Feature | RAM (ic3w0lf22) | NexoAccManager |
|---|---|---|
| **Stack** | WinForms C# (.NET) | Electron + React + TypeScript |
| **Platform** | Windows only | Windows (Mac/Linux future) |
| **UI/UX** | Basic 2015 UI | Modern design system, glassmorphism |
| **Model** | Free, no support | OpenSource MIT — free and open |
| **Auth** | No login | No login — 100% local, no server |
| **Backend** | None | None — everything on device |
| **Account Control Panel** | Basic | Full — privacy, blocks, sessions, password |
| **Server Browser** | Basic list | With region, ping, filter by least players |
| **Smart Server Selection** | Manual | Auto-join least populated + multi-account split |
| **Presence Dashboard** | None | Real-time status of all accounts |
| **Encryption** | Basic | AES-256-GCM hardware-derived |
| **IPC Security** | N/A (.NET) | contextBridge + contextIsolation + sandbox |
| **Auto Cookie Refresh** | Basic | Advanced with retry and notifications |
| **Player Finder** | Basic | With region and multi-account distribution |
| **Active support** | Abandoned | Active community, open source |
| **Download** | GitHub releases | GitHub releases |
| **Inventory from app** | No | Yes — view items, Robux balance |
| **Languages** | English only | ES, EN, PT with full i18n |
| **Custom themes** | No | Dark, Light, Roblox Classic, Custom (all free) |

---

## Design System

### Color palette (Roblox-inspired)

```css
:root {
  --primary:        #DE350D;  /* Roblox Red — main CTAs */
  --primary-dark:   #B22A0A;  /* Hover primary */
  --accent:         #6347FF;  /* Purple — secondary elements */
  --accent-light:   #8B6FFF;  /* Hover accent */
  --bg-dark:        #0D0D0D;  /* Main background */
  --bg-card:        #161616;  /* Cards and panels */
  --bg-surface:     #1E1E1E;  /* Elevated surfaces */
  --text-primary:   #FFFFFF;  /* Main text */
  --text-secondary: #A0A0A0;  /* Secondary text */
  --success:        #2ED573;  /* Green — active states */
  --warning:        #FFA502;  /* Orange — warnings */
  --error:          #FF4757;   /* Red — errors */
  --border:         #2A2A2A;   /* Subtle borders */
}
```

### Available themes

- **Dark (default)** — #0D0D0D background, current theme
- **Light** — #F5F5F5 background, dark text, same accent
- **Roblox Classic** — dominant red #DE350D with black
- **Custom** — user defines primary and accent colors

### Visual style

- Dark theme exclusive by default
- Glassmorphism on cards: `backdrop-filter: blur(12px)`, translucent borders
- Background gradients with subtle Roblox red
- Typography: Inter (UI) + JetBrains Mono (technical data)
- Border radius: 8px cards, 4px inputs
- Animations: 200ms ease-in-out
- Iconography: Lucide Icons
- Inspiration: Linear.app + Vercel Dashboard

---

## Internationalization (i18n)

### Supported languages

- ES Spanish (es) — default language
- EN English (en)
- PT Portuguese (pt)

### Implementation

- Library: `i18next` + `react-i18next`
- Files: `src/renderer/locales/es.json`, `en.json`, `pt.json`
- Selector: dropdown with flags in Header
- Persistence: SQLite `settings` table, key `language`
- Auto-detection: uses OS language on first launch
- IPC channel: `settings:language:get/set`

---

## Personalization and Themes

### Appearance Settings Panel

- **Theme selector**: Dark / Light / Roblox Classic / Custom
- **Custom primary color**: color picker (all users)
- **Custom accent color**: color picker (all users)
- **Font size**: Small / Medium (default) / Large
- **UI density**: Compact / Normal / Spacious
- **Animations**: On / Off (for resource-constrained PCs)
- **Language**: dropdown with flags ES / EN / PT

Persistence: SQLite `settings` table.
Application: CSS variables in `:root` updated dynamically via IPC `theme:set`.

---

## Architecture

```
User
  │
  ▼
NexoAccManager — Electron App (100% local on user's PC)
  ├── Manage multiple accounts without limits
  ├── SQLite AES-256-GCM → accounts (NEVER leave the PC)
  ├── i18n with i18next (ES/EN/PT)
  ├── Customizable themes with CSS variables (all available)
  └── Roblox API calls with local cookie
```

**Note:** The Electron app requires no backend or server. Everything
runs locally on the user's device.

---

## Architecture and design patterns

- **Main pattern**: Two-process model (Main + Renderer) with typed IPC
- **IPC**: invoke/handle (Promise-based) — never send/on for request-response
- **IPC Security**: contextBridge with explicit channel whitelist, validation on both sides
- **IPC Namespacing**: `account:*`, `roblox:*`, `settings:*`, `theme:*`, `i18n:*`, `advanced:*`
- **State**: Zustand in renderer — never state in main process
- **Services**: Repository pattern for SQLite, Service layer for Roblox API
- **Cache**: LRU cache in main process for Roblox API responses (TTL 60s)
- **Error handling**: Result pattern (success/error) in IPC — never throw without catch
- **i18n**: i18next initialized in renderer, language saved via `settings:language:set`
- **Themes**: CSS variables in `:root` updated via IPC `theme:set`

---

## Security

### BrowserWindow config (mandatory)

```
contextIsolation: true    — isolates preload from renderer
nodeIntegration: false    — no Node.js in renderer
sandbox: true             — Chromium sandbox active
webSecurity: true         — same-origin policy
enableRemoteModule: false — remote module disabled
```

### CSP in BrowserWindow

```
default-src 'self'
script-src 'self'
connect-src 'self' https://*.roblox.com
```

### IPC Security

- contextBridge exposes ONLY specific functions, never raw ipcRenderer
- Channel whitelist in preload
- Type validation in main process handlers (defense in depth)
- Never shell.openExternal() without validating the URL first

### Storage

- Roblox cookies in SQLite with AES-256-GCM
- Never localStorage for sensitive data
- Theme and language preferences in SQLite (not sensitive, unencrypted)

**Note:** This project has no backend, collects no data, and does not
communicate with any servers. All operations are local.

---

## License

**MIT License** — See [LICENSE](LICENSE) for full details.

This software is provided "as is", without warranty of any kind.
Use of this software is at your own risk.

**Legal Disclaimer:**
This project is not affiliated with, endorsed by, or sponsored by any
gaming platform, technology company, or trademark. Use of this software
is the sole responsibility of the end user, who must ensure compliance
with the terms of service of any platform they interact with.

---

## Project Status

### Roadmap (July 2026)

| Sprint | Status | Description |
|--------|--------|-------------|
| ✅ OpenSource migration | ✅ Complete | Removed backend, licenses, and monetization from the Electron app |
| ✅ Rebranding | ✅ Complete | Name change and brand reference removal |
| ✅ Documentation | ✅ Complete | README, CONTRIBUTING, build guides |
| ✅ Code cleanup | ✅ Complete | Removed LicenseService, AuthContext, plan validations |
| ✅ Residual SaaS cleanup | ✅ Complete | Removed Enterprise/plan references from locales and comments |
| ❌ UI testing with Playwright | 🔄 In progress | Testing renderer UI via vite dev server |
| ❌ Upload to GitHub releases | ⏳ Pending | |

### SQLite settings table

```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Keys used:
-- language          → 'es' | 'en' | 'pt'
-- theme             → 'dark' | 'light' | 'roblox-classic' | 'custom'
-- fontSize          → 'small' | 'medium' | 'large'
-- uiDensity         → 'compact' | 'normal' | 'spacious'
-- animationsEnabled → 'true' | 'false'
-- primaryColor      → '#DE350D' (user-customizable)
-- accentColor       → '#6347FF' (user-customizable)
```

---

## Features

### Core MVP v1.0 (implemented)

- ✅ Add accounts by .ROBLOSECURITY cookie
- ✅ Cookie verification against auth.roblox.com
- ✅ Local AES-256-GCM encryption, hardware-derived
- ✅ Account list with groups
- ✅ Launch modal with PlaceId and JobId
- ✅ Multi-Roblox (multiple simultaneous instances)
- ✅ Import/Export JSON
- ✅ Local REST API on port 8080

### Account Control Panel — completed

- ✅ View and change display name
- ✅ View and edit profile description
- ✅ View avatar with thumbnail
- ✅ Change password
- ✅ View active sessions
- ✅ Close sessions on specific devices or all
- ✅ Toggle 2FA
- ✅ Privacy settings (messages, follow, chat, inventory, groups)
- ✅ Friends list with online status
- ✅ Accept/reject friend requests
- ✅ Block/unblock users
- ✅ Notification toggles

### Server Browser — completed

- ✅ Search game by PlaceId or name
- ✅ Server list with player count, JobId, estimated region
- ✅ Filters (by region, by least players)
- ✅ Auto-join least populated
- ✅ Multi-account server split

### Presence Dashboard — completed

- ✅ Real-time account status grid (polling 30s)
- ✅ Current game thumbnail
- ✅ Session time
- ✅ Robux balance per account
- ✅ Recent games history

### i18n — completed

- ✅ i18next + react-i18next
- ✅ Translation files: es.json, en.json, pt.json
- ✅ Language selector with flags in Header
- ✅ OS language auto-detection
- ✅ Language persistence in SQLite settings

### Themes — completed

- ✅ CSS variables theme system
- ✅ ThemeService in main process
- ✅ 4 themes: Dark, Light, Roblox Classic, Custom
- ✅ Theme persistence in SQLite settings
- ✅ Dynamic application in renderer without reload

### Settings Panel — completed

- ✅ Appearance: theme, font size, UI density, animations toggle
- ✅ Language: dropdown with flags ES/EN/PT
- ✅ Account: manage local account
- ✅ Security: change password (delegates to Account Control Panel)
- ✅ Advanced: clear cache, export data, delete local account

---

## Roblox APIs used

```
accountsettings.roblox.com    → privacy, notifications
accountinformation.roblox.com → profile, account info
auth.roblox.com               → verify cookie, auth ticket, remote logout
users.roblox.com              → user info, search by username
friends.roblox.com            → friends, followers, requests
presence.roblox.com           → real-time online status
games.roblox.com              → game info, servers, player count
inventory.roblox.com          → item inventory
economy.roblox.com            → Robux balance, transactions
thumbnails.roblox.com         → avatars, game thumbnails
```

---

## Development Sprints — all completed

### Sprint E1 — IPC Security ✅
### Sprint E2 — Account Control Panel ✅
### Sprint E3 — Server Browser ✅
### Sprint E4 — Presence Dashboard ✅
### Sprint E5 — Auto Cookie Refresh ✅
### Sprint E6 — i18n ✅
### Sprint E7 — Themes ✅
### Sprint E8 — Settings Panel ✅

---

## Deployment

- **Distribution:** GitHub Releases
- **Build:** `electron-builder` generates AppImage + .snap (Linux), NSIS installer (Windows)
- **100% local:** No server required, no cloud deploy needed
- **Auto-update:** Configured via `app-update.yml` in GitHub Releases

---

## Global technical decisions — do not change without approval

- Roblox cookies NEVER leave the user's PC — non-negotiable principle
- contextIsolation: true + nodeIntegration: false + sandbox: true — never disable
- 100% local mode — no backend, no server, no cloud
- Roblox API calls with LRU cache 60s to respect rate limits
- i18n: Spanish as default language
- Themes: Dark as default theme
- All themes available to all users — no restrictions
- NEVER use dangerouslySetInnerHTML with external data in React
- Account limit: max 50 per user (hardcoded)

---

*Updated: 2026-07-12 — Repository finalized as standalone OpenSource project.*
