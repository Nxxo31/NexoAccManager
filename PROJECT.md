# NexoAccManager — Herramienta OpenSource de Gestión de Cuentas

## Descripción

**Migración completada a modelo OpenSource (Julio 2026).**

Herramienta libre y de código abierto para la gestión de múltiples cuentas e instancias
de plataformas de juego. Evolución moderna y segura del Roblox Account Manager (RAM)
de ic3w0lf22, enfocada en la privacidad y el control del usuario.

**Naturaleza del proyecto:**
- **Código abierto bajo licencia MIT:** Libre uso, modificación y distribución.
- **Sin fines de lucro:** Sin modelos de suscripción, pagos ni publicidad.
- **100% Local:** Todas las credenciales y datos se almacenan y procesan únicamente
  en el dispositivo del usuario mediante cifrado AES-256-GCM.
- **Independiente:** No requiere servidores, backend ni conexión a internet para funcionar.
- **Sin afiliación:** Este proyecto no está afiliado, respaldado ni patrocinado por
  ninguna plataforma de juego ni empresa relacionada.

## Repositorios del ecosistema

| Repo | Descripción | URL |
|------|-------------|-----|
| **NexoAccManager** (este repo) | App Electron — Motor RAM, 100% local | https://github.com/Nxxo31/NexoAccManager |
| **NexoAccManager-Backend** | API REST SaaS (Fastify + Prisma + Stripe) — repositorio independiente | Ver `../NexoAccManager-Backend/PROJECT.md` |
| **NexoAccManager-Landing** | Landing page Next.js — repositorio independiente | Ver `../NexoAccManager-Landing/PROJECT.md` |

> **Nota:** El backend y la landing page son repositorios SaaS separados que coexisten
> como hermanos en el sistema de archivos (`../NexoAccManager-Backend/`, `../NexoAccManager-Landing/`).
> La app Electron (este repositorio) es 100% local y OpenSource — no depende del backend ni de la landing.

## Historial de Cambios Clave

- **2026-07-04:** Decisión estratégica de migrar de modelo SaaS a OpenSource
  después de evaluación de riesgos legales y técnicos.
- **2026-07-04:** Eliminación de backend propietario, sistema de licencias,
  integración con Stripe y autenticación centralizada de la app Electron.
- **2026-07-12:** Limpieza de PROJECT.md — todo el contenido SaaS (Prisma schema,
  endpoints backend, secciones de landing, JWT/Stripe/referencias a planes) movido
  a los PROJECT.md de los repositorios correspondientes.

## Referencias

- https://github.com/ic3w0lf22/Roblox-Account-Manager
- https://ic3w0lf22.gitbook.io/roblox-account-manager/

---

## Comparativa: NexoAccManager vs RAM original

| Característica | RAM (ic3w0lf22) | NexoAccManager |
|---|---|---|
| **Stack** | WinForms C# (.NET) | Electron + React + TypeScript |
| **Plataforma** | Solo Windows | Windows (Mac/Linux futuro) |
| **UI/UX** | UI básica de 2015 | Design system moderno, glassmorphism |
| **Modelo de negocio** | Gratis, sin soporte | OpenSource MIT — gratis y libre |
| **Autenticación de usuario** | ❌ Sin login | ❌ Sin login — 100% local, sin servidor |
| **Backend** | ❌ Solo local | ❌ Sin backend — todo en el dispositivo |
| **Dashboard web** | ❌ No existe | ❌ No aplica — app de escritorio local |
| **Account Control Panel** | ❌ Básico | ✅ Completo — privacidad, bloqueos, sesiones, contraseña |
| **Server Browser** | ✅ Lista básica | ✅ Con región, ping, filtro por menos jugadores |
| **Smart Server Selection** | ❌ Manual | ✅ Auto-join least populated + multi-account split |
| **Presence Dashboard** | ❌ No existe | ✅ Estado en tiempo real de todas las cuentas |
| **Cifrado** | Básico | AES-256-GCM derivado del hardware |
| **IPC Security** | N/A (.NET) | contextBridge + contextIsolation + sandbox |
| **Auto Cookie Refresh** | ✅ Básico | ✅ Avanzado con retry y notificaciones |
| **Player Finder** | ✅ Básico | ✅ Con región y distribución multi-cuenta |
| **Soporte activo** | ❌ Abandonado | ✅ Comunidad activa, código abierto |
| **Descarga** | GitHub releases | GitHub releases |
| **Inventario desde app** | ❌ No | ✅ Ver items, Robux balance |
| **Idiomas** | ❌ Solo inglés | ✅ ES, EN, PT con i18n completo |
| **Temas personalizables** | ❌ No | ✅ Dark, Light, Roblox Classic, Custom (todos libres) |

