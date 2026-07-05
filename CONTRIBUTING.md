# Guia de Contribucion — NexoAccManager

?Gracias por tu interes en contribuir a NexoAccManager! Este documento explica como colaborar efectivamente.

## ? Filosofia del Proyecto

- **OpenSource primero** — Todo el codigo es publico, auditable y modificable
- **Privacidad del usuario** — Sin telemetria, sin tracking, sin servidores
- **Seguridad ante todo** — Cifrado AES-256-GCM, contextIsolation, sandbox
- **Multi-plataforma** — Electron permite Windows, Mac y Linux

## ? Como Contribuir

### 1. Configurar el Entorno

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev
```

### 2. Encontrar Algo en que Trabajar

- Revisa [Issues](https://github.com/Nxxo31/NexoAccManager/issues) con label `good first issue`
- Comenta en el issue para que sepamos que estas trabajando en el
- Si tienes una idea nueva, abre un [Discussion](https://github.com/Nxxo31/NexoAccManager/discussions) primero

### 3. Flujo de Trabajo

```bash
# Crear branch
git checkout -b feature/mi-feature

# Desarrollar siguiendo las reglas del proyecto
# - Usar IPC tipado con invoke/handle
# - Validar datos en ambos lados (main + renderer)
# - Seguir el design system (colores, glassmorphism)
# - Documentar en espanol preferiblemente

# Verificar que compila
npm run typecheck && npm run lint && npm run build

# Commitear
git add -A
git commit -m "tipo(scope): descripcion en espanol"

# Subir y crear PR
git push origin feature/mi-feature
# Crear Pull Request en GitHub
```

### 4. Convenciones

| Tipo de commit | Descripcion              | Ejemplo                    |
|----------------|-------------------------|----------------------------|
| feat           | Nueva funcionalidad      | feat(account): agregar soporte multi-idioma |
| fix            | Correccion de bug        | fix(ipc): validar cookies antes de guardar |
| refactor       | Refactorizacion          | refactor(theme): simplificar ThemeService |
| docs           | Documentacion            | docs: actualizar README    |
| style          | Cambios de UI/UX         | style(panel): ajustar glassmorphism |
| chore          | Tareas de mantenimiento  | chore: actualizar dependencias |

### 5. Guias de Codigo

- **TypeScript estricto** — No usar `any`, tipar todo
- **IPC namespacing** — `account:*`, `roblox:*`, `settings:*`, `theme:*`, `i18n:*`, `advanced:*`
- **Result pattern** — `{ success, data }` | `{ success: false, error }`
- **Seguridad** — contextBridge solo expone funciones especificas, nunca ipcRenderer raw
- **Estilo visual** — Usar las variables CSS del design system, glassmorphism, Inter/JetBrains Mono

### 6. Antes de Enviar PR

- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run lint` pasa sin warnings
- [ ] `npm run build` genera binarios correctamente
- [ ] Si es funcionalidad nueva: ?tiene tests?
- [ ] Si es UI: ?respeta el design system?
- [ ] Si es IPC: ?usa invoke/handle y validacion de tipos?

## ? Soporte

- **Issues** para bugs y features requests
- **Discussions** para ideas y preguntas generales
- **PRs** para contribuciones de codigo

?Gracias por ayudar a construir NexoAccManager!

---