/**
 * MultiRobloxService - Servicio para lanzar múltiples instancias de Roblox
 *
 * Para permitir múltiples instancias simultáneas de Roblox Player en Windows,
 * necesitamos:
 * 1. Deshabilitar el mutex de instancia única en el registro de Windows
 * 2. Crear directorios de perfil temporales para cada instancia
 * 3. Limpiar perfiles temporales antiguos al iniciar la aplicación
 *
 * Referencia: https://ic3w0lf22.gitbook.io/roblox-account-manager/multi-roblox
 */
import { execSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { promisify } from 'util';
import { exec as execCb } from 'child_process';

export class MultiRobloxService {
  private static readonly REGISTRY_PATH = 'HKEY_CURRENT_USER\\\\Software\\\\ROBLOX Corporation\\\\Roblox';
  private static readonly REGISTRY_KEY = 'MutiplayerApplication';
  private static readonly PROFILE_DIR = 'nexoaccmanager_profiles';

  private originalValue: string | null = null;

  /**
   * Verifica si Multi-Roblox está habilitado en el sistema
   */
  isEnabled(): boolean {
    if (process.platform !== 'win32') return false;

    try {
      const result = execSync(
        `reg query "${MultiRobloxService.REGISTRY_PATH}" /v "${MultiRobloxService.REGISTRY_KEY}"`,
      );
      return result.toString().includes('0x0');
    } catch {
      // Si falla la consulta, asumimos que está deshabilitado (valor por defecto 1)
      return false;
    }
  }

  /**
   * Habilita Multi-Roblox deshabilitando el mutex de instancia única
   */
  enable(): void {
    if (process.platform !== 'win32') return;

    try {
      // Guardar el valor original
      const current = execSync(
        `reg query "${MultiRobloxService.REGISTRY_PATH}" /v "${MultiRobloxService.REGISTRY_KEY}"`,
      ).toString();
      this.originalValue = current.split(/\s+/).pop() || '0x1';

      // Establecer a 0x0 para permitir múltiples instancias
      execSync(
        `reg add "${MultiRobloxService.REGISTRY_PATH}" /v "${MultiRobloxService.REGISTRY_KEY}" /t REG_DWORD /d 0x0 /f`,
      );
    } catch (error) {
      console.error('Error enabling Multi-Roblox:', error);
    }
  }

  /**
   * Deshabilita Multi-Roblox restaurando el valor original
   */
  disable(): void {
    if (process.platform !== 'win32' || !this.originalValue) return;

    try {
      execSync(
        `reg add "${MultiRobloxService.REGISTRY_PATH}" /v "${MultiRobloxService.REGISTRY_KEY}" /t REG_DWORD /d ${this.originalValue} /f`,
      );
    } catch (error) {
      console.error('Error disabling Multi-Roblox:', error);
    }
  }

  /**
   * Obtiene el directorio de datos de usuario de Roblox para un perfil
   */
  getRobloxUserDataDir(profilePath: string): string {
    return path.join(profilePath, 'LocalStorage');
  }

  /**
   * Crea un directorio de perfil temporal para una instancia de Roblox
   * @param index Índice de la instancia
   * @returns Ruta al directorio de perfil creado
   */
  createProfile(index: number): string {
    const basePath = path.join(app.getPath('userData'), MultiRobloxService.PROFILE_DIR);
    const profilePath = path.join(basePath, `profile_${index}`);

    // Crear el directorio si no existe
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
      // Crear estructura básica de carpetas de Roblox
      fs.mkdirSync(path.join(profilePath, 'LocalStorage'), { recursive: true });
      fs.mkdirSync(path.join(profilePath, 'Cookies'), { recursive: true });
    }

    return profilePath;
  }

  /**
   * Limpia perfiles temporales antiguos (más de 24 horas)
   */
  cleanupOldProfiles(): void {
    const basePath = path.join(app.getPath('userData'), MultiRobloxService.PROFILE_DIR);
    if (!fs.existsSync(basePath)) return;

    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 horas
    const items = fs.readdirSync(basePath);

    for (const item of items) {
      const itemPath = path.join(basePath, item);
      try {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory() && stats.mtimeMs < cutoffTime) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        }
      } catch (error) {
        // Ignorar errores de limpieza individuales
        console.warn(`Could not clean profile ${item}:`, error);
      }
    }
  }

  /**
   * Verifica si el sistema puede ejecutar Multi-Roblox
   */
  static isSupported(): boolean {
    return process.platform === 'win32';
  }

  /**
   * Mata todas las instancias de Roblox Player
   * @returns Número de procesos terminados
   */
  async killAll(): Promise<{ killed: number }> {
    const exec = promisify(execCb);
    try {
      const platform = process.platform;
      let killed = 0;
      const TIMEOUT_MS = 5000;

      let command: string;
      if (platform === 'win32') {
        command = 'taskkill /IM "RobloxPlayerBeta.exe" /F';
      } else if (platform === 'linux' || platform === 'darwin') {
        command = 'pkill -f "RobloxPlayer" || pkill -f "roblox" || true';
      } else {
        throw new Error(`Plataforma no soportada: ${platform}`);
      }

      try {
        const { stdout, stderr } = await exec(command, { timeout: TIMEOUT_MS });
        // stdout contiene el conteo de procesos terminados en Windows
        const match = stdout.match(/TERMINATED\s+(\d+)/i);
        killed = match ? parseInt(match[1], 10) : 1;
        if (stderr && stderr.trim()) {
          console.warn('[kill-all] stderr:', stderr.trim());
        }
      } catch (e: any) {
        // pkill retorna código 1 cuando no hay procesos que matar — no es error real
        if (e.code !== 1) {
          console.warn('[kill-all] Error:', e.message);
        }
        // Si no hay procesos, killed queda en 0
      }

      return { killed };
    } catch (e) {
      throw new Error(`Error cerrando instancias: ${(e as Error).message}`);
    }
  }
}