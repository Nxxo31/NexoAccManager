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

### Funcionando
- **Cifrado**: AES-256-GCM con clave derivada del hardware (no portable entre PCs, intencional).
- **Database**: SQLite con tablas `accounts`, `settings`, `recent_games`.
- **Verificación de cookies**: Valida contra `auth.roblox.com` y `users.roblox.com`.
- **API REST interna**: Fastify con autenticación por Bearer token.
- **Menú de aplicación**: Import/Export JSON, API Web Local, Configuración.

### Faltante para MVP v1.0

#### Crítico
- [ ] **Renderer React**: Falta `src/renderer/main.tsx`, `App.tsx` y componentes UI.
- [ ] **Preload**: `ipcRenderer` no está importado; la build falla.
- [ ] ** Dependencia `better-sqlite3`**: No está en `package.json` pero se usa en `DatabaseManager.ts`.

#### Medio
- [ ] **`launchRoblox()`**: Stub vacío, no implementa lanzamiento real.
- [ ] **WebServer**: `fastify-cors` está deprecado; usar `@fastify/cors`.
- [ ] **Import/Export**: Métodos vacíos en `main.ts`.
- [ ] **Manejo de errores**: No hay retries ni manejo de fallos de red de Roblox.
- [ ] **Validación de duplicados**: Al agregar una cuenta no se verifica si ya existe.

#### Leve
- [ ] Tests con Vitest.
- [ ] CI/CD configurado.
- [ ] Icono de aplicación (`public/icon.png`).
- [ ] Sistema de logs estructurados.

## Roadmap

### v0.1.0 — MVP Backend Completo
1. Fix: `preload.ts` (importar `ipcRenderer` de `electron`).
2. Agregar `better-sqlite3` a `dependencies`.
3. Implementar renderer básico: lista de cuentas, agregar cuenta, settings.
4. Implementar `launchRoblox()` mínimo (protocolo `roblox://`).
5. Build funcional (`npm run build`).

### v0.2.0 — UX y Robustez
- Import/Export de cuentas a JSON cifrado.
- Manejo de errores de red y reintentos.
- Validación de duplicados.
- Tests unitarios con Vitest.

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
