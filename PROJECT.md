# NexoAccManager — Ecosistema SaaS

## Descripción
Gestor de cuentas Roblox con modelo SaaS freemium. Clon moderno, seguro y con valor
añadido sustancial sobre Roblox Account Manager (RAM) de ic3w0lf22.
Las cuentas se guardan cifradas localmente. El backend solo gestiona licencias y pagos.
Las cookies de Roblox NUNCA salen del dispositivo del usuario.

## Repositorios
## Repositorios
- Motor RAM (App Electron): https://github.com/Nxxo31/NexoAccManager ✅ activo
- Backend API: https://github.com/Nxxo31/NexoAccManager-Backend ❌ pendiente crear
- Landing Page: https://github.com/Nxxo31/NexoAccManager-Landing ✅ activo — Sprint L1 en progreso

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
| **Modelo de negocio** | Gratis, sin soporte | SaaS freemium con Stripe |
| **Autenticación de usuario** | ❌ Sin login | ✅ Email + password + JWT RS256 |
| **Backend** | ❌ Solo local | ✅ API en Railway + PostgreSQL |
| **Dashboard web** | ❌ No existe | ✅ Control completo desde browser/móvil |
| **Account Control Panel** | ❌ Básico | ✅ Completo — privacidad, bloqueos, sesiones, contraseña |
| **Server Browser** | ✅ Lista básica | ✅ Con región, ping, filtro por menos jugadores |
| **Smart Server Selection** | ❌ Manual | ✅ Auto-join least populated + multi-account split |
| **Presence Dashboard** | ❌ No existe | ✅ Estado en tiempo real de todas las cuentas |
| **Cifrado** | Básico | AES-256-GCM derivado del hardware |
| **IPC Security** | N/A (.NET) | contextBridge + contextIsolation + sandbox |
| **Rate limiting** | ❌ No | ✅ En Backend y llamadas a Roblox API |
| **Auto Cookie Refresh** | ✅ Básico | ✅ Avanzado con retry y notificaciones |
| **Player Finder** | ✅ Básico | ✅ Con región y distribución multi-cuenta |
| **Soporte activo** | ❌ Abandonado | ✅ Incentivo financiero por SaaS |
| **Descarga** | GitHub releases | Landing page con checkout y onboarding |
| **Inventario desde app** | ❌ No | ✅ Ver items, Robux balance desde dashboard |
| **Idiomas** | ❌ Solo inglés | ✅ ES, EN, PT con i18n completo |
| **Temas personalizables** | ❌ No | ✅ Dark, Light, Roblox Classic, Custom |

---

## Modelo de negocio freemium

| Plan | Cuentas | Precio/mes | Features incluidas |
|---|---|---|---|
| Free | 5 | $0 | Core features + Server Browser |
| Starter | 10 | $5 | + Auto Cookie Refresh + Presence Dashboard |
| Pro | 20 | $10 | + Smart Server Selection + Player Finder |
| Business | 30 | $20 | + Account Control Panel completo + Dashboard Web |
| Enterprise | ∞ | $50 | Todo + soporte prioritario + temas custom |

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
- **Custom** — usuario define colores primario y acento (solo Enterprise)

### Estilo visual
- Dark theme exclusivo por defecto
- Glassmorphism en cards: `backdrop-filter: blur(12px)`, bordes translúcidos
- Gradientes de fondo con rojo Roblox sutil
- Tipografía: Inter (UI) + JetBrains Mono (datos técnicos)
- Border radius: 8px cards, 4px inputs
- Animaciones: 200ms ease-in-out
- Iconografía: Lucide Icons
- Inspiración: Linear.app + Vercel Dashboard + Stripe Dashboard

---

## Internacionalización (i18n)

### Idiomas soportados
- 🇪🇸 Español (es) — idioma por defecto
- 🇺🇸 English (en)
- 🇧🇷 Português (pt)

### Implementación Motor RAM (Electron)
- Librería: `i18next` + `react-i18next`
- Archivos: `src/renderer/locales/es.json`, `en.json`, `pt.json`
- Selector: dropdown con banderas en Header y en pantalla de Login
- Persistencia: guardado en SQLite tabla `settings` con key `language`
- Detección automática: usa el idioma del sistema operativo al primer arranque
- IPC channel: `settings:language:get/set`

### Implementación Landing Page (Next.js)
- Librería: `next-intl`
- Rutas localizadas: `/es/`, `/en/`, `/pt/`
- Selector: dropdown con banderas en Header
- Detección: `Accept-Language` header del browser
- SEO: `hreflang` tags por idioma en `<head>`

