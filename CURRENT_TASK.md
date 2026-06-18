# Tarea actual — Sprint E8: Settings Panel completo

## Protocolo de inicio — OBLIGATORIO
```bash
# 1. Leer resumen (NO el PROJECT.md completo todavía)
cat PROJECT_SUMMARY.md

# 2. Auditoría rápida
npx tsc --noEmit 2>&1 | tail -5
git status
git log --oneline -5

# 3. Verificar E6 antes de empezar E7
ls src/renderer/locales/ 2>/dev/null && echo "E6 OK" || echo "COMPLETAR E6 PRIMERO"
```

Si E6 incompleta → completar E6. Si hay errores tsc → corregir primero. Luego continuar.

## Tarea — E7: Temas personalizables
- [x] ThemeService.ts en src/main/core/ — verificar que existe
- [x] IPC: settings:theme:get / settings:theme:set
- [x] 3 temas: Dark / Light / Roblox Classic
- [x] Persistir en SQLite key 'theme'
- [x] Aplicar sin recargar — CSS vars en :root via renderer

## ✅ E7 Completado — Sistema de temas funcionando

## Próxima tarea: L1-L5 — Landing Page
- [x] L1: Crear estructura base Landing Page (Next.js project scaffold)
- [x] L2: Implementar Hero + Features + Pricing
- [ ] L3: Implementar páginas de auth (login, register, verify-email, forgot-password, reset-password)
- [ ] L4: Implementar Dashboard de usuario (plan, uso, descargar app)
- [ ] L5: Integrar Stripe Checkout + SEO + deploy en Vercel

## Siguiente
L1-L5 — Landing Page
