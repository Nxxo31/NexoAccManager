# NexoAccManager — Ecosistema SaaS

## Descripción
Gestor de cuentas Roblox con modelo SaaS freemium. Clon moderno, seguro y con valor
añadido sustancial sobre Roblox Account Manager (RAM) de ic3w0lf22.
Las cuentas se guardan cifradas localmente. El backend solo gestiona licencias y pagos.
Las cookies de Roblox NUNCA salen del dispositivo del usuario.

## Repositorios
- Motor RAM (App Electron): https://github.com/Nxxo31/NexoAccManager
- Backend API: https://github.com/Nxxo31/NexoAccManager-Backend (crear)
- Landing Page: https://github.com/Nxxo31/NexoAccManager-Landing (crear)

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

---

## Modelo de negocio freemium

| Plan | Cuentas | Precio/mes | Features incluidas |
|---|---|---|---|
| Free | 5 | $0 | Core features + Server Browser |
| Starter | 10 | $5 | + Auto Cookie Refresh + Presence Dashboard |
| Pro | 20 | $10 | + Smart Server Selection + Player Finder |
| Business | 30 | $20 | + Account Control Panel completo + Dashboard Web |
| Enterprise | ∞ | $50 | Todo + soporte prioritario |

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

### Estilo visual
- Dark theme exclusivo
- Glassmorphism en cards: `backdrop-filter: blur(12px)`, bordes translúcidos
- Gradientes de fondo con rojo Roblox sutil
- Tipografía: Inter (UI) + JetBrains Mono (datos técnicos)
- Border radius: 8px cards, 4px inputs
- Animaciones: 200ms ease-in-out
- Iconografía: Lucide Icons
- Inspiración: Linear.app + Vercel Dashboard + Stripe Dashboard

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
  ├── Roblox API calls con cookie local
  └── Dashboard Web local en puerto 8081
```

---

## Patrones de arquitectura y diseño

### Motor RAM — Electron
- **Patrón principal**: Two-process model (Main + Renderer) con IPC tipado
- **IPC**: invoke/handle (Promise-based) — nunca send/on para request-response
- **Seguridad IPC**: contextBridge con whitelist explícita de canales, validación en ambos lados
- **Namespacing IPC**: `account:add`, `account:launch`, `roblox:servers`, `settings:privacy`
- **Estado**: Zustand en renderer — nunca estado en main process
- **Servicios**: Repository pattern para SQLite, Service layer para Roblox API
- **Cache**: LRU cache en main process para responses de Roblox API (TTL 60s)
- **Error handling**: Result pattern (success/error) en IPC — nunca throw sin catch

### Backend API
- **Patrón**: Layered Architecture — Routes → Controllers → Services → Repositories
- **Auth**: JWT RS256 asimétrico — access token 15min + refresh token 30 días con rotación
- **Passwords**: bcrypt salt rounds 12
- **Validación**: zod en cada endpoint — nunca confiar en datos del cliente
- **Stripe**: webhook signature verification — nunca procesar sin verificar
- **Errores**: HTTP errors semánticos con body estructurado `{ code, message, details }`

### Landing Page
- **Patrón**: Next.js App Router con Server Components donde sea posible
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
```

---

## Schema de base de datos — Backend (Prisma)

