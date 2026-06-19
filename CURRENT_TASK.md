# Tarea actual — Sprint P: Producción y Deploy (QA + Deploy Preparación)

## Estado anterior completado
- ✅ E1-E8: Motor RAM (Electron) — TODOS COMPLETADOS + fixes de bugs de runtime
- ✅ F0-F4: Fixes críticos de Motor RAM, Landing Build, Backend Build, /cancel
- ✅ B3: Backend Stripe checkout + webhook + customer portal
- ✅ B3: Email verification + forgot/reset password (implementación real, no stubs)

## Dependencias externas bloqueantes
- Backend API (NexoAccManager-Backend) — Stripe completo, auth real, email funcional
- Sin producción: necesita Railway deploy + PostgreSQL + env vars reales
- Landing Page (NexoAccManager-Landing) — conectado a backend mock, necesitaested real deploy

## Protocolo de inicio — OBLIGATORIO
```bash
# 1. Motor RAM
npx tsc --noEmit 2>&1 | tail -5  # ✅ 0 errores
git log --oneline -3

# 2. Backend
cd ../NexoAccManager-Backend && npx tsc --noEmit 2>&1 | tail -5  # ✅ 0 errores

# 3. Landing
cd ../NexoAccManager-Landing && npx next build 2>&1 | tail -5   # ✅ 0 errores
```

## T — Tareas críticas antes de deploy
| # | Tarea | Complejidad | Estado |
|---|-------|------------|--------|
| T1 | Escribir tests backend (auth, stripe, license) — P4 del Kanban | Media | Pendiente |
| T2 | F3 — i18n Landing Page (Hero/Features/FAQ/Footer) | Alta | Pendiente |
| T3 | P3 — Conectar Landing Page con Backend real | Alta | Pendiente |
| T4 | Preparar env vars producción (encriptar secrets, validar) | Media | Pendiente |
| T5 | Deploy Backend a Railway + PostgreSQL producción | Alta | Pendiente |
| T6 | Deploy Landing Page a Vercel | Media | Pendiente |
| T7 | Deploy Motor RAM con electron-builder + auto-update | Alta | Pendiente |
| T8 | Monitoreo + logs + rollback plan | Media | Pendiente |

## Siguiente acción
Seleccionar entre T1-T3 según prioridad definida por usuario.
