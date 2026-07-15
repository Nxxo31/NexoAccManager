# NexoAccManager — PROJECT.md
# Última actualización: 2026-07-16
# Versión actual: 2.5.0 (en desarrollo)

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 2.5.0 |
| tsc | 0 errores |
| vitest | 95/95 pasando |
| lint | 0 errores, 177 warnings |
| build | Pendiente — no ejecutado en v2.5.0 |
| NSIS | Desactualizado — último: v2.4.1 (NexoAccManager.Setup.2.4.0.exe) |
| Playwright | 5/19 pasando (browser-mode) |
| Coverage | Configurado (@vitest/coverage-v8 + Codecov CI) |

## Bloqueos conocidos

### BLOCK-1: Modales inaccesibles desde el UI
- **SettingsPanel** y **ServerBrowser** existen en App.tsx (líneas 391-398) pero no hay botón en el Dock ni Header que los abra.
- `setActiveModal('settings')` y `setActiveModal('servers')` nunca se llaman desde el UI actual.
- **Causa**: La Sidebar se eliminó en v2.4.0 y los botones de navegación (Servers, Presencia, Ajustes) no se migraron.
- **Acción**: Agregar botones al Dock (o Header) para abrir Settings y Servers.

### BLOCK-2: PresenceDashboard no se importa en App.tsx
- `PresenceDashboard.tsx` existe pero no se usa en el render de App.tsx.
- **Acción**: Decidir si PresenceDashboard se integra como panel o modal, o si se elimina.

### BLOCK-3: Tests E2E/a11y/visual fallan (15/19)
- Tests escritos asumiendo selectores que no existen en el DOM real.
- `button[aria-label="Ajustes"]` no existe en el Dock actual.
- Modales de Settings y Servers no abren → tests de modal fallan.
- Baselines de visual regression eliminados (necesitan regenerarse después de fix BLOCK-1).
- **Acción**: Reescribir tests después de fix BLOCK-1, usando selectores del DOM real.

### BLOCK-4: focus-trap duplicado
- `AddAccountModal.tsx` tiene su propio focus-trap (líneas 119-158).
- `ModalShell.tsx` YA tiene focus-trap integrado (líneas 26-87).
- Dos focus-traps compitiendo pueden causar comportamiento errático.
- **Acción**: Eliminar focus-trap de AddAccountModal, delegar a ModalShell.

### BLOCK-5: Archivos duplicados
- `src/store/useUIStore.ts` — duplicado, no importado por nadie. Usar `src/renderer/store/useUIStore.ts`.
- `src/lib/utils.ts` — duplicado, no importado por nadie. Usar `src/renderer/lib/utils.ts`.
- **Acción**: Eliminar duplicados.

## Resumen de cambios v2.5.0 (16 Julio 2026)

### Limpieza legacy (COMPLETADO)
- ✅ 26 archivos legacy eliminados: .bak (6), componentes v2.2/v2.3 (Sidebar, AppShell, AccountDetailsPanel, ActionBar, AccountCard, AccountGrid, AccountList, AddAccountForm, Header viejo, SettingsPanel viejo, PresenceDashboard viejo, ServerBrowser viejo, ui/toast)
- ✅ 3 tests de componentes legacy eliminados (Sidebar.test, AccountDetailsPanel.test, ActionBar.test)
- ✅ Directorios tests/e2e/ y tests/a11y/ eliminados (Electron-mode, selectores de routing)
- ✅ Configs obsoletas eliminadas: playwright-test.js, playwright.config.ts
- ✅ Baselines de visual regression eliminados (regenerar después de fixes)
- ✅ package.json limpiado: removido react-router-dom, @radix-ui/react-toast, @types/react-router-dom, scripts obsoletos
- ✅ Version bumped a 2.5.0
- ✅ Commit: `refactor(v2.5.0): eliminacion completa de codigo legacy v2.2/v2.3`

### Arquitectura limpiada
- 0 archivos .bak
- 0 imports de react-router-dom
- 1 config de Playwright (playwright.browser.config.ts)
- Componentes duplicados eliminados (PresenceDashboard, ServerBrowser)
- Solo queda 1 playwright config

## Resumen de cambios v2.4.1 (anterior)

### Fixes de código
- AccountTable.tsx: `index` type (number → string) alineado con AccountRow
- null-coalescing en `selectedAccountId`
- vitest 2.x upgrade para coverage

### Accesibilidad
- Focus-trap hook en ModalShell
- ARIA labels en todos los icon buttons (Header, Dock)
- role="dialog" + aria-modal en modales
- aria-hidden en iconos decorativos

### Build y Release
- GitHub Release v2.4.1 con NSIS installer (77.7 MB)
- GitHub Actions: Build Windows Release (éxito), Coverage (éxito)

## Arquitectura — v2.5.0

### UI Layout (single-view, no routing)
```
┌─────────────────────────────────────────────┐
│ Header: NexoAcc | 0/50 | [Ocultar] [⚙]    │
├─────────────────────────────────────────────┤
│                                             │
│        AccountTable (3 cols)               │
│        Usuario | Alias | Descripción        │
│        (o "No hay cuentas" empty state)     │
│                                             │
├─────────────────────────────────────────────┤
│ Place ID [____] | Job ID [____] | 🔀        │
│ [+ Agregar] [Eliminar] [Abrir App] [⋮ Más]  │
└─────────────────────────────────────────────┘
```

