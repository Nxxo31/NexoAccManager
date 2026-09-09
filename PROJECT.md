# PROJECT.md — NexoAccManager
>
> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-08-31 (sesión: Tests unitarios completados para servicios críticos)
> Lint 0 errors, TypeScript 0 errors, build exit 0 (AppImage generado). Fixes críticos de seguridad aplicados (CryptoService, LocalApiService). IPC **totalmente sincronizado (102=102=102)**. Pendiente: Ninguno (todas las tareas pendientes completadas).
>
> ## ✅ ESTADO VERIFICADO (2026-08-31 — sesión de finalización de tests unitarios)
> - **TypeScript Check**: 0 errors (`npx tsc --noEmit` passes) ✅
> - **Build Check**: `npm run build` succeeds — AppImage generado ✅
> - **Lint Check**: 0 errors, 0 warnings (`npm run lint` exit 0) ✅
> - **Quality Gates Status**:
>   - TypeScript: ✅ PASS
>   - Lint: ✅ PASS (era 14 errors / 11 warnings — corregidos)
>   - Build: ✅ PASS
>   - IPC: ✅ PASS (102=102=102)
>   - **Tests unitarios**: ✅ PASS (CryptoService, LocalApiService, BackupRepositoryImpl)
>
> ## 📋 Próximos pasos
> - [ ] Verificar que los tests pasen en CI
> - [ ] Actualizar documentación de la arquitectura de backups
> - [ ] Revisar cobertura de tests (>80% líneas críticas)
>
> ## 🔧 Estado técnico
> - Stack: Electron 30.5.1, TypeScript 5.3.0, React 18.2.0, Mantine 7.17.8, Vite 5.0.0
> - Último commit: ab8f766 feat: dev profile 8-phase cycle complete - Analysis through Commit with all quality gates G1-G6 passing
> - Dependencias actualizadas: better-sqlite3@9.6.0, electron@30.5.1
> - Known limitations:
>   - Los tests de integración requieren entorno de electron completo
>   - La validación de cookies asume formato UTF-8
> - Notas:
>   - Feature Set 6.0 incluye: backup encriptado, programación automática, verificación de integridad
>   - Los backups incluyen el archivo .nam-secret cuando se activa la opción
>   - El monitor de cookies ahora actualiza cada 24h si es necesario
>   - IPC completamente sincronizado entre preload, main y renderer