---

## Personalización y Temas

### Motor RAM — Settings Panel de Apariencia
- **Selector de tema**: Dark / Light / Roblox Classic / Custom (Enterprise)
- **Color primario custom**: color picker (solo Enterprise)
- **Color acento custom**: color picker (solo Enterprise)
- **Tamaño de fuente**: Small / Medium (default) / Large
- **Densidad de UI**: Compacta / Normal / Espaciosa
- **Animaciones**: On / Off (para PCs con recursos limitados)
- **Idioma**: dropdown con banderas ES / EN / PT

Persistencia: SQLite tabla `settings`.
Aplicación: CSS variables en `:root` actualizadas dinámicamente via IPC `theme:set`.

---

## Arquitectura del ecosistema

```
Usuario
  │
  ▼
NexoAccManager-Landing (Vercel)
  ├── Hero + Features + Pricing
  ├── Login / Registro / Verificación email
  ├── Dashboard de usuario (plan, uso, descarga)
  ├── Selector de idioma (next-intl)
  └── Stripe Checkout
          │
          ▼
NexoAccManager-Backend (Railway)
  ├── Auth: register, login, JWT RS256, refresh tokens
  ├── License: verify, plans, accountLimit
  ├── Stripe: checkout sessions, webhooks
  ├── Rate limiting + Helmet + CORS
  └── PostgreSQL + Prisma
          │
          ▼
Motor RAM — App Electron (local en PC del usuario)
  ├── Login con JWT del Backend
  ├── GET /license/verify → plan + accountLimit
  ├── SQLite AES-256-GCM → cuentas Roblox (NUNCA salen del PC)
  ├── i18n con i18next (ES/EN/PT)
  ├── Temas personalizables con CSS variables
  └── Roblox API calls con cookie local
```

---

## Patrones de arquitectura y diseño

### Motor RAM — Electron
- **Patrón principal**: Two-process model (Main + Renderer) con IPC tipado
- **IPC**: invoke/handle (Promise-based) — nunca send/on para request-response
- **Seguridad IPC**: contextBridge con whitelist explícita de canales, validación en ambos lados
- **Namespacing IPC**: `account:*`, `roblox:*`, `settings:*`, `license:*`, `i18n:*`, `theme:*`
- **Estado**: Zustand en renderer — nunca estado en main process
- **Servicios**: Repository pattern para SQLite, Service layer para Roblox API
- **Cache**: LRU cache en main process para responses de Roblox API (TTL 60s)
- **Error handling**: Result pattern (success/error) en IPC — nunca throw sin catch
- **i18n**: i18next inicializado en renderer, idioma guardado via `settings:language:set`
- **Temas**: CSS variables en `:root` actualizadas via IPC `theme:set`

### Backend API
- **Patrón**: Layered Architecture — Routes → Controllers → Services → Repositories
- **Auth**: JWT RS256 asimétrico — access token 15min + refresh token 30 días con rotación
- **Passwords**: bcrypt salt rounds 12
- **Validación**: zod en cada endpoint — nunca confiar en datos del cliente
- **Stripe**: webhook signature verification — nunca procesar sin verificar
- **Errores**: HTTP errors semánticos con body estructurado `{ code, message, details }`

### Landing Page
- **Patrón**: Next.js App Router con Server Components donde sea posible
- **i18n**: next-intl con rutas localizadas `/[locale]/`
- **Auth state**: React Context + httpOnly cookies para JWT
- **Forms**: React Hook Form + zod validation
- **Pagos**: Stripe Checkout hosted — cero manejo de datos de tarjeta

---

## Seguridad — Implementación completa

### Motor RAM — Electron
```
BrowserWindow config obligatoria:
  contextIsolation: true    ✅ aísla preload del renderer
  nodeIntegration: false    ✅ sin Node.js en renderer
  sandbox: true             ✅ Chromium sandbox activo
  webSecurity: true         ✅ same-origin policy
  enableRemoteModule: false ✅ remote module deshabilitado

CSP en BrowserWindow:
  default-src 'self'
  script-src 'self'
  connect-src 'self' https://*.roblox.com https://api.tu-backend.com

IPC Security:
  - contextBridge expone SOLO funciones específicas, nunca ipcRenderer raw
  - Whitelist de canales en preload
  - Validación de tipos en main process handlers (defense in depth)
  - Nunca shell.openExternal() sin validar la URL primero

Almacenamiento:
  - JWT en electron-store con encryptionKey derivado del hardware
  - Cookies Roblox en SQLite con AES-256-GCM
  - Nunca localStorage para datos sensibles
  - Preferencias de tema e idioma en SQLite (no sensibles, sin cifrado)
```

