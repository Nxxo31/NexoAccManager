# NexoAccManager

Herramienta libre y de código abierto para la gestión de múltiples cuentas e instancias de plataformas de juego.

Moderna · Segura · 100% Local · Sin límites artificiales (máx 50 cuentas)

---

## Características

- **Gestión de múltiples cuentas** — Agrega, organiza y cambia entre hasta 50 cuentas
- **Cifrado AES-256-GCM** — Todas las credenciales almacenadas localmente con cifrado fuerte
- **Account Control Panel** — Perfil, seguridad, privacidad, amigos y notificaciones
- **Server Browser** — Busca servidores por región, ping y número de jugadores
- **Presence Dashboard** — Monitoreo en tiempo real del estado de todas tus cuentas
- **Temas personalizables** — Dark, Light, Roblox Classic y Custom (todos disponibles)
- **Multi-instancia** — Ejecuta múltiples cuentas simultáneamente
- **i18n completo** — Español, English, Português
- **Sin backend** — 100% local, sin servidores, sin nube, sin tracking

---

## Instalación

### Opción 1 — Descargar el ejecutable (usuarios finales)

1. Ve a la [página de Releases](https://github.com/Nxxo31/NexoAccManager/releases)
2. Descarga el instalador para tu sistema operativo:
   - **Windows**: `NexoAccManager-Setup-x.y.z.exe` (instalador NSIS)
3. Ejecuta el instalador y sigue los pasos
4. Abre NexoAccManager desde el menú de inicio o el acceso en el escritorio

### Opción 2 — Compilar desde el código fuente (desarrolladores)

Requisitos:
- Node.js 18 o superior
- npm 9 o superior
- Git

```bash
# Clonar el repositorio
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager

# Instalar dependencias
npm install

# Compilar para producción (genera instalador en /release)
npm run build
```

El instalador se genera en `release/` como un archivo `.exe` (Windows NSIS).

### Opción 3 — Ejecutar en modo desarrollo

```bash
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager
npm install
npm run dev
```

---

## Uso

1. **Abre la aplicación**
2. **Agrega una cuenta** — Pega tu cookie `.ROBLOSECURITY` en el formulario (máx 50 cuentas)
3. **Organiza en grupos** — Asigna grupos para mantener tus cuentas organizadas
4. **Lanza instancias** — Usa el botón Jugar para abrir el juego con la cuenta seleccionada
5. **Monitorea estado** — El Presence Dashboard muestra el estado online de todas tus cuentas en tiempo real
6. **Explora servidores** — Busca servidores por PlaceId, filtra por región/ocupación y distribuye tus cuentas

### Cómo obtener tu cookie .ROBLOSECURITY

1. Inicia sesión en [roblox.com](https://www.roblox.com)
2. Abre las herramientas de desarrollador del navegador (F12)
3. Ve a Application → Storage → Cookies → `https://www.roblox.com`
4. Busca la cookie llamada `.ROBLOSECURITY`
5. Copia su valor (empieza con `_|WARNING:-DO-NOT-SHARE|_`)
6. Pégala en NexoAccManager

**Importante:** Nunca compartas tu cookie. Es equivalente a tu contraseña de sesión.

---

## Seguridad

- **100% Local** — Tus datos nunca salen de tu dispositivo
- **Sin servidores** — No hay backend, no hay nube, no hay tracking
- **Sin recolección de datos** — No enviamos analíticas ni telemetría
- **Cifrado AES-256-GCM** — Las cookies se cifran localmente derivadas del hardware
- **Sandbox activo** — contextIsolation + sandbox + nodeIntegration deshabilitado
- **Código auditable** — Todo el código es público y revisable

---

## Stack técnico

| Componente       | Tecnología                     |
|------------------|-------------------------------|
| App              | Electron + React + TypeScript |
| Estado           | Zustand                       |
| Base de datos    | SQLite + better-sqlite3       |
| Cifrado          | AES-256-GCM                   |
| IPC Security     | contextBridge + sandbox       |
| i18n             | i18next + react-i18next       |
| Build            | electron-builder (NSIS)       |

---

## Contribuir

Eres bienvenido a contribuir. Revisa [CONTRIBUTING.md](CONTRIBUTING.md) para las guías completas.

- Reporta bugs en [Issues](https://github.com/Nxxo31/NexoAccManager/issues)
- Envía PRs siguiendo las guías de estilo del proyecto
- Discute ideas en [Discussions](https://github.com/Nxxo31/NexoAccManager/discussions)

---

## Licencia

MIT License — Ver [LICENSE](LICENSE) para detalles completos.

---

**Disclaimer:** Este proyecto no está afiliado, respaldado ni patrocinado por Roblox Corporation ni ninguna otra empresa. El uso de este software es responsabilidad exclusiva del usuario final. Las marcas mencionadas pertenecen a sus respectivos propietarios.
