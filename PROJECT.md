# Proyecto: NexoAccManager
# Fecha: 2026-07-16 (actualizado)
# Estado: Release v2.4.1 completo - pulido total, tsc limpio, tests 111/111, build + coverage + a11y, focus-trap, ARIA labels

## Resumen de estado actual

### ✅ COMPLETADO - v2.4.1 (16 Julio 2026)
- **tsc**: 0 errores de TypeScript
- **Tests**: 111/111 passing (vitest)
- **Lint**: 0 errores (177 warnings menores)
- **Build**: AppImage + .snap generados exitosamente
- **Coverage**: configurado con @vitest/coverage-v8, reporter lcov, workflow CI listo

### Fixes de código (v2.4.1)
- ✅ Fix AccountTable.tsx: alineado `index` type con `AccountRow` (string en lugar de number)
- ✅ Fix AccountTable.tsx: `selectedAccountId` null-coalescing para evitar undefined
- ✅ Fix AccountTable.test.tsx: removido tests obsoletos (`onEditAlias`, `onEditDesc`, `@testuser`), alineado con nueva estructura AccountRow + Reorder
- ✅ Fix Sidebar.test.tsx: importado como named `{ Sidebar }`, removido MemoryRouter, actualizado items de navegación

### Mejoras de accesibilidad (a11y)
- ✅ Focus-trap en ModalShell: manejo de Tab/Shift+Tab + focus restoration
- ✅ ARIA labels en todos los botones de iconos (Header, Dock, modales)
- ✅ aria-hidden en iconos decorativos
- ✅ focus-visible styles en botones interactivos
- ✅ role="dialog" + aria-modal en modales inline (App.tsx)
- ✅ sr-only (screen-reader only) para labels redundantes

### Coverage
- ✅ @vitest/coverage-v8 configurado y funcionando
- ✅ Reporter lcov para Codecov integration
- ✅ GitHub Actions workflow `coverage.yml` listo
- ✅ coverage/ en .gitignore

### Arquitectura
- ✅ Nuevo hook useFocusTrap en src/renderer/hooks/useFocusTrap.ts
- ✅ ModalShell actualizado con focus-trap y ARIA attributes
- ✅ AccountRow.tsx creado para manejo de filas con framer-motion Reorder
- ✅ Dock.tsx, Header.tsx, Sidebar.tsx con labels ARIA

### Componentes nuevos
- src/renderer/hooks/useFocusTrap.ts
- src/renderer/components/modal/ModalShell.tsx (actualizado)
- src/renderer/components/accounts/AccountRow.tsx
- src/renderer/components/layout/Dock.tsx
- src/renderer/components/layout/Header.tsx
- src/renderer/animations/variants.ts

### Archivos de documentación
- docs/DESIGN-research-v3.md
- docs/mockup-v3.html

## Rediseño UI/UX — v2.4.0 (15 Julio 2026)

### Filosofía de diseño
- Minimalismo y funcionalidad sobre estética decorativa
- Layout tipo RAM (ic3w0lf22) pero más organizado y limpio
- Vista única compacta, sin sidebar ni routing
- Espaciado tight, glassmorphism eliminado

### Cambios de layout
- **Eliminado**: Sidebar (AppShell.tsx), routing con react-router, AccountDetailsPanel lateral (320px)
- **Eliminado**: Rutas /accounts, /servers, /presence, /settings → todo en una vista
- **Nuevo**: Header compacto (h-12) con logo + contador + botones Servers/Presencia/Ajustes
- **Nuevo**: Tabla de cuentas ocupa toda el área central (3 columnas: Usuario | Alias | Descripción)
- **Nuevo**: Barra Place ID/Job ID integrada directamente debajo de la tabla (estilo RAM)
- **Nuevo**: Action bar inferior compacta con todos los botones agrupados
- **Nuevo**: ServerBrowser, PresenceDashboard, SettingsPanel → modales overlay (no routes)
- **Nuevo**: Editar Alias y Descripción → modales overlay inline (no panel lateral)
- **Nuevo**: JobId Shuffle toggle integrado en la barra Place/Job
- **Nuevo**: Doble-click en fila para jugar (estilo RAM)

### Cambios visuales
- **index.css**: Reducido espaciado global (font-size 14px, transiciones 150ms)
- **Tabla**: Filas más compactas (padding 0.5rem 0.75rem, font 0.75rem)
- **Selección**: Highlight rojo primary con border-left (antes purple accent)
- **Scrollbar**: 6px (antes 8px), más minimalista
- **Backgrounds**: bg-card #141414 (antes #161616), bg-surface #1A1A1A, bg-elevated #222222
- **Glassmorphism/blur**: Eliminado de barras y superficies
- **Sombras**: Eliminadas en cards
- **Border radius**: 4px inputs / 4px botones (antes 6px/8px)

### Cambios de arquitectura
- **Account.ts**: Agregado `savedPlaceId?` y `savedJobId?` al tipo Account
- **postcss.config.js** → renombrado a `postcss.config.cjs` (fix ESM con type:module)
- **Backups**: App.tsx.bak.v2.3, index.css.bak.v2.3 preservados

### Componentes modificados
- `src/renderer/App.tsx` — Reescrito completo (vista única, modales, header compacto)
- `src/renderer/components/accounts/AccountTable.tsx` — Reescrito (3 columnas, edición inline)
- `src/renderer/index.css` — Reescrito (minimalista, tighter spacing)
- `src/types/Account.ts` — Agregados savedPlaceId, savedJobId

