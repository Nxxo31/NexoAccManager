# Especificación Técnica: Fase 3.4-3.5 - Recent Games + Favorite Games

## 3.4 RECENT GAMES

### Tipos
```typescript
export interface RecentGame {
  id: string; // UUID único generado localmente para el registro
  gameId: number; // ID del juego en Roblox (rootPlaceId)
  name: string; // Nombre del juego
  icon?: string; // URL del ícono del juego (thumbnail)
  lastPlayed: Date; // Fecha y hora de la última vez jugado
  placeId: string; // Place ID específico del servidor
  placeName: string; // Nombre del lugar (opcional, puede ser igual a name)
  universeId: number; // ID del universo del juego
}
```

### Modelo de Account
Agregar a la interfaz `Account`:
```typescript
export interface Account {
  // ... campos existentes
  recentGames: RecentGame[]; // Máximo 10 por cuenta, ordenados por lastPlayed DESC
}
```

### Canales IPC
#### `presence:recordGamePlay`
- **Dirección:** Main → Renderer (invocado desde main.ts cuando el usuario hace "Join Server")
- **Parámetros:** 
  ```typescript
  interface RecordGamePlayPayload {
    accountId: string; // ID de la cuenta
    placeId: string;   // Place ID del servidor unido
    universeId: number; // Universe ID del juego
    gameName: string;   // Nombre del juego
    icon?: string;      // URL del ícono del juego (opcional)
  }
  ```
- **Comportamiento:**
  1. Buscar la cuenta por `accountId`.
  2. Crear un objeto `RecentGame` con:
     - `id`: UUID v4 generado
     - `gameId`: `universeId`
     - `name`: `gameName`
     - `icon`: `icon` (si se proporciona)
     - `lastPlayed`: nueva fecha (`new Date()`)
     - `placeId`: `placeId`
     - `placeName`: `gameName` (asumimos que el place name es el mismo que el game name, o se puede obtener de otra manera si está disponible)
     - `universeId`: `universeId`
  3. Insertar el nuevo `RecentGame` al inicio del array `recentGames` de la cuenta.
  4. Recortar el array a un máximo de 10 elementos, manteniendo el orden más reciente primero.
  5. Guardar la cuenta actualizada en el almacenamiento.

#### `presence:getRecentGames`
- **Dirección:** Renderer → Main (invocado desde PresenceView o GamesView)
- **Parámetros:** 
  ```typescript
  interface GetRecentGamesPayload {
    accountId: string; // ID de la cuenta
  }
  ```
- **Respuesta:** 
  ```typescript
  interface GetRecentGamesResponse {
    success: boolean;
    recentGames?: RecentGame[]; // Array ordenado por lastPlayed DESC (máximo 10)
    error?: string;
  }
  ```

### Cambios en la UI

#### PresenceView
- Añadir una nueva pestaña "Recientes" junto a las existentes (si las hubiera).
- Al seleccionar la pestaña "Recientes", mostrar una lista de tarjetas de juegos recientes para la cuenta actualmente seleccionada en la PresenceView.
- Cada tarjeta debe mostrar:
  - Ícono del juego (si está disponible)
  - Nombre del juego
  - Tiempo transcurrido desde la última jugada (ej: "Hace 2h", "Ayer", "05/06/2026")
- Si no hay juegos recientes, mostrar un estado vacío adecuado.

#### GamesView
- Añadir una nueva pestaña "Recientes" (junto a "Buscar", "Favoritos", etc.).
- Al seleccionar la pestaña "Recientes", mostrar una lista de juegos recientes de **todas** las cuentas, agregados y deduplicados por `gameId` (universeId).
  - Ordenar por `lastPlayed` global (más reciente primero).
  - Si el mismo juego aparece en múltiples cuentas, solo mostrar la ocurrencia más reciente.
- Cada tarjeta debe mostrar:
  - Ícono del juego
  - Nombre del juego
  - Tiempo transcurrido desde la última jugada (global)
  - Opcional: mostrar el username de la cuenta que lo jugó recientemente (en pequeño)
- Si no hay juegos recientes en ninguna cuenta, mostrar un estado vacío.