---

## Modelo OpenSource

**Este proyecto es completamente gratuito y de código abierto bajo Licencia MIT.**

Sin planes de pago, suscripciones ni límites de funcionalidad. Todos los usuarios
tienen acceso completo a todas las características sin restricción alguna.

Principios del proyecto:
- **Libre uso:** Descarga, usa y modifica el software sin costo.
- **Sin límites de cuentas:** Gestiona tantas cuentas como necesites.
- **Sin recolección de datos:** Tu información nunca sale de tu dispositivo.
- **100% local:** Sin servidores, sin backend, sin tracking.

---

## Design System

### Paleta de colores (inspirada en Roblox)

```css
:root {
  --primary:        #DE350D;  /* Rojo Roblox — CTAs principales */
  --primary-dark:   #B22A0A;  /* Hover primary */
  --accent:         #6347FF;  /* Púrpura — elementos secundarios */
  --accent-light:   #8B6FFF;  /* Hover accent */
  --bg-dark:        #0D0D0D;  /* Fondo principal */
  --bg-card:        #161616;  /* Cards y paneles */
  --bg-surface:     #1E1E1E;  /* Superficies elevadas */
  --text-primary:   #FFFFFF;  /* Texto principal */
  --text-secondary: #A0A0A0;  /* Texto secundario */
  --success:        #2ED573;  /* Verde — estados activos */
  --warning:        #FFA502;  /* Naranja — advertencias */
  --error:          #FF4757;  /* Rojo — errores */
  --border:         #2A2A2A;  /* Bordes sutiles */
}
```

### Temas disponibles

- **Dark (default)** — fondo #0D0D0D, el tema actual
- **Light** — fondo #F5F5F5, texto oscuro, mismo accent
- **Roblox Classic** — rojo dominante #DE350D con negro
- **Custom** — usuario define colores primario y acento

> **Nota:** Todos los temas están disponibles para todos los usuarios. No hay
> restricciones por plan — el proyecto es OpenSource MIT.

### Estilo visual

- Dark theme exclusivo por defecto
- Glassmorphism en cards: `backdrop-filter: blur(12px)`, bordes translúcidos
- Gradientes de fondo con rojo Roblox sutil
- Tipografía: Inter (UI) + JetBrains Mono (datos técnicos)
- Border radius: 8px cards, 4px inputs
- Animaciones: 200ms ease-in-out
- Iconografía: Lucide Icons
- Inspiración: Linear.app + Vercel Dashboard

---

## Internacionalización (i18n)

### Idiomas soportados

- 🇪🇸 Español (es) — idioma por defecto
- 🇺🇸 English (en)
- 🇧🇷 Português (pt)

### Implementación Motor RAM (Electron)

- Librería: `i18next` + `react-i18next`
- Archivos: `src/renderer/locales/es.json`, `en.json`, `pt.json`
- Selector: dropdown con banderas en Header
- Persistencia: guardado en SQLite tabla `settings` con key `language`
- Detección automática: usa el idioma del sistema operativo al primer arranque
- IPC channel: `settings:language:get/set`

> **Nota:** La landing page usa `next-intl` con rutas localizadas `/es/`, `/en/`, `/pt/`.
> Ver `../NexoAccManager-Landing/PROJECT.md` para detalles.

---

## Personalización y Temas

### Motor RAM — Settings Panel de Apariencia

- **Selector de tema**: Dark / Light / Roblox Classic / Custom
- **Color primario custom**: color picker (todos los usuarios)
- **Color acento custom**: color picker (todos los usuarios)
- **Tamaño de fuente**: Small / Medium (default) / Large
- **Densidad de UI**: Compacta / Normal / Espaciosa
- **Animaciones**: On / Off (para PCs con recursos limitados)
- **Idioma**: dropdown con banderas ES / EN / PT