### Componentes activos (importados por App.tsx)
- Header (layout/Header.tsx) — logo, contador, checkbox Ocultar, botón Cambiar tema
- AccountTable (accounts/AccountTable.tsx) — tabla 3 columnas con drag-drop
- AccountRow (accounts/AccountRow.tsx) — fila con framer-motion Reorder
- AddAccountModal (accounts/AddAccountModal.tsx) — tabs: login/cookie/bulk import
- Dock (layout/Dock.tsx) — Place ID, Job ID, Shuffle, botones de acción
- ModalShell (modal/ModalShell.tsx) — overlay modal con focus-trap + ARIA
- SettingsPanel (settings/SettingsPanel.tsx) — tema + idioma (INACCESIBLE desde UI)
- ServerBrowser (server-browser/ServerBrowser.tsx) — búsqueda de servidores (INACCESIBLE desde UI)
- AccountControlPanel (AccountControlPanel/) — profile, security, privacy, friends, notifications (INACCESIBLE desde UI)

### Componentes no importados
- PresenceDashboard (presence/PresenceDashboard.tsx) — feature muerta, no se usa
- ui/badge (ui/badge.tsx) — no importado directamente por App.tsx (importado por card/ServerBrowser)

### Stores Zustand
- useAccountStore (renderer/store/useAccountStore.ts) — estado de cuentas
- useUIStore (renderer/store/useUIStore.ts) — estado de UI (sidebar collapsed, etc.)

### Hooks
- useFocusTrap (renderer/hooks/useFocusTrap.ts) — focus-trap callback ref

### Main process services
- AccountManager — CRUD + cifrado AES-256-GCM
- CryptoService — cifrado hardware-derived
- ThemeService — CSS variables via IPC
- AccountSettingsService — Roblox account settings
- MultiRobloxService — múltiples instancias
- CookieExpiryService — auto-refresh cookies
- GamesService — game/server search
- PresenceService — real-time online status
- LoginBrowserService — BrowserWindow login (.ROBLOSECURITY capture)
- RobloxAuthService — cookie verification

### Testing
- **Unit (vitest)**: 95/95 — IPC (31), GamesService (14), CryptoService (14), useAccountStore (13), AccountTable (9), ServerBrowser (6), PresenceDashboard (4), RobloxAuthService (4)
- **E2E browser (Playwright)**: 5/19 pasando — smoke (theme toggle, checkbox), visual (empty state, header, dock)
- **a11y browser (axe-core)**: 0/3 pasando — axe import incorrecto + modales inaccesibles
- **Visual regression**: 3/5 pasando — baselines de modales no generados (modales inaccesibles)

## Decisiones técnicas

1. **react-router-dom eliminado** — single-view sin routing. Modales via `activeModal` state.
2. ** framer-motion Reorder** — drag-drop de cuentas con animación fluida.
3. **ModalShell unificado** — todos los modales usan el mismo shell con focus-trap integrado.
4. **BrowserWindow login** — método principal: LoginBrowserService captura .ROBLOSECURITY.
5. **Cookie manual como avanzado** — método secundario en AddAccountModal.
6. **AES-256-GCM** — cifrado hardware-derived, cookies nunca salen del PC.
7. **Browser-mode tests** — Playwright ejecuta contra `BROWSER_ONLY=1 vite --port 5174`, no contra Electron.

## Plan de desarrollo v2.5.0

Plan completo en: `docs/plans/2026-07-16-v2.5.0-cleanup-restructure.md`

### Pendiente
1. ⏳ Fix BLOCK-1: Agregar botones de Settings y Servers al Dock
2. ⏳ Fix BLOCK-2: Integrar o eliminar PresenceDashboard
3. ⏳ Fix BLOCK-3: Reescribir tests E2E con selectores del DOM real
4. ⏳ Fix BLOCK-4: Eliminar focus-trap duplicado de AddAccountModal
5. ⏳ Fix BLOCK-5: Eliminar archivos duplicados (src/store/useUIStore.ts, src/lib/utils.ts)
6. ⏳ Eliminar ui/badge si no se usa en ningún componente activo
7. ⏳ Regenerar baselines de visual regression
8. ⏳ Build completo + tag v2.5.0 + NSIS actualizado
9. ⏳ Validación visual con computer-use

## Historial de versiones
- v2.0.1 (2026-07-13): OpenSource migration, NSIS publicado
- v2.2.0: AccountTable, AccountDetailsPanel, ActionBar, ServerBrowser, PresenceDashboard, Sidebar
- v2.3.x: LoginBrowserService, BrowserWindow login
- v2.4.0: Rediseño single-view, eliminada Sidebar, eliminado routing
- v2.4.1: tsc limpio, coverage, a11y (focus-trap, ARIA), NSIS publicado
- v2.5.0 (en desarrollo): Limpieza legacy completa, eliminación de 26 archivos, estructura coherente
