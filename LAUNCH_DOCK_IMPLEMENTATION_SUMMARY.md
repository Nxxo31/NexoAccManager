# Resumen de Cambios: Flujo Conectado GamesView → LaunchDock

## Objetivo
Eliminar fricción entre seleccionar un juego y lanzarlo:
- Al seleccionar un juego en `GamesView`, su `Place ID` aparece automáticamente en el `LaunchDock`
- Eliminado el campo manual `Job ID` (se usa `shuffle` o valor guardado)
- Añadido botón "Ir a Juegos" para navegar rápidamente
- Lanzamiento desde cualquier vista (Accounts, Servers, Friends, Settings) mediante dock persistente

## Cambios Implementados

### 1. Nuevo Store: `useLaunchStore` (`src/application/store/launchStore.ts`)
- Estado global para propagación de `placeId` entre vistas
- Campos: `selectedPlaceId`, `selectedGame`, `selectedAccountId`, `shuffle`, `launchStatus`
- Acciones: `setSelectedGame`, `setSelectedPlaceId`, `setSelectedAccountId`, `setShuffle`, `setLaunchStatus`, `clearSelection`

### 2. Nuevo Componente: `LaunchDock` (`src/application/components/LaunchDock.tsx`)
- Reemplaza al antiguo `JoinBar` dentro de `AccountsView`
- Dock persistente al pie del `ContentArea` (siempre visible)
- UI:
  - Input **Place ID** (solo-lectura cuando proviene de selección automática)
  - Selector de cuenta (sincronizado con `accountStore`)
  - Checkbox **Shuffle** (genera `jobId` aleatorio vía API)
  - Botón **Ir a Juegos** (navega a `GamesView`)
  - Botón **Unirse** (lanza con `ipcRenderer.invoke('account:launch', ...)`)
  - Estados: vacío, listo, lanzando, éxito, error
  - Feedback: toast al copiar Place ID, highlight en card seleccionada, pulso en dock

### 3. Actualización: `GamesView.tsx`
- Al hacer click en un resultado de búsqueda:
  - Llama a `useLaunchStore.setSelectedGame({ placeId, name, thumbnail })`
  - Muestra toast: "Place ID copiado: 123456789"
  - Navega automáticamente a `AccountsView` (donde el LaunchDock es visible)
- Los juegos favoritos también son cliqueables (lanza directamente al LaunchDock)
- Se elimina la necesidad de copiar/pegar manualmente

### 4. Actualización: `AccountsView.tsx`
- Elimina estado local `placeId`, `jobId`, `setPlaceId`, `setJobId`
- Lee `placeId` y `shuffle` directamente de `useLaunchStore`
- `handleLaunch` ahora:
  - Usa `placeId` del store (propagado desde GamesView o manual)
  - Si `shuffle` está activo, llama a `api.roblox.shuffleJobIdByAccount(placeId, accountId)` para obtener un `jobId` aleatorio válido
  - Llama a `api.roblox.launch(accountId, placeId, jobId)`
- Elimina el `JoinBar` local (el LaunchDock global lo reemplaza)

### 5. Actualización: `App.tsx`
- Importa y renderiza `<LaunchDock />` como hijo fijo del contenedor principal
- Aparece después de `<AnimatePresence>` (ContentArea) y antes de `<AddAccountModal>`
- Siempre visible, sin importar la vista activa (Accounts, Servers, Games, etc.)

### 6. Actualización: IPC Handler `roblox:launch` (`src/infrastructure/ipc/handlers/robloxHandlers.ts`)
- `jobId` ahora es **opcional** en la firma: `{ accountId: string; placeId?: string; jobId?: string }`
- Validación: solo requiere `placeId` (el `jobId` puede ser vacío string '')
- Llama a `launchRobloxDirect(placeIdToUse, jobIdToUse ?? '', cookie)`
- Comentario: "Roblox API permite lanzar sin jobId — une al servidor con menor ping"

### 7. Eliminación de Referencias a Job ID
- Eliminado estado local `jobId` en `AccountsView`
- Eliminado `setJobId` y referencias en `handleLaunch`
- Eliminado `jobId` del estado de `AccountCard`/`AccountDetailPanel` (no se mostraba)
- El `JoinBar` local ya no existe — su funcionalidad fue absorbida y mejorada por el `LaunchDock` global

## Flujo de Usuario Mejorado

### Antes (7 pasos con fricción):
1. Ir a `GamesView`
2. Buscar juego
3. Hacer click en resultado
4. Copiar manualmente el Place ID
5. Ir a `AccountsView`
6. Pegar Place ID en input
7. Seleccionar cuenta
8. Ajustar Job ID (opcional)
9. Pulsar Unirse

### Después (3 pasos, sin copy-paste):
1. Ir a `GamesView` o `ServersView`
2. Hacer click en un juego/servidor (Place ID se copia automáticamente al LaunchDock)
3. Ir a `AccountsView` (o quedarse donde estés — el LaunchDock siempre está visible)
4. Seleccionar cuenta
5. Pulsar Unirse (opcional: activar Shuffle para servidor aleatorio)

### Flujo Alternativo (desde cualquier vista):
1. Estás en `FriendsView` o `SettingsView`
2. Notas que quieres unirte a un juego
3. Miras el LaunchDock (pie de pantalla) — ya muestra el Place ID del último juego seleccionado
4. Seleccionas cuenta
5. Pulsar Unirse

## Beneficios
- ✅ **Eliminación de fricción**: cero copy-paste manual entre vistas
- ✅ **Feedback visual inmediato**: toast, highlight en card, pulso en dock
- ✅ **Siempre visible**: el LaunchDock es persistente, no depende de estar en AccountsView
- ✅ **Menos campos**: se elimina el Job ID manual (reducir complejidad y errores)
- ✅ **Integración con shuffle**: usar servidor aleatorio válido vía API (no random UUID)
- ✅ **Navegación rápida**: botón "Ir a Juegos" desde el dock
- ✅ **Arquitectura limpia**: estado centralizado en `useLaunchStore`, acoplado débilmente

## Próximos Pasos (Opcionales)
- Añadir animaciones de motion al seleccionar un juego (Framer Motion)
- Persistir último Place ID seleccionado en `useLaunchStore` entre recargas
- Añadir atajo de teclado (ej: Ctrl+G para enfocar Place ID, Enter para lanzar)
- Expandir a `ServersView` para que también propague Place ID al seleccionar un servidor