Persistencia: SQLite tabla `settings`.
Aplicación: CSS variables en `:root` actualizadas dinámicamente via IPC `theme:set`.

---

## Arquitectura del ecosistema (OpenSource)

```
Usuario
  │
  ▼
NexoAccManager-Landing (servidor externo — repositorio independiente)
  ├── Hero + Features
  ├── Descarga desde GitHub Releases
  ├── Documentación y guías
  ├── Selector de idioma (next-intl)
  └── Links al código fuente
          │
          ▼
NexoAccManager — App Electron (100% local en PC del usuario)
  ├── Gestión de múltiples cuentas sin límites
  ├── SQLite AES-256-GCM → cuentas (NUNCA salen del PC)
  ├── i18n con i18next (ES/EN/PT)
  ├── Temas personalizables con CSS variables (todos disponibles)
  └── Roblox API calls con cookie local
```

**Nota:** La app Electron no requiere backend ni servidor. Todo funciona
localmente en el dispositivo del usuario. La landing page y el backend
son repositorios SaaS separados que coexisten como hermanos.

---

## Patrones de arquitectura y diseño — Motor RAM (Electron)

- **Patrón principal**: Two-process model (Main + Renderer) con IPC tipado
- **IPC**: invoke/handle (Promise-based) — nunca send/on para request-response
- **Seguridad IPC**: contextBridge con whitelist explícita de canales, validación en ambos lados
- **Namespacing IPC**: `account:*`, `roblox:*`, `settings:*`, `theme:*`, `i18n:*`, `advanced:*`
- **Estado**: Zustand en renderer — nunca estado en main process
- **Servicios**: Repository pattern para SQLite, Service layer para Roblox API
- **Cache**: LRU cache en main process para responses de Roblox API (TTL 60s)
- **Error handling**: Result pattern (success/error) en IPC — nunca throw sin catch
- **i18n**: i18next inicializado en renderer, idioma guardado via `settings:language:set`
- **Temas**: CSS variables en `:root` actualizadas via IPC `theme:set`

> **Patrones del Backend y Landing:** Ver `../NexoAccManager-Backend/PROJECT.md` y
> `../NexoAccManager-Landing/PROJECT.md` respectivamente.

---

## Seguridad — Motor RAM (Electron)

### BrowserWindow config obligatoria

```
contextIsolation: true    ✅ aísla preload del renderer
nodeIntegration: false    ✅ sin Node.js en renderer
sandbox: true             ✅ Chromium sandbox activo
webSecurity: true         ✅ same-origin policy
enableRemoteModule: false ✅ remote module deshabilitado
```

### CSP en BrowserWindow

```
default-src 'self'
script-src 'self'
connect-src 'self' https://*.roblox.com
```

### IPC Security

- contextBridge expone SOLO funciones específicas, nunca ipcRenderer raw
- Whitelist de canales en preload
- Validación de tipos en main process handlers (defense in depth)
- Nunca shell.openExternal() sin validar la URL primero

### Almacenamiento

- Cookies Roblox en SQLite con AES-256-GCM
- Nunca localStorage para datos sensibles
- Preferencias de tema e idioma en SQLite (no sensibles, sin cifrado)

**Nota:** Este proyecto no tiene backend, no recopila datos y no se comunica con
servidores propios. Toda la operación es local.

> **Seguridad del Backend y Landing:** Ver `../NexoAccManager-Backend/PROJECT.md` y
> `../NexoAccManager-Landing/PROJECT.md`.

---

## Licencia

**MIT License** — Ver archivo [LICENSE](LICENSE) para detalles completos.

Este software se proporciona "tal cual", sin garantía de ningún tipo.
El uso de este software es bajo su propia responsabilidad.

**Disclaimer Legal:**
Este proyecto no está afiliado, respaldado ni patrocinado por ninguna
plataforma de juego, empresa de tecnología ni marca registrada. El uso de
este software es responsabilidad exclusiva del usuario final, quien debe
asegurarse de cumplir con los términos de servicio de cualquier plataforma
con la que interactúe.