#### JoinBar
- Al hacer hover sobre el botón "Unirse", mostrar un dropdown (menú desplegable) cerca del botón.
- El dropdown debe mostrar los últimos 3 juegos jugados:
  - Si hay una cuenta seleccionada en la UI (cuenta activa en AccountGrid o AccountDetailPanel), mostrar los últimos 3 juegos de esa cuenta.
  - Si no hay cuenta seleccionada, mostrar los últimos 3 juegos jugados globalmente (de todas las cuentas, deduplicados por `gameId`, ordenados por más reciente).
- Cada elemento del dropdown debe mostrar:
  - Ícono del juego
  - Nombre del juego
  - Tiempo transcurrido desde la última jugada
- Al hacer clic en un elemento del dropdown, intentar unirse a ese juego (usando el `placeId` y posiblemente `jobId` si estuviera disponible, pero actualmente solo guardamos `placeId`; podríamos necesitar guardar también `jobId` para unirse al servidor específico).

### Nota sobre el Place ID y Job ID
- En el IPC `presence:recordGamePlay` actualmente solo recibimos `placeId` y `universeId` (gameId). Para unirse a un servidor específico, necesitamos el `jobId` (server ID). 
- Según el modelo de datos actual de `Account`, tenemos `savedPlaceId` y `savedJobId` para guardar la última ubicación seleccionada manualmente por el usuario.
- Para los juegos recientes, actualmente solo guardamos el `placeId` (que es el rootPlaceId del universo). Esto nos permite unirnos al juego, pero no a un servidor específico.
- Para mejorar esto en el futuro, podríamos considerar guardar el `jobId` también en el `RecentGame` cuando esté disponible (por ejemplo, cuando el usuario se une a un servidor desde la lista de servidores). Sin embargo, por ahora, nos limitamos al `placeId` al `placeId`.

### Casos de Error
- Si la cuenta no se encuentra en `presence:recordGamePlay`, devolver un error en la respuesta IPC (si es de tipo invoke) o silenciosamente fallar (si es de tipo send). Dado que es una notificación desde el main process, podemos asumir que la cuenta existe.
- Si ocurre un error al guardar en el almacenamiento, devolver un error en la respuesta IPC (para `presence:getRecentGames`).

## 3.5 FAVORITE GAMES

### Tipos
```typescript
export interface FavoriteGame {
  id: string; // UUID único generado localmente para el favorito
  gameId: number; // ID del juego en Roblox (rootPlaceId)
  name: string; // Nombre del juego
  icon?: string; // URL del ícono del juego (thumbnail)
  addedAt: Date; // Fecha y hora en que se agregó a favoritos
}
```

### Modelo de Account
Agregar a la interfaz `Account`:
```typescript
export interface Account {
  // ... campos existentes
  favoriteGames: FavoriteGame[]; // Máximo 20 por cuenta
}
```

### Canales IPC
#### `games:addFavorite`
- **Dirección:** Renderer → Main (invocado cuando el usuario marca un juego como favorito)
- **Parámetros:** 
  ```typescript
  interface AddFavoritePayload {
    accountId: string; // ID de la cuenta
    gameId: number;    // ID del juego (universeId)
    name: string;      // Nombre del juego
    icon?: string;     // URL del ícono del juego (opcional)
  }
  ```
- **Comportamiento:**
  1. Buscar la cuenta por `accountId`.
  2. Verificar si el juego ya está en favoritos (por `gameId`). Si ya existe, no hacer nada (o actualizar la fecha? Según requerimiento, parece que solo se agrega si no existe).
  3. Crear un objeto `FavoriteGame` con:
     - `id`: UUID v4 generado
     - `gameId`: `gameId`
     - `name`: `name`
     - `icon`: `icon` (si se proporciona)
     - `addedAt`: nueva fecha (`new Date()`)
  4. Insertar el nuevo `FavoriteGame` al final del array `favoriteGames` (o al inicio, pero el requisito no especifica orden; podemos mantener orden de inserción).
  5. Recortar el array a un máximo de 20 elementos, eliminando los más antiguos si es necesario (FIFO o LRU? El requisito dice máximo 20, no especifica orden. Mantendremos el orden de inserción y eliminaremos el más antiguo al exceder).
  6. Guardar la cuenta actualizada en el almacenamiento.
  7. Devolver respuesta de éxito.

#### `games:removeFavorite`
- **Dirección:** Renderer → Main (invocado cuando el usuario desmarca un juego como favorito)
- **Parámetros:** 
  ```typescript
  interface RemoveFavoritePayload {
    accountId: string; // ID de la cuenta
    gameId: number;    // ID del juego a eliminar de favoritos
  }
  ```
