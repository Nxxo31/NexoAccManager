# Contributing Guide — NexoAccManager

Thank you for your interest in contributing to NexoAccManager! This document explains how to collaborate effectively.

## Project Philosophy

- **OpenSource first** — All code is public, auditable, and modifiable
- **User privacy** — No telemetry, no tracking, no servers
- **Security first** — AES-256-GCM encryption, contextIsolation, sandbox
- **Cross-platform** — Electron supports Windows, Mac, and Linux

## How to Contribute

### 1. Set Up Your Environment

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev
```

### 2. Find Something to Work On

- Check [Issues](https://github.com/Nxxo31/NexoAccManager/issues) with the `good first issue` label
- Comment on the issue so we know you're working on it
- If you have a new idea, open a [Discussion](https://github.com/Nxxo31/NexoAccManager/discussions) first

### 3. Workflow

```bash
# Create a branch
git checkout -b feature/my-feature

# Develop following project rules:
# - Use typed IPC with invoke/handle
# - Validate data on both sides (main + renderer)
# - Follow the design system (colors, glassmorphism)
# - Write commit messages in Spanish

# Verify it compiles
npx tsc --noEmit
npm run lint
npm run build

# Commit
git add -A
git commit -m "tipo(scope): descripcion en español"

# Push and create PR
git push origin feature/my-feature
# Create Pull Request on GitHub
```

### 4. Commit Conventions

| Commit type | Description              | Example                    |
|--------------|--------------------------|----------------------------|
| feat         | New feature              | feat(account): agregar soporte multi-idioma |
| fix          | Bug fix                  | fix(ipc): validar cookies antes de guardar |
| refactor     | Refactoring              | refactor(theme): simplificar ThemeService |
| docs         | Documentation            | docs: actualizar README    |
| style        | UI/UX changes            | style(panel): ajustar glassmorphism |
| chore        | Maintenance tasks        | chore: actualizar dependencias |

### 5. Code Guidelines

- **Strict TypeScript** — No `any`, type everything
- **IPC namespacing** — `account:*`, `roblox:*`, `settings:*`, `theme:*`, `i18n:*`, `advanced:*`
- **Result pattern** — `{ success, data }` | `{ success: false, error }`
- **Security** — contextBridge only exposes specific functions, never raw ipcRenderer
- **Visual style** — Use CSS variables from the design system, glassmorphism, Inter/JetBrains Mono
- **i18n** — All user-facing strings must use `t('key')` from react-i18next

### 6. Before Submitting a PR

- [ ] `npx tsc --noEmit` passes without errors
- [ ] `npm run lint` passes without warnings
- [ ] `npm run build` generates binaries correctly
- [ ] If new feature: does it have tests?
- [ ] If UI: does it respect the design system?
- [ ] If IPC: does it use invoke/handle and type validation?

## Support

- **Issues** for bugs and feature requests
- **Discussions** for ideas and general questions
- **PRs** for code contributions

Thank you for helping build NexoAccManager!
