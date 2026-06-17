# NexoAccManager — Contexto del proyecto

## Proyecto
SaaS gestor de cuentas Roblox. Clon moderno de RAM (ic3w0lf22) con modelo freemium.
Repositorio: https://github.com/Nxxo31/NexoAccManager

## Stack
- **App**: Electron + React + TypeScript + Zustand
- **Main process**: Node.js + Fastify + better-sqlite3
- **Cifrado**: AES-256-GCM derivado del hardware
- **IPC**: contextBridge tipado — invoke/handle únicamente
- **i18n**: i18next + react-i18next (ES/EN/PT)
- **Temas**: CSS variables en :root via IPC theme:set
- **Build**: electron-builder

## Reglas críticas — NUNCA violar
- Cookies Roblox NUNCA salen del PC del usuario
- contextIsolation: true + nodeIntegration: false + sandbox: true — nunca deshabilitar
- JWT RS256 asimétrico — nunca HS256
- Nunca dangerouslySetInnerHTML con datos externos
- Nunca exponer ipcRenderer raw — solo contextBridge
- Nunca commitear con errores tsc sin resolver
- Nunca debilitar tests para que pasen

## Arquitectura IPC — namespacing obligatorio
```
account:*   → gestión de cuentas Roblox
roblox:*    → llamadas a APIs de Roblox
settings:*  → preferencias y configuración
license:*   → validación de plan SaaS
theme:*     → sistema de temas
i18n:*      → internacionalización
advanced:*  → caché, export, datos
```
Patrón: invoke/handle (Promise-based) — nunca send/on para request-response
Result pattern en IPC: `{ success, data }` | `{ success: false, error }` — nunca throw sin catch

## Estado actual — junio 2026
```
✅ E1 — Seguridad IPC
✅ E2 — Account Control Panel
✅ E3 — Server Browser
✅ E4 — Presence Dashboard
✅ E5 — Integración SaaS
✅ E6 — i18n
❌ E7 — Temas personalizables   ← SIGUIENTE
❌ E8 — Settings Panel completo
❌ L1-L5 — Landing Page
❌ B1-B5 — Backend API
```

## Loop de desarrollo para este proyecto
1. `cat CURRENT_TASK.md` → ejecutar tarea activa
2. Leer solo los archivos necesarios — no escanear el proyecto completo
3. `npm run typecheck && npm run lint && npm run build`
4. Actualizar `PROJECT.md` primero — marcar ✅ con fecha
5. Actualizar `CURRENT_TASK.md` con la siguiente tarea
6. `git add -A && git commit -m "tipo(scope): descripción en español"`
7. `git push` → siguiente tarea inmediatamente
8. Consultar `PROJECT.md` solo para saber qué sigue o ante ambigüedad

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
      LicenseService.ts        → validación JWT + plan
    ipc/                       → handlers IPC por namespace
  renderer/
    App.tsx                    → raíz del renderer
    context/                   → React contexts (tema, i18n, auth)
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

## Temas — Sprint E7 pendiente
```
Dark (default)  → bg: #0D0D0D
Light           → bg: #F5F5F5, texto oscuro
Roblox Classic  → rojo dominante #DE350D con negro
Custom          → solo Enterprise — color picker primario + acento
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
Cache LRU 60s en main process — respetar rate limits de Roblox

## Planes SaaS — límites de cuentas
```
Free:       5 cuentas  — $0/mes
Starter:    10 cuentas — $5/mes
Pro:        20 cuentas — $10/mes
Business:   30 cuentas — $20/mes
Enterprise: ∞ cuentas  — $50/mes
```
Custom themes solo disponibles en Enterprise.

## Intervención humana — solo si
- Riesgo de pérdida de datos permanente
- Decisión de producto ausente en PROJECT.md
- Contradicción con sección "Decisiones técnicas globales" de PROJECT.md
- Faltan credenciales o accesos externos
- Cambio arquitectónico que afecta más de un módulo core