- **Comportamiento:**
  1. Buscar la cuenta por `accountId`.
  2. Filtrar el array `favoriteGames` para eliminar el elemento con `gameId` coincidente.
  3. Guardar la cuenta actualizada en el almacenamiento.
  4. Devolver respuesta de éxito.

#### `games:getFavorites`
- **Dirección:** Renderer → Main (invocado desde GamesView o AccountDetailPanel)
- **Parámetros:** 
  ```typescript
  interface GetFavoritesPayload {
    accountId: string; // ID de la cuenta
  }
  ```
- **Respuesta:** 
  ```typescript
  interface GetFavoritesResponse {
    success: boolean;
    favoriteGames?: FavoriteGame[]; // Array de favoritos (orden de inserción o por addedAt DESC? Requisito no especifica, pero podemos devolver en orden de addedAt DESC para mostrar los más recientes primero)
    error?: string;
  }
  ```

### Cambios en la UI

#### GamesView
- Añadir una nueva pestaña "Favoritos" (junto a "Buscar", "Recientes", etc.).
- Al seleccionar la pestaña "Favoritos", mostrar una lista de tarjetas de juegos favoritos de la cuenta actualmente seleccionada en el AccountGrid o AccountDetailPanel.
- Cada tarjeta debe mostrar:
  - Ícono del juego (si está disponible)
  - Nombre del juego
  - Botón o icono de estrella para quitar de favoritos (estrella llena)
- Si no hay juegos favoritos, mostrar un estado vacío adecuado.

#### GameCard (o tarjetas de juegos en general)
- En las tarjetas que representan un juego (por ejemplo, en los resultados de búsqueda de juegos, en la lista de recientes, etc.), añadir un botón de estrella toggle:
  - Estrella vacía (☆) si el juego no está en favoritos de la cuenta seleccionada.
  - Estrella llena (★) si el juego está en favoritos de la cuenta seleccionada.
- Al hacer clic en la estrella:
  - Si no está en favoritos, llamar a `games:addFavorite` para agregar.
  - Si está en favoritos, llamar a `games:removeFavorite` para eliminar.
  - Actualizar el estado de la estrella inmediatamente (optimistic update).

#### AccountDetailPanel
- Añadir una nueva sección "Juegos favoritos" (posiblemente debajo de la sección de amigos o en una pestaña).
- Mostrar una lista de los juegos favoritos de la cuenta que se está viendo en el panel.
- Cada elemento de la lista debe mostrar:
  - Ícono del juego
  - Nombre del juego
  - Fecha de agregado (formato relativo o absoluto)
  - Opcional: botón para eliminar de favoritos (estrella llena que al hacer clic lo quita)

### UI: Estilo de la Estrella
- Usar el icono de lucide-react: `Star` para estrella llena y `StarOff` para estrella vacía (o usar `Star` y cambiar su color).
- Color de la estrella:
  - Cuando es favorito: amarillo (`#FFA502` según el diseño system: warning)
  - Cuando no es favorito: gris (`#2A2A2A` según el diseño system: border, o quizás un gris más claro para desactivado)

### Casos de Error
- Si la cuenta no se encuentra en los IPC de favoritos, devolver un error.
- Si ocurre un error al guardar en el almacenamiento, devolver un error en la respuesta IPC.

## Consideraciones de Diseño y Estado
### Diseño System
- Colores:
  - Fondo: `#0D0D0D` (bg-dark)
  - Primario: `#DE350D` (roblox red)
  - Acento: `#6347FF` (purple)
  - Éxito: `#2ED573` (green)
  - Advertencia: `#FFA502` (yellow) -> para estrellas favoritas
  - Error: `#FF4757` (red)
  - Borde: `#2A2A2A` (border)
- Iconos: lucide-react
- Fuentes: Inter (UI), JetBrains Mono (datos)

### Estado Global y Stores
- Actualmente, el estado de las cuentas se maneja en `useAccountStore` (Zustand) en el renderer.
- Los cambios en `recentGames` y `favoriteGames` deben ser persistentes a través del AccountManager en el main process.
- Los IPC mencionados arriba deben ser implementados en `main.ts` y expuestos a través del `contextBridge` en `preload.ts`.
- Los stores de Zustand deben actualizarse cuando se reciban los datos de los IPC (usando eventos o suscribiendo a cambios mediante `ipcRenderer.on` o mejor, usando patrones de mensaje a través de `ipcRenderer.invoke` y luego actualizando el store con el resultado).

