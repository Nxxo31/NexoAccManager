# PROJECT.md — NexoAccManager

> **Estado:** Activo | **Versión:** 5.0.0 | **Última actualización:** 2026-08-27 (sesión: Feature Set 6.0 completado — Sistema de Respaldos Encriptados, build verificado, IPC 102=102=102 sincronizado)
> Lint 0 errors, TypeScript 0 errors, build exit 0 (AppImage generado). Fixes críticos de seguridad aplicados (CryptoService, LocalApiService). IPC **totalmente sincronizado (102=102=102)**. Pendiente: tests unitarios.
> 
> **Fuente de verdad:** PROJECT.md es la única fuente de verdad por proyecto. MUST leer antes de cualquier acción.

## ✅ ESTADO VERIFICADO (2026-08-25 — sesión de fix de gates)
- **TypeScript Check**: 0 errors (`npx tsc --noEmit` passes) ✅
- **Build Check**: `npm run build` succeeds — AppImage generado ✅
- **Lint Check**: 0 errors, 0 warnings (`npm run lint` exit 0) ✅
- **Quality Gates Status**: 
  - TypeScript: ✅ PASS
  - Lint: ✅ PASS (era 14 errors / 11 warnings — corregidos)
  - Build: ✅ PASS
  - IPC Preload ⇄ Handlers: ✅ PASS (102 = 102 sincronizados)
  - IPC window-api.d.ts: ✅ PASS (102 = 102 = 102 sincronizado — detector corregido)
  - Binary Smoke Test: Expected failure in WSL/Linux (no blocker)
- **Features Verified**: 39/39 completadas + Feature Set 6.0 (Sistema de Respaldos Encriptados)

## 📋 ANÁLISIS DE PROGRESO REAL

### ✅ FUNCIONALIDAD CONFIRMADA:
- **Arquitectura hexagonal** correctamente implementada
- **Clean Architecture** establecida (domain/application/infrastructure/preload/renderer)
- **Modelo de seguridad de cero-confianza**: AES-256-GCM, encrypted settings at rest, CSP headers
- **IPC segura**: 91 canales tipados documentados en window-api.d.ts
- **Estado global**: Zustand stores funcionando (accountStore, uiStore, launchStore)
- **UI**: Mantine v7 con React 18, localización completa ES/EN/PT
- **Build system**: Vite + electron-builder produciendo NSIS/AppImage/Snap
- **Local-first**: 100% offline, cero servidores, cero tracking

### ✅ FEATURES VERIFICADAS COMO COMPLETADAS:
1. **Advanced DevMode persistence** - Handler persiste en settings DB (`settingsRepo.set('devmode', enable)`)
2. **Real Account Control WebSocket** - Implementado en `ControlWebSocketService.ts` (248 líneas), push events al renderer
3. **39/39 features** desde línea base v3.7 (confirmado via historial de git e inspección de código)

### ⚠️ BLOQUEANTES ACTUALES PARA NUEVOS COMMITS:
Todos los bloqueantes de lint quedaron resueltos (0 errors). El "drift IPC" reportado fue **investigado y cerrado**:

#### 1. **IPC window-api.d.ts (92 vs 93) — RESUELTO (2026-08-27)**:
   - El detector `extract-ipc-channels.ts` reportaba 93 en window-api.d.ts vs 92 en preload/handlers.
   - **Causa real**: `controlSubscribe` es un método WS-push especial (suscripción a eventos push, no canal invoke/ipcMain.handle). El detector contaba este método como canal.
   - **Fix aplicado**: detector mejorado para distinguir métodos de suscripción WS (que usan `ipcRenderer.on`) de canales invoke. Ahora reporta **102 = 102 = 102** (incluyendo 10 nuevos canales de backup).
   - **Veredicto**: NO hay drift real. Preload ⇄ Handlers ⇄ window-api.d.ts sincronizados ✅.

