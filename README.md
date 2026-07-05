# NexoAccManager

**Herramienta libre y de c?digo abierto para la gesti?n de m?ltiples cuentas e instancias de plataformas de juego.**

? Moderna ? Segura ? 100% Local ? Sin l?mites artificiales (m?x 50 cuentas)

## ? Caracter?sticas

- **Gesti?n de m?ltiples cuentas** — Agrega, organiza y cambia entre hasta 50 cuentas
- **Cifrado AES-256-GCM** — Todas las credenciales almacenadas localmente con cifrado fuerte
- **Account Control Panel** — Perfil, seguridad, privacidad, amigos y notificaciones
- **Server Browser** — Busca servidores por regi?n, ping y n?mero de jugadores
- **Presence Dashboard** — Monitoreo en tiempo real del estado de todas tus cuentas
- **Temas personalizables** — Dark, Light, Classic y Custom (todos disponibles)
- **i18n completo** — Espa?ol, English, Portugu?s
- **Multi-instancia** — Ejecuta m?ltiples cuentas simult?neamente

## ? Stack T?cnico

| Componente          | Tecnolog?a                     |
|---------------------|-------------------------------|
| **App**             | Electron + React + TypeScript |
| **Estado**          | Zustand                       |
| **Base de datos**   | SQLite + better-sqlite3       |
| **Cifrado**         | AES-256-GCM                   |
| **IPC Security**    | contextBridge + sandbox       |
| **i18n**            | i18next + react-i18next       |
| **Build**           | electron-builder              |

## ? Instalaci?n

### Desde GitHub Releases
Descarga el instalador para tu plataforma desde la [p?gina de releases](https://github.com/Nxxo31/NexoAccManager/releases).

### Compilar desde el c?digo fuente

```bash
# Clonar el repositorio
git clone https://github.com/Nxxo31/NexoAccManager.git
cd NexoAccManager

# Instalar dependencias
npm install

# Compilar para desarrollo
npm run dev

# Compilar para producci?n
npm run build
```

## ? Uso

1. Abre la aplicaci?n
2. Agrega tus cuentas usando las cookies de sesi?n
3. Organiza tus cuentas en grupos
4. Lanza instancias de juego directamente desde la app
5. Monitorea el estado de todas tus cuentas en tiempo real

## ?? Seguridad

- **100% Local** — Tus datos nunca salen de tu dispositivo
- **Sin servidores** — No hay backend, no hay nube, no hay tracking
- **Sin recolecci?n de datos** — No enviamos anal?ticas ni telemetr?a
- **C?digo auditable** — Todo el c?digo es p?blico y revisable

## ?? Contribuir

?Eres bienvenido a contribuir! Revisa [CONTRIBUTING.md](CONTRIBUTING.md) para gu?as.

- Reporta bugs en [Issues](https://github.com/Nxxo31/NexoAccManager/issues)
- Env?a PRs siguiendo las gu?as de estilo del proyecto
- Discute ideas en [Discussions](https://github.com/Nxxo31/NexoAccManager/discussions)

## ? Licencia

MIT License — Ver [LICENSE](LICENSE) para detalles completos.

---

**Disclaimer:** Este proyecto no est? afiliado, respaldado ni patrocinado por ninguna plataforma de juego o empresa. El uso de este software es responsabilidad exclusiva del usuario final.

---