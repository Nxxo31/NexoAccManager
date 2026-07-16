# NexoAccManager v3.0 — Plan de Desarrollo Priorizado

## Objetivo
Evolución de NexoAccManager a v3.0 — paridad funcional con RAM + features propias que mejoren la experiencia.

## Principios de diseño
1. **Configuración global vs per-cuenta clara** — settings globales en Settings, settings por cuenta en AccountDetailPanel
2. **Presence = capa social** — no es un dashboard de "estoy jugando", es friends list, join friends, view profiles
3. **Una vista por nav item** — cada botón del sidebar muestra una vista dedicada, no modales superpuestos
4. **AccountCard como unidad central** — toda info de cuenta accesible desde la card + detail panel
5. **Sin ventanas superpuestas** — RAM usa múltiples ventanas flotantes. NAM usa vistas + modales

---

## FASE 1 — Fix estructural (COMPLETADO)
- [x] Sidebar + TopBar + AppLayout + AccountGrid
- [x] tsc 0 errores, vitest 82/82, build exitoso
- [x] Fix crítico type:module removido
- [x] Commit: 41c5408

---

## FASE 2 — Conectar views existentes + JoinBar
Prioridad: ALTA — sin esto, 3 de 5 vistas son placeholders

### 2.1 Conectar ServerView, GamesView, SettingsView a App.tsx
- Reemplazar placeholders inline con componentes View
- SettingsView ya tiene `onOpenModal` → ligar a SettingsPanel modal
- ServerView ya envuelve ServerBrowser
- GamesView ya tiene search + results grid
- Archivos: App.tsx, components/views/*

### 2.2 JoinBar component (Place ID / Job ID / Shuffle / Join)
- Crear `components/accounts/JoinBar.tsx`
- Inputs: Place ID, Job ID (con savedPlaceId/savedJobId de la cuenta seleccionada)
- Toggle Shuffle (dice icon)
- Botón "Join Server" → usa handleJoinServer
- Se muestra encima de AccountGrid en AccountsView
- Persiste Place ID/Job ID en la cuenta seleccionada

### 2.3 Búsqueda de cuentas funcional
- Pasar searchQuery del store a AccountGrid
- Filtrar: username, displayName, description, group (case-insensitive)
- Debounce 200ms

### 2.4 AccountDetailPanel (slide-in derecho, 320px)
- Crear `components/accounts/AccountDetailPanel.tsx`
- Se abre al seleccionar una AccountCard
- Info: avatar, username, displayName, robloxUserId (mono), group dropdown
- Description textarea (editable inline)
- Cookie status + expiry date
- Saved Place ID + Job ID (editable)
- Botones: Launch Game, Open Browser, Copy Password, Copy rbx-player, Quick Log In
- Presence section: status + current game + current job ID
- Friends section: lista mini con online indicators
- Anima: slide-in from right (framer-motion)

---

## FASE 3 — Features de RAM (paridad funcional)
Prioridad: MEDIA — completa lo que RAM tiene

### 3.1 Save/Copy Password
- Al hacer login (LoginBrowserService), opcionalmente guardar contraseña
- Toggle global en Settings: savePasswords
- Cifrar contraseña con CryptoService (igual que cookies)
- Botón "Copiar contraseña" en AccountDetailPanel
- Botón "Copiar contraseña" en AccountCard (right-click menu o icon)
- IPC: account:savePassword, account:copyPassword

### 3.2 Account Groups UI
- `group` field ya existe en Account type
- Añadir group dropdown en AccountDetailPanel
- Visualizar grupos como separadores en AccountGrid ("Main", "Alts", "Storage")
- Right-click en AccountCard → "Mover a grupo" → dropdown de grupos
- Crear/eliminar grupos dinámicamente
- Persistir en Account.group via IPC account:updateProfile

### 3.3 Account Sorting (drag-drop)
- framer-motion Reorder en AccountGrid
- Persistir orden en store (accountOrder: string[])
- IPC: settings:saveAccountOrder
- Drag-drop entre grupos también

### 3.4 Recent Games
- savedPlaceId ya existe en Account
- Crear `RecentGames` store global (no por cuenta)
- Al hacer Join Server, añadir al historial
- Mostrar en GamesView tab "Recientes"
- Hover en JoinBar → dropdown de juegos recientes

### 3.5 Favorite Games
- Crear FavoriteGame type en types/
- IPC: games:addFavorite, games:removeFavorite, games:listFavorites
- Mostrar en GamesView tab "Favoritos"
- Star icon en GameCard para añadir/quitar

### 3.6 Presence UI
- PresenceService ya existe en main process
- Crear `components/presence/PresenceView.tsx`
- Lista de todas las cuentas con su estado real (polling cada 30s)
- Cuentas online → mostrar juego actual + Place ID + Job ID
- Botón "Unirse" si está en partida
- Expandir cuenta → friends list con estado de cada amigo
- Botones por amigo: Ver Perfil, Eliminar Amigo, Seguir, Unirse a partida
- Search bar: buscar por username → "Añadir amigo"
- Necesita IPC nuevo: roblox:getFriends, roblox:followUser, roblox:unfollowUser, roblox:addFriend, roblox:removeFriend

### 3.7 Account Utilities
- Crear `components/accounts/AccountUtilities.tsx` (modal o sección en DetailPanel)
- Cambiar contraseña (Roblox API)
- Cambiar email
- Set display name
- Who can follow dropdown (privacy)
- Sign out of all other sessions
- Block / Unblock user
- Necesita IPC: roblox:changePassword, roblox:changeEmail, roblox:setDisplayName, roblox:setPrivacy

### 3.8 Account Aging Alert
- Dot amarillo: última vez usada > 20 días
- Dot rojo: última vez usada > 60 días
- lastUsed ya existe en Account
- Calcular en AccountCard render
- Toggle global en Settings: disableAgingAlert

---

## FASE 4 — Features avanzadas (diferenciación)
Prioridad: BAJA — mejora la experiencia pero no es paridad

### 4.1 Auto Relaunch
- Toggle global default + override por cuenta
- Account.autoRelaunch boolean
- Connection Watcher detecta si Roblox se cerró → relanza
- IPC: account:setAutoRelaunch

### 4.2 Connection Watcher
- Monitorear proceso de Roblox activo
- Si no hay conexión por X segundos → cerrar instancia
- Toggle global en Settings + timeout configurable

### 4.3 Prevent Duplicate Instances
- browserTrackerId por cuenta
- Al lanzar, verificar si ya hay instancia activa
- Si existe → cerrar vieja antes de abrir nueva
- IPC: roblox:checkInstance, roblox:closeInstance

### 4.4 Join VIP Servers
- Detectar VIP server link en Place ID input
- Parsear link y extraer Place ID + access code
- Join con código de acceso

### 4.5 Player Finder
- Buscar jugador por username en ServerBrowser
- Recorrer servidores hasta encontrarlo
- Puede tomar tiempo, mostrar loading
- IPC: roblox:findPlayer

### 4.6 Outfit Viewer
- Ver outfit actual de un jugador
- API: roblox:getAvatar
- Modal con visualización 3D o imagen

### 4.7 Local Web API
- HTTP server local (express o http nativo)
- Endpoints: /launch, /join, /accounts, /presences
- Toggle en Settings + port configurable
- Auth via API key local
- Documentación de endpoints

### 4.8 Join Group
- Unirse a grupos con múltiples cuentas
- Input: Group ID
- Seleccionar cuentas → Join Group para todas
- IPC: roblox:joinGroup

### 4.9 Quick Log In
- Usar Roblox Quick Log In feature
- generar código QR o link
- Display en AccountDetailPanel

---

## FASE 5 — Tests y calidad
Prioridad: DESPUÉS de features, ANTES de release

### 5.1 Tests unitarios nuevos
- AccountGrid.test.tsx
- JoinBar.test.tsx
- AccountDetailPanel.test.tsx
- PresenceView.test.tsx
- ServerView.test.tsx
- GamesView.test.tsx

### 5.2 Tests E2E/a11y
- Actualizar selectores para v3.0
- Smoke: app carga, sidebar navega, views cambian
- Navigation: modales abren/cierran, detail panel slide
- A11y: WCAG en todas las views

### 5.3 Visual regression
- Regenerar baselines con nuevo UI
- Screenshot por view + modales abiertos

### 5.4 Lint + tsc + build final
- 0 errores tsc
- 0 errores lint
- Build exitoso (AppImage + snap + NSIS)

---

## FASE 6 — Release
### 6.1 Documentación
- Actualizar PROJECT.md con estado final
- Actualizar AGENTS.md con estructura v3.0
- README.md con features completas + screenshots

### 6.2 Release
- Tag v3.0.0
- GitHub Actions NSIS build
- Release notes completas con comparativa RAM vs NAM
```