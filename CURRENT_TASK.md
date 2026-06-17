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

## Próxima tarea: E8 — Settings Panel completo
- [ ] Revisar y completar el SettingsPanel.tsx
- [ ] Asegurar que todas las opciones guarden correctamente
- [ ] Validar persistencia de todas las configuraciones
- [ ] Integrar con el ThemeService para aplicar cambios en tiempo real
- [ ] Añadir validaciones y feedback visual
- [ ] Probar con los 3 idiomas soportados
- [ ] Commit: feat(E8): Settings Panel completo con persistencia
1. npx tsc --noEmit → 0 errores
2. Los 3 temas cambian sin recargar
3. Tema persiste al cerrar/abrir
4. Commit: feat(E7): sistema de temas con CSS variables
5. PROJECT.md → ✅ E7 con fecha

## Siguiente
E8 — Settings Panel completo