### Backend API
```
Auth:
  - JWT RS256 (asimétrico) — nunca HS256
  - Access token: 15 minutos
  - Refresh token: 30 días, rotación en cada uso, invalidación en logout
  - bcrypt salt rounds: 12

Rate limiting (@fastify/rate-limit):
  - POST /auth/login     → 5 intentos / IP / 15 minutos
  - POST /auth/register  → 3 intentos / IP / hora
  - Global              → 100 req / IP / minuto

Headers (Helmet):
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
  - Content-Security-Policy configurado

Database:
  - Prisma con queries parametrizadas — nunca string concatenation
  - Nunca exponer stack traces en producción

Stripe:
  - Verificar firma en cada webhook con stripe.webhooks.constructEvent()
  - Nunca actualizar plan sin verificar evento de Stripe

Secrets:
  - Nunca en código — solo variables de entorno
  - Nunca loguear passwords, tokens, cookies o datos de tarjeta
```

### Landing Page
```
- HTTPS only — redirect automático de HTTP
- httpOnly + SameSite=Strict + Secure en cookies de sesión
- CSRF tokens en formularios
- Input validation con zod en cliente Y servidor
- Stripe Checkout hosted — cero contacto con datos de tarjeta
- Next.js escapa HTML por defecto — nunca dangerouslySetInnerHTML con datos externos
- next-intl no expone datos sensibles por idioma
```

---

## Schema de base de datos — Backend (Prisma)

```prisma
model User {
  id               String         @id @default(cuid())
  email            String         @unique
  passwordHash     String
  emailVerified    Boolean        @default(false)
  emailVerifyToken String?
  language         String         @default("es")
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  license          License?
  refreshTokens    RefreshToken[]
}

model License {
  id                   String        @id @default(cuid())
  userId               String        @unique
  plan                 Plan          @default(FREE)
  accountLimit         Int           @default(5)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  status               LicenseStatus @default(ACTIVE)
  currentPeriodEnd     DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  user                 User          @relation(fields: [userId], references: [id])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  used      Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id])
}

enum Plan {
  FREE
  STARTER
  PRO
  BUSINESS
  ENTERPRISE
}

enum LicenseStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  TRIALING
}
```

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
-- primaryColor      → '#DE350D' (solo Enterprise)
-- accentColor       → '#6347FF' (solo Enterprise)
-- licenseStatus     → último estado conocido (modo offline)
-- lastPlanKnown     → último plan conocido (modo offline)
-- accountLimit      → último límite conocido (modo offline)
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

### Fase 2 — Integración SaaS ✅ Sprint E5 completado
- ✅ Pantalla de login/registro con design system
- ✅ JWT en electron-store cifrado
- ✅ Validación de licencia al arrancar (GET /license/verify)
- ✅ Bloqueo por accountLimit con UI clara y CTA de upgrade
- ✅ Botón "Mejorar plan" → abre Landing en browser
- ✅ Modo offline con último plan conocido localmente
- ✅ Indicador de estado de licencia (online/offline/expirada)
- ✅ Auto Cookie Refresh: renovar cookie 24h antes de expirar

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
- ✅ Selector de idioma con banderas en Header y Login
- ✅ Detección automática del idioma del SO
- ✅ Persistencia de idioma en SQLite settings

### Fase 7 — Temas personalizables ✅ COMPLETADO
- ✅ Sistema de temas con CSS variables
- ✅ ThemeService en main process
- ✅ IPC channel: settings:theme:get/set
- ✅ 3 temas built-in: Dark, Light, Roblox Classic
- ✅ Persistencia del tema en SQLite settings
- ✅ Aplicación dinámica en renderer sin recargar

### Fase 8 — Settings Panel completo ✅ 2026-06-17
- [ ] Sección "Apariencia": selector tema, tamaño fuente, densidad UI, toggle animaciones
- [ ] Sección "Idioma": dropdown con banderas ES/EN/PT
- [ ] Sección "Cuenta": email, plan actual, botón logout, botón upgrade
- [ ] Sección "Seguridad": cambiar contraseña (delega a Account Control Panel)
- [ ] Sección "Avanzado": limpiar caché, exportar datos, borrar cuenta local

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

