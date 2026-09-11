# PROJECT.md — NexoAccManager
>
> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-09-11 (cierre v5.0.0)
> Lint 0 errors, TypeScript 0 errors, build exit 0 (AppImage generado). Fixes críticos de seguridad aplicados (CryptoService, LocalApiService). IPC **totalmente sincronizado (102=102=102)**. Scripts de tests registrados (`npm test`, `npm run test:watch`, `npm run test:coverage`). ESLint paths corregidos a la estructura hexagonal real. Staleness monitor movido a `scripts/`.
>
> ## ✅ ESTADO VERIFICADO (2026-09-11 — cierre v5.0.0)
> - **TypeScript Check**: 0 errors ✅
> - **Build Check**: `npm run build` succeeds ✅
> - **Lint Check**: 0 errors ✅
> - **Quality Gates Status**:
>   - TypeScript: ✅ PASS
>   - Lint: ✅ PASS
>   - Build: ✅ PASS
>   - IPC: ✅ PASS (102=102=102)
>   - **Tests unitarios**: ✅ PASS (CryptoService, LocalApiService, BackupRepositoryImpl) — `npm test` ejecuta `vitest run`
>
> ## 📋 Próximos pasos
> - [ ] Verificar que los tests pasen en CI (añadir step `npm test` a `.github/workflows/ci.yml`)
> - [ ] Actualizar documentación de la arquitectura de backups
> - [ ] Revisar cobertura de tests (>80% líneas críticas) — `npm run test:coverage`
> - [ ] Externalizar `DiscordRPCService.CLIENT_ID` a config
> - [ ] Resolver TODOs de `SkinEditorModal.tsx` o marcar el feature como experimental
>
> ## 🔧 Estado técnico
> - Stack: Electron 30.5.1, TypeScript 5.3.0, React 18.2.0, Mantine 7.17.8, Vite 5.0.0
> - Scripts de test: `npm test` (vitest run), `npm run test:watch`, `npm run test:coverage`, `npm run test:ui`
> - ESLint: paths corregidos a `src/main.ts`, `src/infrastructure/**`, `src/preload/**` (Node) y `src/renderer.tsx`, `src/application/**` (Browser)
> - Staleness monitor: movido de `src/infrastructure/` a `scripts/` (era meta-tooling de SophIA, no del producto)
> - Dependencias actualizadas: better-sqlite3@9.6.0, electron@30.5.1
> - Known limitations:
>   - Los tests de integración requieren entorno de electron completo
>   - La validación de cookies asume formato UTF-8
> - Notas:
>   - Feature Set 6.0 incluye: backup encriptado, programación automática, verificación de integridad
>   - Los backups incluyen el archivo .nam-secret cuando se activa la opción
>   - El monitor de cookies ahora actualiza cada 24h si es necesario
>   - IPC completamente sincronizado entre preload, main y renderer