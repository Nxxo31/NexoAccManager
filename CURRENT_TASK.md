# Tarea actual — Sprint E7: Temas personalizables

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
- [ ] ThemeService.ts en src/main/core/ — verificar que existe
- [ ] IPC: settings:theme:get / settings:theme:set
- [ ] 3 temas: Dark / Light / Roblox Classic
- [ ] Persistir en SQLite key 'theme'
- [ ] Aplicar sin recargar — CSS vars en :root via renderer

## Criterio de completitud
1. npx tsc --noEmit → 0 errores
2. Los 3 temas cambian sin recargar
3. Tema persiste al cerrar/abrir
4. Commit: feat(E7): sistema de temas con CSS variables
5. PROJECT.md → ✅ E7 con fecha

## Siguiente
E8 — Settings Panel completo
