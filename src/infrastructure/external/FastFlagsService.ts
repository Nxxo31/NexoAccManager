// Infrastructure: FastFlagsService — Lee/escribe ClientAppSettings.json en carpetas de versión de Roblox
// Soporta get/set/delete flags, import/export JSON
// Flags comunes: DFIntTaskSchedulerTargetFps (FPS unlock), FIntDebugForceFlagValue, etc.

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { FastFlag } from '../../domain/entities/FastFlag';

/**
 * Encuentra el directorio de la versión más reciente de Roblox
 * %localappdata%\Roblox\Versions\version-*
 * @returns Ruta al directorio de la versión más reciente o null si no se encuentra
 */
function getLatestRobloxVersionDir(): string | null {
  try {
    const localAppData = process.env.LOCALAPPDATA || (process.env.HOME && `${process.env.HOME}/AppData/Local`);
    if (!localAppData) return null;

    const versionsDir = path.join(localAppData, 'Roblox', 'Versions');
    if (!fs.existsSync(versionsDir)) return null;

    const entries = fs.readdirSync(versionsDir);
    const versionDirs = entries
      .filter((entry) => entry.startsWith('version-') && fs.statSync(path.join(versionsDir, entry)).isDirectory())
      .map((dir) => ({
        name: dir,
        path: path.join(versionsDir, dir),
        mtime: fs.statSync(path.join(versionsDir, dir)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // Más reciente primero

    return versionDirs.length > 0 ? versionDirs[0].path : null;
  } catch (error) {
    console.error('Error finding Roblox version directory:', error);
    return null;
  }
}

/**
 * Obtiene la ruta al archivo ClientAppSettings.json
 * @returns Ruta al archivo o null si no se encuentra
 */
function getClientAppSettingsPath(): string | null {
  const versionDir = getLatestRobloxVersionDir();
  if (!versionDir) return null;
  return path.join(versionDir, 'ClientAppSettings.json');
}

/**
 * Lee el archivo ClientAppSettings.json y lo parsea
 * @returns Objeto con las flags o objeto vacío si no existe/error
 */
export function readClientAppSettings(): Record<string, unknown> {
  const filePath = getClientAppSettingsPath();
  if (!filePath || !fs.existsSync(filePath)) return {};

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading ClientAppSettings.json:', error);
    return {};
  }
}

/**
 * Escribe el objeto de settings al archivo ClientAppSettings.json
 * @param settings Objeto con las flags a guardar
 */
export function writeClientAppSettings(settings: Record<string, unknown>): boolean {
  const filePath = getClientAppSettingsPath();
  if (!filePath) return false;

  try {
    const versionDir = path.dirname(filePath);
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }

    const content = JSON.stringify(settings, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing ClientAppSettings.json:', error);
    return false;
  }
}

/**
 * Obtiene todas las flags como un array de FastFlag
 * @returns Array de objetos FastFlag
 */
export function getAllFastFlags(): FastFlag[] {
  const settings = readClientAppSettings();
  const flags: FastFlag[] = [];

  for (const [name, value] of Object.entries(settings)) {
    // Determinar categoría basada en el prefijo
    let category = 'General';
    if (name.startsWith('DFInt')) category = 'Integer';
    else if (name.startsWith('FInt')) category = 'Integer';
    else if (name.startsWith('DFBool')) category = 'Boolean';
    else if (name.startsWith('FFlag')) category = 'Flag';
    else if (name.startsWith('DFString')) category = 'String';

    flags.push({
      name,
      value: value as string | number | boolean,
      description: '',
      category,
    });
  }

  return flags;
}

/**
 * Obtiene una flag específica por nombre
 * @param name Nombre de la flag
 * @returns Objeto FastFlag o null si no existe
 */
export function getFastFlag(name: string): FastFlag | null {
  const settings = readClientAppSettings();
  const value = settings[name];

  if (value === undefined) return null;

  // Determinar categoría basada en el prefijo
  let category = 'General';
  if (name.startsWith('DFInt')) category = 'Integer';
  else if (name.startsWith('FInt')) category = 'Integer';
  else if (name.startsWith('DFBool')) category = 'Boolean';
  else if (name.startsWith('FFlag')) category = 'Flag';
  else if (name.startsWith('DFString')) category = 'String';

  return {
    name,
    value: value as string | number | boolean,
    description: '',
    category,
  };
}

/**
 * Establece o actualiza una flag
 * @param name Nombre de la flag
 * @param value Valor de la flag (string, number o boolean)
 * @returns true si se guardó exitosamente
 */
export function setFastFlag(name: string, value: string | number | boolean): boolean {
  const settings = readClientAppSettings();
  settings[name] = value;
  return writeClientAppSettings(settings);
}

/**
 * Elimina una flag
 * @param name Nombre de la flag a eliminar
 * @returns true si se eliminó exitosamente
 */
export function deleteFastFlag(name: string): boolean {
  const settings = readClientAppSettings();
  if (!(name in settings)) return false;

  delete settings[name];
  return writeClientAppSettings(settings);
}

/**
 * Importa flags desde un objeto JSON
 * @param json Objeto con las flags a importar
 * @returns Número de flags importadas
 */
export function importFlagsFromJson(json: Record<string, unknown>): number {
  const settings = readClientAppSettings();
  let count = 0;

  for (const [key, value] of Object.entries(json)) {
    // Solo sobrescribir si el valor es un tipo válido (string, number, boolean)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      settings[key] = value;
      count++;
    }
  }

  writeClientAppSettings(settings);
  return count;
}

/**
 * Exporta todas las flags como un objeto JSON
 * @returns Objeto con todas las flags
 */
export function exportFlagsToJson(): Record<string, unknown> {
  return readClientAppSettings();
}

/**
 * Obtiene el espacio libre en el directorio de versiones de Roblox (aproximado)
 * @returns Espacio libre en bytes o 0 si no se puede determinar
 */
export function getFreeSpaceInRobloxDir(): number {
  try {
    const versionDir = getLatestRobloxVersionDir();
    if (!versionDir) return 0;

    const stats = fs.statfsSync(versionDir);
    return stats.bfree * stats.bsize;
  } catch (error) {
    // statfs no está disponible en todos los sistemas
    return 0;
  }
}