### Flujo de Datos Ejemplo para Recent Games
1. Usuario hace clic en "Unirse" en un juego desde ServerView o presencia de un amigo.
2. El proceso principal (main.ts) recibe la solicitud de unirse y, después de lanzar Roblox, llama a `presence:recordGamePlay` mediante `ipcMain.handle` (o similar) con los datos del juego.
3. En el preload, el canal `presence:recordGamePlay` está expuesto a través de `contextBridge.invoke`.
4. En el renderer, podemos tener un efecto que escuche este evento (o mejor, llamamos directamente al invoke desde el main process y actualizamos el store mediante un evento de respuesta).
   - Alternativamente, el main process puede enviar un evento mediante `ipcMain.emit` después de guardar, y el renderer escucha con `ipcRenderer.on` para actualizar el store.
   - Sin embargo, siguiendo el patrón de IPC tipado (invoke/handle), es mejor que el renderer invoque el método y espere la respuesta, pero en este caso el main process lo invoca proactivamente. Por lo tanto, usaremos `ipcMain.emit` para notificar al renderer y el renderer actualizará el store.
5. En el renderer, al recibir la notificación, actualizamos el `useAccountStore` para actualizar la cuenta correspondiente con el nuevo juego reciente.

### Flujo de Datos Ejemplo para Favorite Games
1. Usuario hace clic en la estrella de un juego en un GameCard.
2. El renderer llama a `ipcRenderer.invoke('games:addFavorite', payload)` o `games:removeFavorite`.
3. El main process maneja la invocación, actualiza el almacenamiento y devuelve el resultado.
4. El renderer actualiza el estado de la estrella optimistamente y, en caso de error, revierte la optimización.

### Pruebas
- Se deben escribir pruebas unitarias para los IPC handlers en main.ts.
- Se deben escribir pruebas unitarias para los stores de Zustand (si se usan).
- Se deben escribir pruebas de integración para los componentes UI (PresenceView, GamesView, JoinBar, AccountDetailPanel, GameCard) usando vitest y React Testing Library o Playwright.

