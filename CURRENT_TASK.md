# Tarea actual — Sprint L4-L5: Landing Page (Dashboard + Stripe + Deploy)

## Estado anterior completado
- ✅ E1-E8: Motor RAM (Electron) — TODOS COMPLETADOS
- ✅ L1: Setup Landing Page (Next.js, TypeScript, Tailwind, next-intl, Framer Motion)
- ✅ L2: Páginas públicas (Hero, Features)
- ✅ L3: Páginas de auth (register, login, verify-email, forgot-password, reset-password)

## Protocolo de inicio — OBLIGATORIO
```bash
# 1. Leer resumen
npx tsc --noEmit 2>&1 | tail -5
git status
git log --oneline -5
```

## Tarea activa: L4 — Dashboard de usuario
- [ ] /[locale]/dashboard — plan actual, uso X/Y cuentas, próximo pago
- [ ] /[locale]/dashboard/billing — historial, cambiar plan, cancelar
- [ ] /[locale]/dashboard/download — descarga con instrucciones por SO
- [ ] /[locale]/dashboard/settings — idioma, tema, notificaciones email

## Próxima tarea: L5 — Stripe + i18n + Deploy
- [ ] POST /checkout/create-session integrado
- [ ] Páginas /success y /cancel
- [ ] Traducir todas las páginas a ES, EN, PT
- [ ] Deploy Vercel con variables de entorno

## Dependencias externas bloqueantes
- Backend API (NexoAccManager-Backend) no creado todavía
- Sin backend: no hay auth real, no hay licencias, no hay Stripe webhooks
- Dashboard estático con mock data hasta que backend esté listo

## Siguiente
Sprint B1-B5 — Backend API (Fastify + Prisma + PostgreSQL + Stripe)