## Landing Page — Secciones

### Páginas públicas
1. **Hero** — "El gestor de cuentas Roblox que los pros usan" + CTA + mockup
2. **Features** — comparativa visual vs RAM con iconos
3. **Pricing** — tabla 5 planes con toggle mensual
4. **FAQ** — preguntas frecuentes
5. **Footer** — links, copyright, términos + selector de idioma

### Páginas de auth
6. **/[locale]/register** — email + password + confirm + verificación email + selector idioma
7. **/[locale]/login** — email + password + forgot password + selector idioma
8. **/[locale]/verify-email/[token]** — confirmar email
9. **/[locale]/forgot-password** — solicitar reset
10. **/[locale]/reset-password/[token]** — nueva contraseña

### Dashboard de usuario (post-login)
11. **/[locale]/dashboard** — plan actual, uso (X/Y cuentas), próximo pago
12. **/[locale]/dashboard/billing** — historial pagos, cambiar plan, cancelar
13. **/[locale]/dashboard/download** — descargar app con instrucciones de instalación
14. **/[locale]/dashboard/settings** — idioma, tema, notificaciones email
15. **/success** — confirmación de pago exitoso
16. **/cancel** — usuario canceló el checkout

---

## Endpoints Backend API

### Auth
- POST /auth/register → crear User + License FREE + tokens (incluye language preference)
- POST /auth/login → validar credenciales → tokens
- POST /auth/refresh → rotar refresh token → nuevo access token
- POST /auth/logout → invalidar refresh token
- POST /auth/verify-email → verificar token de email
- POST /auth/forgot-password → enviar email de reset
- POST /auth/reset-password → cambiar password con token

### Licencias
- GET /license/verify → JWT → { plan, accountLimit, status, currentPeriodEnd }
- GET /license/plans → lista planes con precios y features

### Stripe
- POST /checkout/create-session → plan → Stripe Checkout Session URL
- POST /webhook/stripe → checkout.session.completed, subscription.updated, subscription.deleted

### Usuario
- GET /user/me → perfil autenticado (incluye language)
- PATCH /user/me → actualizar email o language
- DELETE /user/me → cancelar cuenta y suscripción en Stripe

---

## Plan de desarrollo — Orden de ejecución

### PRIORIDAD 1 — Motor RAM (App Electron)

#### Sprint E1 — Seguridad IPC ✅ completado
- ✅ Auditar preload.ts — contextIsolation y sandbox activos
- ✅ Whitelist de canales IPC en preload
- ✅ Namespacing de canales: account:*, roblox:*, settings:*, license:*
- ✅ Validación de tipos en todos los ipcMain.handle()
- ✅ CSP en BrowserWindow
- ✅ shell.openExternal() solo acepta URLs roblox-player://

#### Sprint E2 — Account Control Panel ✅ completado
- ✅ IPC channels: settings:privacy:get/set, settings:security:sessions, settings:security:password
- ✅ Integración con accountsettings.roblox.com y accountinformation.roblox.com
- ✅ UI Panel de Perfil: display name, descripción
- ✅ UI Panel de Seguridad: cambiar contraseña, ver sesiones, cerrar sesiones, 2FA toggle
- ✅ UI Panel de Privacidad: mensajes, chat, inventario, grupos
- ✅ UI Panel de Amigos: lista, solicitudes, bloquear/desbloquear
- ✅ UI Panel de Notificaciones: toggles

#### Sprint E3 — Server Browser ✅ completado
- ✅ IPC channels: roblox:games:search, roblox:servers:list, roblox:servers:join
- ✅ Integración con games.roblox.com
- ✅ UI: buscar juego por PlaceId o nombre
- ✅ UI: lista de servers con player count, JobId, región estimada
- ✅ UI: filtros (por región, por menos jugadores)
- ✅ Auto-join least populated
- ✅ Multi-account server split

#### Sprint E4 — Presence Dashboard ✅ completado
- ✅ Integración con presence.roblox.com (polling cada 30s)
- ✅ UI: grid de cuentas con estado en tiempo real
- ✅ UI: thumbnail del juego actual
- ✅ UI: tiempo en sesión
- ✅ Robux balance por cuenta
- ✅ Historial de juegos recientes