### Notas Adicionales
- El campo `placeId` en `RecentGame` es el Place ID específico del servidor (no el rootPlaceId). Esto nos permitirá unirnos al servidor exacto si tuviéramos el jobId. Sin embargo, actualmente solo guardamos el placeId (que en el contexto de `presence:recordGamePlay` es el rootPlaceId del universo, según la documentación de la Presence API). 
  - En realidad, la Presence API devuelve `placeId` como el rootPlaceId y `rootPlaceId` es el mismo. Para obtener el Place ID específico del servidor, necesitamos el `gameId` (que es el universeId) y quizás el `jobId` para el servidor específico.
  - Revisando la documentación de la Presence API (en el PROJECT.md): 
    - Campos: lastLocation (string), placeId, rootPlaceId, gameId (=JobId), universeId, userId, lastOnline (ISO date)
    - Entonces: `placeId` es el rootPlaceId, `gameId` es el JobId.
  - Por lo tanto, en el IPC `presence:recordGamePlay` estamos recibiendo:
    - `placeId`: rootPlaceId (mismo que universeId? No, universoId es separado)
    - `gameId`: esto sería el JobId? Pero el parámetro se llama `gameName` y `icon`. 
  - Hay una confusión en la especificación del proyecto. Vamos a aclarar:
    - Según la Presence API: 
      - `userId`: el ID de usuario
      - `universeId`: ID del universo del juego
      - `placeId`: ID del lugar raíz (root place)
      - `rootPlaceId`: mismo que placeId? 
      - `gameId`: ID del servidor (JobId)
    - En el PROJECT.md dice: 
      - Campos: lastLocation (string), placeId, rootPlaceId, gameId (=JobId), universeId, userId, lastOnline (ISO date)
    - Entonces, en el IPC que recibimos del PresenceService, deberíamos tener:
      - universeId: number
      - placeId: string (rootPlaceId)
      - gameId: string (JobId)  <-- pero en el PROJECT.md dice que gameId es igual a JobId
    - Sin embargo, en la descripción de la fase 3.4 dice: 
      - `presence:recordGamePlay` (main.ts) - llamado cuando usuario hace Join Server (recibe accountId + placeId + universeId + gameName + icon)
    - Aquí menciona `placeId` y `universeId`, pero no `gameId` (JobId). 
    - Para unirse a un servidor específico, necesitamos el JobId (gameId de la Presence API). 
    - Por lo tanto, necesitamos ajustar el IPC para incluir también el `gameId` (JobId) si queremos unirnos al servidor específico en el futuro. 
    - Por ahora, para los recientes, solo guardaremos el `placeId` (rootPlaceId) y cuando el usuario haga clic en un juego reciente, intentaremos unirnos al juego usando ese placeId (lo que lo llevará al servidor predeterminado o último servidor del juego). 
    - Si en el futuro queremos unirnos al servidor específico, necesitaremos guardar también el `gameId` (JobId) en el RecentGame.

  - Dado el alcance de esta fase, nos limitaremos a guardar el `placeId` (rootPlaceId) y usarlo para unirnos al juego (sin especificar servidor). 

  - Para los favoritos, solo necesitamos el juego (universeId) y no el servidor específico, así que usaremos el `gameId` (universeId) como identificador del juego.

  - Por lo tanto, en el IPC `presence:recordGamePlay`:
    - `universeId`: número (ID del universo)
    - `placeId`: string (ID del lugar raíz, rootPlaceId)
    - `gameName`: string (nombre del juego)
    - `icon`: string (URL del ícono)
    - (Opcional) `gameId`: string (JobId) si lo tenemos disponible y queremos guardarlo para futuro uso.

  - Pero la descripción de la fase 3.4 solo menciona accountId + placeId + universeId + gameName + icon. 
  - Asumiremos que el `placeId` recibido es el rootPlaceId y que no tenemos el JobId en este punto. 
  - Si en el futuro tenemos el JobId, podemos extender el modelo.

  - Por ahora, en `RecentGame`:
    - `placeId`: será el rootPlaceId (string)
    - `universeId`: número (ID del universo)
    - No guardaremos el JobId.

  - Al unirse desde recientes, usaremos el `placeId` (rootPlaceId) para lanzar el juego, lo que abrirá el juego en el último servidor visitado o predeterminado.

  - Esto es consistente con cómo funciona actualmente el JoinBar: placeId y jobId son separados, y el placeId es el rootPlaceId.

### Actualización del Modelo de Account
- Ya tenemos `savedPlaceId` y `savedJobId` en la cuenta para guardar la última ubicación seleccionada manualmente por el usuario (por ejemplo, al escribir en el JoinBar). 
- Para los recientes, usaremos un nuevo campo `recentGames` que guardará objetos con `placeId` (rootPlaceId) y `universeId`.

## Plan de Implementación

1. Crear SPEC.md (este documento).
2. Actualizar el modelo de Account en `src/types/Account.ts` para agregar `recentGames` y `favoriteGames`.
3. Implementar los handlers IPC en `src/main/main.ts` (o en un servicio dedicado como `PresenceService` y `GamesService` si existen).
4. Exponer los nuevos canales IPC en `src/preload/preload.ts` mediante `contextBridge`.
5. Actualizar los stores de Zustand (probablemente `useAccountStore`) para manejar los nuevos campos y escuchar los eventos IPC.
6. Crear o actualizar componentes UI:
   - PresenceView: agregar tab "Recientes"
   - GamesView: agregar tabs "Recientes" y "Favoritos"
   - JoinBar: agregar dropdown de recientes al hover
   - GameCard: agregar botón de estrella toggle (si existe) o crear un componente genérico para tarjetas de juego con estrella.
   - AccountDetailPanel: agregar sección "Juegos favoritos"
7. Actualizar los estilos y usar los iconos de lucide-react.
8. Escribir pruebas unitarias y de integración.
9. Ejecutar `tsc --noEmit` y `vitest run` para asegurar que no hay errores.
10. Hacer commit y push.

## Notas sobre la Implementación Actual
- Revisar si ya existe un `GamesService` o `PresenceService` en `src/main/services/`.
- Revisar si ya existe un hook o store para manejar la presencia y juegos.

Dado el tiempo, comenzaremos por crear el SPEC y luego implementaremos paso a paso.