#### 2. **Cobertura de tests: 0 tests** (hallazgo de auditoría):
   - El proyecto verifica "39/39 features + Feature Set 6.0" pero **no tiene tests de unidad/integración/E2E** (0 archivos `*.test.ts(x)`/`*.spec.ts`).
   - Riesgo: regresiones en CryptoService (encryption), LocalApiService (servidor local), BackupService y handlers IPC no están cubiertas.
   - **Acción recomendada**: añadir tests unitarios críticos primero (CryptoService encrypt/decrypt roundtrip, hashCookie, validación de IDs de LocalApiService, BackupService create/restore/verify) con vitest (ya en devDeps según package.json). Prioridad MEDIA-ALTA.

### ✅ FIXES APLICADOS EN ESTA SESIÓN (2026-08-25) — AUDITORÍA DE SEGURIDAD Y CALIDAD

**Resolución completa de issues de lint** (14 errors + 11 warnings previos → 0):
1. **scripts/extract-ipc-channels.ts**: `require()` → `import * as fs/path`, quitados escapes innecesarios `\:` `\>`, eliminada variable `totalDrift` no usada
2. **scripts/verify-gates.ts**: corregido `catch (_)` → `catch`, tipado corregido
3. **src/application/components/AccountDetailPanel.tsx**: `loadOutfits` envuelto en `useCallback` (deps `[api, account.id]`), useEffect actualizado con `[loadOutfits]`, eliminado `eslint-disable` innecesario
4. **src/application/views/GamesView.tsx**: dependencia `loadPlaytime` en useEffect ✅ verificado limpio
5. **src/infrastructure/logging/logger.ts**: variable `app` no usada eliminada ✅ verificado limpio

**Fixes de SEGURIDAD CRÍTICA (auditoría 2026-08-25):**
6. **src/infrastructure/database/CryptoService.ts** — CRÍTICO corregido:
   - ANTES: `deriveKey()` usaba fallback a clave hardcodeada pública `'nexoacc-default-salt-DO-NOT-CHANGE'` si `NAM_SECRET` no estaba → cualquier cookie/password era descifrable offline con conocimiento público.
   - AHORA: si `NAM_SECRET` está set, se usa directamente (≥16 chars validado); si NO, se genera una clave aleatoria de 32 bytes persistida a un archivo `.nam-secret` (permisos 0600) en `userData`, estable entre reinicios. Sin clave pública por defecto.
   - `hashCookie()` AHORA usa HMAC-SHA256 con la clave local (antes SHA-256 sin salt → correlación/cracks offline). Formato de salida se preserva (16 hex).
7. **src/infrastructure/external/LocalApiService.ts** — CRÍTICO corregido (servidor HTTP loopback):
   - **Origin check en endpoints REST** (antes solo el WS upgrade lo tenía): ahora bloquea 403 cualquier request con Origin no-loopback → protege contra DNS-rebinding / páginas web maliciosas que harían fetch a `http://127.0.0.1:31415`.
   - **Validación de PID inline** con `isSafePid()` antes de interpolar en `tasklist`/`ps` (previene inyección de comandos si el mapa `runningInstances` tuviera valor hostil).
   - **Validación de IDs con `isSafeId()`** en todos los endpoints `/accounts/{id}` y `/control` WS (`/^[A-Za-z0-9_-]{1,64}$/`) → previene path traversal / IDs malformados antes de resolver cookies sensibles.

**Limpieza de repo:**
8. **.gitignore**: añadidos `.nam-secret` (nunca commitear), `dist-electron/`, `reforge-state.json`, `*.ts.backup`, `__pycache__/` — elimina ruido de untracked.

> **Verificación post-fixes**: `npm run lint` exit 0 (0 errors, 0 warnings), `npx tsc --noEmit` exit 0, `npm run build` exit 0 (AppImage).

### 🚀 FEATURE SET 6.0 - INVESTIGADO Y LISTO PARA IMPLEMENTAR
Tras evaluación de proyectos similares y alineación con principios del proyecto (100% local, sin servidores, sin tracking, seguridad de cero-confianza):

