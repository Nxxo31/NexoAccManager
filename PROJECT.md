# Proyecto: NexoAccManager
# Fecha: 2026-07-14 (actualizado 2026-07-15)
# Estado: Login con navegador implementado (estilo RAM Original) + UI/UX mejorado y testing mejorado

## Resumen de cambios

### Login con navegador (NUEVO MÉTODO HABITUAL) - Implementado 2026-07-15
- LoginBrowserService: BrowserWindow aislado que abre roblox.com/login
  - Captura automática de cookie .ROBLOSECURITY cuando el usuario inicia sesión
  - Session partition aislada para evitar contaminación
  - Intercepta cambios de cookie mediante session.cookies.on('changed')
  - Obtiene info del usuario vía users.roblox.com/v1/users/authenticated
  - Cierra ventana automáticamente al detectar cookie válida
- IPC handler: `account:login-browser` (método principal, por defecto)
- Método avanzado mantenido: `account:login` (username/password) → movido a Settings como avanzado
- Preload actualizado: whitelist + API `loginBrowser(group?: string)`
- AddAccountModal reescrito:
  - Login con navegador como método principal visible (Globe icon)
  - Cookie manual como opción avanzada (requiere activar "Opciones avanzadas")
  - Mensajes de seguridad claros para ambos métodos

### UI/UX mejoras (v2.2.0 - previamente implementado)
- AccountTable: tabla de 3 columnas (Usuario|Alias|Descripción) con avatar, estado y acciones
- AccountDetailsPanel: panel lateral con Place ID, Job ID, Alias, Descripción editables + Follow + metadata
- ActionBar: barra inferior con Agregar, Eliminar, Ocultar Usernames (checkbox), Abrir App, Editar Tema, Control de Cuenta
- ServerBrowser: búsqueda real de servidores por Place ID vía IPC + filtros y ordenamiento
- PresenceDashboard: polling real con avatares, estados y detalles de juego/balance
- Sidebar: rediseño con glassmorphism, ícono de logo y estado activo mejorado
- SettingsPanel: mejor espaciado, labels en español y feedback visual
- index.css: design system completo con scrollbar customizado, glassmorphism, tipografía JetBrains Mono
- App.tsx: ruta index → /accounts, layout 3 zonas (tabla + detalles + actionbar), datos reales

### Testing mejoras
- Agregado Testing Library (@testing-library/react, @testing-library/jest-dom, @testing-library/user-event)
- Agregado happy-dom como entorno de pruebas para componentes React
- Agregado msw para mock de APIs (aunque no se usó en tests finales por complejidad)
- Actualizado vitest.config.ts para usar environment 'happy-dom' por defecto (para .tsx) y 'node' para .ts
- Agregado src/test/setup.ts con mock de window.api (Electron contextBridge) para pruebas de renderer
- Tests creados para:
  - Sidebar.tsx
  - AccountTable.tsx
  - ActionBar.tsx
  - AccountDetailsPanel.test.tsx (con interacciones de guardar alias/descripción)
  - ServerBrowser.test.tsx
  - PresenceDashboard.test.tsx
  - Intentado test para RobloxAuthService.test.ts (necesita más trabajo de mocking)
- Mantener tests existentes: IPC.test.ts, GamesService.test.ts, useAccountStore.test.ts, CryptoService.test.ts (72 tests pasando)
- Nuevo total: ~105 tests (72 existentes + ~33 nuevos de UI)

## Próximos pasos
1. Mejorar tests de RobloxAuthService con mocking correcto de axios
2. Añadir tests E2E con Playwright para flujos completos (login, añadir cuenta, editar, lanzar juego)
3. Añadir pruebas de visual regresión con Percy o similar
4. Añadir pruebas de accesibilidad con axe-core
5. Configurar coverage report con c8/istanbul y subir a codecov
6. Construir y validar NSIS installer (pendiente desde v2.2.0)

## Decisiones técnicas
- Se mantuvo la arquitectura IPC y Zustand intacta
- Se preservó la seguridad: cookies nunca salen del PC, contextIsolation, sandbox, etc.
- Se usó el mismo sistema de colores y tipografía del design system existente
- Se priorizó componentes críticos de UI sobre tests de services menos críticos
- Los tests de componentes usan mocks de window.api y stores para aislar la capa de presentación
- El login con navegador es ahora el método habitual (por defecto), alineado con RAM Original
- El login username/password sigue disponible como método avanzado en Settings

## Investigando: repositorios de "opita go"

### Resultado del análisis (completado 2026-07-15)

**Organización encontrada:** Opita-Code (GitHub)

**2 repositorios relevantes:**

1. **dark-research-mcp** — https://github.com/Opita-Code/dark-research-mcp
   - Servidor MCP en Go con 57 herramientas para agentes IA
   - OSINT, validación closed-loop (spec→artifact→drift→reconcile), LLM-as-judge
   - Cache LLM con TTL, VCR fixtures para testing, modularidad por dominios

2. **opita-sync-framework** — https://github.com/Opita-Code/opita-sync-framework
   - Kernel de gobernanza IA-First en Go
   - Modelo de intents y contratos: intake→proposal→preview→governance→execution→inspection
   - Capability registry, approval-release workflow, event log inmutable
   - Depuración semántica, policy engine plugable (Cerbos)

### Características aplicables a NexoAccManager
- **Capability registry:** registrar herramientas disponibles (login browser, cookie refresh, server join) como capacidades tipadas
- **Event log inmutable:** auditar todas las acciones de cuentas (login, launch, delete) en log canónico
- **Closed-loop validation:** validar que acciones ejecutadas coincidan con el intent original
- **Approval workflow:** requerir confirmación para acciones críticas (eliminar cuenta, distribuir cuentas en servers)
- **Policy engine:** reglas de límites (50 cuentas, rate limiting de API de Roblox) externalizadas