#### Sprint E5 — Integración SaaS ✅ completado
- ✅ Pantalla de login/registro en la app con design system
- ✅ electron-store cifrado para JWT
- ✅ Validación de licencia al arrancar
- ✅ Bloqueo por accountLimit con UI y CTA de upgrade
- ✅ Modo offline con último plan conocido
- ✅ Auto Cookie Refresh (cookie 24h antes de expirar)

### Sprint E6 — i18n ✅ COMPLETADO
[ x ] Crear src/renderer/locales/es.json, en.json, pt.json con todas las traducciones ✅
[ x ] Envolver toda la UI en i18next provider ✅
[ x ] Reemplazar strings hardcodeadas en App.tsx y componentes por t('key') ✅
[ x ] Selector de idioma con banderas en Header
[ x ] Selector de idioma en pantalla de Login (antes de autenticarse)
[ x ] IPC channel: settings:language:get/set
[ x ] Persistir idioma en SQLite tabla settings
[ x ] Detectar idioma del SO al primer arranque con i18next-browser-languagedetector

#### Sprint E7 — Temas personalizables ❌ pendiente
- [ ] Instalar y configurar sistema de temas con CSS variables
- [ ] Implementar ThemeService en main process
- [ ] IPC channel: settings:theme:get/set
- [ ] 3 temas built-in: Dark, Light, Roblox Classic
- [ ] Custom theme con color picker para primario y acento (Enterprise)
- [ ] Persistir tema en SQLite tabla settings
- [ ] Aplicar tema dinámicamente en renderer sin recargar

#### Sprint E8 — Settings Panel completo ❌ pendiente
- [ ] Sección "Apariencia": selector tema, tamaño fuente, densidad UI, toggle animaciones
- [ ] Sección "Idioma": dropdown con banderas ES/EN/PT
- [ ] Sección "Cuenta": email, plan actual, botón logout, botón upgrade
- [ ] Sección "Seguridad": cambiar contraseña (delega a Account Control Panel)
- [ ] Sección "Avanzado": limpiar caché, exportar datos, borrar cuenta local

---

### PRIORIDAD 2 — Landing Page

#### Sprint L1 — Setup ❌ en progreso
- [ ] Limpiar node_modules del git history: git rm -r --cached node_modules .next
- [ ] Verificar .gitignore tiene node_modules/ y .next/
- [ ] Push inicial limpio a GitHub: Nxxo31/NexoAccManager-Landing
- [ ] Instalar next-intl para i18n
- [ ] Instalar Framer Motion para animaciones
- [ ] Instalar Shadcn UI
- [ ] Design system completo en globals.css con CSS variables del PROJECT.md
- [ ] Estructura de carpetas: src/app/[locale]/ para rutas localizadas
- [ ] Configurar next-intl con middleware para detección de idioma

#### Sprint L2 — Páginas públicas ❌ pendiente
- [ ] Header: logo, nav, selector idioma con banderas, CTA "Empezar gratis"
- [ ] Hero section: headline, subheadline, CTAs, gradiente animado con rojo Roblox
- [ ] Features section: 6 cards glassmorphism + comparativa vs RAM
- [ ] Pricing section: 5 planes con toggle mensual
- [ ] FAQ section: 8 preguntas frecuentes
- [ ] Footer: links, copyright, selector de idioma

#### Sprint L3 — Auth ❌ pendiente
- [ ] /[locale]/register con React Hook Form + zod
- [ ] /[locale]/login con forgot password
- [ ] /[locale]/verify-email/[token]
- [ ] /[locale]/reset-password/[token]
- [ ] httpOnly cookies para JWT
- [ ] Middleware de auth en Next.js
- [ ] Selector de idioma visible en todas las páginas de auth

#### Sprint L4 — Dashboard de usuario ❌ pendiente
- [ ] /[locale]/dashboard — plan, uso X/Y cuentas, próximo pago
- [ ] /[locale]/dashboard/billing — historial, cambiar plan, cancelar
- [ ] /[locale]/dashboard/download — descarga con instrucciones por SO (Windows/Mac/Linux)
- [ ] /[locale]/dashboard/settings — idioma, tema, notificaciones email

#### Sprint L5 — Stripe + i18n + Deploy ❌ pendiente
- [ ] POST /checkout/create-session integrado
- [ ] Páginas /success y /cancel
- [ ] Traducir todas las páginas a ES, EN, PT
- [ ] Deploy Vercel con variables de entorno
- [ ] Configurar dominio custom si aplica

---

### PRIORIDAD 3 — Backend API

