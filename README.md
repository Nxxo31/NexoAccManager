# NexoAccManager

> Roblox Account Manager seguro, limpio y de código abierto.
> Gestiona múltiples cuentas de Roblox con cifrado local y lanzamiento rápido.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Electron 30 |
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Backend (main) | Node.js + TypeScript |
| Base de datos | SQLite (better-sqlite3) |
| Cifrado | AES-256-GCM (Node crypto) |
| API interna | Fastify |
| Build tool | Vite + electron-builder |

## Arquitectura Actual

```
NexoAccManager/
├── src/
│   ├── main/              # Proceso principal Electron (Node)
│   │   ├── main.ts        # Entry point, ventana, IPC, menú
│   │   ├── core/
│   │   │   ├── AccountManager.ts   # Lógica de cuentas, verificación Roblox API
│   │   │   └── CryptoService.ts    # Cifrado AES-256-GCM derivado del hardware
│   │   ├── server/
│   │   │   └── WebServer.ts        # API REST Fastify (puerto 8080)
│   │   └── storage/
│   │       └── DatabaseManager.ts  # SQLite wrapper
│   ├── preload/
│   │   └── preload.ts     # Puente seguro main ↔ renderer
│   ├── renderer/
│   │   └── index.css        # Estilos base Tailwind
│   └── types/
│       └── Account.ts       # Interfaces TypeScript
├── public/
│   └── index.html           # HTML entry point
├── package.json
└── vite.config.ts
```

## Estado del MVP

### ✅ Funcionando (Sprint E0)
- **Cifrado**: AES-256-GCM con clave derivada del hardware.
- **Database**: SQLite con tablas `accounts`, `settings`, `recent_games`.
- **Verificación de cookies**: Valida contra `auth.roblox.com` y `users.roblox.com`.
- **API REST interna**: Fastify con autenticación por Bearer token.
- **Menú de aplicación**: Import/Export JSON, API Web Local, Configuración.
- **Renderer React**: UI completa con lista de cuentas, modal de lanzamiento, grupos.
- **Multi-Roblox**: Perfiles temporales para múltiples instancias simultáneas.
- **Import/Export**: JSON con validación de formato y detección de duplicados.
- **Lanzamiento Roblox**: Protocolo `roblox-player://` con auth ticket.

### ✅ Sprint E1 — Seguridad IPC (Completado)
- [x] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- [x] Whitelist explícita de canales IPC en preload.ts
- [x] Namespacing: `account:*`, `roblox:*`, `settings:*`
- [x] Type guards en todos los `ipcMain.handle()` — validación de payloads
- [x] Content-Security-Policy en BrowserWindow
- [x] `shell.openExternal()` solo acepta URLs `roblox-player://`

### ✅ Sprint E2 Perfil, Seguridad, Privacidad, Amigos y Notificaciones (Completado)

**Perfil:**
- ✅ Ver y cambiar display name (`account:profile:get`, `account:profile:update`)
- ✅ Ver y editar descripción de perfil
- ✅ Ver avatar actual con thumbnail (`account:avatar-thumbnail`)
- ✅ `AccountSettingsService` con integración a `accountinformation.roblox.com` y `thumbnails.roblox.com`

**Seguridad:**
- ✅ Ver sesiones activas (`settings:security:sessions`)
- ✅ Cerrar sesión individual (`settings:security:logout`)
- ✅ Cerrar todas las sesiones (`settings:security:logout-all`)
- ✅ Cambiar contraseña (`settings:security:password`)
- ✅ Estado 2FA (`settings:security:2fa:get`, `settings:security:2fa:set`)

**Privacidad:**
- ✅ Mensajes, chat, inventario, grupos, última conexión, seguidores
- ✅ UI `PrivacyPanel.tsx` con toggles categorizados

**Amigos:**
- ✅ Ver lista de amigos con estado online (`account:friends:list`)
- ✅ Aceptar/rechazar solicitudes de amistad (`account:friends:requests`, `account:friends:respond`)
- ✅ Bloquear/desbloquear usuarios (`account:block:user`, `account:unblock:user`)
- ✅ Ver lista de bloqueados (`account:blocked:list`)
- ✅ UI `FriendsPanel.tsx` con sub-tabs Amigos/Solicitudes/Bloqueados

**Notificaciones:**
- ✅ Toggle notificaciones de solicitudes de amistad
- ✅ Toggle notificaciones de mensajes
- ✅ UI `NotificationsPanel.tsx` con toggles

**UI:**
- ✅ `ProfilePanel.tsx` — avatar, displayName editable, descripción editable
- ✅ `SecurityPanel.tsx` — tabs Sesiones / Contraseña / 2FA
- ✅ `PrivacyPanel.tsx` — toggles de privacidad categorizados
- ✅ `FriendsPanel.tsx` — lista de amigos, solicitudes, bloqueados
- ✅ `NotificationsPanel.tsx` — toggles de notificaciones
- ✅ `AccountControlPanel.tsx` — modal con 5 tabs integrado en App.tsx
- ✅ Botón "Configurar" en cada cuenta de la lista

### Pendiente

#### Fase 2 — Integración SaaS
- [ ] Pantalla de login/registro con design system
- [ ] JWT en electron-store cifrado
- [ ] Validación de licencia al arrancar (GET /license/verify)
- [ ] Bloqueo por accountLimit con UI clara y CTA de upgrade
- [ ] Botón "Mejorar plan" → abre Landing en browser
- [ ] Modo offline con último plan conocido localmente
- [ ] Indicador de estado de licencia (online/offline/expirada)

#### Fase 3 — Account Control Panel (Business+)
- [ ] Cambiar contraseña desde la app
- [ ] Bloquear/desbloquear cuenta remotamente
- [ ] Ver sesiones activas
- [ ] Eliminar cuenta desde Account Control Panel

#### Leve
- [ ] Tests con Vitest
- [ ] CI/CD configurado (GitHub Actions)
- [ ] Icono de aplicación (`public/icon.png`)
- [ ] Sistema de logs estructurados

## Roadmap

### ✅ v0.1.0 — MVP Backend Completo
- [x] Fix: `preload.ts` (importar `ipcRenderer` de `electron`).
- [x] Agregar `better-sqlite3` a `dependencies`.
- [x] Implementar renderer básico: lista de cuentas, agregar cuenta, settings.
- [x] Implementar `launchRoblox()` mínimo (protocolo `roblox-player://`).
- [x] Build funcional (`npm run build`).

### ✅ v0.1.1 — Seguridad IPC (Sprint E1)
- [x] contextIsolation + sandbox + nodeIntegration:false
- [x] Whitelist canales IPC en preload.ts
- [x] Type guards en ipcMain.handle()
- [x] CSP en BrowserWindow
- [x] Validación shell.openExternal()

### v0.2.0 — UX y Robustez
- [x] Import/Export de cuentas a JSON cifrado.
- [x] Manejo de errores de red y reintentos.
- [x] Validación de duplicados.
- [x] Multi-Roblox con perfiles temporales.
- [ ] Tests unitarios con Vitest.

### v0.3.0 — Polish
- Icono e instalador auto-firmado.
- Logs estructurados.
- GitHub Actions para CI/CD y releases.

## Scripts Disponibles

```bash
npm run dev              # Desarrollo (Vite dev server)
npm run build            # Build de producción
npm run electron:dev      # Electron en modo dev
npm run electron:build    # Build + empaquetado con electron-builder
npm run test             # Vitest
npm run lint             # ESLint
```

## Licencia

GPL-3.0 — NEXO DEVELOPING SOFTWARE