```prisma
model User {
  id              String         @id @default(cuid())
  email           String         @unique
  passwordHash    String
  emailVerified   Boolean        @default(false)
  emailVerifyToken String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  license         License?
  refreshTokens   RefreshToken[]
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

### Fase 2 — Integración SaaS
- ❌ Pantalla de login/registro con design system
- ❌ JWT en electron-store cifrado
- ❌ Validación de licencia al arrancar (GET /license/verify)
- ❌ Bloqueo por accountLimit con UI clara y CTA de upgrade
- ❌ Botón "Mejorar plan" → abre Landing en browser
- ❌ Modo offline con último plan conocido localmente
- ❌ Indicador de estado de licencia (online/offline/expirada)

### Fase 3 — Account Control Panel (Business+)
Control completo de la cuenta Roblox desde la app, sin abrir el navegador:

**Perfil:**
- ✅ Ver y cambiar display name (Sprint E2)
- ✅ Ver y editar descripción de perfil (Sprint E2)
- ✅ Ver avatar actual con thumbnail (Sprint E2)

**Seguridad y acceso:**
- ✅ Cambiar contraseña (requiere contraseña actual) (Sprint E2)
- ✅ Ver sesiones activas (dispositivos conectados) (Sprint E2)
- ✅ Cerrar sesión en dispositivos específicos o en todos (Sprint E2)
- ❌ Ver historial de accesos recientes
- ✅ Toggle verificación en dos pasos (2FA) (Sprint E2)

**Privacidad:**
- ❌ Quién puede enviarme mensajes (nadie/amigos/todos)
- ❌ Quién puede seguirme
- ❌ Quién puede chatear conmigo en juegos
- ❌ Privacidad del inventario (público/privado)
- ❌ Privacidad de grupos
- ❌ Privacidad de juegos recientes

**Amigos y contactos:**
- ❌ Ver lista de amigos con estado online
- ❌ Enviar/aceptar/rechazar solicitudes de amistad
- ❌ Bloquear / desbloquear usuarios por username o userId
- ❌ Ver lista de bloqueados
- ❌ Seguir / dejar de seguir usuarios

**Notificaciones:**
- ❌ Toggle notificaciones de solicitudes de amistad
- ❌ Toggle notificaciones de mensajes

### Fase 4 — Server Browser + Smart Selection (Pro+)
- ❌ Buscar juego por PlaceId o nombre
- ❌ Ver thumbnail, descripción, player count, rating del juego
- ❌ Listar servers activos con: JobId, players actuales, players máximos
- ❌ Detectar región del server por latencia estimada
- ❌ Filtrar servers por región
- ❌ Filtrar servidor con menos jugadores (auto-select)
- ❌ Auto-join least populated: unirse automáticamente al server más vacío
- ❌ Multi-account server split: distribuir N cuentas en servers diferentes
- ❌ VIP Server support: pegar link completo para extraer JobId
- ❌ Unirse a server específico por JobId directamente

### Fase 5 — Presence Dashboard + Inventario (Starter+)
- ❌ Estado en tiempo real de todas las cuentas (online/in-game/offline)
- ❌ En qué juego está cada cuenta con thumbnail
- ❌ Tiempo en el juego actual
- ❌ Mapa visual de actividad de todas las cuentas
- ❌ Ver Robux balance de cada cuenta
- ❌ Ver inventario de items limitados con valor estimado
- ❌ Historial de juegos recientes por cuenta

### Fase 6 — Features avanzadas
- ❌ Auto Cookie Refresh (Starter+): renovar cookie 24h antes de expirar
- ❌ Player Finder (Pro+): buscar jugador específico en qué server está
- ❌ Account Control via WebSocket (Business+): control en-game
- ❌ Quick Log In: cambio rápido de cuenta en browser
- ❌ BrowserTrackerID: prevenir instancias duplicadas
- ❌ FPS Unlocker integrado
- ❌ Themes/skins personalizables
- ❌ Max Instances setting

---

## APIs de Roblox utilizadas

```
accountsettings.roblox.com  → privacidad, notificaciones
accountinformation.roblox.com → perfil, información de cuenta
auth.roblox.com             → verificar cookie, auth ticket, logout remoto
users.roblox.com            → info de usuarios, buscar por username
friends.roblox.com          → amigos, followers, solicitudes
presence.roblox.com         → estado online en tiempo real
games.roblox.com            → info de juegos, servers, player count
inventory.roblox.com        → inventario de items
economy.roblox.com          → Robux balance, transacciones
thumbnails.roblox.com       → avatares, thumbnails de juegos
```

---

## Landing Page — Secciones

### Páginas públicas
1. **Hero** — "El gestor de cuentas Roblox que los pros usan" + CTA + mockup
2. **Features** — comparativa visual vs RAM con iconos
3. **Pricing** — tabla 5 planes con toggle mensual
4. **FAQ** — preguntas frecuentes
5. **Footer** — links, copyright, términos

### Páginas de auth
6. **/register** — email + password + confirm + verificación email
7. **/login** — email + password + forgot password
8. **/verify-email/[token]** — confirmar email
9. **/forgot-password** — solicitar reset
10. **/reset-password/[token]** — nueva contraseña

### Dashboard de usuario (post-login)
11. **/dashboard** — plan actual, uso (X/Y cuentas), próximo pago
12. **/dashboard/billing** — historial pagos, cambiar plan, cancelar
13. **/dashboard/download** — descargar app con instrucciones de instalación
14. **/success** — confirmación de pago exitoso
15. **/cancel** — usuario canceló el checkout

---

## Endpoints Backend API

### Auth
- POST /auth/register → crear User + License FREE + tokens
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
- GET /user/me → perfil autenticado
- PATCH /user/me → actualizar email
- DELETE /user/me → cancelar cuenta y suscripción en Stripe

---

## Plan de desarrollo — Orden de ejecución

### PRIORIDAD 1 — Motor RAM (App Electron)

#### Sprint E1 — Seguridad IPC (refactor)
- [ ] Auditar preload.ts — verificar contextIsolation y sandbox activos
- [ ] Implementar whitelist de canales IPC en preload
- [ ] Namespacing de canales: account:*, roblox:*, settings:*, license:*
- [ ] Validación de tipos en todos los ipcMain.handle()
- [ ] CSP en BrowserWindow
- [ ] Verificar shell.openExternal() solo acepta URLs roblox-player://

#### Sprint E2 — Account Control Panel
- [ ] IPC channels: settings:privacy:get/set, settings:security:sessions, settings:security:password
- [ ] Integración con accountsettings.roblox.com y accountinformation.roblox.com
- [ ] UI Panel de Perfil: display name, descripción
- [ ] UI Panel de Seguridad: cambiar contraseña, ver sesiones, cerrar sesiones, 2FA toggle
- [ ] UI Panel de Privacidad: mensajes, chat, inventario, grupos, juegos recientes
- [ ] UI Panel de Amigos: lista, solicitudes, bloquear/desbloquear, seguir
- [ ] UI Panel de Notificaciones: toggles

#### Sprint E3 — Server Browser
- [ ] IPC channels: roblox:games:search, roblox:servers:list, roblox:servers:join
- [ ] Integración con games.roblox.com
- [ ] UI: buscar juego por PlaceId o nombre
- [ ] UI: lista de servers con player count, JobId, región estimada
- [ ] UI: filtros (por región, por menos jugadores)
- [ ] Auto-join least populated
- [ ] Multi-account server split

#### Sprint E4 — Presence Dashboard
- [ ] Integración con presence.roblox.com (polling cada 30s)
- [ ] UI: grid de cuentas con estado en tiempo real
- [ ] UI: thumbnail del juego actual
- [ ] UI: tiempo en sesión
- [ ] Robux balance por cuenta
- [ ] Historial de juegos recientes

#### Sprint E5 — Integración SaaS
- [ ] Pantalla de login/registro en la app con design system
- [ ] electron-store cifrado para JWT
- [ ] Validación de licencia al arrancar
- [ ] Bloqueo por accountLimit con UI y CTA de upgrade
- [ ] Modo offline con último plan conocido
- [ ] Auto Cookie Refresh (cookie 24h antes de expirar)

---

### PRIORIDAD 2 — Landing Page

#### Sprint L1 — Setup
- [ ] Crear repo NexoAccManager-Landing
- [ ] Next.js 14 + TypeScript + TailwindCSS + Shadcn UI + Framer Motion
- [ ] Implementar design system (CSS variables, componentes base)

#### Sprint L2 — Páginas públicas
- [ ] Hero section con mockup de la app
- [ ] Features section con comparativa vs RAM
- [ ] Pricing section con 5 planes
- [ ] FAQ + Footer

#### Sprint L3 — Auth
- [ ] /register con validación zod
- [ ] /login con forgot password
- [ ] /verify-email/[token]
- [ ] /reset-password/[token]
- [ ] httpOnly cookies para JWT

#### Sprint L4 — Dashboard de usuario
- [ ] /dashboard — plan, uso, próximo pago
- [ ] /dashboard/billing — historial, cambiar plan, cancelar
- [ ] /dashboard/download — descarga con instrucciones

#### Sprint L5 — Stripe + Deploy
- [ ] Integración Stripe Checkout
- [ ] /success y /cancel
- [ ] Deploy Vercel
- [ ] Configurar env vars en Vercel

---

### PRIORIDAD 3 — Backend API

#### Sprint B1 — Setup
- [ ] Crear repo NexoAccManager-Backend
- [ ] Fastify + TypeScript + Prisma + PostgreSQL local
- [ ] Schema Prisma (User + License + RefreshToken)
- [ ] Primera migración
- [ ] Variables de entorno: DATABASE_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

#### Sprint B2 — Auth
- [ ] POST /auth/register con bcrypt + License FREE automática + email verification
- [ ] POST /auth/login con JWT RS256
- [ ] POST /auth/refresh con rotación de refresh token
- [ ] POST /auth/logout con invalidación de token
- [ ] POST /auth/verify-email
- [ ] POST /auth/forgot-password + /auth/reset-password
- [ ] Middleware JWT para rutas protegidas

#### Sprint B3 — Licencias + Rate limiting
- [ ] GET /license/verify
- [ ] GET /license/plans
- [ ] @fastify/rate-limit en endpoints de auth
- [ ] @fastify/helmet para headers de seguridad
- [ ] CORS configurado solo para orígenes permitidos

#### Sprint B4 — Stripe
- [ ] Crear productos y precios en Stripe Dashboard
- [ ] POST /checkout/create-session
- [ ] POST /webhook/stripe con verificación de firma
- [ ] Manejar: checkout.session.completed, subscription.updated, subscription.deleted
- [ ] Actualizar License en DB según eventos

#### Sprint B5 — Deploy
- [ ] Crear proyecto Railway
- [ ] PostgreSQL en Railway
- [ ] Variables de entorno en Railway
- [ ] Deploy y verificar endpoints
- [ ] Configurar webhook URL en Stripe Dashboard
- [ ] Generar par de claves RS256 para JWT

---

## Estado actual

### Motor RAM (App Electron)
- Backend Electron: ✅
- Preload: ✅ corregido (pendiente auditoría IPC Sprint E1)
- Dependencias: ✅
- Renderer React UI: ✅ con modal de lanzamiento
- launchRoblox(): ✅
- Import/Export: ✅
- Multi-Roblox: ✅
- API REST local (8080): ✅
- Build: ✅
- Account Control Panel: ❌ Sprint E2
- Server Browser: ❌ Sprint E3
- Presence Dashboard: ❌ Sprint E4
- Integración SaaS: ❌ Sprint E5

### Backend API: ❌ Prioridad 3
### Landing Page: ❌ Prioridad 2

## Commits Motor RAM realizados
- 9a1138b — Estructura inicial: backend Electron + crypto + DB + API REST
- 1695243 — fix: importar ipcRenderer y contextBridge desde electron en preload
- 7d2ae79 — deps: agregar better-sqlite3 y @fastify/cors, eliminar sqlite3 obsoleto
- b95b247 — feat: crear renderer React con estructura base y componentes UI
- ac4c3b8 — fix: usar @fastify/cors en lugar de fastify-cors (deprecado)
- 68e5702 — feat: implementar launchRoblox con protocolo roblox-player
- 260dbe7 — feat: UI completa con modal de lanzamiento e IPC completa

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