---

## Estado del Proyecto

### Roadmap actualizado (Julio 2026)

| Sprint | Estado | Descripción |
|--------|--------|-------------|
| ✅ Migración OpenSource | ✅ Completado | Eliminación de backend, licencias y monetización de la app Electron |
| ✅ Rebranding | ✅ Completado | Cambio de nombre y eliminación de referencias de marca |
| ✅ Documentación | ✅ Completado | README, CONTRIBUTING, guías de compilación |
| ✅ Limpieza de código | ✅ Completado | Eliminar LicenseService, AuthContext, validaciones de plan |
| ❌ Testeo con cuentas reales | 🔄 En progreso | Usando Computer-use |
| ❌ Subir a GitHub releases | ⏳ Pendiente | |

### SQLite Motor RAM — tabla settings

```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Keys usadas:
-- language          → 'es' | 'en' | 'pt'
-- theme             → 'dark' | 'light' | 'roblox-classic' | 'custom'
-- fontSize          → 'small' | 'medium' | 'large'
-- uiDensity         → 'compact' | 'normal' | 'spacious'
-- animationsEnabled → 'true' | 'false'
-- primaryColor      → '#DE350D' (personalizable por usuario)
-- accentColor       → '#6347FF' (personalizable por usuario)
```

---

## Features del Motor RAM — App Electron

### Core MVP v1.0 (ya implementado)

- ✅ Agregar cuentas por cookie .ROBLOSECURITY
- ✅ Verificación de cookie contra auth.roblox.com
- ✅ Cifrado AES-256-GCM local derivado del hardware
- ✅ Lista de cuentas con grupos
- ✅ Modal de lanzamiento con PlaceId y JobId
- ✅ Multi-Roblox (múltiples instancias simultáneas)
- ✅ Import/Export JSON
- ✅ API REST local en puerto 8080

### Fase 3 — Account Control Panel ✅ Sprint E2 completado

Control completo de la cuenta Roblox desde la app, sin abrir el navegador:

**Perfil:**
- ✅ Ver y cambiar display name
- ✅ Ver y editar descripción de perfil
- ✅ Ver avatar actual con thumbnail

**Seguridad y acceso:**
- ✅ Cambiar contraseña (requiere contraseña actual)
- ✅ Ver sesiones activas (dispositivos conectados)
- ✅ Cerrar sesión en dispositivos específicos o en todos
- ❌ Ver historial de accesos recientes
- ✅ Toggle verificación en dos pasos (2FA)

**Privacidad:**
- ✅ Quién puede enviarme mensajes (nadie/amigos/todos)
- ✅ Quién puede seguirme
- ✅ Quién puede chatear conmigo en juegos
- ✅ Privacidad del inventario (público/privado)
- ✅ Privacidad de grupos
- ❌ Privacidad de juegos recientes

**Amigos y contactos:**
- ✅ Ver lista de amigos con estado online
- ✅ Aceptar/rechazar solicitudes de amistad
- ❌ Enviar solicitudes de amistad
- ✅ Bloquear / desbloquear usuarios por username o userId
- ✅ Ver lista de bloqueados
- ❌ Seguir / dejar de seguir usuarios

**Notificaciones:**
- ✅ Toggle notificaciones de solicitudes de amistad
- ✅ Toggle notificaciones de mensajes

### Fase 4 — Server Browser ✅ Sprint E3 completado

- ✅ IPC channels: roblox:games:search, roblox:servers:list, roblox:servers:join
- ✅ Integración con games.roblox.com
- ✅ UI: buscar juego por PlaceId o nombre
- ✅ UI: lista de servers con player count, JobId, región estimada
- ✅ UI: filtros (por región, por menos jugadores)
- ✅ Auto-join least populated
- ✅ Multi-account server split
- ❌ VIP Server support: pegar link completo para extraer JobId
- ❌ Unirse a server específico por JobId directamente desde URL

### Fase 5 — Presence Dashboard ✅ Sprint E4 completado

