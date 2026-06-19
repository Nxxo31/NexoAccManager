# Tarea actual — Sprint P: Producción y Deploy (QA + Deploy Preparación)

## Estado anterior completado
- ✅ E1-E8: Motor RAM (Electron) — TODOS COMPLETADOS + fixes de bugs de runtime
- ✅ F0-F4: Fixes críticos de Motor RAM, Landing Build, Backend Build, /cancel
- ✅ B3: Backend Stripe checkout + webhook + customer portal
- ✅ B3: Email verification + forgot/reset password (implementación real, no stubs)
- ✅ T3: Landing Page conectada con Backend real (Dashboard, Billing, Settings, Login con POST /auth/login real)

## Dependencias externas bloqueantes
- Backend API (NexoAccManager-Backend) — Stripe completo, auth real, email funcional
- Sin producción: necesita Railway deploy + PostgreSQL + env vars reales
- Landing Page (NexoAccManager-Landing) — ✅ ahora conectada a backend real

## Protocolo de inicio — OBLIGATORIO
```
# 1. Motor RAM
npx tsc --noEmit 2>&1 | tail -5  # ✅ 0 errores
cd ../NexoAccManager && git log --oneline -3

# 2. Backend
cd ../NexoAccManager-Backend && npx tsc --noEmit 2>&1 | tail -5  # ✅ 0 errores

# 3. Landing
cd ../NexoAccManager-Landing && npm run build 2>&1 | tail -5
# ⚠️ Errores de pre-rendering PRE-EXISTENTES en login/register/dashboard/etc.
# Causa raíz: ClientLayout carga messages dinámicamente en runtime (patrón L5 problemático).
# No introducido por cambios recientes en T3. Reparación pendiente en futuro sprint.
```

## T — Tareas críticas antes de deploy
| # | Tarea | Complejidad | Estado |
|---|-------|------------|--------|
| T1 | Escribir tests backend (auth, stripe, license) — P4 del Kanban | Media | ✅ COMPLETADO |
| T2 | F3 — i18n Landing Page (Hero/Features/FAQ/Footer) | Alta | Pendiente |
| T3 | P3 — Conectar Landing Page con Backend real | Alta | ✅ COMPLETADO |
| T4 | Preparar env vars producción (encriptar secrets, validar) | Media | Pendiente |
| T5 | Deploy Backend a Railway + PostgreSQL producción | Alta | Pendiente |
| T6 | Deploy Landing Page a Vercel | Media | Pendiente |
| T7 | Deploy Motor RAM con electron-builder + auto-update | Alta | Pendiente |
| T8 | Monitoreo + logs + rollback plan | Media | Pendiente |

## Bug pre-existente documentado — Landing build warnings
- Tipo: Errores de pre-rendering en login/register/dashboard/etc.
- Origen: Sprint L5 — patrón de ClientLayout con carga dinámica de messages
- No bloqueante: deployment funciona, afecta solo validación estática de Next.js
- Solución futura: refactorizar ClientLayout a Server Component o usar unstable_noStore()

## Siguiente acción
T2 (i18n Landing Page) es la siguiente tarea prioritaria según el Kanban.