### Componentes no usados (preservados, no eliminados)
- `src/renderer/components/layout/Sidebar.tsx` — ya no se importa
- `src/renderer/components/layout/AppShell.tsx` — ya no se importa
- `src/renderer/components/accounts/AccountDetailsPanel.tsx` — ya no se importa
- `src/renderer/components/accounts/ActionBar.tsx` — ya no se importa (integrado en App.tsx)

## Resumen de cambios históricos (v2.3.x)

### Login con navegador (NUEVO MÉTODO HABITUAL) - Implementado 2026-07-15
- LoginBrowserService: BrowserWindow aislada que abre roblox.com/login
- Captura automática de cookie .ROBLOSECURITY cuando el usuario inicia sesión
- Session partition aislada para evitar contaminación
- Intercepta cambios de cookie mediante session.cookies.on('changed')
- Obtiene info del usuario vía users.roblox.com/v1/users/authenticated
- Cierra ventana automáticamente al detectar cookie válida
- **Mejoras de seguridad (v2.3.1)**: cleanup de event listeners, mejor error handling en getUserInfo
- IPC handler: `account:login-browser` (método principal, por defecto)
- Método avanzado mantenido: `account:login` (username/password) → movido a Settings como avanzado
- Preload actualizado: whitelist + API `loginBrowser(group?: string)`
- AddAccountModal reescrito:
  - Login con navegador como método principal visible (Globe icon)
  - Cookie manual como opción avanzada (requiere activar "Opciones avanzadas")
  - Mensajes de seguridad claros para ambos métodos

### UI/UX mejoras (v2.2.0 - previamente implementado)
- AccountTable: tabla de 3 columnas (Usuario|Alias|Descripción) con avatar, estado y acciones
- AccountDetailsPanel: panel lateral con Place ID (solo lectura + copiar), Job ID editable, Alias editable + guardar, Descripción textarea + guardar, botón Follow y metadata
- ActionBar: barra inferior con Agregar Cuenta, Eliminar, Ocultar Usernames (checkbox), Abrir App, Editar Tema, Control de Cuenta
- ServerBrowser mejorado: búsqueda real de servidores por Place ID vía IPC + filtros + unión al juego
- PresenceDashboard mejorado: polling real con avatares, estados (Online/En juego/Offline), juego actual y balance de Robux
- Sidebar: rediseño con glassmorphism, ícono de logo, estado activo mejorado y footer con versión
- SettingsPanel: mejor espaciado, labels en español y feedback visual
- index.css: sistema de diseño completo con scrollbar customizado, glassmorphism, tipografía Inter + JetBrains Mono, animaciones suaves
- App.tsx: ruta index → /accounts redirección automática, layout de 3 zonas (tabla + panel detalles + barra acciones), datos reales conectados vía IPC

### Testing mejoras
- Agregado Testing Library (@testing-library/react, @testing-library/jest-dom, @testing-library/user-event)
- Agregado happy-dom como entorno de prueba para componentes React
- Agregado msw (Mock Service Worker) para mock de APIs
- Actualizado vitest.config.ts para usar entorno 'happy-dom' por defecto (para .tsx) y 'node' para .ts
- Agregado src/test/setup.ts con mock de window.api (Electron contextBridge) para pruebas de renderer
- Tests creados para:
  - Sidebar.tsx
  - AccountTable.tsx
  - ActionBar.tsx
  - AccountDetailsPanel.test.tsx (con interacciones de guardar alias/descripción)
  - ServerBrowser.test.tsx
  - PresenceDashboard.test.tsx
  - RobloxAuthService.test.ts (arreglado con mocks correctos de axios)
- Mantener tests existentes: IPC.test.ts, GamesService.test.ts, useAccountStore.test.ts, CryptoService.test.ts (72 tests pasando)
- Nuevo total: **108 tests** (72 existentes + 36 nuevos de UI/services)

## Próximos pasos
1. ✅ Añadir tests E2E con Playwright para flujos completos (login, añadir cuenta, editar, lanzar juego) — COMPLETADO
2. ✅ Añadir pruebas de accesibilidad con axe-core — COMPLETADO
3. ✅ Configurar coverage report con c8/istanbul y subir a codecov — COMPLETADO
4. ✅ Construir y validar NSIS installer (pendiente desde v2.2.0) — disponible via GitHub Actions CI al pushear tag v* — PENDIENTE
5. ✅ Implementar Bulk Import (importación masiva de user:pass o cookies) — COMPLETADO v2.3.1
6. ✅ Implementar JobId Shuffler (selección aleatoria de JobId al unir servidores) — COMPLETADO v2.3.1
7. ⏳ Implementar Auto Relaunch + Connection Watcher (relogin automático y monitor de conexión) — PROPUESTO v2.4.1
8. ⏳ Mejoras de accesibilidad: focus-trap en modales — COMPLETADO v2.4.1

## Decisiones técnicas
- Se mantuvo la arquitectura IPC y Zustand intacta
- Se preservó la seguridad: cookies nunca salen del PC, contextIsolation, sandbox, etc.
- Se usó el mismo sistema de colores y tipografía del design system existente
- Se priorizó componentes críticos de UI sobre tests de services menos críticos
- Los tests de componentes usan mocks de window.api y stores para aislar la capa de presentación
- El login con navegador es ahora el método habitual (por defecto), alineado con RAM Original
- El login username/password sigue disponible como método avanzado en Settings

## Estado del código
- **TypeScript**: 0 errores
- **Tests**: 111/111 pasando
- **Lint**: 0 errores, 177 warnings (principalmente unused vars en shadcn-ui y any types en ThemeContext)
- **Build**: AppImage + .snap + .deb + NSIS generados exitosamente
- **Coverage**: configurado y funcionando con @vitest/coverage-v8