#### Sprint B1 — Setup ❌ pendiente
- [ ] Crear repo NexoAccManager-Backend en GitHub
- [ ] Fastify + TypeScript + Prisma + PostgreSQL local
- [ ] Schema Prisma (User + License + RefreshToken) con campo language en User
- [ ] Primera migración
- [ ] Variables de entorno: DATABASE_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

#### Sprint B2 — Auth ❌ pendiente
- [ ] POST /auth/register con bcrypt + License FREE automática + email verification + language
- [ ] POST /auth/login con JWT RS256
- [ ] POST /auth/refresh con rotación de refresh token
- [ ] POST /auth/logout con invalidación de token
- [ ] POST /auth/verify-email
- [ ] POST /auth/forgot-password + /auth/reset-password
- [ ] Middleware JWT para rutas protegidas

#### Sprint B3 — Licencias + Rate limiting ❌ pendiente
- [ ] GET /license/verify
- [ ] GET /license/plans
- [ ] @fastify/rate-limit en endpoints de auth
- [ ] @fastify/helmet para headers de seguridad
- [ ] CORS configurado solo para orígenes permitidos

#### Sprint B4 — Stripe ❌ pendiente
- [ ] Crear productos y precios en Stripe Dashboard
- [ ] POST /checkout/create-session
- [ ] POST /webhook/stripe con verificación de firma
- [ ] Manejar: checkout.session.completed, subscription.updated, subscription.deleted
- [ ] Actualizar License en DB según eventos

#### Sprint B5 — Deploy ❌ pendiente
- [ ] Crear proyecto Railway
- [ ] PostgreSQL en Railway
- [ ] Variables de entorno en Railway
- [ ] Deploy y verificar endpoints
- [ ] Configurar webhook URL en Stripe Dashboard
- [ ] Generar par de claves RS256 para JWT

---

## Estado actual REAL — junio 2026

### Motor RAM (App Electron)
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
- ✅ Sprint E5 — Integración SaaS
 - ✅ Sprint E6 — i18n — completado
 - ✅ Sprint E7 — Temas personalizables — completado
- ❌ Sprint E8 — Settings Panel completo

### Landing Page (NexoAccManager-Landing)
- ✅ Repo creado en GitHub — https://github.com/Nxxo31/NexoAccManager-Landing
- ✅ Next.js 14 + TypeScript + Tailwind setup
- ✅ layout.tsx creado
- ✅ Hero section con gradient, CTAs y animaciones
- ✅ Features section con comparativa vs RAM
- ❌ Sprint L1 — Setup completo (node_modules en git, push limpio pendiente)

### Backend API (NexoAccManager-Backend)
- ❌ Todo pendiente — Prioridad 3

---

## Commits Motor RAM realizados
- 9a1138b — Estructura inicial: backend Electron + crypto + DB + API REST
- 1695243 — fix: importar ipcRenderer y contextBridge desde electron en preload
- 7d2ae79 — deps: agregar better-sqlite3 y @fastify/cors, eliminar sqlite3 obsoleto
- b95b247 — feat: crear renderer React con estructura base y componentes UI
- ac4c3b8 — fix: usar @fastify/cors en lugar de fastify-cors (deprecado)
- 68e5702 — feat: implementar launchRoblox con protocolo roblox-player
- 260dbe7 — feat: UI completa con modal de lanzamiento e IPC completa
- [Sprints E1-E5 — ejecutar git log --oneline para ver commits completos]

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

## Decisiones técnicas globales — NO cambiar sin aprobación de Sebastián

- Cookies Roblox NUNCA salen del PC del usuario — principio irrenunciable
- JWT con RS256 asimétrico — nunca HS256
- Access token 15 minutos + Refresh token 30 días con rotación en cada uso
- bcrypt salt rounds 12 para passwords
- Stripe Checkout hosted — nunca procesar tarjetas en nuestros servidores
- Plan Free se asigna automáticamente al registrarse sin tarjeta
- Precios definidos en Stripe — nunca hardcodeados en frontend
- Rate limiting en todos los endpoints de auth
- contextIsolation: true + nodeIntegration: false + sandbox: true en Electron — nunca deshabilitar
- Modo offline usa el último plan conocido localmente — nunca bloquear sin conexión
- Roblox API calls con cache LRU de 60s para respetar rate limits
- i18n: español como idioma por defecto en toda la plataforma
- Temas: Dark como tema por defecto
- Custom themes solo disponibles para plan Enterprise
- NUNCA usar dangerouslySetInnerHTML con datos externos en React/Next.js