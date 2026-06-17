# NexoAccManager — Resumen ejecutivo

## Estado actual — junio 2026
✅ E1 IPC Security | ✅ E2 Account Control | ✅ E3 Server Browser
✅ E4 Presence | ✅ E5 SaaS Auth | ⚠️ E6 i18n (verificar) | ❌ E7 Temas | ❌ E8 Settings

## Tarea activa
Ver CURRENT_TASK.md

## Stack
Electron + React + TypeScript + better-sqlite3 + AES-256-GCM

## Reglas críticas — nunca violar
- contextIsolation:true nodeIntegration:false sandbox:true — siempre
- JWT RS256 — nunca HS256
- Cookies Roblox nunca salen del PC
- npx tsc --noEmit antes de cualquier commit
- Ver PROJECT.md completo solo ante ambigüedad

## Archivos clave
src/main/main.ts | src/preload/preload.ts | src/renderer/App.tsx
src/main/core/ | src/renderer/components/ | src/renderer/context/
