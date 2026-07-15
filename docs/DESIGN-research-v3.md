# NexoAccManager — Rediseño Front-end v3.0.0
# Investigación + Documento de Diseño

## 1. INVESTIGACIÓN — Framer Motion (Motion)

### Estado actual
- **Librería**: Motion (antes Framer Motion) — `motion` package
- **Reputación**: High, 306 code snippets, production-grade
- **Tamaño**: ~30KB gzipped
- **Compatibilidad**: React 18/19, Electron, Vue

### Features aplicables a NexoAccManager

| Feature | Aplicación | Prioridad |
|---------|-----------|-----------|
| `AnimatePresence` | Transiciones de entrada/salida de modales (fade + scale) | Alta |
| `layout` prop | Animación automática al agregar/eliminar/reordenar cuentas | Alta |
| `Reorder.Group` | Drag-to-reorder de cuentas (feature de RAM) | Media |
| `useInView` | Animar elementos al hacer scroll (lazy load de avatares) | Baja |
| `whileHover` / `whileTap` | Feedback táctil en botones y filas | Alta |
| `motion` divs | Transiciones suaves entre estados (cuenta seleccionada/no seleccionada) | Alta |

### Mejores prácticas identificadas
1. **"Motion should whisper, not scream"** — animaciones sutiles, no distractores
2. `AnimatePresence mode="wait"` para modales — un elemento sale completamente antes de que entre el siguiente
3. `layout` prop en listas — Framer Motion auto-anima cambios de posición sin configuración
4. `whileHover={{ scale: 1.02 }}` — feedback sutil, nunca >1.05 en desktop
5. `transition={{ duration: 0.15 }}` — coincidir con el `--transition-duration: 150ms` del design system
6. En Electron: usar `transform` y `opacity` (GPU-accelerated) — evitar animar `width`/`height` por performance