- ✅ Integración con presence.roblox.com (polling cada 30s)
- ✅ UI: grid de cuentas con estado en tiempo real
- ✅ UI: thumbnail del juego actual
- ✅ UI: tiempo en sesión
- ✅ Robux balance por cuenta
- ✅ Historial de juegos recientes
- ❌ Ver inventario de items limitados con valor estimado
- ❌ Mapa visual de actividad de todas las cuentas

### Fase 6 — i18n ✅ COMPLETADO

- ✅ i18next + react-i18next instalado
- ✅ Archivos de traducción: es.json, en.json, pt.json
- ✅ Selector de idioma con banderas en Header
- ✅ Detección automática del idioma del SO
- ✅ Persistencia de idioma en SQLite settings

### Fase 7 — Temas personalizables ✅ COMPLETADO

- ✅ Sistema de temas con CSS variables
- ✅ ThemeService en main process
- ✅ IPC channel: settings:theme:get/set
- ✅ 4 temas: Dark, Light, Roblox Classic, Custom (todos disponibles)
- ✅ Persistencia del tema en SQLite settings
- ✅ Aplicación dinámica en renderer sin recargar

### Fase 8 — Settings Panel completo ✅ 2026-06-19

- [x] Sección "Apariencia": selector tema, tamaño fuente, densidad UI, toggle animaciones
- [x] Sección "Idioma": dropdown con banderas ES/EN/PT
- [x] Sección "Cuenta": gestionar cuenta local
- [x] Sección "Seguridad": cambiar contraseña (delega a Account Control Panel)
- [x] Sección "Avanzado": limpiar caché, exportar datos, borrar cuenta local
- [x] Bug fix: `require('electron')` en renderer reemplazado por IPC `shell:open-external`
- [x] Bug fix: Props `accounts` y `onSelectAccount` ya se declaran correctamente

### Fase 9 — Por definir

Mejoras, optimizaciones, nuevas features.

---

## APIs de Roblox utilizadas

```
accountsettings.roblox.com    → privacidad, notificaciones
accountinformation.roblox.com → perfil, información de cuenta
auth.roblox.com               → verificar cookie, auth ticket, logout remoto
users.roblox.com              → info de usuarios, buscar por username
friends.roblox.com            → amigos, followers, solicitudes
presence.roblox.com           → estado online en tiempo real
games.roblox.com              → info de juegos, servers, player count
inventory.roblox.com          → inventario de items
economy.roblox.com            → Robux balance, transacciones
thumbnails.roblox.com         → avatares, thumbnails de juegos
```

---

## Plan de desarrollo — Motor RAM (App Electron)

### Sprint E1 — Seguridad IPC ✅ completado

- ✅ Auditar preload.ts — contextIsolation y sandbox activos
- ✅ Whitelist de canales IPC en preload
- ✅ Namespacing de canales: account:*, roblox:*, settings:*, theme:*, i18n:*, advanced:*
- ✅ Validación de tipos en todos los ipcMain.handle()
- ✅ CSP en BrowserWindow
- ✅ shell.openExternal() solo acepta URLs roblox-player://

### Sprint E2 — Account Control Panel ✅ completado

- ✅ IPC channels: settings:privacy:get/set, settings:security:sessions, settings:security:password
- ✅ Integración con accountsettings.roblox.com y accountinformation.roblox.com
- ✅ UI Panel de Perfil: display name, descripción
- ✅ UI Panel de Seguridad: cambiar contraseña, ver sesiones, cerrar sesiones, 2FA toggle
- ✅ UI Panel de Privacidad: mensajes, chat, inventario, grupos
- ✅ UI Panel de Amigos: lista, solicitudes, bloquear/desbloquear
- ✅ UI Panel de Notificaciones: toggles

### Sprint E3 — Server Browser ✅ completado

- ✅ IPC channels: roblox:games:search, roblox:servers:list, roblox:servers:join
- ✅ Integración con games.roblox.com
- ✅ UI: buscar juego por PlaceId o nombre
- ✅ UI: lista de servers con player count, JobId, región estimada
- ✅ UI: filtros (por región, por menos jugadores)
- ✅ Auto-join least populated
- ✅ Multi-account server split

### Sprint E4 — Presence Dashboard ✅ completado

