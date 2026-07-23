// Infrastructure: CacheCleanerService — Limpia archivos de caché y temporales de Roblox
// Limpia: %temp%\Roblox\*, %localappdata%\Roblox\temp\*, archivos de log antiguos
// Devuelve el espacio liberado en bytes

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Obtiene el directorio de TEMP de Windows
 * %temp%\Roblox
 * @returns Ruta al directorio de temp de Roblox o null si no se encuentra
 */
function getRobloxTempDir(): string | null {
  try {
    const tempDir = process.env.TEP || process.env.TMP || (process.env.HOME && `${process.env.HOME}/AppData/Local/Temp`);
    if (!tempDir) return null;

    const robloxTempDir = path.join(tempDir, 'Roblox');
    if (!fs.existsSync(robloxTempDir)) return null;
    return robloxTempDir;
  } catch (error) {
    console.error('Error finding Roblox temp directory:', error);
    return null;
  }
}

/**
 * Obtiene el directorio de temp interno de Roblox
 * %localappdata%\Roblox\temp
 * @returns Ruta al directorio de temp interno o null si no se encuentra
 */
function getRobloxInternalTempDir(): string | null {
  try {
    const localAppData = process.env.LOCALAPPDATA || (process.env.HOME && `${process.env.HOME}/AppData/Local`);
    if (!localAppData) return null;

    const internalTempDir = path.join(localAppData, 'Roblox', 'temp');
    if (!fs.existsSync(internalTempDir)) return null;
    return internalTempDir;
  } catch (error) {
    console.error('Error finding Roblox internal temp directory:', error);
    return null;
  }
}

/**
 * Obtiene el directorio de logs de Roblox
 * %localappdata%\Roblox\logs
 * @returns Ruta al directorio de logs o null si no se encuentra
 */
function getRobloxLogsDir(): string | null {
  try {
    const localAppData = process.env.LOCALAPPDATA || (process.env.HOME && `${process.env.HOME}/AppData/Local`);
    if (!localAppData) return null;

    const logsDir = path.join(localAppData, 'Roblox', 'logs');
    if (!fs.existsSync(logsDir)) return null;
    return logsDir;
  } catch (error) {
    console.error('Error finding Roblox logs directory:', error);
    return null;
  }
}

/**
 * Calcula el tamaño de un directorio recursivamente
 * @param dirPath Ruta al directorio
 * @returns Tamaño en bytes
 */
function getDirectorySize(dirPath: string): number {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        size += getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        size += stats.size;
      }
    }
  } catch (error) {
    // Si no podemos leer el directorio, asumir tamaño 0
    console.warn(`Could not calculate size for ${dirPath}:`, error);
  }
  
  return size;
}

/**
 * Elimina recursivamente un directorio y devuelve el espacio liberado
 * @param dirPath Ruta al directorio a eliminar
 * @returns Espacio liberado en bytes
 */
function deleteDirectoryAndGetSize(dirPath: string): number {
  const sizeBefore = getDirectorySize(dirPath);
  
  try {
    function removeDirRecursive(currentPath: string) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          removeDirRecursive(fullPath);
        } else if (entry.isFile()) {
          fs.unlinkSync(fullPath);
        }
      }
      
      fs.rmdirSync(currentPath);
    }
    
    removeDirRecursive(dirPath);
    return sizeBefore;
  } catch (error) {
    console.error(`Error deleting directory ${dirPath}:`, error);
    return 0; // No se pudo liberar espacio
  }
}

/**
 * Elimina archivos antiguos (más de X días) en un directorio
 * @param dirPath Ruta al directorio
 * @param daysOld Edad mínima en días para eliminar
 * @returns Espacio liberado en bytes
 */
function deleteOldFilesInDirectory(dirPath: string, daysOld: number): number {
  let spaceFreed = 0;
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  try {
    function processDirectory(currentPath: string) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          processDirectory(fullPath);
        } else if (entry.isFile()) {
          try {
            const stats = fs.statSync(fullPath);
            if (stats.mtime.getTime() < cutoffTime) {
              spaceFreed += stats.size;
              fs.unlinkSync(fullPath);
            }
          } catch (error) {
            // Ignorar errores individuales de archivos
          }
        }
      }
    }
    
    processDirectory(dirPath);
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
  
  return spaceFreed;
}

/**
 * Limpia el directorio temp de Roblox (%temp%\Roblox\*)
 * @returns Espacio liberado en bytes
 */
export function cleanRobloxTemp(): number {
  const tempDir = getRobloxTempDir();
  if (!tempDir) return 0;
  
  return deleteDirectoryAndGetSize(tempDir);
}

/**
 * Limpia el directorio temp interno de Roblox (%localappdata%\Roblox\temp\*)
 * @returns Espacio liberado en bytes
 */
export function cleanRobloxInternalTemp(): number {
  const tempDir = getRobloxInternalTempDir();
  if (!tempDir) return 0;
  
  return deleteDirectoryAndGetSize(tempDir);
}

/**
 * Limpia archivos de log antiguos (más de 7 días) en %localappdata%\Roblox\logs\*
 * @returns Espacio liberado en bytes
 */
export function cleanOldLogs(): number {
  const logsDir = getRobloxLogsDir();
  if (!logsDir) return 0;
  
  return deleteOldFilesInDirectory(logsDir, 7); // Mantener logs de los últimos 7 días
}

/**
 * Limpieza completa de caché de Roblox
 * @returns Objeto con detalle del espacio liberado por categoría y total
 */
export function cleanRobloxCache(): {
  temp: number;
  internalTemp: number;
  oldLogs: number;
  total: number;
} {
  const temp = cleanRobloxTemp();
  const internalTemp = cleanRobloxInternalTemp();
  const oldLogs = cleanOldLogs();
  const total = temp + internalTemp + oldLogs;
  
  return {
    temp,
    internalTemp,
    oldLogs,
    total,
  };
}

/**
 * Obtiene el tamaño total de los directorios de caché de Roblox sin limpiarlos
 * @returns Objeto con detalle del tamaño por categoría y total
 */
export function getRobloxCacheSize(): {
  temp: number;
  internalTemp: number;
  logs: number;
  total: number;
} {
  let tempSize = 0;
  let internalTempSize = 0;
  let logsSize = 0;
  
  const tempDir = getRobloxTempDir();
  if (tempDir) {
    tempSize = getDirectorySize(tempDir);
  }
  
  const internalTempDir = getRobloxInternalTempDir();
  if (internalTempDir) {
    internalTempSize = getDirectorySize(internalTempDir);
  }
  
  const logsDir = getRobloxLogsDir();
  if (logsDir) {
    logsSize = getDirectorySize(logsDir);
  }
  
  return {
    temp: tempSize,
    internalTemp: internalTempSize,
    logs: logsSize,
    total: tempSize + internalTempSize + logsSize,
  };
}