### Implementación recomendada
```tsx
// Modal transition
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

// Account reordering
import { Reorder } from 'framer-motion';

<Reorder.Group axis="y" values={accounts} onReorder={setAccounts}>
  {accounts.map((account) => (
    <Reorder.Item key={account.id} value={account}>
      {/* row content */}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

---

## 2. INVESTIGACIÓN — shadcn/ui Blocks

### Blocks relevantes identificados

| Block | Descripción | Aplicabilidad |
|-------|------------|---------------|
| `dashboard-01` | Sidebar + charts + data table | No — exceso para account manager |
| `sidebar-07` | Sidebar colapsable a iconos | No — decidimos vista única |
| `sidebar-03` | Sidebar con submenús agrupados | No |
| `login-03` | Login page muted background | Referencia para AddAccountModal |
| `login-04` | Login con form + imagen | Referencia visual |

### Patrones de shadcn/ui aplicables (sin importar sidebar)

1. **Collapsible Groups**: `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` — para agrupar cuentas por grupo (RAM feature)
2. **DropdownMenu**: menú contextual en filas de cuenta (eliminar, follow, control, copiar)
3. **SidebarMenuButton tooltip**: tooltips en iconos para reducir labels
4. **Group-data selectors**: esconder texto en modo compacto
5. **Item component**: estructura consistente `ItemMedia + ItemContent + ItemActions`

### Lo que TOMAMOS de shadcn/ui
- Filosofía "copy and paste" — componentes que posees, no dependencia
- Patrones de composición con Radix primitives
- `DropdownMenu` para context menu en filas
- `Collapsible` para grupos de cuentas
- Diseño limpio, sin glassmorphism, border sutil

### Lo que NO tomamos
- Layout con sidebar (NexoAccManager es vista única)
- Charts/dashboards (no es una app de analytics)
- Sistema de routing (todo es modal/overlay)

---

## 3. INVESTIGACIÓN — Roblox UI/UX Design Principles + RAM

### Principios oficiales de Roblox (creator-docs)

#### Prioritization — Hierarchy of Information
- Preguntas clave: ¿Qué está haciendo el usuario? ¿Qué es lo más importante? ¿Qué decisiones tiene que tomar?
- **Aplicado**: Cuando no hay cuenta seleccionada → mostrar solo "Agregar" + Place/Job. Cuando hay selección → mostrar acciones contextuales.

#### Attention — Color, Size, Space, Proximity, Movement
- **Color**: Rojo primary (#DE350D) solo para CTAs críticos (Agregar, Jugar). Muted para todo lo demás.
- **Size**: "Jugar" es el botón más grande. Agregar es mediano. Todo lo demás es compacto.
- **Space**: Negativo alrededor de la sección activa. Separadores visuales entre grupos funcionales.
- **Proximity**: Botones relacionados agrupados físicamente. Place/Job + Jugar = un solo bloque.
- **Movement**: Framer Motion sutil en transiciones (no excesivo).

#### Visual Language
- **Icons**: Lucide Icons consistentes — mismo estilo en toda la app
- **Buttons**: Container claro (bg + border) para distinguir de texto plano
- **Text**: Headers bold, data en JetBrains Mono, body en Inter
- **Consistency**: Mismo color = mismo concepto (rojo = acción primaria SIEMPRE)

#### Conventions
- X para cerrar (chatbot/docs lo hacen)
- Gray para disabled
- Lock icon para features bloqueados / no disponibles
- Click derecho = menú contextual

#### UX Flows — Minimize Friction
- Flow de juego: Seleccionar cuenta → (opcional Place/Job) → Jugar = 2-3 pasos máximo
- Flow de agregar: Click Agregar → Login con navegador → done = 2 pasos
- Flow de editar: Double-click fila → modal inline → guardar = 3 pasos

### RAM (ic3w0lf22) — Feature Audit

| Feature RAM | Estado NexoAccManager | Acción |
|-------------|----------------------|--------|
| Account Encryption | ✅ Implementado | Mantener |
| Multi Roblox | ✅ Implementado | Mantener |
| Server List | ✅ ServerBrowser modal | Mantener |
| Account Sorting (drag) | ❌ No implementado | **NUEVO: Reorder.Group** |
| Account Grouping | ❌ No implementado | **Futuro: Collapsible groups** |
| Shuffle JobId | ✅ Implementado | Refinar UI |
| Save PlaceId/JobId | ✅ Implementado | Mantener |
| Bulk Import | ✅ Implementado | Mantener |
| Auto Relaunch | ⏳ Propuesto v2.4.0 | **Diseñar para futura integración** |
| Cookie Refresh | ✅ CookieExpiryService | Mantener |
| Connection Watcher | ⏳ Propuesto v2.4.0 | **Diseñar para futura integración** |
| Copy rbx-player link | ❌ No implementado | **Context menu** |
| Quick Log In | ❌ No implementado | Futuro |
| Themes | ✅ ThemeService | Mantener |

---

## 4. DASHBOARD UX BEST PRACTICES (investigación adicional)

1. **Visual hierarchy** — guía el ojo al elemento más importante (NN/g)
2. **Reduce cognitive load** — menos elementos en pantalla = decisiones más rápidas
3. **Progressive disclosure** — esencial primero, avanzado bajo demanda
4. **Proximity grouping** — elementos relacionados juntos física y visualmente
5. **Contextual actions** — acciones que dependen de selección aparecen solo cuando hay selección
6. **One primary action per view** — no compete por atención

---

## 5. REDISEÑO — Especificación

### Filosofía: "Minimalismo Contextual"
La UI muestra solo lo necesario para el contexto actual. Cuando no hay cuenta seleccionada, el dock muestra lo mínimo. Cuando hay selección, las acciones contextuales aparecen suavemente. Todo tiene un propósito único — cero redundancia.

### Layout — 3 Zonas Claras

```
┌──────────────────────────────────────────────┐
│ HEADER (h-12)                                 │
│ [NexoAcc] 12/50        [Ocultar] [Ajustes]  │
├──────────────────────────────────────────────┤
│                                                │
│  MAIN — Account Table (flex-1)                │
│  ┌──────────────────────────────────────────┐ │
│  │ avatar │ Usuario    │ Alias  │ Descripción │ │
│  │ avatar │ Usuario2   │ Alias2 │ Desc2      │ │
│  │ avatar │ Usuario3   │ Alias3 │ Desc3      │ │
│  └──────────────────────────────────────────┘ │
│                                                │
├──────────────────────────────────────────────┤
│ DOCK (h-14) — Unified bar                      │
│ [Place ID____] [Job ID___] [ Shuffle ]         │
│ [Agregar]  [Jugar ▶]  [Servers]  [⋯ More]      │
└──────────────────────────────────────────────┘
```

### Botones — Auditoría de Redundancia

| Botón actual | Estado | Razón |
|-------------|--------|-------|
| Agregar | ✅ Mantiene | Primary global — siempre visible izquierda |
| Eliminar | 🔄 Row-level | Icono trash en fila seleccionada/hover |
| Ocultar | ✅ Mantiene | Header toggle |
| Ajustes | ✅ Mantiene | Header |
| Servers | 🔄 Contextual | Solo visible cuando hay Place ID |
| Join Server | 🔄 Fusionado | → "Jugar" (unifica Join Server + Abrir App) |
| Abrir App | 🔄 Fusionado | → "Jugar" detecta contexto automáticamente |
| Control | 🔄 Row-level | Icono gamepad en fila + context menu |
| Follow | 🔄 Row-level | Icono user-plus en fila + context menu |
| Shuffle | ✅ Mantiene | Toggle en Place/Job section |

**Reducer de botones globales**: 10 → 4 (Agregar, Jugar, Servers, More)
**Buttons en fila**: Eliminar, Control, Follow — aparecen en hover/selection

### "Jugar" — Botón Unificado Inteligente
- Si hay Place ID → Lanza Roblox con Place/Job (antes "Join Server")
- Si NO hay Place ID → Abre la app Roblox (antes "Abrir App")
- Label cambia dinámicamente: "Jugar" o "Join Server"
- Icono: Play (siempre)

### "More" (⋯) — Dropdown Menu
Acciones secundarias agrupadas:
- Editar Alias
- Editar Descripción
- Copiar Place ID
- Copiar rbx-player link (futuro)
- Auto Relaunch toggle (futuro)
- Connection Watcher toggle (futuro)

### Row-level Actions (hover/selected)
Iconos que aparecen al hover en la fila derecha:
- **Trash2** (Eliminar) — con confirmación inline
- **Gamepad2** (Control) — abra AccountControlPanel
- **UserPlus** (Follow) — follow user

### Animaciones con Framer Motion

1. **Modales**: `AnimatePresence` + fade + scale (0.95 → 1.0, 150ms)
2. **Filas**: `layout` prop — auto-anim al agregar/eliminar
3. **Reorder**: `Reorder.Group` + `Reorder.Item` — drag-to-sort con animación
4. **Hover**: `whileHover={{ scale: 1.02 }}` en botones, `whileTap={{ scale: 0.98 }}`
5. **Context menu**: `AnimatePresence` slide-down desde fila
6. **Dock contextual**: `AnimatePresence` — botones contextuales aparecen/desaparecen suavemente

### Design System — Refinamientos

```css
/* Mantener colores base */
--primary: #DE350D;
--bg-dark: #0D0D0D;
--bg-card: #141414;
--bg-surface: #1A1A1A;
--border: #2A2A2A;