- ✅ Integración con presence.roblox.com (polling cada 30s)
- ✅ UI: grid de cuentas con estado en tiempo real
- ✅ UI: thumbnail del juego actual
- ✅ UI: tiempo en sesión
- ✅ Robux balance por cuenta
- ✅ Historial de juegos recientes

### Sprint E5 — Auto Cookie Refresh ✅ completado

- ✅ Auto Cookie Refresh: renovar cookie 24h antes de expirar
- ✅ Retry con notificaciones

### Sprint E6 — i18n ✅ COMPLETADO

- [x] Crear src/renderer/locales/es.json, en.json, pt.json con todas las traducciones ✅
- [x] Envolver toda la UI en i18next provider ✅
- [x] Reemplazar strings hardcodeadas en App.tsx y componentes por t('key') ✅
- [x] Selector de idioma con banderas en Header
- [x] IPC channel: settings:language:get/set
- [x] Persistir idioma en SQLite tabla settings
- [x] Detectar idioma del SO al primer arranque con i18next-browser-languagedetector

### Sprint E7 — Temas personalizables ✅ COMPLETADO

- ✅ Instalar y configurar sistema de temas con CSS variables
- ✅ Implementar ThemeService en main process
- ✅ IPC channel: settings:theme:get/set
- ✅ 4 temas: Dark, Light, Roblox Classic, Custom
- ✅ Persistir tema en SQLite tabla settings
- ✅ Aplicar tema dinámicamente en renderer sin recargar

### Sprint E8 — Settings Panel completo ✅ COMPLETADO

- ✅ Sección "Apariencia": selector tema, tamaño fuente, densidad UI, toggle animaciones
- ✅ Sección "Idioma": dropdown con banderas ES/EN/PT
- ✅ Sección "Cuenta": gestionar cuenta local
- ✅ Sección "Seguridad": cambiar contraseña (delega a Account Control Panel)
- ✅ Sección "Avanzado": limpiar caché, exportar datos, borrar cuenta local

> **Sprints del Backend y Landing:** Ver `../NexoAccManager-Backend/PROJECT.md` y
> `../NexoAccManager-Landing/PROJECT.md` respectivamente.

---

## Estado actual REAL — Julio 2026

### Motor RAM (App Electron — este repositorio)

- ✅ Backend Electron completo
- ✅ Preload corregido + IPC seguro (Sprint E1)
- ✅ Dependencias corregidas
- ✅ Renderer React UI con modal de lanzamiento
- ✅ launchRoblox() con protocolo roblox-player
- ✅ Import/Export JSON
- ✅ Multi-Roblox
- ✅ API REST local (8080)
- ✅ Build funcional
- ✅ Sprint E1 — Seguridad IPC
- ✅ Sprint E2 — Account Control Panel
- ✅ Sprint E3 — Server Browser
- ✅ Sprint E4 — Presence Dashboard
- ✅ Sprint E5 — Auto Cookie Refresh
- ✅ Sprint E6 — i18n
- ✅ Sprint E7 — Temas personalizables
- ✅ Sprint E8 — Settings Panel completo
- ✅ Migración OpenSource — Eliminado SaaS backend y licencias de la app
- ✅ Licencia MIT — Establecida con disclaimers legales
- ✅ Limpieza de código — AuthService, LicenseService, WebServer eliminados
- ✅ Locales limpios — claves auth/license/plan eliminadas (es/en/pt)
- ✅ tsc compila limpio — 0 errores
- ✅ Build exitoso — AppImage + .snap generados
- ✅ README.md — Guía de instalación completa
- ❌ Testeo con cuentas reales usando Computer-use — EN PROGRESO
- ❌ Subir a GitHub releases — Pendiente

### Backend API (NexoAccManager-Backend — repositorio independiente)

- Ver `../NexoAccManager-Backend/PROJECT.md` para estado completo

### Landing Page (NexoAccManager-Landing — repositorio independiente)

- Ver `../NexoAccManager-Landing/PROJECT.md` para estado completo

---

## Commits Motor RAM realizados