#### ✅ FUNCIONALIDADES RECOMENDADAS PARA IMPLEMENTAR:
| Feature | Descripción | Prioridad | Alineación con Principios |
|---------|-------------|-----------|----------------------------|
| **Sistema de Respaldos Encriptados Locales** | Respaldos programables y manuales de la base de datos de cuentas y settings, encriptados con AES-256-GCM, almacenados en carpeta local seleccionable por el usuario | ALTA | ✅ Totalmente local, refuerza cero-confianza |
| **Import/Export de Perfiles de Juego** | Funcionalidad para exportar/importar configuraciones específicas de juegos (incluyendo FastFlags, launch presets, etc.) entre diferentes instalaciones de NexoAccManager | MEDIA | ✅ Local, mejora usabilidad sin comprometer seguridad |
| **Plantillas de Configuración de Seguridad** | Perfiles predefinidos de configuración de seguridad (ej. "Máxima Seguridad", "Equilibrado", "Desarrollo") que aplican conjuntos de ajustes de CSP, límites de tasa, etc. | MEDIA | ✅ Refuerza modelo de cero-confianza |
| **Integración con Hardware de Seguridad Locales** | Soporte para utilizar YubiKey u otros dispositivos de hardware local como segundo factor para operaciones críticas (exportar cuentas, cambiar contraseña maestra) | BAJA | ✅ Local, mejora seguridad física (opcional) |
| **Modo Kiosco/Aparato Dedicado** | Configuración especial para ejecutar NexoAccManager en modo pantalla completa, sin acceso al sistema operativo subyacente, ideal para estaciones dedicadas de gestión de cuentas | BAJA | ✅ Local, mejora seguridad ambiental |

#### ⚠️ FUNCIONALIDADES EVALUADAS PERO NO RECOMENDADAS:
| Feature | Razón de Rechazo |
|---------|------------------|
| **Sincronización en la Nube Opcional** | Viola directamente el principio "100% local, no servidores, no nube" |
| **Tracking de Uso Anónimo** | Contraviene el principio "Sin tracking de telemetría — privacidad por diseño" |
| **Integración con Servicios de Terceros (Discord, etc.)** | Introduce dependencias externas y posibles vectores de ataque; mejor logrado mediante plugins comunitarios separados |
| **Actualizaciones Automáticas desde Repositorios Remotos** | Riesgo de seguridad; el modelo actual de verificación de firma y actualización manual es más seguro para este tipo de aplicación |

## 📊 DECISIÓN DE ARQUITECTURA PARA FEATURE SET 6.0
Tras evaluación, se decidió que las funcionalidades recomendadas del feature set 6.0 se implementarán como:
- **Mejoras al núcleo existente** (respaldos encriptados, import/export de perfiles)
- **Extensiones mediante el sistema de plugins** (plantillas de seguridad, integración con hardware)
- **Sin comprometer los principios fundacionales** del proyecto

## 📋 SPRINT ACTUAL - PRÓXIMOS PASOS (EN ORDEN DE PRIORIDAD)
1. **[MEDIA-ALTA] Añadir tests unitarios críticos** (hallazgo de auditoría 2026-08-25 + Feature Set 6.0)
   - Configurar vitest: tests de `CryptoService` (encrypt/decrypt roundtrip, clave sin fallback hardcodeado, hashCookie HMAC), validación `isSafeId`/`isSafePid` de `LocalApiService`
   - Tests de `BackupService` (create/restore/verify/schedule/folder operations)
   - Proteger las correcciones de seguridad y Feature Set 6.0 de regresiones
   - Seguir ciclo 8-phase Dev (Analysis → Design → Implementation → LSP review → Code review → Self-review → Validation → Commit)

2. **[MEDIA] Import/Export de Perfiles de Juego** (Feature Set 6.0)
   - FastFlags, launch presets entre instalaciones

3. **[MEDIA] Plantillas de Configuración de Seguridad** (Feature Set 6.0)
   - Perfiles "Máxima Seguridad" / "Equilibrado" / "Desarrollo"

4. **[BAJA] Integración Hardware local (YubiKey)** y **Modo Kiosco** (Feature Set 6.0)

## 🎯 OBJETIVO PRINCIPAL
Gestor de cuentas Roblox de código abierto, 100% local, con encriptación AES-256-GCM y arquitectura hexagonal — sin servidores, no nube, sin tracking.