/* NUEVOS tokens */
--dock-height: 56px;       /* h-14 unificado */
--row-height: 40px;        /* compacto */
--action-fade: 150ms;      /* fade de row actions */
--modal-overlay: rgba(0, 0, 0, 0.50);
--modal-radius: 8px;       /* cards 4px, modals 8px */
--shadow-modal: 0 8px 32px rgba(0, 0, 0, 0.4);
```

### Estructura de Componentes

```
src/renderer/
  App.tsx                    → Layout shell + state orchestration
  components/
    layout/
      Header.tsx            → Logo + counter + global toggles
      Dock.tsx              → Unified Place/Job + actions bar
    accounts/
      AccountList.tsx       → Reorder.Group container
      AccountRow.tsx        → Reorder.Item + row content + hover actions
      AccountTable.tsx      → (deprecated → AccountList)
    modals/
      ModalShell.tsx        → Reusable AnimatePresence modal wrapper
      AddAccountModal.tsx  → (existing, add Framer Motion)
      ServerBrowserModal.tsx
      SettingsModal.tsx
      EditAliasModal.tsx
      EditDescModal.tsx
    context-menu/
      AccountContextMenu.tsx → DropdownMenu for row actions
  animations/
    variants.ts             → Shared Framer Motion variants
```

### Shared Animation Variants (animations/variants.ts)

```ts
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};

export const modalContent = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.15 }
};

export const rowHover = {
  whileHover: { scale: 1.0 },
  transition: { duration: 0.1 }
};

export const buttonTap = {
  whileTap: { scale: 0.98 },
  whileHover: { scale: 1.02 },
  transition: { duration: 0.1 }
};

export const slideDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.15 }
};
```

---

## 6. RESUMEN DE CAMBIOS

### Eliminado
- Action bar separada (fusionada con Place/Job bar → Dock unificado)
- 6 botones globales redundantes (Elimina, Abrir App, Control, Follow → row-level/contextual)
- Modales custom inline (reemplazados por ModalShell reutilizable)

### Nuevo
- Dock unificado (Place/Job + acciones en una sola barra)
- Botón "Jugar" inteligente (unifica Join Server + Abrir App)
- Row-level actions (Eliminar, Control, Follow aparecen en hover)
- "More" (⋯) dropdown para acciones secundarias
- Framer Motion: modal transitions, row animations, reorder, hover feedback
- `animations/variants.ts` — shared animation variants
- Drag-to-reorder de cuentas (Reorder.Group)

### Mejorado
- Eliminación de redundancia: 10 botones → 4 globales + 3 row-level
- Visual hierarchy más clara ( guía del ojo)
- Contextual UI (acciones aparecen según contexto — Roblox principle)
- Feedback táctil (whileHover, whileTap)
- Progressive disclosure (More menu para acciones raras)

### Futuro (preparado, no implementado)
- Auto Relaunch toggle en More menu
- Connection Watcher toggle en More menu
- Account Grouping (Collapsible groups)
- Copy rbx-player link
- Quick Log In
