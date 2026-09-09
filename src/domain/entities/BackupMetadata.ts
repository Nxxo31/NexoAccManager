// Domain Entity: BackupMetadata
// Metadatos de un archivo de backup encriptado

export interface BackupMetadata {
  id: string;                    // UUID del backup (basado en timestamp + random)
  version: number;               // Versión del formato de backup (actual: 1)
  createdAt: string;             // ISO 8601
  originalSize: number;          // Tamaño en bytes del .db original
  checksum: string;              // SHA-256 hex del .db original (pre-encryption)
  encryptedSize: number;         // Tamaño del archivo .enc resultante
  includesSecret: boolean;       // Si incluye .nam-secret encriptado
  metadata: {
    accountCount: number;
    settingsCount: number;
    appVersion: string;
  };
  filePath: string;              // Ruta completa al archivo .enc
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;                  // HH:mm (24h, zona local)
  lastRun?: string;              // ISO 8601 del último run
  nextRun?: string;              // ISO 8601 del próximo run programado
}

export interface BackupFolderConfig {
  path: string;                  // Carpeta seleccionada por el usuario
  lastSelectedAt: string;        // ISO 8601
}