## 🎯 OBJETIVOS SECUNDARIOS
1. Cementar el modelo de seguridad de cero-confianza (cifrado AES-256-GCM, branded type `EncryptedString`, CSP)
2. Establecer Clean Architecture como base del código (domain / application / infrastructure / preload / renderer)
3. Proveer una superficie IPC segura y auditada para el renderer (nunca exponer cookies ni secretos)
4. Localización completa ES / EN / PT vía el sistema único `t(key, vars)` personalizado en `src/config/i18n.ts` — 255 leaf keys × 3 idiomas (es/en/pt), simétricos, sin duplicados, con fallback ES
5. Soporte multi-OS (Windows NSIS + MSIX, Linux AppImage + Snap)

## 📐 ARQUITECTURA VERIFICADA
### Stack Tecnológico
| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| Lenguaje | TypeScript | 5.x | Tipado estático estricto across main + renderer |
| Framework | Electron | 30.x | Runtime desktop multi-OS con sandbox + contextIsolation |
| UI Framework | React | 18.x | Renderer (Mantine v7) con TSX components |
| Estado | Zustand | 5.x | Stores globales reactivos (accountStore, uiStore, launchStore) |
| UI Kit | Mantine | 7.17.8 | Componentes accesibles (Modal, Notification, etc.) |
| Build | Vite + electron-builder | 5.x / 24.x | Vite dev/build + empaquetado NSIS/AppImage/Snap |
| Verification Gates | LSP live_diagnostics + code review + gitleaks | — | Type safety en tiempo real + code review adversarial + secret scanning |
| Logging | electron-log | 5.4.4 | Logger estructurado rotativo en `userData/logs/` |
| Seguridad | node-forge | 1.3.1 | AES-256-GCM encryption con clave derivada hardware |
| DB | better-sqlite3 | 9.4.0 | SQLite local para cuentas + settings (sin servidor DB) |
| Lint | ESLint + typescript-eslint | 10.x / 8.x | 0 errors, 0 warnings baseline (requiere atención) |

## ⚠️ LÍMITES Y CONOCIMIENTOS
- Sin servidores externos — todo es local/offline
- Sin tracking de telemetría — privacidad por diseño
- Electron sandbox mode con contextIsolation — sin nodeIntegration en renderer
- 101 canales IPC tipados — documentación en `window-api.d.ts` (sincronizado 102=102=102)
- Las mejoras del Feature Set 6.0 mantendrán estos límites
- **Actual estado**: Quality gates de lint/tsc/build 100% verdes. **IPC 102=102=102 sincronizado**. Pendiente: tests unitarios

## 📝 REGISTRO DE COMMITS RECIENTES (VERIFICADOS)
- `f94cc51` feat(backup): Feature Set 6.0 - Sistema de Respaldos Encriptados Locales (17 files, 2266 insertions, IPC 102=102=102)
- `e541d49` fix(ipc): sync window-api.d.ts with preload (92 channels), fix drift detection script, fix lint in extract-ipc-channels, update verify-gates logic, fix pre-commit patterns
- `e85e134` feat(agents): add AGENTS.md — protocolo memoria cross-session
- `b566530` completar stubs devmode persistencia (julio 2026) ✅ VERIFICADO
- `7954103` merge B-1 cleanup smart-polling eliminado, okResult/errResult inline
- `a0fa40a` B-1 real WebSocket inicial ✅ VERIFICADO
- `c04e646` B-1 inicial WebSocket
- `4e65a86` B-1 WebSocket continuacion
- **[PENDIENTE]** tests: añadir tests unitarios críticos (CryptoService, LocalApiService, BackupService, IPC handlers)

## 🔑 API KEYS & SECRETS — NUNCA EN CODE
- Roblox Auth: usar .env variables (nunca commiteadas)
- AES-256-GCM clave: derivada hardware, nunca en source code
- Settings DB: encrypted at rest, nunca plain text en commits
- **Feature Set 6.0:** Todas las claves de respaldo derivadas de la clave maestra local

## 📞 SOPORTE
- Issue Tracker: GitHub Issues
- Discord Community: branded community server
- Documentation: PROJECT.md (siempre actualizada con estado verificado)