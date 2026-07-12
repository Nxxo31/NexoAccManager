# NexoAccManager -- Herramienta OpenSource

## Proyecto
Gestor de cuentas multiplataforma open-source bajo MIT License.
Evoluci?n moderna y segura de RAM (ic3w0lf22) enfocada en privacidad.
Repositorio: https://github.com/Nxxo31/NexoAccManager
Maximo de cuentas: 50 por usuario (sin restricciones de plan)

## Stack
- **App**: Electron + React + TypeScript + Zustand
- **Main process**: Node.js + better-sqlite3
- **Cifrado**: AES-256-GCM derivado del hardware
- **IPC**: contextBridge tipado -- invoke/handle ?nicamente
- **i18n**: i18next + react-i18next (ES/EN/PT)
- **Temas**: CSS variables en :root via IPC theme:set (todos libres)
- **Build**: electron-builder
- **Sin backend**: 100% local, sin servidores, sin nube

## Reglas críticas — NUNCA violar
- Cookies Roblox NUNCA salen del PC del usuario
- contextIsolation: true + nodeIntegration: false + sandbox: true — nunca deshabilitar
- 100% local — sin backend, sin servidor, sin nube
- Nunca dangerouslySetInnerHTML con datos externos
- Nunca exponer ipcRenderer raw — solo contextBridge
- Nunca commitear con errores tsc sin resolver
- Nunca debilitar tests para que pasen

> **Nota:** JWT RS256, bcrypt, Stripe y rate limiting son responsabilidades del
> backend SaaS (`../NexoAccManager-Backend/`), no de esta app Electron.

## Arquitectura IPC — namespacing obligatorio
```
account:*   → gesti?n de cuentas (CRUD + cifrado)
roblox:*    → llamadas a APIs de plataformas
settings:*  → preferencias y configuraci?n local
theme:*     → sistema de temas
i18n:*      → internacionalizaci?n
advanced:*  → cach?, export, datos
```
Patr?n: invoke/handle (Promise-based) — nunca send/on para request-response
Result pattern en IPC: `{ success, data }` | `{ success: false, error }` — nunca throw sin catch

## L?mite de cuentas
- M?ximo 50 cuentas por usuario
- Sin restricciones por plan o pago
- L?mite hardcoded en el contador de accounts

## Estado actual — Julio 2026 (Migración OpenSource COMPLETADA)
```
✅ Migración OpenSource — Eliminado SaaS backend y licencias
✅ Licencia MIT — Establecida con disclaimers legales
✅ PROJECT.md, README.md, CONTRIBUTING.md — Actualizados
✅ LICENSE — Creado
✅ Limpieza de código — AuthService, LicenseService, WebServer eliminados
✅ Locales limpios — claves auth/license/plan eliminadas (es/en/pt)
✅ tsc compila limpio — 0 errores
✅ Build exitoso — AppImage + .snap generados
✅ README.md — Guía de instalación completa
❌ Testeo con cuentas reales usando Computer-use ← EN PROGRESO
❌ Subir a GitHub releases
```

## Loop de desarrollo para este proyecto
1. `cat PROJECT.md` → verificar fase activa
2. Leer solo los archivos necesarios — no escanear el proyecto completo
3. `npm run typecheck && npm run lint && npm run build`
4. Actualizar `PROJECT.md` primero — marcar ✅ con fecha
5. `git add -A && git commit -m "tipo(scope): descripción en español"`
6. `git push` → siguiente tarea inmediatamente
7. Consultar `PROJECT.md` solo para saber qué sigue o ante ambigüedad

## Edición de archivos de código (TSX/JSX/TS/JS)
- NUNCA usar `sed -i` con regex multilínea o reemplazos de tags JSX/TSX 
  (ej. <Link> -> <button>) en archivos .tsx, .jsx, .ts, .js.
- Para cualquier cambio que involucre más de una línea o estructura JSX, 
  leer el archivo completo, aplicar el cambio en memoria, y escribir el 
  archivo completo de una sola vez.
- Antes de escribir, hacer backup (.bak) solo si no existe ya uno reciente 
  (no acumular backups).
- Después de escribir, validar sintaxis (build o linter) antes de marcar 
  la tarea como completada.
- Si una edición falla 2 veces con el mismo enfoque, detenerse y reportar 
  el problema en vez de reintentar con variaciones del mismo comando.

## PROJECT.md — documento vivo
- Completar tarea → ✅ con fecha inmediatamente
- Subtareas nuevas descubiertas → agregar al momento
- Decisiones técnicas → documentar en el momento
- Inconsistencia PROJECT.md vs código → el código manda, actualizar PROJECT.md
- Nunca desactualizado más de un commit

## Estructura de archivos clave
```
src/
  main/
    main.ts                    → proceso principal Electron
    core/
      AccountManager.ts        → gestión de cuentas + cifrado
      ThemeService.ts          → sistema de temas CSS
      LicenseService.ts          → ELIMINADO (migración OpenSource)
    ipc/                       → handlers IPC por namespace
  renderer/
    App.tsx                    → raíz del renderer
    context/                   → React contexts (tema, i18n)
    components/                → componentes UI
    locales/                   → es.json, en.json, pt.json
  preload/
    preload.ts                 → contextBridge — whitelist de canales
```

## Design system — no improvisar
```css
--primary:        #DE350D;  /* Rojo Roblox — CTAs */
--accent:         #6347FF;  /* Púrpura — secundarios */
--bg-dark:        #0D0D0D;  /* Fondo principal */
--bg-card:        #161616;  /* Cards */
--bg-surface:     #1E1E1E;  /* Superficies elevadas */
--success:        #2ED573;
--warning:        #FFA502;
--error:          #FF4757;
--border:         #2A2A2A;
```
- Glassmorphism: `backdrop-filter: blur(12px)` en cards
- Tipografía: Inter (UI) + JetBrains Mono (datos)
- Border radius: 8px cards / 4px inputs
- Animaciones: 200ms ease-in-out
- Iconos: Lucide Icons

## Temas — Sprint E7 COMPLETADO
```
Dark (default)  → bg: #0D0D0D
Light           → bg: #F5F5F5, texto oscuro
Roblox Classic  → rojo dominante #DE350D con negro
Custom          → color picker primario + acento (todos los usuarios)
```

## i18n — implementado en E6
- Idioma default: español (es)
- IPC: `settings:language:get` / `settings:language:set`
- Persistencia: SQLite tabla `settings` key `language`
- Detección: i18next-browser-languagedetector al primer arranque

## APIs Roblox utilizadas
```
auth.roblox.com               → verificar cookie, auth ticket
accountsettings.roblox.com    → privacidad, notificaciones
accountinformation.roblox.com → perfil
users.roblox.com              → info usuarios
friends.roblox.com            → amigos, solicitudes
presence.roblox.com           → estado online (polling 30s)
games.roblox.com              → servers, player count
thumbnails.roblox.com         → avatares
economy.roblox.com            → Robux balance
```
Cache LRU 60s en main process -- respetar rate limits

## Temas — todos disponibles (sin restricci?n)
```
Dark (default)  → bg: #0D0D0D
Light           → bg: #F5F5F5, texto oscuro
Roblox Classic  → rojo dominante #DE350D con negro
Custom          → color picker primario + acento (todos los usuarios)
```

## Intervención humana — solo si
- Riesgo de pérdida de datos permanente
- Decisión de producto ausente en PROJECT.md
- Contradicción con sección "Decisiones técnicas globales" de PROJECT.md
- Faltan credenciales o accesos externos
- Cambio arquitectónico que afecta más de un módulo core
