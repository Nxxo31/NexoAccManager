# AI Agent Instructions — Sprint Agent

> This file is auto-read by Claude Code, Cursor, and other AI agents.
> It gives you persistent context across sessions.

## Your Workflow (every session)

1. **Read this file** to understand the project context
2. **Read `.sprint/sprints/` latest file** to see the current sprint
3. **Pick the next TODO ticket** from today's plan
4. **Work for 30 minutes** on the ticket
5. **Update the sprint file** — mark ticket as done, add notes
6. **Commit** with ticket ID in the message (e.g. "T-003: fix auth redirect")

## Rules

- 1 daily = 1 ticket (unless XS effort)
- Always verify deploys after push
- Document blockers in the sprint file
- Friday = retrospective day (run `sprint-agent retro`)
- If blocked > 5 min, note it and move to next ticket
- Update backlog if you discover new work

## Sprint Settings

- Daily session: 30 min
- Working days per sprint: 5
- Total sprint capacity: 2.5h
- Retrospective: friday

## Project Context

> ADD YOUR PROJECT-SPECIFIC CONTEXT BELOW THIS LINE.
> The more context you give here, the less the agent needs to explore.

### NexoAccManager v3.0.0

Open-source multi-account manager for Roblox. Evolution of RAM (ic3w0lf22) with modern UI, privacy-first, 100% local.

**Stack:** Electron 30 + React 18 + TypeScript 5 + Zustand 5 + framer-motion 12 + Tailwind CSS + Vite + vitest + Playwright

**Repo:** https://github.com/Nxxo31/NexoAccManager
**Path:** /home/sebas/proyectos/NexoAccManager

**Run dev (renderer-only, WSL):**
```
BROWSER_ONLY=1 npx vite --port 5173 --host
```
**Preview:** http://localhost:5173 (navegador Windows o MyPreview en VS Code)

**Test:**
```
npx tsc --noEmit && npx vitest run
```

**Build:**
```
npm run build  # tsc + vite build + electron-builder
```

**Key files:**
- `src/renderer/App.tsx` — renderer root (delegates to AppLayout)
- `src/renderer/components/layout/` — Sidebar, TopBar, AppLayout
- `src/renderer/components/accounts/` — AccountGrid, AccountCard, AddAccountModal
- `src/renderer/hooks/useAccountActions.ts` — all account handlers
- `src/renderer/store/` — useAccountStore, useUIStore
- `src/preload/preload.ts` — IPC contextBridge
- `src/main/main.ts` — Electron main process
- `PROJECT.md` — single source of truth
- `.codereview.yml` — code review guidelines

**Workflow con GitHub:**
1. Crear rama feature: `git checkout -b feature/nombre`
2. Implementar + test: `npx tsc --noEmit && npx vitest run`
3. Commit + push: `git add -A && git commit -m "feat(scope): desc" && git push`
4. Abrir PR: `gh pr create --title "..." --body "..." --base main`
5. Agregar label: `gh pr edit --add-label "visual diff"`
6. mcp-code-review analiza diff automáticamente + visual-diff Action captura screenshot
7. Aprobar + merge: `gh pr merge --squash --delete-branch`

**Critical rules:**
- Roblox cookies NEVER leave user's PC
- contextIsolation: true, nodeIntegration: false, sandbox: true
- 100% local — no backend, no server, no cloud
- Spanish UI text only
- framer-motion 200ms transitions
- ModalShell for all modals
- shadcn-ui primitives preferred

