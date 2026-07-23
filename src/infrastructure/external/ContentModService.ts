// Infrastructure: ContentModService — Copia/restaura archivos de contenido de Roblox
// Soporta backup/restore de death sounds, mouse cursors, fonts, textures

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Obtiene el directorio de contenido de Roblox
 * %localappdata%\Roblox\content
 * @returns Ruta al directorio de contenido o null si no se encuentra
 */
function getRobloxContentDir(): string | null {
  try {
    const localAppData = process.env.LOCALAPPDATA || (process.env.HOME && `${process.env.HOME}/AppData/Local`);
    if (!localAppData) return null;

    const contentDir = path.join(localAppData, 'Roblox', 'content');
    if (!fs.existsSync(contentDir)) return null;
    return contentDir;
  } catch (error) {
    console.error('Error finding Roblox content directory:', error);
    return null;
  }
}

/**
 * Obtiene el directorio de backup para modificaciones de contenido
 * %localappdata%\NexoAccManager\content-backup
 * @returns Ruta al directorio de backup
 */
function getBackupDir(): string {
  try {
    const localAppData = process.env.LOCALAPPDATA || (process.env.HOME && `${process.env.HOME}/AppData/Local`);
    if (!localAppData) return path.join(process.env.HOME || '/tmp', 'nexoaccmanager-content-backup');

    const backupDir = path.join(localAppData, 'NexoAccManager', 'content-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  } catch (error) {
    // Fallback a temp directory
    return path.join(process.env.TMPDIR || '/tmp', 'nexoaccmanager-content-backup');
  }
}

/**
 * Hace backup de un archivo o carpeta de contenido
 * @param relativePath Ruta relativa dentro del directorio de contenido de Roblox
 * @returns true si se hizo backup exitosamente
 */
export function backupContent(relativePath: string): boolean {
  try {
    const contentDir = getRobloxContentDir();
    if (!contentDir) return false;

    const sourcePath = path.join(contentDir, relativePath);
    if (!fs.existsSync(sourcePath)) return false;

    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, relativePath);

    // Asegurar que el directorio de destino exista
    const backupDirPath = path.dirname(backupPath);
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }

    // Copiar archivo o directorio
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory()) {
      copyDirectoryRecursive(sourcePath, backupPath);
    } else {
      fs.copyFileSync(sourcePath, backupPath);
    }

    return true;
  } catch (error) {
    console.error(`Error backing up content ${relativePath}:`, error);
    return false;
  }
}

/**
 * Restaura un archivo o carpeta de contenido desde el backup
 * @param relativePath Ruta relativa dentro del directorio de contenido de Roblox
 * @returns true si se restauró exitosamente
 */
export function restoreContent(relativePath: string): boolean {
  try {
    const contentDir = getRobloxContentDir();
    if (!contentDir) return false;

    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, relativePath);
    if (!fs.existsSync(backupPath)) return false;

    const targetPath = path.join(contentDir, relativePath);

    // Eliminar el objetivo existente
    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
    }

    // Asegurar que el directorio de destino exista
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copiar desde backup
    const stats = fs.statSync(backupPath);
    if (stats.isDirectory()) {
      copyDirectoryRecursive(backupPath, targetPath);
    } else {
      fs.copyFileSync(backupPath, targetPath);
    }

    return true;
  } catch (error) {
    console.error(`Error restoring content ${relativePath}:`, error);
    return false;
  }
}

/**
 * Elimina el backup de un archivo o carpeta
 * @param relativePath Ruta relativa dentro del directorio de contenido de Roblox
 * @returns true si se eliminó el backup exitosamente
 */
export function deleteBackup(relativePath: string): boolean {
  try {
    const backupDir = getBackupDir();
    const backupPath = path.join(backupDir, relativePath);
    if (!fs.existsSync(backupPath)) return false;

    const stats = fs.statSync(backupPath);
    if (stats.isDirectory()) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(backupPath);
    }

    return true;
  } catch (error) {
    console.error(`Error deleting backup ${relativePath}:`, error);
    return false;
  }
}

/**
 * Lista todos los backups disponibles
 * @returns Array de rutas relativas que tienen backup
 */
export function listAvailableBackups(): string[] {
  try {
    const backupDir = getBackupDir();
    if (!fs.existsSync(backupDir)) return [];

    const items = fs.readdirSync(backupDir);
    const backups: string[] = [];

    function scanDirectory(dir: string, relativePath: string = '') {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relative = path.join(relativePath, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          scanDirectory(fullPath, relative);
        } else {
          backups.push(relative);
        }
      }
    }

    scanDirectory(backupDir);
    return backups;
  } catch (error) {
    console.error('Error listing available backups:', error);
    return [];
  }
}

/**
 * Función auxiliar para copiar directorios recursivamente
 */
function copyDirectoryRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcItem = path.join(src, item);
    const destItem = path.join(dest, item);
    const stats = fs.statSync(srcItem);

    if (stats.isDirectory()) {
      copyDirectoryRecursive(srcItem, destItem);
    } else {
      fs.copyFileSync(srcItem, destItem);
    }
  }
}

/**
 * Tipos de contenido soportados para modificaciones
 */
export enum ContentModType {
  DEATH_SOUND = 'death-sound',
  MOUSE_CURSOR = 'mouse-cursor',
  FONT = 'font',
  TEXTURE = 'texture',
}

/**
 * Obtiene la ruta común para un tipo de mod de contenido
 * @param type Tipo de mod
 * @param fileName Nombre del archivo (opcional)
 * @returns Ruta relativa dentro del directorio de contenido
 */
export function getContentPath(type: ContentModType, fileName?: string): string {
  switch (type) {
    case ContentModType.DEATH_SOUND:
      return fileName ? `sounds/${fileName}` : 'sounds/';
    case ContentModType.MOUSE_CURSOR:
      return fileName ? `cursors/${fileName}` : 'cursors/';
    case ContentModType.FONT:
      return fileName ? `fonts/${fileName}` : 'fonts/';
    case ContentModType.TEXTURE:
      return fileName ? `textures/${fileName}` : 'textures/';
    default:
      return fileName || '';
  }
}