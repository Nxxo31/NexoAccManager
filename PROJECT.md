# NexoAccManager — PROJECT.md
# Última actualización: 2026-07-16
# Versión actual: 2.5.0 (en desarrollo)

## Estado actual

| Métrica | Valor |
|---------|-------|
| Versión | 2.5.0 |
| Último commit | d7aa918 — docs(PROJECT.md): actualizado post-auditoria |
| tsc | 0 errores |
| vitest | 95/95 pasando |
| lint | 0 errores, 177 warnings |
| build | Pendiente — no ejecutado en v2.5.0 |
| NSIS | Desactualizado — último: v2.4.1 |
| Playwright | Pendiente — selectores actualizados, por verificar |

## Bloqueos resueltos en esta sesión

### BLOCK-4 (✅) — focus-trap duplicado
- `AddAccountModal.tsx` ya no tiene focus-trap propio. Delegado a `ModalShell.tsx`.
- 335 líneas → reducido, sin código duplicado.

### BLOCK-5 (✅) — archivos duplicados
- `src/store/useUIStore.ts` eliminado. Todo usa `src/renderer/store/useUIStore.ts`.
- `src/lib/utils.ts` eliminado. Todo usa `src/renderer/lib/utils.ts`.

### BLOCK-1 (✅) — modales inaccesibles desde el UI
- Dock ahora tiene botones `Servidores` y `Ajustes` en la barra principal.
- `setActiveModal('servers')` y `setActiveModal('settings')` se disparan correctamente.
- Dropdown "Más opciones" ahora tiene toggle funcional (`dropdownOpen` state).
- Modal de Ajustes confirmado visible en browser (role="dialog", ARIA correcto).

### Documentación (✅)
- AGENTS.md reescrito con estructura real v2.5.0, reglas claras de PROJECT.md como prioridad.
- PROJECT.md reescrito con datos concretos de auditoría, bloqueos documentados.

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
- Dock (layout/Dock.tsx) — Place ID, Job ID, Shuffle, botones Agregar/Eliminar/Abrir App/Servidores/Ajustes/Más opciones
- ModalShell (modal/ModalShell.tsx) — overlay modal con focus-trap + ARIA
- SettingsPanel (settings/SettingsPanel.tsx) — tema + idioma + gestión de datos (accesible via Dock → Ajustes)
- ServerBrowser (server-browser/ServerBrowser.tsx) — búsqueda de servidores (accesible via Dock → Servidores)
- AccountControlPanel (AccountControlPanel/) — profile, security, privacy, friends, notifications (importado, pendiente verificar si accesible desde UI)

### Componentes no importados (dead code candidates)
- PresenceDashboard (presence/PresenceDashboard.tsx) — no se importa en App.tsx
- ui/badge (ui/badge.tsx) — importado por ServerBrowser/card, no directamente por App.tsx

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
1. ⏳ Reescribir tests E2E/a11y/visual con selectores del DOM real v2.5.0
2. ⏳ Regenerar baselines de visual regression (settings-modal, server-browser-modal)
3. ⏳ Decidir destino de PresenceDashboard (integrar como modal o eliminar)
4. ⏳ Verificar AccountControlPanel accesible desde UI
5. ⏳ Build completo + tag v2.5.0 + NSIS actualizado
6. ⏳ Validación visual con computer-use

### RAM original (ic3w0lf22) — comparación de features
| Feature | RAM original | NexoAccManager v2.5.0 |
|---------|-------------|----------------------|
| Multi-instance Roblox | ✅ (built-in, disabled by default) | ✅ MultiRobloxService |
| Add accounts | ✅ usuario:contraseña | ✅ BrowserWindow login + cookie + bulk import |
| Cookie storage | ✅ plaintext | ✅ AES-256-GCM encrypted |
| Save/Copy Password | ✅ | ❌ pendiente |
| Account Control (Nexus) | ✅ in-game control via Lua | ❌ pendiente |
| Local Web API | ✅ http API | ❌ pendiente |
| DevMode (rbx-player link) | ✅ | ✅ en Dock dropdown |
| PlaceId/JobId join | ✅ | ✅ en Dock |
| Server browser | ✅ | ✅ ServerBrowser modal |
| Presence/online status | ✅ | ✅ PresenceService (UI pendiente) |
| Custom themes | ✅ WinForms limited | ✅ CSS variables + 4 presets |
| i18n | ❌ English only | ✅ ES/EN/PT |
| Cross-platform | ❌ Windows only | ✅ Electron (Win/Linux/Mac) |
| Open source | ✅ GPL-3.0 | ✅ MIT |
| Modern UI | ❌ WinForms | ✅ React + framer-motion + Tailwind |

## Historial de versiones
- v2.0.1 (2026-07-13): OpenSource migration, NSIS publicado
- v2.2.0: AccountTable, AccountDetailsPanel, ActionBar, ServerBrowser, PresenceDashboard, Sidebar
- v2.3.x: LoginBrowserService, BrowserWindow login
- v2.4.0: Rediseño single-view, eliminada Sidebar, eliminado routing
- v2.4.1: tsc limpio, coverage, a11y (focus-trap, ARIA), NSIS publicado
- v2.5.0 (en desarrollo): Limpieza legacy completa, eliminación de 26 archivos, estructura coherente
