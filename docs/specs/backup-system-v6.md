# SPEC: Sistema de Respaldos Encriptados Locales (Feature Set 6.0 - P1)

## Objetivo
Implementar un sistema de respaldos **100% local, encriptado con AES-256-GCM**, programable y manual, que permita al usuario respaldar y restaurar la base de datos de cuentas (`nexoacc.db`) y settings de forma segura.

## Alcance
- Backup completo del archivo SQLite (`nexoacc.db`)
- Backup opcional del archivo de clave secreta (`.nam-secret`) — **solo si el usuario lo autoriza explícitamente**
- Encriptación AES-256-GCM usando `CryptoService` existente (clave derivada de `NAM_SECRET` o archivo local)
- Almacenamiento en carpeta seleccionable por el usuario (diálogo nativo Electron)
- Programación: diario/semanal/mensual + manual bajo demanda
- Restauración segura con validación de integridad
- UI integrada en Settings → pestaña General → accordion "Data" (existente)

## Principios de Seguridad
- **Cero confianza**: El archivo de backup encriptado es inútil sin la clave maestra (derivada de `NAM_SECRET` o `.nam-secret`)
- **Sin servidores**: Todo local, sin red
- **Integridad**: Cada backup incluye checksum SHA-256 del contenido original para detectar corrupción/tampering
- **Versionado**: Formato de backup con versión para migraciones futuras

## Arquitectura

### 1. Domain Layer
```
src/domain/services/BackupService.ts       // Interface + lógica pura
src/domain/entities/BackupMetadata.ts      // Entidad de metadatos del backup
src/domain/repositories/BackupRepository.ts // Interface repositorio
```

### 2. Application Layer
```
src/application/hooks/useBackups.ts        // Hook React para UI
src/application/components/settings/SettingsBackups.tsx  // Componente UI
```

### 3. Infrastructure Layer
```
src/infrastructure/database/BackupRepositoryImpl.ts     // Implementación filesystem
src/infrastructure/services/BackupScheduler.ts          // node-cron o setInterval para scheduling
src/infrastructure/ipc/handlers/backupHandlers.ts       // IPC handlers
```

### 4. IPC Channels (nuevos)
```
backup:create        → { description?: string } → { backupId, path, size, createdAt }
backup:list          → void → BackupMetadata[]
backup:restore       → { backupId: string, confirm: boolean } → { success, restoredTables }
backup:delete        → { backupId: string } → { success }
backup:schedule:get  → void → BackupSchedule | null
backup:schedule:set  → { enabled: boolean, frequency: 'daily'|'weekly'|'monthly', time: string } → { success }
backup:select-folder → void → { path } | null
```

### 5. Preload / window-api.d.ts
Añadir namespace `backup` con tipado completo.

## Formato de Archivo de Backup

```typescript
interface EncryptedBackupFile {
  version: 1;
  createdAt: string;           // ISO 8601
  originalSize: number;        // bytes del .db original
  checksum: string;            // SHA-256 hex del .db original (pre-encryption)
  encryptedData: string;       // base64(salt || iv || tag || ciphertext)
  includesSecret: boolean;     // si incluye .nam-secret encriptado aparte
  metadata: {
    accountCount: number;
    settingsCount: number;
    appVersion: string;
  };
}
```

## Encriptación
- Usar `CryptoService.encrypt()` / `decrypt()` existentes (AES-256-GCM, PBKDF2 100k iteraciones, salt aleatorio por backup)
- El archivo `.nam-secret` (si se incluye) se encripta **con la misma clave** y se almacena como campo separado en el backup

## Scheduling
- Opciones: `disabled` | `daily` | `weekly` | `monthly`
- Hora: string `HH:mm` (24h, zona local del usuario)
- Implementación: `node-cron` (nueva dep) o `setInterval` con persistencia en settings DB
- Persistir schedule en settings: `backup.schedule` (JSON)

## UI (SettingsData.tsx → SettingsBackups.tsx)
Extender el accordion "Data" existente con:
- Botón "Crear respaldo ahora"
- Lista de respaldos con: fecha, tamaño, nº cuentas, botón restaurar/eliminar
- Selector de carpeta de respaldos
- Configuración de schedule (frecuencia + hora)
- Indicador de último respaldo automático

## Validación de Restauración
1. Desencriptar backup → verificar checksum SHA-256 coincide
2. Verificar versión de backup compatible
3. Backup actual de `.db` antes de restaurar (safety)
4. Reemplazar archivo `.db` + reiniciar app (o recargar DB connection)
5. Si `includesSecret`: restaurar `.nam-secret` (requiere confirmación extra)

## Edge Cases
- Backup folder no accesible → error claro
- Backup corrupto (checksum fail) → bloquear restauración
- App version mismatch → advertencia pero permitir
- Restore durante operación crítica → bloquear o cola
- Schedule overlap → skip si backup anterior en progreso

## Testing
- Unit: encrypt/decrypt roundtrip, checksum validation, schedule parsing
- Integration: create → list → restore → verify data integrity
- E2E: manual backup + scheduled backup trigger

## Gates (Enterprise Dev Workflow)
- G1-G3: Analysis, Design, Implementation
- G4: LSP clean (typescript, eslint)
- G5: Code review subagent
- G6: Self-review checklist
- G7: typecheck + lint + build + adversarial (security review encriptación)
- G8: Commit