- 9a1138b — Estructura inicial: backend Electron + crypto + DB + API REST
- 1695243 — fix: importar ipcRenderer y contextBridge desde electron en preload
- 7d2ae79 — deps: agregar better-sqlite3 y @fastify/cors, eliminar sqlite3 obsoleto
- b95b247 — feat: crear renderer React con estructura base y componentes UI
- ac4c3b8 — fix: usar @fastify/cors en lugar de fastify-cors (deprecado)
- 68e5702 — feat: implementar launchRoblox con protocolo roblox-player
- 260dbe7 — feat: UI completa con modal de lanzamiento e IPC completa
- [Sprints E1-E8 — ejecutar git log --oneline para ver commits completos]

---

## Instrucciones para el agente — LEER ANTES DE TOCAR CUALQUIER ARCHIVO

1. Lee este PROJECT.md completo antes de empezar cualquier tarea
2. Ejecuta `git log --oneline -10` para ver el estado real de commits
3. Ejecuta `git status` para ver cambios pendientes
4. Verifica el estado real antes de asumir qué está hecho o no
5. Una tarea a la vez — commit atómico en español después de cada una
6. Actualiza este PROJECT.md marcando ✅ al completar cada item
7. Push a origin main después de cada commit
8. Para y reporta después de cada tarea esperando confirmación
9. Si hay errores de TypeScript — corrígelos antes de continuar
10. NUNCA commitear con errores de tsc sin resolver
11. Responde siempre en español

---

## Decisiones técnicas globales — Motor RAM (Electron) — NO cambiar sin aprobación

- Cookies Roblox NUNCA salen del PC del usuario — principio irrenunciable
- contextIsolation: true + nodeIntegration: false + sandbox: true — nunca deshabilitar
- Modo 100% local — sin backend, sin servidor, sin nube
- Roblox API calls con cache LRU de 60s para respetar rate limits
- i18n: español como idioma por defecto en toda la plataforma
- Temas: Dark como tema por defecto
- Todos los temas disponibles para todos los usuarios — sin restricciones
- NUNCA usar dangerouslySetInnerHTML con datos externos en React
- Límite de cuentas: máximo 50 por usuario (hardcoded, sin restricciones de plan)

> **Decisiones técnicas del Backend y Landing:** Ver sus respectivos PROJECT.md.

---

## Despliegue

### Motor RAM (App Electron — este repositorio)

- **Distribución:** GitHub Releases
- **Build:** `electron-builder` genera AppImage + .snap (Linux), instaladores Windows
- **100% local:** No requiere servidor, no requiere deploy en la nube
- **Auto-update:** Configurado via `app-update.yml` en GitHub Releases

### Backend API y Landing Page (repositorios independientes)

- Ver `../NexoAccManager-Backend/PROJECT.md` y `../NexoAccManager-Landing/PROJECT.md`
  para información de despliegue de los repositorios SaaS hermanos.

---

## Estructura de archivos clave

```
src/
  main/
    main.ts                    → proceso principal Electron
    core/
      AccountManager.ts        → gestión de cuentas + cifrado
      CryptoService.ts         → cifrado AES-256-GCM
      ThemeService.ts          → sistema de temas CSS
      AccountSettingsService.ts → settings de cuenta Roblox
      MultiRobloxService.ts    → múltiples instancias
    ipc/                       → handlers IPC por namespace (en main.ts)
    services/
      CookieExpiryService.ts   → auto-refresh de cookies
      GamesService.ts          → búsqueda de juegos y servers
      PresenceService.ts       → estado online en tiempo real
    storage/
      DatabaseManager.ts       → SQLite local
  renderer/
    App.tsx                    → raíz del renderer
    context/
      ThemeContext.tsx         → React context para temas
    components/
      AccountList.tsx
      AddAccountForm.tsx
      Header.tsx
      SettingsPanel.tsx
      AccountControlPanel/     → perfil, seguridad, privacidad, amigos, notificaciones
      PresenceDashboard/       → grid de estado en tiempo real
      ServerBrowser/           → búsqueda y lista de servers
    locales/                   → es.json, en.json, pt.json
    themeDefinitions.ts
    index.css
    main.tsx
  preload/
    preload.ts                 → contextBridge — whitelist de canales
  types/
    Account.ts
```

---

*Actualizado: 2026-07-12 — Limpieza de contenido SaaS stale, expansión de sub-projects.*
