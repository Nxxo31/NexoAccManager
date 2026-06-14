/**
 * MultiRobloxService - Servicio para lanzar mÃºltiples instancias de Roblox
 *
 * Para permitir mÃºltiples instancias simultÃ¡neas de Roblox Player en Windows,
 * necesitamos:
 * 1. Deshabilitar el mutex de instancia Ãºnica en el registro de Windows
 * 2. Crear directorios de perfil temporales para cada instancia
 * 3. Limpiar perfiles temporales antiguos al iniciar la aplicaciÃ³n
 *
 * Referencia: https://ic3w0lf22.gitbook.io/roblox-account-manager/multi-roblox
 */
import { execSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class MultiRobloxService {
  private static readonly REGISTRY_PATH = 'HKEY_CURRENT_USER\\Software\\ROBLOX Corporation\\Roblox';
  private static readonly REGISTRY_KEY = 'MutiplayerApplication';
  private static readonly PROFILE_DIR = 'nexoaccmanager_profiles';

  private originalValue: string | null = null;

  /**
   * Verifica si Multi-Roblox estÃ¡ habilitado en el sistema
   */
  isEnabled(): boolean {
    if (process.platform !== 'win32') return false;

    try {
      const result = execSync(
        `reg query "${MultiRobloxService.REGISTRY_PATH}" /v ${MultiRobloxService.REGISTRY_KEY} 2>nul`,
        { encoding: 'utf-8', timeout: 5000 }
      );
      // Busca el valor de la clave
      const match = result.match(/MutiplayerApplication\s+REG_DWORD\s+0x(\d+)/i);
      if (match) {
        return parseInt(match[1], 16) === 1;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Habilita Multi-Roblox deshabilitando el mutex de instancia Ãºnica
   * Devuelve true si se habilitÃ³ exitosamente
   */
  enable(): boolean {
    if (process.platform !== 'win32') {
      console.warn('[MultiRoblox] Solo disponible en Windows');
      return false;
    }

    try {
      // Verificar si ya estÃ¡ habilitado
      if (this.isEnabled()) {
        console.log('[MultiRoblox] Ya habilitado');
        return true;
      }

      // Guardar valor original por seguridad
      try {
        const result = execSync(
          `reg query "${MultiRobloxService.REGISTRY_PATH}" /v ${MultiRobloxService.REGISTRY_KEY} 2>nul`,
          { encoding: 'utf-8', timeout: 5000 }
        );
        const match = result.match(/MutiplayerApplication\s+REG_\w+\s+(.+)/i);
        if (match) {
          this.originalValue = match[1].trim();
        }
      } catch {
        // La clave no existe aÃºn, no hay valor original que guardar
      }

      // Establecer MutiplayerApplication = 1 (habilitar mÃºltiples instancias)
      execSync(
        `reg add "${MultiRobloxService.REGISTRY_PATH}" /v ${MultiRobloxService.REGISTRY_KEY} /t REG_DWORD /d 1 /f`,
        { timeout: 5000 }
      );

      console.log('[MultiRoblox] Habilitado exitosamente');
      return true;
    } catch (error) {
      console.error('[MultiRoblox] Error al habilitar:', error);
      return false;
    }
  }

  /**
   * Deshabilita Multi-Roblox restaurando el mutex original
   */
  disable(): boolean {
    if (process.platform !== 'win32') return false;

    try {
      if (this.originalValue !== null) {
        // Restaurar el valor original
        execSync(
          `reg add "${MultiRobloxService.REGISTRY_PATH}" /v ${MultiRobloxService.REGISTRY_KEY} /t REG_DWORD /d ${this.originalValue} /f`,
          { timeout: 5000 }
        );
        console.log('[MultiRoblox] Deshabilitado (valor original restaurado)');
      } else {
        // Eliminar la clave si no existÃ­a antes
        execSync(
          `reg delete "${MultiRobloxService.REGISTRY_PATH}" /v ${MultiRobloxService.REGISTRY_KEY} /f 2>nul`,
          { timeout: 5000 }
        );
        console.log('[MultiRoblox] Deshabilitado (clave eliminada)');
      }
      return true;
    } catch (error) {
      console.error('[MultiRoblox] Error al deshabilitar:', error);
      return false;
    }
  }

  /**
   * Crea un directorio de perfil temporal Ãºnico para una cuenta
   * Devuelve la ruta al directorio de perfil
   */
  createTempProfile(accountId: string): string {
    const profilesBase = this.getProfilesDirectory();
    const profilePath = path.join(profilesBase, `account_${accountId}`);

    // Crear el directorio si no existe
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
    }

    return profilePath;
  }

  /**
   * Obtiene el directorio base para perfiles temporales
   */
  getProfilesDirectory(): string {
    // Usar el directorio temporal del sistema
    const baseDir = path.join(os.tmpdir(), MultiRobloxService.PROFILE_DIR);

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    return baseDir;
  }

  /**
   * Limpia perfiles temporales antiguos (mÃ¡s de 24 horas)
   */
  cleanupOldProfiles(): number {
    const profilesDir = this.getProfilesDirectory();
    let cleaned = 0;
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    const now = Date.now();

    try {
      if (!fs.existsSync(profilesDir)) return 0;

      const entries = fs.readdirSync(profilesDir);
      for (const entry of entries) {
        const entryPath = path.join(profilesDir, entry);
        try {
          const stats = fs.statSync(entryPath);
          if (now - stats.mtimeMs > maxAge) {
            fs.rmSync(entryPath, { recursive: true, force: true });
            cleaned++;
          }
        } catch {
          // Ignorar entradas que no se puedan leer
        }
      }
    } catch (error) {
      console.error('[MultiRoblox] Error al limpiar perfiles:', error);
    }

    if (cleaned > 0) {
      console.log(`[MultiRoblox] Perfiles limpiados: ${cleaned}`);
    }
    return cleaned;
  }

  /**
   * Limpia un perfil especÃ­fico
   */
  deleteProfile(accountId: string): boolean {
    const profilePath = path.join(this.getProfilesDirectory(), `account_${accountId}`);

    try {
      if (fs.existsSync(profilePath)) {
        fs.rmSync(profilePath, { recursive: true, force: true });
        console.log(`[MultiRoblox] Perfil eliminado: ${profilePath}`);
        return true;
      }
    } catch (error) {
      console.error('[MultiRoblox] Error al eliminar perfil:', error);
    }
    return false;
  }

  /**
   * Obtiene el directorio de datos de usuario de Roblox para un perfil
   */
  getRobloxUserDataDir(profilePath: string): string {
    return path.join(profilePath, 'LocalStorage');
  }

  /**
   * Verifica si el sistema puede ejecutar Multi-Roblox
   */
  static isSupported(): boolean {
    return process.platform === 'win32';
  }
}