# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v4.2.0] - 2026-08-05
### Added
- Real WebSocket connection for account:control IPC (B-1) - replaces smart polling fallback
- Dynamic form interpolation keys for i18n (B-5) - 247 keys × 3 locales (ES/EN/PT)
- Account encryption invariant validation in `EncryptedString.isEncryptedString()` - runtime guard against plaintext strings
- LaunchDock persistence via Zustand middleware (carry-over from v4.1.0)
- CSP headers restricting connections to *.roblox.com only
- Memory leak fixes in SettingsView, App.tsx, and main.ts
- Structured electron-log logger with request IDs

### Changed
- Migration from `node:test`/`assert` to Vitest for unit test harness (aligns with B-6 test restoration)
- Updated test scripts: `test:unit`, `test:unit:watch`, `test:coverage`, `test:e2e`
- DevDependencies: added `@playwright/test`, `jsdom`, `vitest`; updated `@types/*`, `vite`, `typescript`
- EncryptedString factory now validates invariants on creation (domain-layer encapsulation)
- AGENTS.md gates updated for WebSocket real implementation
- PROJECT.md updated with B-1/B-5 completion and technical debt roadmap

### Fixed
- Duplicate i18n keys removal in Friends/Games/Servers views
- CSS specificity issues in AccountCard and GamesView (frramer-motion animations)
- Command injection surface reduction in SettingsView
- Session isolation hardening in preload script
- Unhandled promise rejections in SettingsView IPC handlers

### Removed
- Smart-polling fallback mechanism for account:control (replaced by real WebSocket)
- Legacy cookie-exfiltration handlers (security hardening)

## [v4.1.0] - 2026-07-28
### Added
- LaunchDock persistent state (last selected Place ID and game) via Zustand middleware
- i18n parity: 247 translation keys in ES/EN/PT with dynamic interpolation
- Account groups UI with visual separators and drag-and-drop sorting (framer-motion)
- Recent/Favorite games tabs with auto-suggest
- VIP server links generation and management
- Player Finder and Outfit Viewer modules
- FPS Unlocker toggle with Roblox process integration
- Local Web API toggle with configurable host/port
- Auto-relaunch and connection watcher utilities
- AES-256-GCM encryption for all at-rest credentials (node-forge + hardware-derived salt)
- Hexagonal Architecture (Ports & Adapters) refactor −79% LOC vs v3.5.0 Facade
- CSP headers and session isolation hardening
- Structured electron-logging with request IDs
- GitHub issue/PR templates and CI workflow with 3-layer gates (LSP + review + gitleaks)

### Changed
- Migration from Facade/Ports&Adapters to strict Hexagonal Architecture
- RobloxApiPort segregated into 6 capability-based sub-ports (Auth, Games, Presence, Social, Settings, Cookie)
- SettingsView redesigned as 12-subcomponent accordion (SRP compliance)
- AccountCard inline editing and GamesView performance optimizations
- ErrorBoundary wrappers for critical UI components
- Dependency updates: Electron 30, React 18, TypeScript 5, Mantine v7, Vite 5

### Fixed
- Memory leaks in SettingsView and main event listeners
- Command injection surface in login handlers
- Password exposure via getPassword() handler (removed)
- Legacy IPC handlers exposing cookies (removed)
- Unhandled promise rejections in SettingsView
- ESLint exhaustion-deprecation false positives (plugin not installed)
- CI workflow file-path detection (workspace-agnostic)

### Removed
- 6 legacy shadcn-ui files and lib/utils.ts (dead code)
- Vitest/Playwright test harness (temporarily parked; CI gates use continue-on-error)
- Axes-core accessibility testing (temporarily parked)

## [v4.0.0] - 2026-07-22
### Added
- Initial Hexagonal Architecture release (Ports & Adapters)
- AES-256-GCM encryption for credentials
- SQLite persistence with better-sqlite3
- Zustand state management
- Mantine v7 UI components
- Electron 30 + React 18 + TypeScript 5 stack
- Vite 5 + electron-builder 24 toolchain
- ESLint + Prettier code quality gates
- MIT license
